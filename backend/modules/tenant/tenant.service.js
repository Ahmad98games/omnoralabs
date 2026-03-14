const { supabase } = require('../../shared/lib/supabaseClient');
const logger = require('../../shared/services/logger');

/**
 * Tenant Domain Service
 * 
 * Orchestrates CMS (AST), Products, Inventory, and Media for specific storefronts.
 * profit.
 */
class TenantService {
    // ─── CMS & AST Management ────────────────────────────────────────────────

    async getPageAST(merchantId, slug, isPublished = true) {
        const { data: page, error } = await supabase
            .from('store_pages')
            .select('ast_manifest')
            .eq('tenant_id', merchantId)
            .eq('slug', slug)
            .eq('is_published', isPublished)
            .maybeSingle();

        if (error) throw error;
        return page?.ast_manifest || null;
    }

    async savePageAST(merchantId, slug, manifest, isPublished = false) {
        const { data, error } = await supabase
            .from('store_pages')
            .upsert({
                tenant_id: merchantId,
                slug,
                ast_manifest: manifest,
                is_published: isPublished,
                updated_at: new Date()
            }, { onConflict: 'tenant_id, slug, is_published' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ─── Product & Inventory ─────────────────────────────────────────────────

    async getProducts(merchantId, filters = {}) {
        let query = supabase
            .from('products')
            .select('*')
            .eq('merchant_id', merchantId);

        if (filters.status) query = query.eq('status', filters.status);
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async updateInventory(merchantId, productId, quantity) {
        const { data, error } = await supabase
            .from('products')
            .update({ inventory_count: quantity })
            .eq('id', productId)
            .eq('merchant_id', merchantId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

module.exports = new TenantService();
