const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables (Backend Context)
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Env Vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is required for Omnora Backend.');
}

// Initialise the Supabase client for backend usage
// Note: We use the ANON key for RLS-enforced queries
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
