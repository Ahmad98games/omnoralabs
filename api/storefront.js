/**
 * Vercel Edge-Cached Storefront API
 * 
 * Phase 45: ISR-Style Caching for Black Friday Scale
 * 
 * This serverless function acts as a CDN-cached proxy for storefront
 * read operations. It sets aggressive Cache-Control headers so that
 * Vercel's Edge CDN serves stale content while revalidating in the
 * background, eliminating direct database hits for every visitor.
 * 
 * Cache Strategy:
 * - s-maxage=60: CDN serves cached response for 60 seconds.
 * - stale-while-revalidate=300: After 60s, CDN serves stale content
 *   for up to 300s while fetching a fresh response in the background.
 * - No client-side caching (max-age=0) to ensure users always get
 *   the latest CDN version on hard refresh.
 */

    try {
        // ── Lazy-load Supabase ────────────────────────────────────────
        const { supabase } = require('../backend/shared/lib/supabaseClient');

        // ── Route Resolution ──────────────────────────────────────────
        const { pathname } = new URL(req.url, `https://${req.headers.host}`);
        const tenantId = req.headers['x-tenant-id'] || req.query.tenant || 'default_tenant';

        // ┌─────────────────────────────────────────────────────────────┐
        // │  STOREFRONT CONTENT (CMS Layout / Builder AST)             │
        // │  GET /api/storefront/content?tenant=xxx                    │
        // └─────────────────────────────────────────────────────────────┘
        if (pathname.endsWith('/content') || pathname.endsWith('/content/')) {
            const { data: content, error } = await supabase
                .from('store_configs')
                .select('*')
                .eq('merchant_id', tenantId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
                 throw error;
            }

            if (!content) {
                return res.status(404).json({ success: false, error: 'Storefront not found' });
            }

            // ── ISR Cache Headers ─────────────────────────────────────
            res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
            res.setHeader('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
            res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

            return res.status(200).json({
                success: true,
                content: content.node_tree || {},
                tenant_id: content.merchant_id,
                tenant_slug: content.tenant_slug || tenantId,
                _cache: { strategy: 'isr', maxAge: 60, swr: 300 },
            });
        }

        // ┌─────────────────────────────────────────────────────────────┐
        // │  PRODUCT CATALOG                                           │
        // │  GET /api/storefront/products?tenant=xxx                   │
        // └─────────────────────────────────────────────────────────────┘
        if (pathname.endsWith('/products') || pathname.endsWith('/products/')) {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            const category = req.query.category;
            const search = req.query.search;

            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('merchant_id', tenantId)
                .range(from, to)
                .order('created_at', { ascending: false });

            if (category) query = query.eq('category_slug', category);
            if (search) query = query.ilike('title', `%${search}%`);

            const { data: products, count: total, error } = await query;
            if (error) throw error;

            // ── ISR Cache Headers ─────────────────────────────────────
            res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
            res.setHeader('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
            res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

            return res.status(200).json({
                success: true,
                products: products || [],
                pagination: { page, limit, total, pages: Math.ceil((total || 0) / limit) },
                _cache: { strategy: 'isr', maxAge: 60, swr: 300 },
            });
        }

        // ┌─────────────────────────────────────────────────────────────┐
        // │  SINGLE PRODUCT                                            │
        // │  GET /api/storefront/product/:handle?tenant=xxx            │
        // └─────────────────────────────────────────────────────────────┘
        const productMatch = pathname.match(/\/product\/([^/]+)/);
        if (productMatch) {
            const handle = productMatch[1];
            const { data: product, error } = await supabase
                .from('products')
                .select('*, product_variants(*), product_images(*)')
                .eq('merchant_id', tenantId)
                .or(`handle.eq.${handle},slug.eq.${handle},id.eq.${handle}`)
                .single();

            if (error || !product) {
                return res.status(404).json({ success: false, error: 'Product not found' });
            }

            // ── ISR Cache Headers ─────────────────────────────────────
            res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
            res.setHeader('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
            res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

            return res.status(200).json({
                success: true,
                product,
                _cache: { strategy: 'isr', maxAge: 60, swr: 300 },
            });
        }

        // Fallback
        return res.status(404).json({ error: 'Unknown storefront route' });

    } catch (err) {
        console.error('[Storefront Cache Error]', err.message);
        // Never cache errors
        res.setHeader('Cache-Control', 'no-store');
        return res.status(500).json({ error: 'STOREFRONT_CACHE_FAILURE', message: err.message });
    }
};
