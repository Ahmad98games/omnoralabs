const { protect, seller } = require('./auth');

/**
 * requireAuth middleware enforces that a valid token is present 
 * and maps to a valid merchant record.
 * 
 * Alias for `protect` to meet unified architecture standards.
 */
const requireAuth = protect;

module.exports = {
    requireAuth,
    seller
};