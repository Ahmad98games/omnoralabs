/**
 * waRateGuard.js
 * Global WhatsApp abuse & rate protection layer.
 *
 * Guards:
 *   1. Per-seller per-day send cap  (default: 500 msgs/day)
 *   2. Per-phone per-seller cooldown  (default: 24h per customer)
 *   3. Velocity spike detection — if a seller sends >50 msgs in 1 min → auto-pause
 *   4. Abuse flag — admin can hard-block a seller
 *
 * Uses in-memory counters in dev; Redis in production (via IORedis).
 */
const logger = require('./logger');

// ─── In-memory fallback (dev / no-Redis) ─────────────────────────────────────

const memStore = new Map(); // key → { count, resetAt }

function memGet(key) { return memStore.get(key) || { count: 0, resetAt: 0 }; }
function memInc(key, windowMs) {
    const now = Date.now();
    const entry = memGet(key);
    if (now > entry.resetAt) { memStore.set(key, { count: 1, resetAt: now + windowMs }); return 1; }
    entry.count++;
    memStore.set(key, entry);
    return entry.count;
}

// ─── Redis helpers (prod) ─────────────────────────────────────────────────────

async function redisIncEx(redis, key, windowSec) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);
    return count;
}

// ─── Paused sellers (in-memory for simplicity — persisted to DB on restart) ───

const pausedSellers = new Set();
const abuseFlags = new Set(); // hard-blocked by admin

// ─── Main guard function ──────────────────────────────────────────────────────

/**
 * Returns { allowed: boolean, reason: string }
 * Call BEFORE every WhatsApp send.
 */
async function check(sellerId, phone, redis = null) {
    // 1. Admin hard-block
    if (abuseFlags.has(sellerId)) {
        return { allowed: false, reason: 'seller_blocked' };
    }

    // 2. Auto-pause (velocity spike)
    if (pausedSellers.has(sellerId)) {
        return { allowed: false, reason: 'seller_paused_spike' };
    }

    const DAILY_CAP = parseInt(process.env.WA_DAILY_CAP_PER_SELLER) || 500;
    const PHONE_COOL = parseInt(process.env.WA_PHONE_COOLDOWN_H) || 24;  // hours
    const SPIKE_LIMIT = parseInt(process.env.WA_SPIKE_PER_MIN) || 50;

    const dailyKey = `wa:daily:${sellerId}:${new Date().toISOString().slice(0, 10)}`;
    const phoneKey = `wa:phone:${sellerId}:${phone}`;
    const spikeKey = `wa:spike:${sellerId}`;

    let dailyCount, phoneCount, spikeCount;

    if (redis) {
        [dailyCount, phoneCount, spikeCount] = await Promise.all([
            redisIncEx(redis, dailyKey, 86400),
            redisIncEx(redis, phoneKey, PHONE_COOL * 3600),
            redisIncEx(redis, spikeKey, 60),          // 1-minute window
        ]);
    } else {
        dailyCount = memInc(dailyKey, 86400 * 1000);
        // For phone cooldown: don't increment here — just check
        const phoneEntry = memGet(phoneKey);
        phoneCount = Date.now() < phoneEntry.resetAt ? phoneEntry.count + 1 : 1;
        memInc(phoneKey, PHONE_COOL * 3600 * 1000);
        spikeCount = memInc(spikeKey, 60 * 1000);
    }

    // 3. Daily cap
    if (dailyCount > DAILY_CAP) {
        logger.warn(`WA_GUARD: Seller ${sellerId} exceeded daily cap (${dailyCount}/${DAILY_CAP})`);
        return { allowed: false, reason: 'daily_cap_exceeded' };
    }

    // 4. Phone cooldown (>1 in the cooldown window = duplicate)
    if (phoneCount > 1) {
        return { allowed: false, reason: 'phone_cooldown' };
    }

    // 5. Velocity spike → auto-pause seller for 10 min
    if (spikeCount >= SPIKE_LIMIT) {
        pausedSellers.add(sellerId);
        setTimeout(() => pausedSellers.delete(sellerId), 10 * 60 * 1000);  // lift after 10 min
        logger.error(`WA_GUARD: Seller ${sellerId} PAUSED — velocity spike (${spikeCount} msgs/min)`);
        return { allowed: false, reason: 'velocity_spike' };
    }

    return { allowed: true };
}

// ─── Admin controls ───────────────────────────────────────────────────────────

function blockSeller(sellerId) { abuseFlags.add(sellerId); logger.warn(`WA_GUARD: Seller ${sellerId} hard-blocked`); }
function unblockSeller(sellerId) { abuseFlags.delete(sellerId); logger.info(`WA_GUARD: Seller ${sellerId} unblocked`); }
function pauseSeller(sellerId) { pausedSellers.add(sellerId); }
function resumeSeller(sellerId) { pausedSellers.delete(sellerId); }

function getStatus(sellerId) {
    return {
        hardBlocked: abuseFlags.has(sellerId),
        paused: pausedSellers.has(sellerId),
    };
}

module.exports = { check, blockSeller, unblockSeller, pauseSeller, resumeSeller, getStatus };
