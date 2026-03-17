import { createClient } from '@supabase/supabase-js';

// Vite mein process.env nahi chalta, import.meta.env chalta hai!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log(`[Omnora Supabase] Init Key Prefix: ${supabaseKey.substring(0, 5)}...`);

export const getSupabaseClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cuywxaeancehgibiibne.supabase.co';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey || supabaseKey === 'undefined') {
        console.warn('[Omnora Supabase] Client disabled - VITE variables missing');
        return null;
    }

    try {
        return createClient(supabaseUrl, supabaseKey);
    } catch (err) {
        console.warn('[Omnora Supabase] Initialization failure:', err);
        return null;
    }
};

export const supabase = getSupabaseClient();