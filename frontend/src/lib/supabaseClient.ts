import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cuywxaeancehgibiibne.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fSTvAeJdvOl4WkUIPVz65Q_xTTScsF-';

if (!supabaseUrl || !supabaseKey) {
    console.warn('[Omnora Supabase] Absolute Initialization failure: missing URL or Key');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

/**
 * 🛡️ Defensive full-object error logger for Ahmad
 */
export const handleSupabaseError = (error: unknown, context: string) => {
    console.error(`[Supabase Error] -> @${context}:`, JSON.stringify(error, null, 2));
    throw error;
};

/**
 * ⚡ Sample Fetcher Example: Bypassing Axios completely via SDK
 */
export const fetchProducts = async (tenantId: string) => {
    await supabase.auth.getSession();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', tenantId);

    if (error) handleSupabaseError(error, 'fetchProducts');
    return data;
};

/**
 * 📂 Constant 'db' object wrapper for Dashboard ops
 */
export const db = {
    createPage: async (userId: string, name: string, content: unknown) => {
        try {
            const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const { data, error } = await supabase
                .from('pages')
                .upsert({ 
                    merchant_id: userId, 
                    title: name, 
                    slug: slug,
                    content: content as Record<string, unknown>, // Cast to strict record for Supabase JSON compatibility
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
            return data;
        } catch (error) {
            handleSupabaseError(error, 'createPage');
        }
    },
    getMerchantContent: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('pages')
                .select('*')
                .eq('merchant_id', userId);
                
            if (error) throw error;
            
            // Assume single content wrapper object returned if multiple rows exist
            if (data && data.length > 0) {
               return data[0].content; // Fallback to first page content bundle setup
            }
            return null;
        } catch (error) {
            handleSupabaseError(error, 'getMerchantContent');
        }
    }
};
