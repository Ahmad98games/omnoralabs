const express = require('express');
const router = express.Router();
// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const { protect, seller } = require('../../backend/middleware/auth');
const { sanitizeManifest } = require('../../backend/services/manifestService');
const { validateManifest } = require('../../backend/services/preflightService');

// @desc    Get site content (Autonomous & Isolated)
// @route   GET /api/cms/content
router.get('/content', async (req, res) => {
    try {
        const isPreview = req.query.preview === 'true';
        const targetTenant = req.tenantId || 'default_tenant';
        const slug = req.query.slug || '_site_config';

        // 1. Fetch from Supabase
        let { data: pageData, error } = await supabase
            .from('store_pages')
            .select('*')
            .eq('tenant_id', targetTenant)
            .eq('slug', slug)
            .eq('is_published', !isPreview)
            .maybeSingle();

        // 🟢 INTERIM FIX: If store_pages is missing, try store_configs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (error && error.code === 'PGRST205' && uuidRegex.test(targetTenant)) {
            console.warn('[CMS Fallback]: store_pages missing, attempting store_configs');
            const { data: configData, error: configError } = await supabase
                .from('store_configs')
                .select('*')
                .eq('merchant_id', targetTenant)
                .eq('is_published', !isPreview)
                .maybeSingle();
            
            if (configData) {
                pageData = {
                    tenant_id: configData.merchant_id,
                    ast_manifest: configData.node_tree, // Map node_tree to ast_manifest
                    slug: '_site_config'
                };
                error = null;
            } else {
                error = configError;
            }
        }

        // Map store_pages structure to legacy content structure
        let content = pageData ? {
            tenant_id: pageData.tenant_id,
            tenant_slug: req.tenantSlug || 'default',
            published: pageData.ast_manifest || pageData.node_tree,
            draft: pageData.ast_manifest || pageData.node_tree
        } : null;

        if (error && error.code !== 'PGRST205') throw error;

        if (!content && targetTenant !== 'default_tenant' && (!error || error.code === 'PGRST205')) {
            const { data: rootPage } = await supabase
                .from('store_pages')
                .select('*')
                .eq('tenant_id', 'default_tenant')
                .eq('slug', '_site_config')
                .maybeSingle();

            const newContent = {
                tenant_id: targetTenant,
                slug: slug,
                ast_manifest: rootPage ? (rootPage.ast_manifest || rootPage.node_tree) : {},
                is_published: !isPreview
            };

            const { data: inserted, error: insertError } = await supabase
                .from('store_pages')
                .insert([newContent])
                .select()
                .single();

            if (insertError) throw insertError;
            content = {
                tenant_id: inserted.tenant_id,
                tenant_slug: req.tenantSlug,
                published: inserted.ast_manifest,
                draft: inserted.ast_manifest
            };
        }

        if (!content) {
            if (targetTenant === 'default_tenant') {
                return res.json({
                    success: true,
                    content: { nodes: [] },
                    isDraft: isPreview,
                    tenant_slug: 'default',
                    tenant_id: '00000000-0000-0000-0000-000000000000'
                });
            }
            return res.status(404).json({ success: false, error: 'Content Territory Not Initialized' });
        }

        let responseData = isPreview ? content.draft : content.published;

        // STERILIZATION LOCK (Phase 2)
        if (!isPreview) {
            responseData = sanitizeManifest(responseData || {});
        }

        res.json({
            success: true,
            content: responseData || { nodes: [] }, // Return a valid empty node tree
            isDraft: isPreview,
            tenant_slug: content.tenant_slug,
            tenant_id: content.tenant_id
        });
    } catch (err) {
        console.error('[Supabase CMS GET Error]:', err);
        // Fallback for missing table or Supabase issues
        return res.json({
            success: true,
            content: {
                pages: {
                    allIds: ['home'],
                    byId: {
                        home: {
                            id: 'home',
                            title: 'Home',
                            headlineText: 'Welcome to your Imperial Store (Internal Cache)',
                            heroHeadline: 'Independent Luxury Reimagined',
                            layout: []
                        }
                    }
                },
                configuration: {
                    name: 'Omnora Store'
                }
            },
            isDraft: true
        });
    }
});

// @desc    Update DRAFT (Tenant-Specific Sandbox)
// @route   POST /api/cms/content
router.post('/content', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';

        // NUCLEAR BARRIER
        if (targetTenant === 'default_tenant' && req.user.role !== 'super-admin') {
            return res.status(403).json({ success: false, error: "Access Denied: Imperial Hub is Protected." });
        }

        let { data: pageData, error } = await supabase
            .from('store_pages')
            .select('*')
            .eq('tenant_id', targetTenant)
            .eq('slug', '_site_config')
            .eq('is_published', false) // Check draft first
            .maybeSingle();

        if (error) throw error;

        // Map store_pages to content structure
        let content = pageData ? {
            id: pageData.id,
            tenant_id: pageData.tenant_id,
            draft: pageData.ast_manifest,
            published: pageData.ast_manifest // In this table, it's just one version per row
        } : null;

        // Fallback for first-time edit
        if (!content && req.user.role !== 'super-admin') {
            const { data: rootPage } = await supabase
                .from('store_pages')
                .select('*')
                .eq('tenant_id', 'default_tenant')
                .eq('slug', '_site_config')
                .maybeSingle();
            
            const newContent = {
                tenant_id: targetTenant,
                slug: '_site_config',
                ast_manifest: rootPage ? rootPage.ast_manifest : {},
                is_published: false
            };

            const { data: inserted, error: insertError } = await supabase
                .from('store_pages')
                .insert([newContent])
                .select()
                .single();

            if (insertError) throw insertError;
            content = {
                id: inserted.id,
                tenant_id: inserted.tenant_id,
                draft: inserted.ast_manifest,
                published: inserted.ast_manifest
            };
        }

        if (!content) return res.status(404).json({ success: false, error: 'Territory not found and provisioning failed.' });

        // Atomic Updates to DRAFT state
        let updatedDraft = { ...(content.draft || {}) };

        if (req.body.pages) {
            const incomingPages = req.body.pages?.byId || {};
            const existingPages = updatedDraft.pages?.byId || {};
            if (existingPages.home && !incomingPages.home) {
                return res.status(403).json({ success: false, error: 'SECURITY BREACH: System Page "Home" cannot be deleted.' });
            }
            updatedDraft.pages = req.body.pages;
        }

        if (req.body.pageLayouts) updatedDraft.pageLayouts = req.body.pageLayouts;
        if (req.body.nodes) updatedDraft.nodes = req.body.nodes;
        if (req.body.designSystem) updatedDraft.configuration = req.body.designSystem;

        // Save to Supabase
        const { data: finalUpdate, error: updateError } = await supabase
            .from('store_pages')
            .update({ ast_manifest: updatedDraft })
            .eq('tenant_id', targetTenant)
            .eq('slug', '_site_config')
            .eq('is_published', false)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Multi-Page Scene Manager Updated (Atomic)', content: finalUpdate.draft });
    } catch (err) {
        console.error('[Supabase CMS POST Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    ATOMIC SYNC: Publish DRAFT to LIVE
// @route   POST /api/cms/content/publish
router.post('/content/publish', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';

        if (targetTenant === 'default_tenant' && req.user.role !== 'super-admin') {
            return res.status(403).json({ success: false, error: "Access Denied: Imperial Hub is Protected." });
        }

        const { data: pageData, error } = await supabase
            .from('store_pages')
            .select('*')
            .eq('tenant_id', targetTenant)
            .eq('slug', '_site_config')
            .eq('is_published', false)
            .maybeSingle();

        if (error || !pageData) return res.status(404).json({ success: false, error: 'Target territory (Draft) not found' });
        const content = { draft: pageData.ast_manifest };

        // Phase 2: PREFLIGHT AUDIT
        const audit = validateManifest(content.draft);
        if (!audit.isValid) {
            return res.status(400).json({ success: false, error: 'Publish Blocked', issues: audit.issues });
        }

        const oldPublished = content.published ? JSON.parse(JSON.stringify(content.published)) : null;
        let newHistory = content.history || [];
        
        if (oldPublished) {
            newHistory = [oldPublished, ...newHistory].slice(0, 5);
        }

        // In Supabase schema, we either update the is_published=true row OR insert a new one
        // Pattern: Upsert where is_published=true
        const { error: updateError } = await supabase
            .from('store_pages')
            .upsert({ 
                tenant_id: targetTenant,
                slug: '_site_config',
                ast_manifest: content.draft,
                is_published: true
            }, { onConflict: 'tenant_id,slug,is_published' });

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Storefront Territory Published (Live)', warnings: audit.issues.filter(i => i.severity !== 'error') });
    } catch (err) {
        console.error('[Supabase CMS Publish Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    ROLLBACK: Revert Live site to previous snapshot
// @route   POST /api/cms/content/rollback
router.post('/content/rollback', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';
        
        const { data: content, error } = await supabase
            .from('site_content')
            .select('*')
            .eq('tenant_id', targetTenant)
            .maybeSingle();

        if (error || !content || !content.history || content.history.length === 0) {
            return res.status(400).json({ success: false, error: 'No snapshots available for rollback' });
        }

        const previousVersion = content.history[0];
        const newHistory = content.history.slice(1);

        const { error: updateError } = await supabase
            .from('site_content')
            .update({ 
                published: previousVersion,
                history: newHistory
            })
            .eq('tenant_id', targetTenant);

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Storefront Reverted to Previous Version' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;