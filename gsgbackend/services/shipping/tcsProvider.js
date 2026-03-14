/**
 * tcsProvider.js — TCS Courier API adapter (stub)
 * Configure TCS_API_KEY + TCS_API_URL in .env
 */
const logger = require('../logger');

const isConfigured = () => !!process.env.TCS_API_KEY;

async function createShipment({ recipientName, address, city, phone, weight = 0.5, cod = 0 }) {
    if (!isConfigured()) {
        logger.warn('TCS: Not configured — returning mock tracking number');
        return { trackingNumber: `TCS-MOCK-${Date.now()}`, raw: { mock: true } };
    }
    // TODO: Integrate TCS Connect API — replace with actual endpoint
    logger.info('TCS: createShipment called', { recipientName, city, weight, cod });
    return { trackingNumber: `TCS-${Date.now()}`, raw: {} };
}

async function trackShipment(trackingNumber) {
    if (!isConfigured()) return { status: 'in_transit', note: 'Mock tracking (TCS not configured)' };
    // TODO: Integrate TCS tracking API
    return { status: 'in_transit', note: 'TCS tracking not yet integrated', trackingNumber };
}

async function cancelShipment(trackingNumber) {
    logger.warn('TCS: Manual cancellation required via TCS portal for:', trackingNumber);
    return { success: true };
}

module.exports = { createShipment, trackShipment, cancelShipment };
