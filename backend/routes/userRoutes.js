const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin
} = require('../validators/userValidator');

router.post('/register', authLimiter, validateRegister, userController.registerUser);
router.post('/login', authLimiter, validateLogin, userController.loginUser);
router.post('/refresh', authLimiter, userController.refreshToken);

router.post('/logout', protect, userController.logout);
router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);

module.exports = router;