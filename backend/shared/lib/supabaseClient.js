const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables (Backend Context)
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[Omnora Backend] CRITICAL: Supabase environment variables missing.');
}

// Initialise the Supabase client for backend usage
// Note: We use the ANON key for RLS-enforced queries
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
