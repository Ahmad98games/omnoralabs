/**
 * jobRoutes.js
 * 
 * Endpoints for polling background job status.
 */

const express = require('express');
const router = express.Router();
const jobService = require('../services/jobService');
const { protect } = require('../middleware/auth');
const logger = require('../services/logger');

/**
 * @desc    Get status of a background job
 * @route   GET /api/jobs/:id
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const status = await jobService.getJobStatus(req.params.id);
        
        if (status.status === 'not_found') {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        res.json({ success: true, ...status });
    } catch (err) {
        logger.error('GET_JOB_STATUS_ROUTE_ERR', { error: err.message, jobId: req.params.id });
        res.status(500).json({ success: false, error: 'Internal Server Error fetching job status' });
    }
});

module.exports = router;
