/**
 * aiQuotaService.js
 * Per-seller AI generation quota service.
 *
 * Limits:
 *   - Monthly generation quota (default: 50 per seller per month)
 *   - Per-minute rate limit (default: 5 per minute)
 *   - Quota reset at start of each UTC month
 *
 * Usage:
 *   const ok = await aiQuotaService.checkAndConsume(sellerId);
 *   if (!ok.allowed) return res.status(429).json({ error: ok.reason });
 */
const logger = require('./logger');

// ─── In-memory store (Redis-ready interface) ──────────────────────────────────

const store = new Map(); // key → { count, resetAt }

function getKey(sellerId, window) {
    if (window === 'month') {
        const d = new Date();
        return `ai:quota:${sellerId}:${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    }
    if (window === 'minute') {
        return `ai:rate:${sellerId}:${Math.floor(Date.now() / 60000)}`;
    }
    return `ai:${window}:${sellerId}`;
}

function memIncEx(key, windowMs, limit) {
    const now = Date.now();
    const entry = store.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { count: 1, allowed: 1 <= limit };
    }
    entry.count++;
    store.set(key, entry);
    return { count: entry.count, allowed: entry.count <= limit };
}

// ─── Config (env-overridable) ─────────────────────────────────────────────────

const MONTHLY_QUOTA = () => parseInt(process.env.AI_MONTHLY_QUOTA_PER_SELLER) || 50;
const MINUTELY_CAP = () => parseInt(process.env.AI_RATE_PER_MINUTE) || 5;

// ─── Check & consume ─────────────────────────────────────────────────────────

async function checkAndConsume(sellerId) {
    // 1. Per-minute rate
    const rateKey = getKey(sellerId, 'minute');
    const rate = memIncEx(rateKey, 60 * 1000, MINUTELY_CAP());
    if (!rate.allowed) {
        logger.warn(`AI_QUOTA: Seller ${sellerId} hit rate limit (${rate.count}/min)`);
        return { allowed: false, reason: `rate_limit`, retryAfterSec: 60 };
    }

    // 2. Monthly quota
    const monthKey = getKey(sellerId, 'month');
    const msUntilMonthReset = (() => {
        const now = new Date();
        const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        return next.getTime() - now.getTime();
    })();
    const monthly = memIncEx(monthKey, msUntilMonthReset, MONTHLY_QUOTA());
    if (!monthly.allowed) {
        logger.warn(`AI_QUOTA: Seller ${sellerId} monthly quota exhausted (${monthly.count}/${MONTHLY_QUOTA()})`);
        return { allowed: false, reason: 'monthly_quota_exceeded', used: monthly.count, limit: MONTHLY_QUOTA() };
    }

    return { allowed: true, used: monthly.count, limit: MONTHLY_QUOTA(), remaining: MONTHLY_QUOTA() - monthly.count };
}

// ─── Query current usage ──────────────────────────────────────────────────────

function getUsage(sellerId) {
    const monthKey = getKey(sellerId, 'month');
    const rateKey = getKey(sellerId, 'minute');
    const monthly = store.get(monthKey) || { count: 0 };
    const rate = store.get(rateKey) || { count: 0 };
    return {
        monthlyUsed: monthly.count,
        monthlyLimit: MONTHLY_QUOTA(),
        minuteUsed: rate.count,
        minuteLimit: MINUTELY_CAP(),
    };
}

// ─── Admin: manually reset a seller's quota ───────────────────────────────────

function resetQuota(sellerId) {
    store.delete(getKey(sellerId, 'month'));
    logger.info(`AI_QUOTA: Monthly quota reset for seller ${sellerId}`);
}

module.exports = { checkAndConsume, getUsage, resetQuota };
