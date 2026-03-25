const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    try {
        const { data: row, error: rowErr } = await supabase.from('merchants').select('*').limit(1);
        if (rowErr) {
            console.error('Error fetching sample row:', rowErr);
        } else if (row && row[0]) {
            console.log('Sample Row Keys:', Object.keys(row[0]));
            console.log('Sample Metadata:', JSON.stringify(row[0].metadata, null, 2));
        } else {
            console.log('No rows found in merchants table to infer keys from.');
        }
    } catch (err) {
        console.error('Crash reading profile:', err);
    }
}

inspect();
