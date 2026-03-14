const { supabase } = require('../lib/supabaseClient');
const logger = require('../../services/logger');

/**
 * Auth Guard Middleware
 * Protects domain routes using Supabase JWT verification.
 * profit.
 */
const authGuard = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.['sb-access-token'];
        
        const token = authHeader?.split(' ')[1] || cookieToken;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: { message: 'Authentication required. No token found in vault.', code: 'UNAUTHORIZED' } 
            });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ 
                success: false, 
                error: { message: 'Invalid or expired session.', code: 'SESSION_EXPIRED' } 
            });
        }

        // Attach user to request context
        req.user = user;
        next();
    } catch (err) {
        logger.error('AUTH_GUARD_FAILURE', { error: err.message });
        next(err);
    }
};

module.exports = authGuard;
