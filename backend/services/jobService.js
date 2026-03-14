/**
 * jobService.js
 * 
 * High-level service for managing the lifecycle of asynchronous jobs.
 * Bridges BullMQ state with API-friendly status reporting.
 */

const queueService = require('./queueService');
const logger = require('./logger');

const jobService = {
    /**
     * Start a new background job
     * @param {string} type - Job type (e.g., 'launch_store', 'sync_cms')
     * @param {object} data - Payload for the worker
     * @param {object} options - BullMQ job options
     */
    createJob: async (type, data, options = {}) => {
        const result = await queueService.safeAdd('background-tasks', type, data, options);
        
        if (!result.success) {
            logger.error('JOB_SERVICE_INIT_ERROR', { type, error: result.error });
            return { status: 'failed', error: result.error };
        }

        logger.info('Background job initiated', { jobId: result.jobId, type });
        return { 
            status: 'processing', 
            jobId: result.jobId,
            message: 'Task accepted and queued for processing'
        };
    },

    /**
     * Retrieve current status of a job
     * @param {string} jobId - BullMQ Job ID
     */
    getJobStatus: async (jobId) => {
        try {
            // Locate the queue
            const queue = require('./queueService')._getQueueInternal('background-tasks');
            if (!queue) return { status: 'unknown', error: 'Queue infrastructure offline' };

            const job = await queue.getJob(jobId);
            if (!job) return { status: 'not_found' };

            const state = await job.getState();
            
            // Map BullMQ states to Omnora UI statuses
            const statusMap = {
                'active': 'processing',
                'waiting': 'queued',
                'delayed': 'queued',
                'completed': 'completed',
                'failed': 'failed',
                'prioritized': 'queued'
            };

            return {
                jobId: job.id,
                status: statusMap[state] || state,
                progress: job.progress || 0,
                result: job.returnvalue || null,
                error: job.failedReason || null,
                createdAt: job.timestamp,
                processedAt: job.processedOn,
                finishedAt: job.finishedOn
            };

        } catch (error) {
            logger.error('JOB_STATUS_FETCH_ERROR', { jobId, error: error.message });
            return { status: 'error', message: 'Unable to fetch job status' };
        }
    }
};

module.exports = jobService;
