/**
 * traxProvider.js — Trax API adapter (stub)
 * Configure TRAX_API_KEY + TRAX_CUSTOMER_ID in .env
 */
const axios = require('axios');
const logger = require('../logger');

const BASE_URL = 'https://sonic.pk/api';
const API_KEY = process.env.TRAX_API_KEY;
const CUSTOMER_ID = process.env.TRAX_CUSTOMER_ID;

const isConfigured = () => !!(API_KEY && CUSTOMER_ID);

async function createShipment({ recipientName, address, city, phone, weight = 0.5, cod = 0 }) {
    if (!isConfigured()) {
        logger.warn('TRAX: Not configured — returning mock tracking number');
        return { trackingNumber: `TRAX-MOCK-${Date.now()}`, raw: { mock: true } };
    }
    try {
        const res = await axios.post(`${BASE_URL}/orders`, {
            service: 'overnight',
            consignee: { name: recipientName, phone, address, city_name: city },
            pieces: [{ weight, description: 'Package', quantity: 1 }],
            payment_type: cod > 0 ? 'COD' : 'Prepaid',
            cod_amount: cod,
            charges_type: 'consignee',
        }, { headers: { 'Authorization': `Bearer ${API_KEY}`, 'customer-id': CUSTOMER_ID } });

        return { trackingNumber: res.data?.tracking_number, raw: res.data };
    } catch (err) {
        logger.error('TRAX createShipment failed', { error: err.message });
        throw err;
    }
}

async function trackShipment(trackingNumber) {
    if (!isConfigured()) return { status: 'in_transit', note: 'Mock tracking (Trax not configured)' };
    try {
        const res = await axios.get(`${BASE_URL}/orders/${trackingNumber}`, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
        return { status: mapStatus(res.data?.status), note: res.data?.last_event, raw: res.data };
    } catch (err) {
        return { status: 'unknown', note: err.message };
    }
}

async function cancelShipment(trackingNumber) {
    if (!isConfigured()) return { success: true, mock: true };
    try {
        await axios.delete(`${BASE_URL}/orders/${trackingNumber}`, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
        return { success: true };
    } catch (err) {
        logger.error('TRAX cancel failed', { error: err.message });
        return { success: false, error: err.message };
    }
}

function mapStatus(raw = '') {
    const r = String(raw).toLowerCase();
    if (r.includes('deliver')) return 'delivered';
    if (r.includes('return')) return 'returned';
    if (r.includes('out')) return 'out_for_delivery';
    if (r.includes('attempt')) return 'attempted';
    return 'in_transit';
}

module.exports = { createShipment, trackShipment, cancelShipment };
