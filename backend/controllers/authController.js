const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../services/logger');

const { validateEnv } = require('../config/env');

const config = validateEnv();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password // Will be hashed by pre-save hook
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Registration error', { error: error.message });
        res.status(500).json({ error: 'Registration failed' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Login error', { error: error.message });
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        // Safety check to prevent 500 errors if middleware fails
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = req.user; // User is already attached by protect middleware

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Get user error', { error: error.message });
        res.status(500).json({ error: 'Failed to get user' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Generate new token
        const newToken = generateToken(user._id);

        res.json({
            success: true,
            token: newToken
        });
    } catch (error) {
        logger.error('Refresh token error', { error: error.message });
        res.status(401).json({ error: 'Invalid token' });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate reset token
        const resetToken = jwt.sign({ id: user._id }, config.jwt.secret, {
            expiresIn: '1h'
        });

        // TODO: Send email with reset link
        // For now, just return the token
        logger.info('Password reset requested', { email });

        res.json({
            success: true,
            message: 'Password reset email sent',
            // Remove this in production
            resetToken
        });
    } catch (error) {
        logger.error('Forgot password error', { error: error.message });
        res.status(500).json({ error: 'Failed to process request' });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'Invalid token' });
        }

        // Update password
        user.password = password;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        logger.error('Reset password error', { error: error.message });
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
