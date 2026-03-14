const logger = require('../services/logger');
const { getQueueStats, getDLQJobs, retryDLQJob } = require('../services/queueService');
const AdminActionLog = require('../models/AdminActionLog');
const MessageLog = require('../models/MessageLog');

/**
 * @desc    Get queue statistics
 * @route   GET /api/admin/queue/stats
 * @access  Private/Admin
 */
exports.getQueueStats = async (req, res) => {
    try {
        const [emailStats, whatsappStats] = await Promise.all([
            getQueueStats('email'),
            getQueueStats('whatsapp')
        ]);

        res.json({
            success: true,
            queues: {
                email: emailStats,
                whatsapp: whatsappStats
            },
            timestamp: new Date()
        });
    } catch (error) {
        logger.error('Get queue stats error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch queue statistics' });
    }
};

/**
 * @desc    Get DLQ jobs
 * @route   GET /api/admin/dlq?queue=email&start=0&end=50
 * @access  Private/Admin
 */
exports.getDLQJobs = async (req, res) => {
    try {
        const { queue = 'email', start = 0, end = 50 } = req.query;

        if (!['email', 'whatsapp'].includes(queue)) {
            return res.status(400).json({ error: 'Invalid queue name. Must be "email" or "whatsapp"' });
        }

        const jobs = await getDLQJobs(queue, parseInt(start), parseInt(end));

        res.json({
            success: true,
            queue,
            jobs,
            count: jobs.length
        });
    } catch (error) {
        logger.error('Get DLQ jobs error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch DLQ jobs' });
    }
};

/**
 * @desc    Retry a job from DLQ
 * @route   POST /api/admin/dlq/:jobId/retry
 * @access  Private/Admin
 */
exports.retryDLQJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { queue } = req.body;

        if (!['email', 'whatsapp'].includes(queue)) {
            return res.status(400).json({ error: 'Invalid queue name. Must be "email" or "whatsapp"' });
        }

        const newJob = await retryDLQJob(queue, jobId);

        // Record admin action
        await AdminActionLog.create({
            action: 'dlq_retry',
            orderId: newJob.data.orderId || null,
            adminEmail: req.user?.email || 'admin',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details: {
                queue,
                originalJobId: jobId,
                newJobId: newJob.id
            }
        });

        logger.info('DLQ job retried', {
            queue,
            originalJobId: jobId,
            newJobId: newJob.id,
            adminEmail: req.user?.email
        });

        res.json({
            success: true,
            message: 'Job retried successfully',
            newJobId: newJob.id
        });
    } catch (error) {
        logger.error('Retry DLQ job error', { error: error.message });
        res.status(500).json({ error: error.message || 'Failed to retry job' });
    }
};

/**
 * @desc    Delete a job from DLQ
 * @route   DELETE /api/admin/dlq/:jobId
 * @access  Private/Admin
 */
exports.deleteDLQJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { queue } = req.body;

        if (!['email', 'whatsapp'].includes(queue)) {
            return res.status(400).json({ error: 'Invalid queue name. Must be "email" or "whatsapp"' });
        }

        const { emailDLQ, whatsappDLQ } = require('../services/queueService');
        const dlq = queue === 'email' ? emailDLQ : whatsappDLQ;

        const job = await dlq.getJob(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found in DLQ' });
        }

        await job.remove();

        // Record admin action
        await AdminActionLog.create({
            action: 'dlq_delete',
            orderId: job.data.orderId || null,
            adminEmail: req.user?.email || 'admin',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details: {
                queue,
                jobId,
                reason: req.body.reason || 'Manual deletion'
            }
        });

        logger.info('DLQ job deleted', { queue, jobId, adminEmail: req.user?.email });

        res.json({
            success: true,
            message: 'Job deleted from DLQ'
        });
    } catch (error) {
        logger.error('Delete DLQ job error', { error: error.message });
        res.status(500).json({ error: 'Failed to delete job' });
    }
};

/**
 * @desc    Get admin action logs
 * @route   GET /api/admin/logs?limit=50&skip=0
 * @access  Private/Admin
 */
exports.getAdminLogs = async (req, res) => {
    try {
        const { limit = 50, skip = 0 } = req.query;

        const logs = await AdminActionLog.find()
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await AdminActionLog.countDocuments();

        res.json({
            success: true,
            logs,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > (parseInt(skip) + parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Get admin logs error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch admin logs' });
    }
};

/**
 * @desc    Get message logs (WhatsApp delivery tracking)
 * @route   GET /api/admin/messages?orderId=xxx&status=delivered
 * @access  Private/Admin
 */
exports.getMessageLogs = async (req, res) => {
    try {
        const { orderId, status, limit = 50, skip = 0 } = req.query;

        const query = {};
        if (orderId) {
            query['content.orderId'] = orderId;
        }
        if (status) {
            query.status = status;
        }

        const messages = await MessageLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await MessageLog.countDocuments(query);

        res.json({
            success: true,
            messages,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > (parseInt(skip) + parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Get message logs error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch message logs' });
    }
};
