import { supabase } from '../../../lib/supabaseClient';

export class SuperAdminPaymentController {
    
    /**
     * Approves a pending billing request.
     * Credits the merchant wallet and updates the subscription plan.
     */
    static async approveRequest(requestId: string, merchantId: string, plan: string, daysToAdd: number = 30) {
        // 1. Mark Request as Approved
        const { error: updateError } = await supabase
            .from('billing_requests')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // 2. Increment Wallet Days (via RPC safely, but we do simple update here for MVP)
        // Note: For absolute safety, you should write a PG function `increment_wallet_days(merchant_id, days)`
        // Here we read current days, then update.
        const { data: merchantData } = await supabase
            .from('merchants')
            .select('wallet_days_remaining')
            .eq('id', merchantId)
            .single();

        const currentDays = merchantData?.wallet_days_remaining || 0;
        const newTotalDays = Math.max(0, currentDays) + daysToAdd;

        const { error: walletError } = await supabase
            .from('merchants')
            .update({
                wallet_days_remaining: newTotalDays,
                subscription_plan: plan,
                is_paused: false
            })
            .eq('id', merchantId);

        if (walletError) throw walletError;

        return { success: true, newTotalDays };
    }

    /**
     * Rejects a pending billing request.
     */
    static async rejectRequest(requestId: string, adminNotes: string) {
        const { error } = await supabase
            .from('billing_requests')
            .update({ 
                status: 'rejected', 
                admin_notes: adminNotes, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', requestId);

        if (error) throw error;
        return { success: true };
    }
}
