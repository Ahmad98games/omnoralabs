import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/omnora OS/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase.rpc('inspect_table', { table_name: 'merchants' });
    if (error) {
        // Fallback: Query information_schema back-end style via raw JS node PG driver or look at a sample row
        const { data: row, error: rowErr } = await supabase.from('merchants').select('*').limit(1);
        if (rowErr) {
            console.error('Error fetching sample row:', rowErr);
        } else if (row && row[0]) {
            console.log('Sample Row Keys:', Object.keys(row[0]));
        } else {
            console.log('No rows found in merchants table to infer keys from.');
        }
    } else {
        console.log('Table Schema:', data);
    }
}

inspect();
