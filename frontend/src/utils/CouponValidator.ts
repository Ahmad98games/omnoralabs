import { supabase } from '../lib/supabaseClient';

export interface CouponData {
    id: string;
    merchant_id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    expires_at: string | null;
    usage_limit: number | null;
    used_count: number;
}

export const CouponValidator = {
    /**
     * Validate a discount code against the coupons table.
     */
    validateCoupon: async (code: string, merchantId: string): Promise<CouponData | null> => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase().trim())
                .eq('merchant_id', merchantId)
                .single();

            if (error || !data) {
                console.warn('[CouponValidator] Invalid code or not found:', code);
                return null;
            }

            const coupon = data as CouponData;

            // Check if expired
            if (coupon.expires_at) {
                const now = new Date();
                const expiry = new Date(coupon.expires_at);
                if (now > expiry) {
                    console.warn('[CouponValidator] Coupon expired:', code);
                    return null;
                }
            }

            // Check usage limit
            if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
                console.warn('[CouponValidator] Usage limit reached:', code);
                return null;
            }

            return coupon;
        } catch (err) {
            console.error('[CouponValidator] Validation error:', err);
            return null;
        }
    },

    /**
     * Increment the used_count of a coupon upon successful order placement.
     */
    incrementUsedCount: async (couponId: string): Promise<boolean> => {
        try {
            const { data: current, error: fetchErr } = await supabase
                .from('coupons')
                .select('used_count')
                .eq('id', couponId)
                .single();

            if (fetchErr || !current) return false;

            const { error: updateErr } = await supabase
                .from('coupons')
                .update({ used_count: current.used_count + 1 })
                .eq('id', couponId);

            if (updateErr) return false;
            return true;
        } catch (err) {
            console.error('[CouponValidator] Increment error:', err);
            return false;
        }
    }
};
