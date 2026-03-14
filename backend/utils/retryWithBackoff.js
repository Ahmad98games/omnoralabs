/**
 * retryWithBackoff.js
 * Generic exponential backoff retry utility for unstable external APIs.
 *
 * Usage:
 *   const result = await retryWithBackoff(() => leopardsApi.createShipment(...), {
 *     maxAttempts: 4,
 *     baseDelayMs: 500,
 *     onRetry: (err, attempt) => logger.warn('Retrying...', { attempt })
 *   });
 */
const logger = require('../services/logger');

/**
 * Sleep for `ms` milliseconds.
 */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Exponential backoff formula: baseDelay * 2^(attempt-1) + jitter
 */
function calcDelay(baseDelayMs, attempt, jitterMs = 200) {
    return baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * jitterMs;
}

/**
 * @param {() => Promise<any>} fn          — async function to retry
 * @param {object}             opts
 * @param {number}             opts.maxAttempts  — default 4
 * @param {number}             opts.baseDelayMs  — default 500ms
 * @param {number}             opts.maxDelayMs   — ceiling (default 30s)
 * @param {string}             opts.label        — logging label
 * @param {Function}           opts.isRetryable  — (err) => bool, default: always true
 * @param {Function}           opts.onRetry      — (err, attempt) => void
 */
async function retryWithBackoff(fn, opts = {}) {
    const {
        maxAttempts = 4,
        baseDelayMs = 500,
        maxDelayMs = 30_000,
        label = 'operation',
        isRetryable = () => true,
        onRetry = null,
    } = opts;

    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            if (!isRetryable(err)) {
                logger.warn(`RETRY[${label}]: Non-retryable error — aborting`, { attempt, error: err.message });
                throw err;
            }

            if (attempt === maxAttempts) break;

            const delay = Math.min(calcDelay(baseDelayMs, attempt), maxDelayMs);
            logger.warn(`RETRY[${label}]: Attempt ${attempt}/${maxAttempts} failed — retry in ${Math.round(delay)}ms`, { error: err.message });
            if (onRetry) onRetry(err, attempt);
            await sleep(delay);
        }
    }

    logger.error(`RETRY[${label}]: All ${maxAttempts} attempts exhausted`, { error: lastError.message });
    throw lastError;
}

module.exports = { retryWithBackoff, sleep };
