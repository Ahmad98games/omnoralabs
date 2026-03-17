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
export const handleSupabaseError = (error: any, context: string) => {
    console.error(`[Supabase Error] -> @\${context}:`, JSON.stringify(error, null, 2));
    throw error;
};

/**
 * ⚡ Sample Fetcher Example: Bypassing Axios completely via SDK
 */
export const fetchProducts = async (tenantId: string) => {
    try {
        // Auto-Session Verification if required
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('merchant_id', tenantId);

        if (error) {
            handleSupabaseError(error, 'fetchProducts');
        }

        return data;
    } catch (err) {
        throw err;
    }
};
