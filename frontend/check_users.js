import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error("Error fetching users:", error);
    } else {
        console.log("Users in DB:");
        data.forEach(u => console.log(`- Email: ${u.email}, Role: ${u.role}, ID: ${u.id}`));
    }
}

checkUsers();
