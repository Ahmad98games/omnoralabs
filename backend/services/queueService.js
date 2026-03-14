const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('./logger');
const { validateEnv } = require('../config/env');
const stateService = require('./stateService');
const { INFRA } = require('./stateService');

const config = validateEnv();

// Redis connection instance (Private to module)
let connection = null;
if (config.isProduction) {
    connection = new IORedis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        maxLoadingRetryTime: 5000,
        retryStrategy(times) {
            const delay = Math.min(times * 2000, 30000);
            return delay;
        }
    });

    // Update SystemState on connection events
    connection.on('connect', () => {
        stateService.setInfraStatus(INFRA.REDIS, true);
        logger.info('REDIS_SUCCESS: Connection established');
    });
    connection.on('error', (err) => {
        stateService.setInfraStatus(INFRA.REDIS, false);
        if (err.code === 'ECONNREFUSED') {
            if (!process._redisRefused) {
                logger.warn('REDIS_DEGRADED: Connection refused. Proceeding without queues.');
                process._redisRefused = true;
            }
        } else {
            logger.error('REDIS_FAILURE: Connection lost', { error: err.message });
        }
    });
} else {
    logger.info('DEV_MODE: Skipping Redis connection (Queues disabled)');
}

const defaultJobOptions = {
    attempts: 5,                                          // was 3 — more retries for transient failures
    backoff: { type: 'exponential', delay: 3000 },       // 3s, 6s, 12s, 24s, 48s
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 }             // keep failed jobs 7 days for DLQ inspection
};

// ── Queue definitions ─────────────────────────────────────────────────────────
// Internal Queues (Private to module)
const _queues = {};
if (connection) {
    _queues.email = new Queue('email-notifications', { connection, defaultJobOptions });
    _queues.whatsapp = new Queue('whatsapp-notifications', { connection, defaultJobOptions });
    _queues['ai-content'] = new Queue('ai-content', { connection, defaultJobOptions });
    _queues['background-tasks'] = new Queue('background-tasks', { connection, defaultJobOptions });
    _queues.emailDLQ = new Queue('email-dlq', { connection, defaultJobOptions });
    _queues.whatsappDLQ = new Queue('whatsapp-dlq', { connection, defaultJobOptions });
    _queues.aiDLQ = new Queue('ai-content-dlq', { connection, defaultJobOptions });
    _queues.backgroundDLQ = new Queue('background-dlq', { connection, defaultJobOptions });
}

// ── WhatsApp queue with concurrency cap ──────────────────────────────────────
const WA_CONCURRENCY = parseInt(process.env.WA_WORKER_CONCURRENCY) || 3;  // max 3 parallel WA sends
const EMAIL_CONCURRENCY = parseInt(process.env.EMAIL_WORKER_CONCURRENCY) || 5;
const AI_CONCURRENCY = parseInt(process.env.AI_WORKER_CONCURRENCY) || 2;  // costly ops get fewer slots

// These are registered by dedicated worker files — exposed here for reference.
module._concurrency = { WA_CONCURRENCY, EMAIL_CONCURRENCY, AI_CONCURRENCY };

// ── DLQ routing helper (call from failed job handlers) ───────────────────────
async function sendToDLQ(queueName, job, error) {
    const dlqName = `${queueName}DLQ`;
    const dlq = _queues[dlqName];
    if (!dlq) return;
    await dlq.add('dead-letter', {
        originalJob: job.name,
        data: job.data,
        failedAt: new Date(),
        errorMessage: error?.message || 'Unknown',
        attempts: job.attemptsMade,
    }).catch(e => logger.error('DLQ_WRITE_FAILED', { error: e.message }));
    logger.warn(`DLQ: Job moved to ${dlqName}`, { jobId: job.id, error: error?.message });
}

/**
 * .safeAdd() Pattern
 * Enforces availability check and Result object pattern.
 */
async function safeAdd(queueName, type, data, options = {}) {
    const isAvailable = stateService.getSnapshot().infra.redis;

    if (!isAvailable) {
        logger.warn('QUEUE_DEGRADED: Redis unavailable, skipping queue operation', { queueName, type });
        return { success: false, error: 'Redis unavailable - running in degraded mode' };
    }

    const queue = _queues[queueName];
    if (!queue) throw new Error(`INVALID_QUEUE: '${queueName}' does not exist.`);

    // ── Overflow guard: drop if queue already very deep ──────────────────────
    const waitingCount = await queue.getWaitingCount().catch(() => 0);
    const OVERFLOW_LIMIT = parseInt(process.env.QUEUE_MAX_WAITING) || 500;
    if (waitingCount >= OVERFLOW_LIMIT) {
        logger.warn('QUEUE_OVERFLOW: Queue depth exceeded limit — job dropped', { queueName, type, waitingCount });
        return { success: false, error: 'queue_overflow' };
    }

    try {
        const job = await queue.add(type, {
            ...data,
            queuedAt: new Date()
        }, options);

        return { success: true, jobId: job.id };
    } catch (error) {
        logger.error('QUEUE_FAILURE: Enqueue failed', { error: error.message, queueName });
        return { success: false, error: error.message };
    }
}

/**
 * Legacy Wrappers (Refactored to use safeAdd)
 */
async function queueEmail(type, data) {
    return safeAdd('email', type, data, {
        priority: data.priority || 5,
        jobId: `email-${type}-${data.orderId || Date.now()}`
    });
}

async function queueWhatsApp(phone, templateName, params, metadata = {}) {
    return safeAdd('whatsapp', 'send-template', {
        phone, templateName, params, metadata
    }, {
        priority: metadata.priority || 5,
        jobId: `whatsapp-${templateName}-${metadata.orderId || Date.now()}`
    });
}

/**
 * Queue Monitoring (Using internal private queues)
 */
async function getQueueStats(queueName) {
    const queue = _queues[queueName];
    if (!queue) return null;

    const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount()
    ]);

    return { queue: queueName, waiting, active, completed, failed };
}

async function closeQueues() {
    logger.info('Shutting down queues...');
    try {
        await Promise.all(Object.values(_queues).map(q => q.close().catch(() => { })));
        if (connection.status !== 'end') {
            await connection.quit().catch(() => { });
        }
    } catch (err) {
        logger.warn('QUEUE: Error during cleanup', { error: err.message });
    }
}

// ── Queue health report (for /api/health endpoint) ───────────────────────────
async function getHealthReport() {
    if (!stateService.getSnapshot().infra.redis) return { status: 'degraded', queues: {} };
    const names = ['email', 'whatsapp', 'ai-content', 'emailDLQ', 'whatsappDLQ', 'aiDLQ'];
    const stats = {};
    await Promise.all(names.map(async name => {
        const q = _queues[name];
        if (!q) return;
        const [waiting, active, failed] = await Promise.all([
            q.getWaitingCount().catch(() => -1),
            q.getActiveCount().catch(() => -1),
            q.getFailedCount().catch(() => -1),
        ]);
        stats[name] = { waiting, active, failed };
    }));
    return { status: 'ok', queues: stats };
}

module.exports = {
    safeAdd,
    queueEmail,
    queueWhatsApp,
    sendToDLQ,
    getQueueStats,
    getHealthReport,
    closeQueues,
    isAvailable: () => stateService.getSnapshot().infra.redis,
    _getQueueInternal: (name) => _queues[name], // Internal use for status polling
    connection // Exported for authorized worker use
};
