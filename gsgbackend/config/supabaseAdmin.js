const { createClient } = require('@supabase/supabase-js');

/**
 * 🛡️ Backend Bridge: Bypasses RLS to query as Super Admin securely
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://cuywxaeancehgibiibne.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Supabase Admin] Missing URL or Service Key. Cannot initialize Backend Bridge.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false, 
    autoRefreshToken: false
  }
});

module.exports = { supabaseAdmin };
