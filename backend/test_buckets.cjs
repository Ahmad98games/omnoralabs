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
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error listing buckets:', error);
        } else {
            console.log('Available Buckets:', data.map(b => ({ id: b.id, name: b.name, public: b.public })));
        }
    } catch (err) {
        console.error('Crash reading buckets:', err);
    }
}

inspect();
