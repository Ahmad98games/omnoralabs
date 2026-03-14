/**
 * shippingService.js
 * Provider adapter pattern — routes to the correct shipping carrier.
 * Each provider implements: createShipment(), trackShipment(), cancelShipment()
 */
const logger = require('./logger');

// ── Providers ───────────────────────────────────────────────────────────────
// Lazy import providers
const providers = {
    leopards: () => require('./shipping/leopardsProvider'),
    tcs: () => require('./shipping/tcsProvider'),
    trax: () => require('./shipping/traxProvider'),
};

const getModels = () => ({
    Shipment: require('../models/Shipment'),
});

// ── Track status cache (prevents hammering unstable courier APIs) ───────────
const TRACK_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const trackCache = new Map(); // trackingNumber → { data, expiresAt }

function getProvider(name) {
    const factory = providers[name];
    if (!factory) throw new Error(`Unknown shipping provider: ${name}`);
    return factory();
}

// ─── Create shipment ──────────────────────────────────────────────────────────

async function createShipment(sellerId, orderId, { provider = 'leopards', recipientName, address, city, phone, weight = 0.5, cod = 0 }) {
    const { Shipment } = getModels();
    const p = getProvider(provider);

    const response = await p.createShipment({ recipientName, address, city, phone, weight, cod });

    const shipment = await Shipment.create({
        sellerId,
        orderId,
        provider,
        trackingNumber: response.trackingNumber,
        status: 'booked',
        providerResponse: response.raw,
        lastSyncAt: new Date(),
        events: [{ status: 'booked', note: 'Shipment created', timestamp: new Date() }]
    });

    logger.info(`SHIPPING: ${provider} shipment created`, { orderId, tracking: response.trackingNumber });
    return shipment;
}

// ─── Track shipment (with 3-min cache + graceful degradation) ────────────────

async function trackShipment(trackingNumber, provider = 'leopards') {
    // Return cached result if still fresh
    const cached = trackCache.get(trackingNumber);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
    }

    try {
        const p = getProvider(provider);
        const info = await p.trackShipment(trackingNumber);
        // Cache fresh result for 3 minutes
        trackCache.set(trackingNumber, { data: info, expiresAt: Date.now() + TRACK_CACHE_TTL_MS });
        return info;
    } catch (err) {
        logger.warn(`SHIPPING: trackShipment failed for ${trackingNumber} — serving stale cache if available`, { error: err.message });
        // Graceful degradation: stale cache beats crashing the cron job
        if (cached) return { ...cached.data, stale: true };
        return { status: 'unknown', note: err.message };
    }
}


// ─── Cancel shipment ──────────────────────────────────────────────────────────

async function cancelShipment(shipmentId) {
    const { Shipment } = getModels();
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const p = getProvider(shipment.provider);
    await p.cancelShipment(shipment.trackingNumber);

    await Shipment.findByIdAndUpdate(shipmentId, {
        status: 'cancelled',
        $push: { events: { status: 'cancelled', note: 'Cancelled by seller', timestamp: new Date() } }
    });

    return { success: true };
}

// ─── Sync all in-transit shipments (cron job) ────────────────────────────────

async function syncInTransitShipments() {
    const { Shipment } = getModels();
    const inTransit = await Shipment.find({ status: { $in: ['booked', 'in_transit', 'out_for_delivery'] } });
    let synced = 0;

    for (const s of inTransit) {
        try {
            const info = await trackShipment(s.trackingNumber, s.provider);
            if (info.status && info.status !== s.status) {
                await Shipment.findByIdAndUpdate(s._id, {
                    status: info.status,
                    lastSyncAt: new Date(),
                    $push: { events: { status: info.status, note: info.note || '', timestamp: new Date() } }
                });
                synced++;
            }
        } catch (err) {
            logger.warn(`SHIPPING: Sync failed for ${s.trackingNumber}`, { error: err.message });
        }
    }

    logger.info(`SHIPPING: Synced ${synced}/${inTransit.length} shipments`);
    return { synced, total: inTransit.length };
}

module.exports = { createShipment, trackShipment, cancelShipment, syncInTransitShipments, getProvider };
