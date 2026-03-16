const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env
.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Listing contents of merchants table...');
    const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .limit(5);

    console.log('\nData:', data);
    console.log('\nError:', error);
}

test();
