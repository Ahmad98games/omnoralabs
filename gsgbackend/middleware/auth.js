const { createServerClient } = require('@supabase/ssr');
const { supabase: db } = require('../config/supabaseClient');
const logger = require('../services/logger');

const protect = async (req, res, next) => {
  try {
    const supabase = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name) { return req.cookies[name]; },
          set(name, value, options) { res.cookie(name, value, options); },
          remove(name, options) { res.clearCookie(name, options); },
        },
      }
    );

    // 1. Resolve User (Header or Cookie)
    const authHeader = req.headers.authorization;
    let sbUser = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data } = await supabase.auth.getUser(token);
      sbUser = data.user;
    } else {
      const { data } = await supabase.auth.getUser();
      sbUser = data.user;
    }

    if (!sbUser) {
      return res.status(401).json({ error: 'Unauthorized: Session missing' });
    }

    // 2. Self-Healing Hybrid Logic
    let { data: user } = await db.from('users').select('*').eq('id', sbUser.id).single();

    if (!user) {
      logger.info('AUTH_RECOVERY: Syncing missing user profile', { userId: sbUser.id });
      const role = sbUser.user_metadata?.role || 'customer';
      const name = sbUser.user_metadata?.name || sbUser.email.split('@')[0];
      
      const { data: newUser, error } = await db.from('users').upsert({
        id: sbUser.id,
        email: sbUser.email,
        name,
        role,
        created_at: new Date().toISOString()
      }).select().single();
      
      if (error) throw error;
      user = newUser;
    }

    // 3. Merchant Self-Healing (For Sellers/Admins)
    if (user.role === 'seller' || user.role === 'admin') {
      const { data: merchant } = await db.from('merchants').select('*').eq('id', sbUser.id).single();
      if (!merchant) {
        logger.info('AUTH_RECOVERY: Hydrating missing merchant record', { userId: sbUser.id });
        await db.from('merchants').upsert({
          id: sbUser.id,
          email: sbUser.email,
          display_name: user.name,
          store_name: sbUser.user_metadata?.store_name || `${user.name}'s Store`,
          created_at: new Date().toISOString()
        });
      }
    }

    req.user = user;
    return next();
  } catch (err) {
    logger.error('AUTH_PROTECT_CRITICAL', { error: err.message });
    return res.status(500).json({ error: 'Internal Authentication Error' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = {
  protect,
  verifyToken: protect,
  admin: authorize('admin', 'super-admin'),
  seller: authorize('seller', 'admin', 'super-admin'),
  customer: authorize('customer', 'seller', 'admin', 'super-admin'),
  superAdmin: authorize('super-admin'),
  authorize
};