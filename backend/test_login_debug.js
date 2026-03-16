const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
// console.log('Supabase Key:', supabaseKey); // Don't log full key, maybe length
console.log('Key Length:', supabaseKey ? supabaseKey.length : 0);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('\nTesting Supabase read for merchants...');
    const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('email', 'ahmed123457@gmail.com')
        .maybeSingle();

    console.log('\nData:', data);
    console.log('\nError:', error);
    
    if (data) {
        console.log('\nHas password_hash:', !!data.password_hash);
        console.log('password_hash value (truncated):', data.password_hash ? data.password_hash.substring(0, 10) + '...' : 'MISSING');
    } else {
        console.log('\nNo data returned. User may not exist or RLS is blocking read.');
    }
}

test();
