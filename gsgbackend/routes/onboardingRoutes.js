const express = require('express');
const router = express.Router();
const { protect: authenticate } = require('../middleware/auth');
const onboardingService = require('../services/onboardingService');
const logger = require('../services/logger');

// â”€â”€ POST /api/onboarding/store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Step 1: Basic store info (handled by auth registration â€” no extra DB call needed)
router.post('/store', authenticate, async (req, res) => {
    try {
        const { storeName, niche } = req.body;
        if (!storeName) return res.status(400).json({ error: 'storeName is required' });
        res.json({ success: true, message: 'Store info saved', storeName, niche });
    } catch (err) {
        logger.error('ONBOARDING /store', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST /api/onboarding/branding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Step 2: Logo, colours, slogan â€” stored in CMS configuration
router.post('/branding', authenticate, async (req, res) => {
    try {
        const { logoUrl, faviconUrl, primaryColor, accentColor, slogan } = req.body;
        const SiteContent = require('../models/SiteContent');
        const sellerId = req.user.id;

        await SiteContent.findOneAndUpdate(
            { sellerId, pageId: 'home' },
            {
                $set: {
                    'configuration.branding.logoUrl': logoUrl || '',
                    'configuration.branding.faviconUrl': faviconUrl || '',
                    'configuration.branding.slogan': slogan || '',
                    'configuration.colors.accentPrimary': accentColor || '#C5A059',
                    'configuration.colors.primary': primaryColor || '#030304',
                }
            },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (err) {
        logger.error('ONBOARDING /branding', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST /api/onboarding/payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Step 3: Enable payment methods
router.post('/payments', authenticate, async (req, res) => {
    try {
        const { cod, bankTransfer, easypaisa, jazzcash } = req.body;
        const PaymentMethod = require('../models/PaymentMethod');
        const sellerId = req.user.id;

        await PaymentMethod.findOneAndUpdate(
            { sellerId },
            { $set: { methods: { cod: !!cod, bankTransfer: !!bankTransfer, easypaisa: !!easypaisa, jazzcash: !!jazzcash, stripe: false } } },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (err) {
        logger.error('ONBOARDING /payments', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST /api/onboarding/launch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Step 4: Apply template + seed demo products
router.post('/launch', authenticate, async (req, res) => {
    try {
        const { niche = 'general', storeName = 'My Store' } = req.body;
        const sellerId = req.user.id;
        const result = await onboardingService.launchStore(sellerId, { niche, storeName });
        res.json(result);
    } catch (err) {
        logger.error('ONBOARDING /launch', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

