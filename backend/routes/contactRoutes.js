const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.post('/', contactController.submitContactForm);

// Protected routes (admin only)
router.get('/', protect, admin, contactController.getContactSubmissions);
router.put('/:id', protect, admin, contactController.updateContactStatus);

module.exports = router; 