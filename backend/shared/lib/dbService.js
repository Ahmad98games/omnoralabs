const logger = require('./logger');

const { Pool } = require('pg');

let pgPool = global.pgPool;

/**
 * Singleton Database Service
 * Handles PostgreSQL connection pooling, retry logic, and graceful shutdown.
 */

// ── PostgreSQL (Supabase Pooler) ──────────────────────────────────────

async function connectPostgres(connectionString) {
    if (pgPool) return pgPool;

    logger.info('Initializing Supabase PostgreSQL Connection Pool (Transaction Mode)...');

    pgPool = new Pool({
        connectionString,
        max: 20, // Limit connections for transaction mode
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 10000, // 10s query limit
    });

    // Resilience: Exponential Retry Logic on Connect
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
        try {
            const client = await pgPool.connect();
            logger.info('PostgreSQL connection established via Pooler (Port 6543)');
            client.release();
            global.pgPool = pgPool;
            return pgPool;
        } catch (err) {
            retries--;
            logger.warn(`PostgreSQL connection failed. Retries left: ${retries}`, { error: err.message });
            if (retries === 0) throw err;
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
}

/**
 * Graceful Shutdown
 */
async function disconnect() {
    if (pgPool) {
        logger.info('Closing PostgreSQL pool...');
        await pgPool.end();
        pgPool = null;
        global.pgPool = null;
        logger.info('PostgreSQL pool closed');
    }
}

function isReady() {
    return !!pgPool;
}

module.exports = {
    connectPostgres,
    disconnect,
    isReady,
    getPgPool: () => pgPool
};
