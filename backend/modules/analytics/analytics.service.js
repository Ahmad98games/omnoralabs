const { supabase } = require('../../shared/lib/supabaseClient');
const logger = require('../../shared/services/logger');

/**
 * Analytics Domain Service
 * 
 * Aggregates platform-wide and merchant-specific performance data.
 * profit.
 */
class AnalyticsService {
    /**
     * Fetch merchant sales stats via Supabase RPC.
     */
    async getStoreStats(merchantId, days = 30) {
        const { data, error } = await supabase
            .rpc('get_store_metrics', {
                p_merchant_id: merchantId,
                p_days: days
            });

        if (error) throw error;
        return data;
    }

    /**
     * Track a specific event (Interactions).
     */
    async trackEvent(merchantId, event) {
        const { error } = await supabase
            .from('interaction_logs')
            .insert({
                merchant_id: merchantId,
                event_type: event.type,
                product_id: event.productId,
                metadata: event.metadata || {}
            });

        if (error) throw error;
        return { success: true };
    }
}

module.exports = new AnalyticsService();
