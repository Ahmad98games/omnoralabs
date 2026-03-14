const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const { protect, seller } = require('../middleware/auth');
const { sanitizeManifest } = require('../services/manifestService');
const { validateManifest } = require('../services/preflightService');

// @desc    Get site content (Autonomous & Isolated)
// @route   GET /api/cms/content
router.get('/content', async (req, res) => {
    try {
        const isPreview = req.query.preview === 'true';
        const targetTenant = req.tenantId || 'default_tenant';

        let content = await SiteContent.findOne({ tenant_id: targetTenant });

        // AUTO-PROVISIONING (The "Instant Store" Logic)
        if (!content && targetTenant !== 'default_tenant') {
            const rootContent = await SiteContent.findOne({ tenant_id: 'default_tenant' });

            content = await SiteContent.create({
                seller: 'SYSTEM', // Initially system owned until first claim
                tenant_id: targetTenant,
                tenant_slug: req.tenantSlug || `store-${targetTenant.replace('tenant_', '')}`,
                draft: rootContent ? JSON.parse(JSON.stringify(rootContent.published)) : {}, // Atomic Clone of Golden Template
                published: rootContent ? JSON.parse(JSON.stringify(rootContent.published)) : {}
            });
        }

        if (!content) return res.status(404).json({ success: false, error: 'Content Territory Not Initialized' });

        let responseData = isPreview ? content.draft : content.published;

        // STERILIZATION LOCK (Phase 2): Never expose builder metadata to live storefront
        if (!isPreview) {
            responseData = sanitizeManifest(responseData);
        }

        res.json({
            success: true,
            content: responseData,
            isDraft: isPreview,
            tenant_slug: content.tenant_slug,
            tenant_id: content.tenant_id
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Update DRAFT (Tenant-Specific Sandbox)
// @route   POST /api/cms/content
router.post('/content', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';

        // NUCLEAR BARRIER: PROTECT THE IMPERIAL HUB
        if (targetTenant === 'default_tenant' && req.user.role !== 'super-admin') {
            return res.status(403).json({
                success: false,
                error: "Access Denied: Imperial Hub is Protected. Requires Super-Admin clearance."
            });
        }

        // Find by tenant_id AND ensure seller ownership (unless Super-Admin)
        const query = req.user.role === 'super-admin'
            ? { tenant_id: targetTenant }
            : { tenant_id: targetTenant, seller: req.user._id };

        let content = await SiteContent.findOne(query);

        // Fallback for first-time edit: Claim the auto-provisioned store
        if (!content && req.user.role !== 'super-admin') {
            content = await SiteContent.findOne({ tenant_id: targetTenant });
            if (content && content.seller === 'SYSTEM') {
                content.seller = req.user._id;
            } else if (content && content.seller.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, error: 'TERRITORY DISPUTE: You do not own this territory.' });
            } else if (!content) {
                // AUTO-PROVISIONING: Clone Imperial Master Template
                const rootContent = await SiteContent.findOne({ tenant_id: 'default_tenant' });
                content = new SiteContent({
                    seller: req.user._id,
                    tenant_id: targetTenant,
                    tenant_slug: req.tenantSlug || `store-${req.user._id}`,
                    draft: rootContent ? JSON.parse(JSON.stringify(rootContent.published)) : {},
                    published: rootContent ? JSON.parse(JSON.stringify(rootContent.published)) : {}
                });
            }
        }

        if (!content) return res.status(404).json({ success: false, error: 'Territory not found and provisioning failed.' });

        // Atomic Updates to DRAFT state
        // Expected payload: { pages, pageLayouts, nodes, designSystem }
        
        if (req.body.pages) {
            // Safety: Ensure locked pages (Home) cannot be sabotaged via API
            const incomingPages = req.body.pages?.byId || {};
            const existingPages = content.draft?.pages?.byId || {};
            
            // Validate: If Home existed, it must remain locked and present
            if (existingPages.home && !incomingPages.home) {
                return res.status(403).json({ success: false, error: 'SECURITY BREACH: System Page "Home" cannot be deleted.' });
            }

            content.draft.pages = req.body.pages;
        }

        if (req.body.pageLayouts) content.draft.pageLayouts = req.body.pageLayouts;
        if (req.body.nodes) content.draft.nodes = req.body.nodes;
        if (req.body.designSystem) content.draft.configuration = req.body.designSystem;

        content.markModified('draft');
        await content.save();

        res.json({ success: true, message: 'Multi-Page Scene Manager Updated (Atomic)', content: content.draft });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    ATOMIC SYNC: Publish DRAFT to LIVE (Isolated Territory)
// @route   POST /api/cms/content/publish
router.post('/content/publish', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';

        // NUCLEAR BARRIER: PROTECT THE IMPERIAL HUB
        if (targetTenant === 'default_tenant' && req.user.role !== 'super-admin') {
            return res.status(403).json({
                success: false,
                error: "Access Denied: Imperial Hub is Protected. Sync Forbidden."
            });
        }

        const query = req.user.role === 'super-admin'
            ? { tenant_id: targetTenant }
            : { tenant_id: targetTenant, seller: req.user._id };

        const content = await SiteContent.findOne(query);
        if (!content) return res.status(404).json({ success: false, error: 'Target territory not found' });

        // Phase 2: PREFLIGHT AUDIT
        const audit = validateManifest(content.draft);
        if (!audit.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Publish Blocked: Critical Safety Violations Found',
                issues: audit.issues
            });
        }

        // Atomic Synchronization & Snapshot (Phase 2)
        const oldPublished = content.published ? JSON.parse(JSON.stringify(content.published)) : null;

        content.published = JSON.parse(JSON.stringify(content.draft));

        if (oldPublished) {
            content.history = [oldPublished, ...content.history].slice(0, 5); // Keep last 5
        }

        content.markModified('published');
        content.markModified('history');
        await content.save();

        res.json({
            success: true,
            message: 'Storefront Territory Published (Live)',
            warnings: audit.issues.filter(i => i.severity !== 'error')
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    ROLLBACK: Revert Live site to previous snapshot
// @route   POST /api/cms/content/rollback
router.post('/content/rollback', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';
        const query = req.user.role === 'super-admin'
            ? { tenant_id: targetTenant }
            : { tenant_id: targetTenant, seller: req.user._id };

        const content = await SiteContent.findOne(query);
        if (!content || !content.history || content.history.length === 0) {
            return res.status(400).json({ success: false, error: 'No snapshots available for rollback' });
        }

        // Pop the latest history snapshot to published
        const previousVersion = content.history[0];
        content.published = JSON.parse(JSON.stringify(previousVersion));
        content.history = content.history.slice(1); // Remove it from history

        content.markModified('published');
        content.markModified('history');
        await content.save();

        res.json({ success: true, message: 'Storefront Reverted to Previous Version' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
