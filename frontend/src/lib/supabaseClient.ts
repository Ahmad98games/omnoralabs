import { createClient } from '@supabase/supabase-js';

// Vite mein process.env nahi chalta, import.meta.env chalta hai!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log(`[Omnora Supabase] Init Key Prefix: ${supabaseKey.substring(0, 5)}...`);

const initSupabase = () => {
    try {
        if (!supabaseUrl || !supabaseKey) {
            console.warn("Supabase Config Missing");
            return null;
        }
        return createClient(supabaseUrl, supabaseKey);
    } catch (err) {
        console.error('[Omnora Frontend] Failed to initialize Supabase client:', err);
        return null;
    }
};

export const supabase = initSupabase();