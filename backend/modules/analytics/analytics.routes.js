const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const authGuard = require('../../shared/middleware/authGuard');

/**
 * Analytics Domain Routes
 * Mounted at /api/analytics
 */

// Private Merchant Stats
router.get('/metrics', authGuard, analyticsController.getMetrics);

// Public Tracking (Cross-origin from storefront)
router.post('/track', analyticsController.track);

module.exports = router;
