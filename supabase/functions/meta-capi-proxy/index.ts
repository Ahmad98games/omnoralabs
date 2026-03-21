import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// SHA256 Polyfill/Implementation for Edge
async function sha256(text: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

serve(async (req) => {
    // Basic CORS
    if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });

    try {
        const payload = await req.json();
        
        // Expected Payload from DB Webhook or Direct Call
        // { event_id: uuid, merchant_id: string, email: string, phone: string, value: number, currency: string, client_ip: string, client_user_agent: string }
        const { event_id, merchant_id, email, phone, value, currency, client_ip, client_user_agent, source_url } = payload;

        if (!event_id || !merchant_id) return new Response('Missing keys', { status: 400 });

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch Meta CAPI Access Token & Pixel ID from merchant settings
        const { data: merchantData } = await supabase
            .from('merchants')
            .select('fb_pixel_id, fb_capi_token')
            .eq('id', merchant_id)
            .single();

        if (!merchantData || !merchantData.fb_pixel_id || !merchantData.fb_capi_token) {
            // Log missing configuration
            await supabase.from('tracking_logs').insert({
                event_id, merchant_id, status: 'error', details: { message: 'Missing FB Pixel or CAPI Token on store' }
            });
            return new Response('CAPI not configured', { status: 400 });
        }

        const hashedEmail = email ? await sha256(email) : undefined;
        // Strip non-numeric out of phone natively
        const cleanPhone = phone ? phone.replace(/\D/g, '') : undefined;
        const hashedPhone = cleanPhone ? await sha256(cleanPhone) : undefined;

        // Construct exact JSON expected by Graph API
        const metaPayload = {
            data: [
                {
                    event_name: "Purchase",
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: "website",
                    event_id: event_id,
                    event_source_url: source_url || `https://omnora.com/s/${merchant_id}`,
                    user_data: {
                        em: hashedEmail ? [hashedEmail] : undefined,
                        ph: hashedPhone ? [hashedPhone] : undefined,
                        client_ip_address: client_ip || undefined,
                        client_user_agent: client_user_agent || undefined
                    },
                    custom_data: {
                        currency: currency || "PKR",
                        value: value
                    }
                }
            ]
        };

        const META_ENDPOINT = `https://graph.facebook.com/v19.0/${merchantData.fb_pixel_id}/events?access_token=${merchantData.fb_capi_token}`;

        const fbRes = await fetch(META_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metaPayload)
        });

        const fbData = await fbRes.json();

        if (fbRes.ok) {
            await supabase.from('tracking_logs').insert({
                event_id, merchant_id, status: 'ok', details: { fbResponse: fbData, computed_value: value }
            });
            return new Response(JSON.stringify({ success: true, events_received: fbData.events_received }), { 
                headers: { 'Content-Type': 'application/json' } 
            });
        } else {
            // Log Meta Error natively
            await supabase.from('tracking_logs').insert({
                event_id, merchant_id, status: 'error', details: { fbError: fbData }
            });
            return new Response(JSON.stringify({ success: false, error: fbData }), { status: 400 });
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
