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
    throw new Error('Missing Env Vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is required for Omnora Backend.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
