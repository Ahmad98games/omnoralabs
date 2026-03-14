const express = require('express');
const router = express.Router();
const { protect: authenticate } = require('../middleware/auth');
const aiContentService = require('../services/aiContentService');
const logger = require('../services/logger');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// â”€â”€ POST /api/ai/generate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { type, niche, tone, language, length, storeName, extraContext, forceRegenerate } = req.body;
        if (!type || !niche) return res.status(400).json({ error: 'type and niche are required' });

        const userId = req.user.id || req.user._id;
        if (!uuidRegex.test(userId)) {
            return res.status(403).json({ error: 'Merchant Identity Required' });
        }
        const result = await aiContentService.generateContent(userId, { type, niche, tone, language, length, storeName, extraContext, forceRegenerate });

        // Quota / rate-limit block â†’ 429
        if (result.allowed === false) {
            res.set('Retry-After', result.retryAfterSec || 60);
            return res.status(429).json({ error: result.reason, used: result.used, limit: result.limit });
        }

        res.json(result);
    } catch (err) {
        logger.error('AI /generate', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});


// â”€â”€ GET /api/ai/content/:type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/content/:type', authenticate, async (req, res) => {
    try {
        const result = await aiContentService.getResult(req.user.id, req.params.type);
        res.json(result || { status: 'not_found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ DELETE /api/ai/content/:type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.delete('/content/:type', authenticate, async (req, res) => {
    try {
        await aiContentService.clearCache(req.user.id, req.params.type);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

