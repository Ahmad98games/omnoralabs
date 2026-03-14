const express = require('express');
const router = express.Router();
const { protect, seller } = require('../middleware/auth');
const Event = require('../models/Event');
const SiteContent = require('../models/SiteContent');

// @desc    Get Performance Analytics (Isolated)
// @route   GET /api/cms/performance-hub
router.get('/', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';

        // Fetch events for this tenant
        const events = await Event.find({ tenant_id: targetTenant }).sort({ createdAt: -1 }).limit(1000);

        // Basic Aggregation Logic (Aggregated for Dashboard)
        const stats = {
            views: events.filter(e => e.type === 'page_view').length,
            clicks: events.filter(e => e.type === 'interaction').length,
            conversions: events.filter(e => e.type === 'conversion').length,
            recentEvents: events.slice(0, 10)
        };

        // Integration with "Draft vs Published" for Targets/Goals
        const content = await SiteContent.findOne({ tenant_id: targetTenant });
        const analyticsConfig = content?.draft?.configuration?.analytics || { targetMonthlySales: 10000 };

        res.json({
            success: true,
            stats,
            config: analyticsConfig
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Update Analytics Targets (Draft State Only)
// @route   POST /api/cms/performance-hub/targets
router.post('/targets', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';

        // SOVEREIGN GUARD: Block mutation on default_tenant
        if (targetTenant === 'default_tenant' && req.user.role !== 'super-admin') {
            return res.status(403).json({
                success: false,
                error: "SOVEREIGN GUARD: Imperial Hub targets are immutable."
            });
        }

        const content = await SiteContent.findOne({ tenant_id: targetTenant, seller: req.user._id });
        if (!content) return res.status(404).json({ success: false, error: 'Territory not found.' });

        content.draft.configuration = {
            ...content.draft.configuration,
            analytics: {
                ...content.draft.configuration?.analytics,
                ...req.body
            }
        };

        content.markModified('draft');
        await content.save();

        res.json({ success: true, message: 'Performance Targets Updated (Draft)' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
