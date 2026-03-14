const logger = require('../../services/logger');

/**
 * Global Error Handler Middleware
 * Catch-all for async domain errors and structured formatting.
 * profit.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    logger.error('DOMAIN_ERROR', {
        message: err.message,
        stack: isProduction ? null : err.stack,
        path: req.path,
        method: req.method,
        code: err.code || 'UNKNOWN_CORE_ERROR'
    });

    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'An internal system error occurred in the Omnora engine.',
            code: err.code || 'SYS_GENERAL_ERROR',
            details: isProduction ? null : err.details || null
        }
    });
};

module.exports = errorHandler;
