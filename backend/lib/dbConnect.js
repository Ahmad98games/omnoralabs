const mongoose = require('mongoose');
const { validateEnv } = require('../config/env');

const config = validateEnv();
const MONGODB_URI = config.mongo.uri;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!MONGODB_URI) {
        console.warn('WARN: MONGODB_URI not found in env, skipping connection (LocalDB Mode)');
        return null;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable Mongoose buffering to fail fast if no connection
            // serverSelectionTimeoutMS: 5000, // Fail fast if DB down (Vercel constraint)
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

module.exports = dbConnect;
