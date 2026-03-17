const express = require('express');
// Force Restart 3 // restart trigger 3
const cors = require('cors');
// Dotenv loaded in config/env.js securely
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

// --- Bridge JWT Auth Requirements ---
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('./config/supabaseClient');
// ------------------------------------

// Load Validated Config
const config = validateEnv();
const sbUrl = process.env.SUPABASE_URL || '';
console.log(sbUrl ? `[Supabase Startup] URL Loaded: ${sbUrl.substring(0, 10)}...` : "[Supabase Startup] URL MISSING");
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

const { tenantContext } = require('./middleware/tenantContext');
app.use(tenantContext);

// ---------- Middleware ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
};

app.use(cors(corsOptions));
// Increased limit for Serverless uploads (Vercel max 4.5MB)
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
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));

const morganStream = { write: (message) => logger.info(message.trim()) };
app.use(morgan('combined', { stream: morganStream }));

// =========================================================================
// BRIDGE JWT AUTH ROUTES (/auth/login & /auth/register) DIRECTLY IN SERVER
// =========================================================================
app.post('/api/auth/register', async (req, res) => {
  try {
      const { name, email, password, role } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      // Check if user exists
      const { data: userExists } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (userExists) return res.status(400).json({ error: 'User already exists' });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create new user securely bypassing trigger hooks with Service Role Key
      const { data: user, error } = await supabase.from('users').insert([{
          email,
          password_hash,
          role: role || 'customer'
      }]).select().single();

      if (error) throw error;

      const token = jwt.sign(
          { id: user.id, role: user.role || 'customer' }, 
          config.jwt?.secret || process.env.JWT_SECRET || 'secret', 
          { expiresIn: '7d' }
      );
      
      res.status(201).json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      // Fetch user using service role
      const { data: user, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (!user || error) return res.status(401).json({ error: 'Invalid credentials' });

      // Verify bcrypt hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
          { id: user.id, role: user.role }, 
          config.jwt?.secret || process.env.JWT_SECRET || 'secret', 
          { expiresIn: '7d' }
      );
      
      res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
  }
});
// =========================================================================

// ---------- Routes ----------
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const healthRoutes = require('./routes/healthRoutes');
const domainRoutes = require('./routes/domainRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

app.use('/api/auth', authRoutes); // Fallback for other auth actions like /auth/me or /auth/logout
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
app.post('/api/track', require('./controllers/analyticsController').track);
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
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message, stack: err.stack });
});

// --- ASYNC IIFE FOR BACKGROUND BOOTSTRAP ---
(async () => {
  try {
    const bootstrap = require('./bootstrap');
    await bootstrap();
  } catch (err) {
    logger.error('IIFE_BOOTSTRAP_FAILURE', { error: err.message });
  }
})();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason: reason?.message || reason });
  setTimeout(() => { process.exit(1); }, 1000);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  setTimeout(() => { process.exit(1); }, 1000);
});

// Fully export the Express standard app! Vercel Node Runtime expects exactly this.
module.exports = app;
