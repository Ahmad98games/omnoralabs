// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const { protect, seller } = require('../middleware/auth');

// @desc    Get Performance Analytics (Isolated)
// @route   GET /api/cms/performance-hub
router.get('/', protect, seller, async (req, res) => {
    try {
        const targetTenant = req.tenantId || 'default_tenant';

        // Fetch events for this tenant from interaction_logs
        const { data: logs, error: logsError } = await supabase
            .from('interaction_logs')
            .select('*')
            .eq('merchant_id', targetTenant)
            .order('created_at', { ascending: false })
            .limit(1000);

        if (logsError) throw logsError;

        // Basic Aggregation Logic
        const stats = {
            views: logs.filter(e => e.event_type === 'page_view').length,
            clicks: logs.filter(e => e.event_type === 'product_view').length,
            conversions: logs.filter(e => e.event_type === 'purchase').length,
            recentEvents: logs.slice(0, 10)
        };

        // Integration with "Draft" config from store_pages
        const { data: pageData } = await supabase
            .from('store_pages')
            .select('ast_manifest')
            .eq('tenant_id', targetTenant)
            .eq('slug', '_site_config')
            .eq('is_published', false)
            .maybeSingle();

        const analyticsConfig = pageData?.ast_manifest?.configuration?.analytics || { targetMonthlySales: 10000 };

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

        const { data: pageData, error: fetchError } = await supabase
            .from('store_pages')
            .select('ast_manifest')
            .eq('tenant_id', targetTenant)
            .eq('slug', '_site_config')
            .eq('is_published', false)
            .maybeSingle();

        if (fetchError || !pageData) return res.status(404).json({ success: false, error: 'Territory not found.' });

        const updatedManifest = {
            ...pageData.ast_manifest,
            configuration: {
                ...pageData.ast_manifest?.configuration,
                analytics: {
                    ...pageData.ast_manifest?.configuration?.analytics,
                    ...req.body
                }
            }
        };

        const { error: updateError } = await supabase
            .from('store_pages')
            .update({ ast_manifest: updatedManifest })
            .eq('tenant_id', targetTenant)
            .eq('slug', '_site_config')
            .eq('is_published', false);

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Performance Targets Updated (Draft)' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
