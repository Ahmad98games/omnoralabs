const mongoose = require('mongoose');
const logger = require('./logger');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Singleton Database Service
 * Handles connection pooling, retry logic, and graceful shutdown.
 */
async function connect(uri) {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        logger.info('Initializing new MongoDB connection pool...');

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            logger.info('MongoDB Connection Established');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        logger.error('CRITICAL: MongoDB Connection Failed', {
            error: e.message,
            code: e.code,
            suggestion: 'Check your internet connection and MONGODB_URI in .env'
        });
        throw e;
    }

    return cached.conn;
}

/**
 * Graceful Shutdown
 */
async function disconnect() {
    if (mongoose.connection.readyState !== 0) {
        logger.info('Closing MongoDB connections...');
        await mongoose.connection.close();
        cached.conn = null;
        cached.promise = null;
        logger.info('MongoDB disconnected successfully');
    }
}

function isReady() {
    return mongoose.connection.readyState === 1;
}

module.exports = {
    connect,
    disconnect,
    isReady
};
