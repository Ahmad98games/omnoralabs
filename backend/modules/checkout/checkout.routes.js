const express = require('express');
const router = express.Router();
const checkoutController = require('./checkout.controller');
const authGuard = require('../../shared/middleware/authGuard');

/**
 * Checkout Domain Routes
 * profit.
 */

// Secure session creation
router.post('/create-session', authGuard, checkoutController.createSession);

// Unprotected Webhook (verified internally by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), checkoutController.handleWebhook);

module.exports = router;
