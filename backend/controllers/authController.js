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

        // Split name into firstName and lastName for the new schema
        const nameParts = (name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Member';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        // Create user
        const user = await User.create({
            firstName,
            lastName,
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
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName} ${user.lastName}`.trim(),
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

        // --- EMERGENCY ADMIN ACCESS FALLBACK (CONTROLLED) ---
        const RESCUE_EMAIL = process.env.ADMIN_EMAIL;
        const RESCUE_PASS = process.env.ADMIN_PASSWORD;

        if (RESCUE_EMAIL && RESCUE_PASS && email === RESCUE_EMAIL && password === RESCUE_PASS) {
            const rescueUser = {
                _id: '000000000000000000000000',
                firstName: 'Emergency',
                lastName: 'Admin',
                email: RESCUE_EMAIL,
                role: 'admin'
            };
            const token = generateToken(rescueUser._id);
            return res.json({
                success: true,
                token,
                user: {
                    id: rescueUser._id,
                    firstName: rescueUser.firstName,
                    lastName: rescueUser.lastName,
                    name: `${rescueUser.firstName} ${rescueUser.lastName}`.trim(),
                    email: rescueUser.email,
                    role: rescueUser.role
                }
            });
        }

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
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Login error', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = req.user;

        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName} ${user.lastName}`.trim(),
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
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'User not found' });

        const newToken = generateToken(user._id);
        res.json({ success: true, token: newToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// @desc    Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const resetToken = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: '1h' });
        res.json({ success: true, message: 'Password reset email sent', resetToken });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

// @desc    Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ error: 'Invalid token' });

        user.password = password;
        await user.save();
        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
