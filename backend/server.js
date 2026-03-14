const express = require('express');
// Force Restart 3 // restart trigger 3
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
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

// Database Layer Unified on Supabase/PostgreSQL

const { tenantContext } = require('./shared/middleware/tenantContext');
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

// ---------- Domain Modules (Modular Monolith) ----------
const aiForgeModule = require('./modules/ai-forge/ai-forge.routes');
const checkoutModule = require('./modules/checkout/checkout.routes');
const tenantModule = require('./modules/tenant/tenant.routes');
const analyticsModule = require('./modules/analytics/analytics.routes');

// Legacy & Shared Routes (To be eventually modularized)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const healthRoutes = require('./routes/healthRoutes');

// --- Mount Domains ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiForgeModule);
app.use('/api/checkout', checkoutModule);
app.use('/api/tenant', tenantModule);
app.use('/api/analytics', analyticsModule);

// Legacy Fallbacks
app.use('/api/health', healthRoutes);
app.use('/api/media', require('./routes/mediaRoutes'));

// ---------- Global Error Orchestration ----------
const errorHandler = require('./shared/middleware/errorHandler');
app.use(errorHandler);

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
