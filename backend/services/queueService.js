const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('./logger');

// Redis connection
let connection;
try {
    connection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
            // Stop retrying after 3 attempts if initial connection fails
            if (times > 3) {
                return null;
            }
            return Math.min(times * 50, 2000);
        }
    });

    connection.on('error', (err) => {
        // Suppress unhandled error events to prevent crash
        logger.warn('Redis connection error (queues disabled):', err.message);
    });
} catch (error) {
    logger.warn('Failed to initialize Redis connection:', error.message);
}

// Queue configurations
const defaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000 // 2s, 4s, 8s
    },
    removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000
    },
    removeOnFail: {
        age: 7 * 24 * 3600 // Keep failed jobs for 7 days
    }
};

// ============================================
// EMAIL QUEUE
// ============================================

let emailQueue, emailDLQ;
if (connection) {
    try {
        emailQueue = new Queue('email-notifications', {
            connection,
            defaultJobOptions
        });

        emailDLQ = new Queue('email-dlq', {
            connection,
            defaultJobOptions: {
                attempts: 1, // DLQ doesn't retry
                removeOnComplete: false,
                removeOnFail: false
            }
        });
    } catch (e) {
        logger.warn('Failed to create email queues:', e.message);
    }
}

/**
 * Add email job to queue
 * @param {string} type - Email type (order_confirmation, payment_approved, etc.)
 * @param {Object} data - Email data
 * @returns {Promise<Job>}
 */
async function queueEmail(type, data) {
    if (!emailQueue) {
        logger.warn('Email queue not available, skipping email:', type);
        return null;
    }
    try {
        const job = await emailQueue.add(type, {
            type,
            ...data,
            queuedAt: new Date()
        }, {
            priority: data.priority || 5, // Lower number = higher priority
            jobId: `email-${type}-${data.orderId || Date.now()}`
        });

        logger.info('Email queued', { jobId: job.id, type, orderId: data.orderId });
        return job;
    } catch (error) {
        logger.error('Failed to queue email', { error: error.message, type });
        // Don't throw, just log, so main flow continues
        return null;
    }
}

// ============================================
// WHATSAPP QUEUE
// ============================================

let whatsappQueue, whatsappDLQ;
if (connection) {
    try {
        whatsappQueue = new Queue('whatsapp-notifications', {
            connection,
            defaultJobOptions
        });

        whatsappDLQ = new Queue('whatsapp-dlq', {
            connection,
            defaultJobOptions: {
                attempts: 1,
                removeOnComplete: false,
                removeOnFail: false
            }
        });
    } catch (e) {
        logger.warn('Failed to create WhatsApp queues:', e.message);
    }
}

/**
 * Add WhatsApp job to queue
 * @param {string} phone - Recipient phone number
 * @param {string} templateName - Template name
 * @param {Array} params - Template parameters
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Job>}
 */
async function queueWhatsApp(phone, templateName, params, metadata = {}) {
    if (!whatsappQueue) {
        logger.warn('WhatsApp queue not available, skipping message:', templateName);
        return null;
    }
    try {
        const job = await whatsappQueue.add('send-template', {
            phone,
            templateName,
            params,
            metadata,
            queuedAt: new Date()
        }, {
            priority: metadata.priority || 5,
            jobId: `whatsapp-${templateName}-${metadata.orderId || Date.now()}`
        });

        logger.info('WhatsApp queued', { jobId: job.id, templateName, phone: phone.substring(0, 5) + '***' });
        return job;
    } catch (error) {
        logger.error('Failed to queue WhatsApp', { error: error.message, templateName });
        // Don't throw
        return null;
    }
}

// ============================================
// QUEUE MONITORING
// ============================================

/**
 * Get queue statistics
 */
async function getQueueStats(queueName) {
    const queue = queueName === 'email' ? emailQueue : whatsappQueue;
    const dlq = queueName === 'email' ? emailDLQ : whatsappDLQ;

    const [waiting, active, completed, failed, dlqCount] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        dlq.getWaitingCount()
    ]);

    return {
        queue: queueName,
        waiting,
        active,
        completed,
        failed,
        dlq: dlqCount,
        total: waiting + active + completed + failed
    };
}

/**
 * Get failed jobs from DLQ
 */
async function getDLQJobs(queueName, start = 0, end = 50) {
    const dlq = queueName === 'email' ? emailDLQ : whatsappDLQ;
    const jobs = await dlq.getJobs(['waiting', 'failed'], start, end);

    return jobs.map(job => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn
    }));
}

/**
 * Retry a job from DLQ
 */
async function retryDLQJob(queueName, jobId) {
    const dlq = queueName === 'email' ? emailDLQ : whatsappDLQ;
    const targetQueue = queueName === 'email' ? emailQueue : whatsappQueue;

    const job = await dlq.getJob(jobId);
    if (!job) {
        throw new Error('Job not found in DLQ');
    }

    // Re-queue the job
    const newJob = await targetQueue.add(job.name, job.data);

    // Remove from DLQ
    await job.remove();

    logger.info('Job retried from DLQ', { jobId, newJobId: newJob.id, queue: queueName });
    return newJob;
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function closeQueues() {
    logger.info('Closing queues...');
    await Promise.all([
        emailQueue.close(),
        whatsappQueue.close(),
        emailDLQ.close(),
        whatsappDLQ.close(),
        connection.quit()
    ]);
    logger.info('All queues closed');
}

// Handle process termination
process.on('SIGTERM', closeQueues);
process.on('SIGINT', closeQueues);

module.exports = {
    // Queues
    emailQueue,
    whatsappQueue,
    emailDLQ,
    whatsappDLQ,

    // Functions
    queueEmail,
    queueWhatsApp,
    getQueueStats,
    getDLQJobs,
    retryDLQJob,
    closeQueues
};
