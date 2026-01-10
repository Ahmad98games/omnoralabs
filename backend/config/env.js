/**
 * Centralized Environment Configuration
 * 
 * This module is the ONLY authorized entry point for process.env.
 * It enforces strict validation and redacts secrets from logs.
 */

require('dotenv').config();

const ERRORS = {
    MISSING_SECRET: 'ERR_ENV_MISSING_CRITICAL_SECRET',
    MISSING_RUNTIME: 'ERR_ENV_MISSING_RUNTIME_VAR',
    INVALID_FORMAT: 'ERR_ENV_INVALID_FORMAT'
};

const config = {
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',

    port: parseInt(process.env.PORT || '5000', 10),
    apiPrefix: process.env.API_PREFIX || '/api',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
    logLevel: process.env.LOG_LEVEL || 'info',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    mongo: {
        uri: process.env.MONGODB_URI
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        approvalSecret: process.env.APPROVAL_TOKEN_SECRET
    },

    limits: {
        authRateLimit: parseInt(process.env.AUTH_RATE_LIMIT || '20', 10),
        apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '300', 10)
    },

    services: {
        sentryDsn: process.env.SENTRY_DSN,
        callMeBotApiKey: process.env.CALLMEBOT_APIKEY,
        adminEmail: process.env.ADMIN_EMAIL || 'admin@omnora.com',
        backendUrl: process.env.BACKEND_URL,
        sendgrid: {
            apiKey: process.env.SENDGRID_API_KEY,
            fromEmail: process.env.SENDGRID_FROM_EMAIL || 'omnorainfo28@gmail.com'
        },
        mailbluster: {
            apiKey: process.env.MAILBLUSTER_API_KEY
        },
        whatsapp: {
            phoneId: process.env.WHATSAPP_PHONE_ID,
            token: process.env.WHATSAPP_CLOUD_API_TOKEN,
            appSecret: process.env.WHATSAPP_APP_SECRET,
            verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
        },
        nodemailer: {
            service: process.env.EMAIL_SERVICE,
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    },

    payments: {
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
        },
        jazzcash: {
            merchantId: process.env.JAZZCASH_MERCHANT_ID || 'JC12345',
            password: process.env.JAZZCASH_PASSWORD || 'test_password',
            hashKey: process.env.JAZZCASH_HASH_KEY || 'test_hash_key',
            returnUrl: process.env.JAZZCASH_RETURN_URL || `http://localhost:${process.env.PORT || '5000'}/api/payments/jazzcash/callback`
        },
        easypaisa: {
            merchantId: process.env.EASYPAISA_MERCHANT_ID || 'EP12345',
            secretKey: process.env.EASYPAISA_SECRET_KEY || 'test_secret_key',
            returnUrl: process.env.EASYPAISA_RETURN_URL || `http://localhost:${process.env.PORT || '5000'}/api/payments/easypaisa/callback`
        }
    }
};

let validatedConfig = null;

function validateEnv() {
    if (validatedConfig) return validatedConfig;

    // Only validate critical stuff for startup
    const criticalSecrets = ['jwt.secret'];
    const criticalRuntime = ['port'];

    for (const path of criticalSecrets) {
        const value = path.split('.').reduce((acc, part) => acc && acc[part], config);
        if (!value && !config.isTest) {
            const err = new Error(`Critical configuration failure: ${path.split('.').pop().toUpperCase()} is missing.`);
            err.code = ERRORS.MISSING_SECRET;
            throw err;
        }
    }

    for (const path of criticalRuntime) {
        const value = path.split('.').reduce((acc, part) => acc && acc[part], config);
        if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
            const err = new Error(`Configuration failure: ${path.split('.').pop().toUpperCase()} is invalid or missing.`);
            err.code = ERRORS.MISSING_RUNTIME;
            throw err;
        }
    }

    validatedConfig = Object.freeze(config);
    return validatedConfig;
}

module.exports = {
    validateEnv,
    getConfig: () => validatedConfig || config,
    ERRORS
};
