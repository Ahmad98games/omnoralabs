const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL present: " + (!!process.env.SUPABASE_URL));

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Env Vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is required for Omnora Backend.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
