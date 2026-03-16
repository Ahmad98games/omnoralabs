const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables (Backend Context)
dotenv.config();

const initSupabase = () => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

        console.log(supabaseUrl ? "[Supabase] URL Loaded" : "[Supabase] URL MISSING");

        if (!supabaseUrl || !supabaseKey) {
            console.warn('[Omnora Backend] CRITICAL: Supabase environment variables missing. App degrading gracefully.');
            return null;
        }
        return createClient(supabaseUrl, supabaseKey);
    } catch (err) {
        console.error('[Omnora Backend] Failed to initialize Supabase client:', err);
        return null;
    }
};

const supabase = initSupabase();

module.exports = { supabase };
