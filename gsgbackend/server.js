const express = require('express');
// Force Restart 3 // restart trigger 3
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
// [Mongoose Removed] const mongoose = require('mongoose');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const Sentry = require('@sentry/node');
const { apiLimiter } = require('./middleware/rateLimiter');
const { validateEnv } = require('./config/env');
const logger = require('./services/logger');
const { gatekeeper, CAPABILITIES } = require('./middleware/gatekeeper');

// Load Validated Config
const config = validateEnv();
const API_PREFIX = config.apiPrefix;

const app = express();
app.set('trust proxy', 1);

// Initialise Sentry if DSN provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  app.use(Sentry.Handlers.requestHandler());
}

// Database connection and seeding are handled by bootstrap.js

// [Mongoose Removed] require('./models/OneClickCheckout');
// [Mongoose Removed] require('./models/AbandonedCart');
// [Mongoose Removed] require('./models/Bundle');
// [Mongoose Removed] require('./models/Phase1Models');
// [Mongoose Removed] require('./models/Phase2Models');
// [Mongoose Removed] require('./models/Phase3Models');
// [Mongoose Removed] require('./models/SiteContent');
// [Mongoose Removed] require('./models/Product');
// [Mongoose Removed] require('./models/PaymentMethod');
// [Mongoose Removed] require('./models/WaOptOut');
// [Mongoose Removed] require('./models/WhatsAppTemplate');
// [Mongoose Removed] require('./models/AiContent');
// [Mongoose Removed] require('./models/Shipment');

const { tenantContext } = require('./middleware/tenantContext');
app.use(tenantContext);

// ---------- Middleware ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
};

app.use(cors(corsOptions));
// Increased limit for Serverless uploads (Vercel max 4.5MB)
// Capture raw body for Stripe webhooks
app.use(express.json({
  limit: '4mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/api/webhook')) {
      req.rawBody = buf;
    }
  }
}));
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
const cmsRoutes = require('./routes/cmsRoutes');
const healthRoutes = require('./routes/healthRoutes');
const domainRoutes = require('./routes/domainRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', require('./routes/webhookRoutes'));
app.use('/api/admin', gatekeeper(CAPABILITIES.STATE_MUTATING), require('./routes/adminRoutes'));
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/domains', domainRoutes);
app.post('/api/track', require('./controllers/analyticsController').track); // Direct alias for frontend
app.use('/api/phase1', phase1Routes);
app.use('/api/phase2', phase2Routes);
app.use('/api/phase3', phase3Routes);
app.use('/api/cms', cmsRoutes);
app.use('/api/cms/performance-hub', require('./routes/performanceHubRoutes'));
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));
app.use('/api/payment-methods', require('./routes/paymentMethodRoutes'));
app.use('/api/seller-analytics', require('./routes/sellerAnalyticsRoutes'));
app.use('/api/whatsapp-templates', require('./routes/whatsappTemplateRoutes'));
app.use('/api/ai', require('./routes/aiContentRoutes'));
app.use('/api/media', mediaRoutes);
app.use('/api/health', healthRoutes);

// Global error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(err.status || 500).json({
    error: `Error: ${err.message}`,
    stack: err.stack // Temporarily exposing stack for debugging
  });
});

// Only start server if running directly
if (require.main === module) {
  const bootstrap = require('./bootstrap');
  bootstrap().then(({ config }) => {
    const PORT = config.port;
    app.listen(PORT, '127.0.0.1', () => {
      logger.info(`Server running on http://127.0.0.1:${PORT}`);
      logger.info(`Mode: ${config.env}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use!`);
        process.exit(1);
      } else {
        logger.error('Server error', { error: err.message });
      }
    });
  }).catch(err => {
    console.error('❌ FATAL: Bootstrap failed:', err);
    process.exit(1);
  });
}

module.exports = app;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason: reason?.message || reason });
  // Flush logs if possible, then exit to allow restart
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  // Flush logs if possible, then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});
