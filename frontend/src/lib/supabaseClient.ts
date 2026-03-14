import { createClient } from '@supabase/supabase-js';

// Vite mein process.env nahi chalta, import.meta.env chalta hai!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[Omnora Frontend] CRITICAL: Supabase environment variables missing.');
}

// Exporting using ES6 modules (not module.exports)
export const supabase = createClient(supabaseUrl, supabaseKey);