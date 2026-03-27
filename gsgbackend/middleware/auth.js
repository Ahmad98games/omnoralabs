const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabaseClient');
const logger = require('../services/logger');

const { validateEnv } = require('../config/env');

const config = validateEnv();

/**
 * [SURGICAL] Next-Style CSR/SSR Hybrid Middleware
 * Uses @supabase/ssr to read session from cookies or headers automatically.
 */
const protect = async (req, res, next) => {
  try {
    const supabase = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name) {
            return req.cookies[name];
          },
          set(name, value, options) {
            res.cookie(name, value, options);
          },
          remove(name, options) {
            res.clearCookie(name, options);
          },
        },
      }
    );

    // 1. Unified Session Check: Reads from Cookies OR Authorization Header
    const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser();

    if (sbError || !sbUser) {
      if (sbError) logger.error('AUTH_FAIL: Supabase validation error', { error: sbError.message });
      return res.status(401).json({ error: 'Session expired or invalid.' });
    }

    // 2. Profile Fetch / Self-Healing
    const { supabase: db } = require('../config/supabaseClient');
    const { data: existingUser } = await db
      .from('users')
      .select('*')
      .eq('id', sbUser.id)
      .single();

    let user = existingUser;

    if (!user) {
      logger.info('AUTH_RECOVERY: Hydrating missing profile', { userId: sbUser.id });
      const role = sbUser.user_metadata?.role || 'customer';
      const name = sbUser.user_metadata?.full_name || sbUser.email.split('@')[0];

      const { data: newUser, error: syncError } = await db
        .from('users')
        .upsert({
          id: sbUser.id,
          email: sbUser.email,
          name: name,
          role: role,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (syncError) {
        logger.error('AUTH_RECOVERY_FAIL', { error: syncError.message });
        return res.status(401).json({ error: 'Profile recovery failed.' });
      }
      user = newUser;
    }

    req.user = user;
    return next();
  } catch (err) {
    logger.error('PROTECT_CRITICAL_FAILURE', { error: err.message });
    return res.status(500).json({ error: 'Internal Auth Failure' });
  }
};

// The optionalAuth function is no longer functional with the removal of JWT_SECRET, extractToken, and attachUser.
// It is commented out to maintain syntactic correctness. If optionalAuth is still needed, it would require
// a similar rewrite using createServerClient or a different authentication mechanism.
/*
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