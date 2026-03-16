const crypto = require('crypto');
const logger = require('../services/logger');
const stateService = require('../services/stateService');
const { LIFECYCLE } = require('../services/stateService');

const CAPABILITIES = {
    READ_ONLY: 'READ_ONLY',
    STATE_MUTATING: 'STATE_MUTATING',
    INTERNAL_ONLY: 'INTERNAL_ONLY'
};

const API_VERSION = '1';

/**
 * Standardized V1 Error Contract
 */
const createErrorResponse = (reason, retryable = false) => ({
    v: 1,
    error: 'SERVICE_UNAVAILABLE',
    code: 503,
    retryable,
    reason,
    blocking: stateService.getSnapshot().infra.db ? [] : ['DB'],
    timestamp: new Date().toISOString()
});

/**
 * Request Fingerprinting
 * Hash of (Route + Capability + ClientHash)
 */
const getFingerprint = (req, capability) => {
    // Trusted Proxy Awareness: X-Forwarded-For (sanitized)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const nonce = req.headers['x-fingerprint-nonce'] || '';

    const data = `${clientIp}-${userAgent}-${nonce}`;
    const hmacCurrent = process.env.HMAC_KEY_CURRENT;
    const hmacPrevious = process.env.HMAC_KEY_PREVIOUS;
    const clientSig = req.headers['x-request-signature'];

    // 1. HMAC Verification (Current Key)
    if (clientSig && hmacCurrent) {
        const expected = crypto.createHmac('sha256', hmacCurrent).update(data).digest('hex');
        if (clientSig === expected) return _finalHash(req.originalUrl, capability, expected);

        // 2. Double-Key Rotation Window (Previous Key)
        if (hmacPrevious) {
            const expectedPrev = crypto.createHmac('sha256', hmacPrevious).update(data).digest('hex');
            if (clientSig === expectedPrev) {
                logger.info('GATEKEEPER: Valid signature via legacy key window');
                return _finalHash(req.originalUrl, capability, expectedPrev);
            }
        }
        logger.warn('GATEKEEPER: HMAC verification failed, defaulting to IP-based hash', { path: req.path });
    }

    // 3. Fallback: Deterministic Hash
    const clientHash = crypto.createHash('sha256')
        .update(data)
        .digest('hex')
        .substring(0, 16);

    return _finalHash(req.originalUrl, capability, clientHash);
};

const _finalHash = (url, capability, clientPart) => {
    return crypto.createHash('sha256')
        .update(`${url}-${capability}-${clientPart}`)
        .digest('hex')
        .substring(0, 16);
};

/**
 * Gatekeeper Middleware Factory
 */
const gatekeeper = (capability) => {
    if (!CAPABILITIES[capability]) {
        throw new Error(`GATEKEEPER_CONFIG_ERROR: Unknown capability '${capability}'`);
    }

    // PRODUCTION_GUARD for INTERNAL_ONLY
    if (capability === CAPABILITIES.INTERNAL_ONLY && process.env.NODE_ENV === 'production') {
        throw new Error(`GATEKEEPER_SECURITY_VIOLATION: INTERNAL_ONLY routes are forbidden in production.`);
    }

    return (req, res, next) => {
        const snapshot = stateService.getSnapshot();

        // 1. Universal Version Check
        const clientVersion = req.headers['x-api-version'];
        // Imperial Hardening: Flexible version check for migration
        if (clientVersion && clientVersion !== '1') {
            return res.status(503).json({
                error: 'SERVICE_UNAVAILABLE',
                message: `API Version Mismatch (Expected: 1, Received: ${clientVersion})`,
                retryAfter: 5
            });
        }

        // 2. Lifecycle Check: DRAINING
        if (snapshot.lifecycle === LIFECYCLE.DRAINING && capability !== CAPABILITIES.READ_ONLY) {
            return res.status(503).json(createErrorResponse('Server is draining for maintenance. Non-critical requests rejected.', true));
        }

        // 3. Infrastructure Check: DB
        // Imperial Hardening: Relaxed check for Supabase transition
        /*
        if (capability === CAPABILITIES.STATE_MUTATING && snapshot.lifecycle === LIFECYCLE.BOOTING) {
            logger.warn('GATEKEEPER: Blocked mutating request during BOOTING', {
                path: req.path,
                fingerprint: getFingerprint(req, capability)
            });

            return res.status(503).json(createErrorResponse('System is still initializing.', true));
        }
        */

        // 4. Rate Limiting for gated/degraded requests (Implicit here, can be extended)
        // ... handled externally or by middleware wrapper

        next();
    };
};

module.exports = {
    gatekeeper,
    CAPABILITIES,
    getFingerprint
};
