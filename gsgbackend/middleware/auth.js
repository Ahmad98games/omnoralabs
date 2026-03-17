const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabaseClient');
const logger = require('../services/logger');

// Ensure JWT Secret is loaded
const JWT_SECRET = process.env.JWT_SECRET;

const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return req.cookies?.token || null;
};

const attachUser = async (userId) => {
  if (!userId) return null;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('AUTH_USER_FETCH_ERROR', { error: error.message, userId });
    return null;
  }
  return user;
};

const protect = async (req, res, next) => {
  // Defensive check for Keys
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    return res.status(500).json({ error: 'Backend Config Error: Missing Supabase Key' });
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Not authorized. Token missing.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await attachUser(decoded.id || decoded.userId || decoded.sub);

    if (!user) {
      return res.status(401).json({ error: 'User session expired or invalid.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    logger.warn('AUTH_FAIL: JWT verification failed', { error: error.message });
    return res.status(401).json({ error: 'Session invalid. Please re-login.' });
  }
};

// Role Helpers
const seller = (req, res, next) => {
  if (!req.user || (req.user.role !== 'seller' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ error: 'Seller privileges required.' });
  }
  next();
};

module.exports = { protect, verifyToken: protect, seller };