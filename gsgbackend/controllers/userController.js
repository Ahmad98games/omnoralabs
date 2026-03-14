// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../services/logger');
const { validateEnv } = require('../config/env');

const config = validateEnv();
const JWT_SECRET = config.jwt.secret;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET || ''}-refresh`;
const ACCESS_TOKEN_EXPIRES_IN = config.jwt.expiresIn;
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const signAccessToken = (user) =>
  jwt.sign({ id: user.id || user._id, role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });

const signRefreshToken = (user) =>
  jwt.sign({ id: user.id || user._id, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });

const issueTokens = async (user) => {
  const accessToken = jwt.sign({ id: user.id || user._id, role: user.role || 'customer' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: user.id || user._id, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  
  // Update refresh token in DB
  await supabase.from('merchants').update({ 
    metadata: { ...user.metadata, refreshToken } 
  }).eq('id', user.id);
  
  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => ({
  id: user.id || user._id,
  firstName: user.firstName || user.metadata?.firstName,
  lastName: user.lastName || user.metadata?.lastName,
  email: user.email,
  role: user.role || user.metadata?.role,
  phone: user.phone || user.metadata?.phone,
  brandProfile: (user.brandProfile || user.metadata?.brandProfile) || {}
});

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Check if user exists
    const { data: existingUser } = await supabase.from('merchants').select('id').eq('email', email).maybeSingle();
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { data: user, error } = await supabase
      .from('merchants')
      .insert([{
        email,
        password_hash: passwordHash,
        display_name: `${firstName} ${lastName}`.trim(),
        metadata: { firstName, lastName, phone, role: 'customer' }
      }])
      .select()
      .single();

    if (error) throw error;

    const tokens = await issueTokens(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: sanitizeUser(user),
      tokens
    });
  } catch (error) {
    logger.error('Error registering user', { error: error.message });
    return res.status(500).json({ error: 'Unable to register user at this time.' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const tokens = await issueTokens(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      user: sanitizeUser(user),
      tokens
    });
  } catch (error) {
    logger.error('Error logging in user', { error: error.message });
    return res.status(500).json({ error: 'Unable to login at this time.' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const { data: user, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const storedToken = user.metadata?.refreshToken;
    if (storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token has been revoked.' });
    }

    const tokens = await issueTokens(user);

    return res.json({
      success: true,
      tokens
    });
  } catch (error) {
    logger.warn('Refresh token rejected', { error: error.message });
    return res.status(401).json({ error: 'Unable to refresh token.' });
  }
};

exports.logout = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({ success: true });
    }
    await supabase.from('merchants').update({ 
      metadata: { ...req.user.metadata, refreshToken: null } 
    }).eq('id', req.user.id || req.user._id);
    
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error during logout', { error: error.message });
    return res.status(500).json({ error: 'Unable to logout.' });
  }
};

exports.getUserProfile = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  return res.json({ success: true, user: sanitizeUser(req.user) });
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, password, brandProfile } = req.body;
    const userId = req.user.id || req.user._id;

    const { data: user, error: fetchError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updateData = {
      display_name: `${firstName || user.metadata?.firstName} ${lastName || user.metadata?.lastName}`.trim(),
      metadata: { 
        ...user.metadata, 
        firstName: firstName || user.metadata?.firstName,
        lastName: lastName || user.metadata?.lastName,
        phone: phone || user.metadata?.phone,
        brandProfile: { ...(user.metadata?.brandProfile || {}), ...(brandProfile || {}) }
      }
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('merchants')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    logger.error('Error updating profile', { error: error.message });
    return res.status(500).json({ error: 'Unable to update profile.' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      users: users.map(sanitizeUser)
    });
  } catch (error) {
    logger.error('Error fetching all users', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { error } = await supabase
      .from('merchants')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const { data: user, error: fetchError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newRole = isAdmin ? 'admin' : 'customer';
    const { data: updatedUser, error: updateError } = await supabase
      .from('merchants')
      .update({ 
        metadata: { ...user.metadata, role: newRole }
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: `User role updated the to ${newRole}`,
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    logger.error('Error updating user role', { error: error.message });
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

