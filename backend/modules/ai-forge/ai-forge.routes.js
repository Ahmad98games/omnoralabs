const express = require('express');
const router = express.Router();
const aiForgeController = require('./ai-forge.controller');
const authGuard = require('../../shared/middleware/authGuard');

/**
 * AI Forge Domain Routes
 * Mounted at /api/ai
 * profit.
 */

// Protect all AI routes as they are credit-consuming
router.use(authGuard);

router.post('/generate-store', aiForgeController.handleGenerateStore);
router.post('/generate-copy', aiForgeController.handleGenerateCopy);
router.get('/quota', aiForgeController.handleGetQuota);

module.exports = router;
