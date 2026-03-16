const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cuywxaeancehgibiibne.supabase.co';
const supabaseKey = 'sb_publishable_fSTvAeJdvOl4WkUIPVz65Q_xTTScsF-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing Supabase read for merchants...');
    const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('email', 'ahmed123457@gmail.com')
        .maybeSingle();

    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data) {
        console.log('Has password_hash:', !!data.password_hash);
        console.log('password_hash value (truncated):', data.password_hash ? data.password_hash.substring(0, 10) + '...' : 'MISSING');
    }
}

test();
