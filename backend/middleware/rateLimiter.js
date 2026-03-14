const rateLimit = require('express-rate-limit');

const { validateEnv } = require('../config/env');

const config = validateEnv();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.limits.authRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: config.limits.apiRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Slow down your requests.'
    })
});

module.exports = {
  authLimiter,
  apiLimiter
};

