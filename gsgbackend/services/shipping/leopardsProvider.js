/**
 * leopardsProvider.js
 * Adapter for Leopards Courier API — with retry + exponential backoff.
 * Replace BASE_URL and credentials with live Leopards API in .env
 */
const axios = require('axios');
const logger = require('../logger');
const { retryWithBackoff } = require('../../utils/retryWithBackoff');

const BASE_URL = process.env.LEOPARDS_API_URL || 'https://merchantapi.leopardscourier.com/api';
const API_KEY = process.env.LEOPARDS_API_KEY;
const API_PWD = process.env.LEOPARDS_API_PASSWORD;

function isConfigured() { return !!(API_KEY && API_PWD); }

// Only retry on network errors or 5xx — NOT on 4xx (bad creds / bad request)
const isRetryable = err => !err.response || err.response.status >= 500;

async function createShipment({ recipientName, address, city, phone, weight = 0.5, cod = 0 }) {
    if (!isConfigured()) {
        logger.warn('LEOPARDS: API not configured — returning mock tracking number');
        return { trackingNumber: `LEO-MOCK-${Date.now()}`, raw: { mock: true } };
    }
    return retryWithBackoff(() =>
        axios.post(`${BASE_URL}/createShipment`, {
            api_key: API_KEY, api_password: API_PWD,
            consignee_name: recipientName, consignee_address: address,
            consignee_city: city, consignee_phone: phone,
            shipment_weight: weight, cod_amount: cod,
        }).then(res => ({ trackingNumber: res.data?.track_number, raw: res.data })),
        { maxAttempts: 4, baseDelayMs: 500, maxDelayMs: 30_000, label: 'leopards.createShipment', isRetryable });
}

async function trackShipment(trackingNumber) {
    if (!isConfigured()) return { status: 'in_transit', note: 'Mock tracking (Leopards not configured)' };
    try {
        return await retryWithBackoff(() =>
            axios.post(`${BASE_URL}/trackBookedPackets`, {
                api_key: API_KEY, api_password: API_PWD, track_numbers: trackingNumber,
            }).then(res => {
                const data = res.data?.packet_list?.[0];
                return { status: mapStatus(data?.status), note: data?.last_location, raw: data };
            }),
            { maxAttempts: 3, baseDelayMs: 1000, label: 'leopards.track', isRetryable });
    } catch (err) {
        logger.error('LEOPARDS trackShipment failed after retries', { error: err.message });
        return { status: 'unknown', note: err.message };
    }
}

async function cancelShipment(trackingNumber) {
    if (!isConfigured()) return { success: true, mock: true };
    logger.warn('LEOPARDS: Cancellation must be done via their dashboard for tracking:', trackingNumber);
    return { success: true };
}

function mapStatus(raw) {
    if (!raw) return 'in_transit';
    const r = String(raw).toLowerCase();
    if (r.includes('deliver')) return 'delivered';
    if (r.includes('return')) return 'returned';
    if (r.includes('out')) return 'out_for_delivery';
    return 'in_transit';
}

module.exports = { createShipment, trackShipment, cancelShipment };
