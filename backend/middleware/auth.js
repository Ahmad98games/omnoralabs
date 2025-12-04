const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../services/logger');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.warn('JWT_SECRET is not defined. Set it in your environment variables.');
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
  return User.findById(userId).select('-password -refreshToken');
};

const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Not authorized. Token missing.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await attachUser(decoded);

    if (!user) {
      return res.status(401).json({ error: 'User associated with this token no longer exists.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    logger.warn('JWT validation failed', { error: error.message });
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
  if (!req.user || (req.user.role !== 'customer' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Customer access required.' });
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
  optionalAuth,
  customer,
  authorize
};