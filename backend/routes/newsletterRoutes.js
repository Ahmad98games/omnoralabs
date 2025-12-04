const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.post('/subscribe', newsletterController.subscribeNewsletter);
router.post('/unsubscribe', newsletterController.unsubscribeNewsletter);

// Protected routes (admin only)
router.get('/', protect, admin, newsletterController.getAllSubscribers);

module.exports = router; 