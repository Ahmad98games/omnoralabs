const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../services/logger');

const { validateEnv } = require('../config/env');

const config = validateEnv();
const JWT_SECRET = config.jwt.secret;

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
  // LocalDB does not support chaining .select() on findById promise
  // We return the user directly.
  return User.findById(userId);
};

const protect = async (req, res, next) => {
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
    logger.warn('AUTH_FAIL: JWT verification failed', { error: error.message });
    return res.status(401).json({ error: 'Not authorized. Invalid or expired token.' });
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
  admin,
  seller,
  superAdmin,
  optionalAuth,
  customer,
  authorize
};