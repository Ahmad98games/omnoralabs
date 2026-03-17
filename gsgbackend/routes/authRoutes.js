const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const { protect } = require('../middleware/auth'); // Isse abhi comment rakhein jab tak login test na ho jaye

// 🟢 PUBLIC ROUTES (No Gatekeeper for now to avoid 500 errors)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// 🔵 PROTECTED ROUTES
// Note: 'protect' middleware ko tab on karein jab apka naya Manual JWT logic stable ho
router.get('/me', authController.getMe); 
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;