const express = require('express');
const router = express.Router();
const { protect: authenticate } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');
const logger = require('../services/logger');

// â”€â”€ GET /api/seller-analytics/overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/overview', authenticate, async (req, res) => {
    try {
        const data = await analyticsService.getOverview(req.user.id);
        res.json(data);
    } catch (err) {
        logger.error('ANALYTICS /overview', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ GET /api/seller-analytics/revenue?days=30 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/revenue', authenticate, async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 30, 365);
        const data = await analyticsService.getRevenueChart(req.user.id, days);
        res.json(data);
    } catch (err) {
        logger.error('ANALYTICS /revenue', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ GET /api/seller-analytics/products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/products', authenticate, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const data = await analyticsService.getTopProducts(req.user.id, limit);
        res.json(data);
    } catch (err) {
        logger.error('ANALYTICS /products', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ GET /api/seller-analytics/customers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/customers', authenticate, async (req, res) => {
    try {
        const data = await analyticsService.getCustomerInsights(req.user.id);
        res.json(data);
    } catch (err) {
        logger.error('ANALYTICS /customers', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

