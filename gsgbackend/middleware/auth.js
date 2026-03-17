const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabaseClient');
const logger = require('../services/logger');

const { validateEnv } = require('../config/env');

const config = validateEnv();
const JWT_SECRET = config.jwt.secret;

if (!JWT_SECRET || JWT_SECRET === 'default_secret_for_development') {
    throw new Error('BACKEND_MISSING_JWT_SECRET');
}

const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

const attachUser = async (decoded) => {
  const userId = decoded.id || decoded.userId || decoded.sub;
  if (!userId) {
    return null;
  }
  
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
  if (!process.env.SUPABASE_ANON_KEY) {
    logger.error('Backend Config Error: Missing Supabase Key');
    return res.status(500).json({ error: 'Backend Config Error: Missing Supabase Key' });
  }
  try {
    const token = extractToken(req);
    if (!token) {
      logger.warn('AUTH_FAIL: Token missing from request headers/cookies');
      return res.status(401).json({ error: 'Not authorized. Token missing.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    // logger.info(`AUTH_DEBUG: Token decoded`, { id: decoded.id }); // Too noisy for prod, useful for debug

    const user = await attachUser(decoded);

    if (!user) {
      logger.warn('AUTH_FAIL: Token valid but User not found', { userId: decoded.id });
      return res.status(401).json({ error: 'User associated with this token no longer exists.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    logger.error('AUTH_FAIL: JWT verification failed', { 
      name: error.name, 
      message: error.message, 
      stack: error.stack 
    });
    return res.status(401).json({ error: `Not authorized. Invalid token: ${error.name}` });
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await attachUser(decoded);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    logger.debug('Optional auth token invalid', { error: error.message });
  } finally {
    next();
  }
};

const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }
  return next();
};

const customer = (req, res, next) => {
  if (!req.user || (req.user.role !== 'customer' && req.user.role !== 'admin' && req.user.role !== 'super-admin' && req.user.role !== 'seller')) {
    return res.status(403).json({ error: 'Customer access required.' });
  }
  return next();
};

const seller = (req, res, next) => {
  if (!req.user || (req.user.role !== 'seller' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ error: 'Seller privileges required.' });
  }
  return next();
};

const superAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Super-Admin privileges required.' });
  }
  return next();
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `User role '${req.user.role}' is not authorized to access this route` });
    }

    next();
  };
};

module.exports = {
  protect,
  verifyToken: protect, // Manual JWT Alias
  admin,
  seller,
  superAdmin,
  optionalAuth,
  customer,
  authorize
};