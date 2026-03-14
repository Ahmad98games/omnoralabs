const express = require('express');
const router = express.Router();
const { protect: authenticate } = require('../middleware/auth');
const logger = require('../services/logger');
const { DEFAULT_TEMPLATES } = require('../models/WhatsAppTemplate');

const getModel = () => require('../models/WhatsAppTemplate');

// â”€â”€ GET /api/whatsapp-templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Returns all 5 event templates for the seller; creates defaults if missing
router.get('/', authenticate, async (req, res) => {
    try {
        const Template = getModel();
        const sellerId = req.user.id;
        const events = Object.keys(DEFAULT_TEMPLATES);

        // Ensure all 5 templates exist for this seller
        await Promise.all(events.map(eventName =>
            Template.findOneAndUpdate(
                { sellerId, eventName },
                { $setOnInsert: { sellerId, eventName, templateText: DEFAULT_TEMPLATES[eventName] } },
                { upsert: true, new: false }
            ).catch(() => { })
        ));

        const templates = await Template.find({ sellerId });
        res.json(templates);
    } catch (err) {
        logger.error('WA_TEMPLATES GET', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ PUT /api/whatsapp-templates/:eventName â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/:eventName', authenticate, async (req, res) => {
    try {
        const Template = getModel();
        const { eventName } = req.params;
        const { templateText, isActive, timingWindowStart, timingWindowEnd, minGapHours } = req.body;

        if (!Object.keys(DEFAULT_TEMPLATES).includes(eventName)) {
            return res.status(400).json({ error: 'Invalid eventName' });
        }

        const updated = await Template.findOneAndUpdate(
            { sellerId: req.user.id, eventName },
            { $set: { templateText, isActive, timingWindowStart, timingWindowEnd, minGapHours } },
            { upsert: true, new: true }
        );
        res.json({ success: true, template: updated });
    } catch (err) {
        logger.error('WA_TEMPLATES PUT', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST /api/whatsapp-templates/optout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Webhook for when customer sends STOP
router.post('/optout', async (req, res) => {
    try {
        const { phone, sellerId } = req.body;
        if (!phone || !sellerId) return res.status(400).json({ error: 'phone and sellerId required' });
        const waAutomation = require('../services/whatsappAutomationService');
        await waAutomation.processOptOut(phone, sellerId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

