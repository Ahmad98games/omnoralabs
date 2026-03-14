import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const superAdminEmail = Deno.env.get('SUPERADMIN_EMAIL')

        if (!superAdminEmail) {
            console.error("Critical: SUPERADMIN_EMAIL not configured in Edge Function environment.")
            return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── 1. Authenticate Requesting User ────────────────────────────────
        const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser(token)

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid authentication token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── 2. Super Admin Evaluation ──────────────────────────────────────
        if (user.email !== superAdminEmail) {
            console.warn(`[SECURITY] Unauthorized God Mode access attempt by: ${user.email}`)
            return new Response(JSON.stringify({ error: 'Forbidden. Super Admin access required.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── 3. Bypass RLS for Platform Analytics ───────────────────────────
        const supabaseAdmin = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch Metrics
        const { count: totalStores } = await supabaseAdmin.from('merchants').select('*', { count: 'exact', head: true })

        // Calculate GMV (Sum of all paid orders)
        const { data: paidOrders } = await supabaseAdmin.from('orders').select('grand_total').eq('financial_status', 'paid')
        const totalGmv = (paidOrders || []).reduce((acc: number, curr: any) => acc + (curr.grand_total || 0), 0)

        // Calculate MRR (Rough calculation assuming Pro tier is $29/mo)
        const { count: proStores } = await supabaseAdmin.from('merchants').select('*', { count: 'exact', head: true }).eq('subscription', 'pro')
        const platformMrr = (proStores || 0) * 29

        return new Response(
            JSON.stringify({
                metrics: {
                    totalActiveStores: totalStores || 0,
                    totalPlatformMrr: platformMrr,
                    totalGmvProcessed: totalGmv
                }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err: any) {
        console.error(`Edge Function Error: ${err.message}`)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
