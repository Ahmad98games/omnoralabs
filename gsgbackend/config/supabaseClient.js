const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("Supabase Init Success");
} else {
    console.log("Env Missing");
}

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Missing Env Vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is required for Omnora Backend.');
}

// Use dummy values to prevent synchronous crashes on Vercel boot if env vars are misconfigured.
// The queries will fail gracefully later, instead of crashing the entire Serverless Function container.
const supabase = createClient(
    supabaseUrl || 'https://dummy.supabase.co', 
    supabaseKey || 'dummy_key'
);

module.exports = { supabase };
