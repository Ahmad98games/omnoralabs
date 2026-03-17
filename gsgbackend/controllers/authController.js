// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../config/supabaseClient'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../services/logger');

const { validateEnv } = require('../config/env');

const config = validateEnv();

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, config.jwt.secret, {
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
        const { data: userExists } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Split name into firstName and lastName for compatibility
        const nameParts = (name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Member';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        // Create user in merchants table
        const { data: user, error: registerError } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash,
                store_slug: name.toLowerCase().replace(/[^a-z0-9]/g, '') || `store-${Date.now()}`,
                subscription: req.body.role === 'seller' ? 'pro' : 'free'
            }])
            .select()
            .single();

        if (registerError) throw registerError;

        // --- Demo Hydration for Sellers ---
        if (req.body.role === 'seller') {
            await supabase
                .from('store_pages')
                .insert([{
                    tenant_id: user.id,
                    slug: '_site_config',
                    ast_manifest: {
                        configuration: {
                            name: `${firstName}'s Imperial Store`,
                            assets: {
                                logo: '/images/omnora.jpg',
                                favicon: '/favicon.ico'
                            }
                        },
                        pages: {
                            home: {
                                heroHeadline: `Welcome to ${firstName}'s Collection`,
                                heroSubheadline: 'Experience Independent Luxury'
                            }
                        }
                    },
                    is_published: true
                }]);
            logger.info('Demo Site Hydrated', { sellerId: user.id, slug: user.store_slug });
        }

        // Generate token
        const token = generateToken(user.id, user.role || 'customer');

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Registration error', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// @desc    Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const { data: user, error: loginError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (!user || loginError) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user.id, user.role);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
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
                id: user.id || user._id,
                firstName: user.metadata?.firstName || user.firstName,
                lastName: user.metadata?.lastName || user.lastName,
                name: user.display_name || `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                role: user.metadata?.role || user.role
            }
        });
    } catch (error) {
        logger.error('Get user error', { error: error.message });
        res.status(503).json({ error: 'Service Unavailable' });
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
        const { data: user } = await supabase.from('users').select('*').eq('id', decoded.id).single();
        if (!user) return res.status(401).json({ error: 'User not found' });

        const newToken = generateToken(user.id);
        res.json({ success: true, token: newToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// @desc    Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const { data: user, error } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (error || !user) return res.status(404).json({ error: 'User not found' });

        const resetToken = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: '1h' });
        res.json({ success: true, message: 'Password reset email sent', resetToken });
    } catch (error) {
        res.status(503).json({ error: 'Service Unavailable' });
    }
};

// @desc    Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const decoded = jwt.verify(token, config.jwt.secret);
        
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const { error } = await supabase
            .from('users')
            .update({ password_hash })
            .eq('id', decoded.id);

        if (error) throw error;

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(503).json({ error: 'Service Unavailable' });
    }
};
