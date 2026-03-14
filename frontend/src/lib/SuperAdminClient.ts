import { supabase } from './supabaseClient';

export interface PlatformMetrics {
    totalStores: number;
    platformMrr: number;
    totalGmvProcessed: number;
}

export interface MerchantDetails {
    id: string;
    email: string;
    display_name: string;
    store_slug: string;
    subscription: string;
    is_active: boolean;
    created_at: string;
}

export const SuperAdminClient = {
    async getPlatformMetrics(): Promise<PlatformMetrics> {
        // Calls the secure Edge Function
        const { data, error } = await supabase.functions.invoke('fetch-platform-stats');
        
        if (error) {
            console.error("[SuperAdminClient] Error fetching platform metrics:", error);
            throw new Error(error.message || 'Failed to fetch platform metrics.');
        }

        return {
            totalStores: data?.totalStores || 0,
            platformMrr: data?.platformMrr || 0,
            totalGmvProcessed: data?.totalGmvProcessed || 0
        };
    },

    async getAllMerchants(): Promise<MerchantDetails[]> {
        const { data, error } = await supabase
            .from('merchants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("[SuperAdminClient] Error fetching merchants:", error);
            throw new Error(error.message || 'Failed to fetch merchants.');
        }

        return data as MerchantDetails[];
    },

    async toggleMerchantStatus(merchantId: string, suspend: boolean): Promise<void> {
        // Uses is_active (false = suspended, true = active)
        const isActive = !suspend;
        const { error } = await supabase
            .from('merchants')
            .update({ is_active: isActive })
            .eq('id', merchantId);

        if (error) {
            console.error(`[SuperAdminClient] Error toggling status for merchant ${merchantId}:`, error);
            throw new Error(error.message || 'Failed to toggle merchant status.');
        }
    }
};
