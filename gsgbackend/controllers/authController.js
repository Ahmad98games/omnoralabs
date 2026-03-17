const { supabase } = require('../config/supabaseClient'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper for Token
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role }, 
        process.env.JWT_SECRET || 'imperial_secret_key_2026', 
        { expiresIn: '7d' }
    );
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 1. Check if user exists
        const { data: userExists } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (userExists) return res.status(400).json({ error: 'User already exists' });

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Create User in 'users' table
        const { data: user, error: regError } = await supabase
            .from('users')
            .insert([{
                full_name: name || 'Imperial Member',
                email: email.toLowerCase(),
                password_hash,
                role: role || 'customer',
                store_slug: name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : `store-${Date.now()}`,
                subscription: role === 'seller' ? 'pro' : 'free'
            }])
            .select()
            .single();

        if (regError) throw regError;

        // 4. Generate Token
        const token = generateToken(user.id, user.role);

        res.status(201).json({
            success: true,
            token,
            user: { id: user.id, email: user.email, role: user.role, name: user.full_name }
        });

    } catch (error) {
        console.error('Registration Crash:', error.message);
        res.status(500).json({ error: `Server Crash: ${error.message}` });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user, error: loginError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (!user || loginError) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        const token = generateToken(user.id, user.role);

        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, role: user.role, name: user.full_name }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Simple GetMe to verify token works
exports.getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};