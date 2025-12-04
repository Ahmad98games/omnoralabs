// server.js - corrected version with robust MongoDB connection and in‑memory fallback
const express = require('express');
// Conditionally require mongodb-memory-server (dev dependency)
let MongoMemoryServer;
try {
  MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
} catch (e) {
  // mongodb-memory-server not available (production mode)
  MongoMemoryServer = null;
}
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const Sentry = require('@sentry/node');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./services/logger');

console.log('Starting server.js...');
dotenv.config();
console.log('Environment variables loaded.');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Initialise Sentry if DSN provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  app.use(Sentry.Handlers.requestHandler());
}

// ---------- MongoDB connection with fallback ----------
const connectDB = async () => {
  console.log('Attempting to connect to MongoDB...');
  const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omnora_ecommerce';
  try {
    await mongoose.connect(primaryUri);
    logger.info('MongoDB connected (primary)');
    return;
  } catch (primaryErr) {
    logger.error('Primary MongoDB connection failed', { error: primaryErr.message });
  }

  // Try local MongoDB fallback
  const localUri = 'mongodb://127.0.0.1:27017/omnora_ecommerce';
  try {
    await mongoose.connect(localUri);
    logger.info('MongoDB connected (local fallback)');
    return;
  } catch (localErr) {
    logger.error('Local MongoDB fallback failed', { error: localErr.message });
  }

  // Final fallback: in‑memory MongoDB (only if available)
  if (MongoMemoryServer) {
    try {
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      logger.info('MongoDB connected (in‑memory)');
      // Store reference for graceful shutdown if needed
      process.env.MEMORY_MONGODB_URI = memUri;
      return;
    } catch (memErr) {
      logger.error('In‑memory MongoDB startup failed', { error: memErr.message });
    }
  }

  // No MongoDB available
  logger.warn('All MongoDB connection attempts failed. Server starting in OFFLINE mode (using in-memory data).');
  // Do NOT exit, allow server to start with in-memory fallbacks in controllers
  // process.exit(1);
};

const seedDatabase = async () => {
  try {
    // Load models first to ensure they are registered
    require('./models/Product');
    const Product = mongoose.model('Product');
    const defaultProducts = require('./data/defaultProducts');

    if (mongoose.connection.readyState !== 1) {
      logger.warn('Skipping seed: MongoDB not connected');
      return;
    }

    const count = await Product.countDocuments();
    if (count === 0) {
      logger.info('Database empty, seeding default products...');
      // Ensure _id is handled correctly if it's a string in defaultProducts but ObjectId in schema
      // But usually mongoose handles string _id if schema allows or if we remove it.
      // Let's remove _id to let Mongoose generate it, or keep it if we want fixed IDs.
      // defaultProducts has string IDs '1', '2', etc. which might be an issue if Schema expects ObjectId.
      // Let's try inserting as is, if it fails we might need to map.
      // Actually, let's map to remove _id so Mongoose generates valid ObjectIds
      const productsToInsert = defaultProducts.map(({ _id, ...rest }) => rest);

      await Product.insertMany(productsToInsert);
      logger.info(`Seeded ${productsToInsert.length} products`);
    }
  } catch (error) {
    logger.error('Seeding failed', { error: error.message });
  }
};

// Load all Mongoose models after DB connection
// We need to load them before seeding
require('./models/OneClickCheckout');
require('./models/AbandonedCart');
require('./models/Bundle');
require('./models/Phase1Models');
require('./models/Phase2Models');
require('./models/Phase3Models');
// Product model is likely in Phase1Models or loaded separately. 
// Let's ensure it's loaded.
require('./models/Product');

connectDB().then(() => seedDatabase());

// ---------- Middleware ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(hpp());
app.use(compression());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  })
);

const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan('combined', { stream: morganStream }));

// ---------- Routes ----------
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const phase1Routes = require('./routes/phase1Routes');
const phase2Routes = require('./routes/phase2Routes');
const phase3Routes = require('./routes/phase3Routes');
const healthRoutes = require('./routes/healthRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', require('./routes/webhookRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Global error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'development'
        ? `Error: ${err.message}`
        : 'Internal server error occurred',
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API URL: http://localhost:${PORT}${API_PREFIX}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use! Please stop the other process running on this port.`);
    process.exit(1);
  } else {
    logger.error('Server error', { error: err.message });
  }
});
