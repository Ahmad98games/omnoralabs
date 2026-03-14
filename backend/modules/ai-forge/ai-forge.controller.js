const aiForgeService = require('./ai-forge.service');
const logger = require('../../shared/services/logger');

/**
 * AI Forge Controller
 * Handles incoming requests for the AI Forge domain.
 * profit.
 */
class AIForgeController {
    /**
     * POST /api/ai/generate-store
     */
    async handleGenerateStore(req, res, next) {
        try {
            const { prompt } = req.body;
            const merchantId = req.user.id;

            const ast = await aiForgeService.generateStoreAST(merchantId, prompt);
            res.json({ success: true, ast });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/ai/generate-copy
     */
    async handleGenerateCopy(req, res, next) {
        try {
            const merchantId = req.user.id;
            const result = await aiForgeService.generateCopy(merchantId, req.body);
            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/ai/quota
     */
    async handleGetQuota(req, res, next) {
        try {
            const merchantId = req.user.id;
            const usage = await aiForgeService.checkQuota(merchantId);
            res.json({ success: true, usage );
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AIForgeController();
