import { supabase } from '../lib/supabaseClient';

export interface AbandonedCartInfo {
    cart_id: string;
    merchant_id: string;
    customer_name: string;
    customer_phone: string;
    /**
     * FIX: Replaced 'any' with a safe object type for JSON storage.
     */
    cart_json: Record<string, unknown> | Array<Record<string, unknown>>;
    cart_value: number;
}

export const AbandonedCartService = {
    /**
     * Save or update an abandoned cart.
     */
    saveDraft: async (info: AbandonedCartInfo) => {
        try {
            const { error } = await supabase
                .from('abandoned_carts')
                .upsert({
                    cart_id: info.cart_id,
                    merchant_id: info.merchant_id,
                    customer_name: info.customer_name,
                    customer_phone: info.customer_phone,
                    cart_json: info.cart_json,
                    cart_value: info.cart_value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'cart_id' });
                
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('[AbandonedCart] Failed to save draft', err);
            return false;
        }
    },

    /**
     * Mark a cart as recovered
     */
    markRecovered: async (cartId: string) => {
        try {
            await supabase
                .from('abandoned_carts')
                .update({ recovered: true })
                .eq('cart_id', cartId);
        } catch (err) {
            console.error('[AbandonedCart] Error marking recovered:', err);
        }
    },

    /**
     * Mark a cart as recovered by phone (Auto-Conversion)
     */
    markRecoveredByPhone: async (phone: string, merchantId: string) => {
        try {
            const cleanPhone = phone.replace(/[^0-9+]/g, '');
            await supabase
                .from('abandoned_carts')
                .update({ recovered: true })
                .eq('merchant_id', merchantId)
                .ilike('customer_phone', `%${cleanPhone.substring(cleanPhone.length - 8)}%`);
        } catch (err) {
            console.error('[AbandonedCart] Error auto-converting by phone:', err);
        }
    },

    /**
     * Update the last recovery attempt timestamp
     */
    updateRecoveryAttempt: async (cartId: string) => {
        try {
            await supabase
                .from('abandoned_carts')
                .update({ last_recovery_at: new Date().toISOString() })
                .eq('cart_id', cartId);
        } catch (err) {
            console.error('[AbandonedCart] Error updating recovery attempt:', err);
        }
    },

    /**
     * Get unrecovered carts for a merchant
     */
    getAbandonedCarts: async (merchantId: string) => {
        try {
            const { data, error } = await supabase
                .from('abandoned_carts')
                .select('*')
                .eq('merchant_id', merchantId)
                .eq('recovered', false)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('[AbandonedCart] Error fetching list:', err);
            return [];
        }
    },

    /**
     * Generate WhatsApp Recovery Message & Link
     */
    generateRecoveryLink: (phone: string, name: string, storeSlug: string, cartId: string) => {
        const checkoutUrl = `${window.location.origin}/store/${storeSlug}/checkout?cart_id=${cartId}`;
        const message = `Hi ${name || 'there'}, aapne apni shopping puri nahi ki! Click here to complete your order and get 5% OFF: ${checkoutUrl}`;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }
};