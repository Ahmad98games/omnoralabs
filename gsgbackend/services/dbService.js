// 🛑 MongoDB Removed. Providing Mock for System Compatibility
const logger = require('./logger');

/**
 * Supabase Connection Mock
 * Keeps existing logic alive while database is fully Supabase.
 */
async function connect(uri) {
    logger.info('Omnora Engine: Using Supabase Cloud Gateway');
    return { connection: { readyState: 1 } };
}

async function disconnect() {
    logger.info('Closing Gateway connections...');
}

function isReady() {
    return true; // Supabase is always ready via client
}

module.exports = {
    connect,
    disconnect,
    isReady
};
