const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT || '300', 10),
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

