import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import Stripe from "https://esm.sh/stripe@14.16.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // ── Handle CORS ───────────────────────────────────────────────────────────
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { cartItems, merchantId, customerEmail, discountCode } = await req.json()

        // ── 1. Initialize Supabase Admin ──────────────────────────────────────
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // ── 2. Fetch Merchant Details ─────────────────────────────────────────
        const { data: merchant, error: merchantErr } = await supabaseAdmin
            .from('merchants')
            .select('display_name, custom_domain')
            .eq('id', merchantId)
            .single()

        if (merchantErr || !merchant) {
            throw new Error(`Merchant not found: ${merchantId}`)
        }

        // ── 3. Map Cart Items to Stripe Line Items (Cents) ────────────────────
        const line_items = cartItems.map((item: any) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    images: item.image ? [item.image] : [],
                    metadata: {
                        productId: item.id,
                        variantId: item.variantId || '',
                    },
                },
                unit_amount: Math.round(item.price * 100), // convert to cents
            },
            quantity: item.quantity,
        }))

        // ── 4. Create Stripe Checkout Session ─────────────────────────────────
        const origin = req.headers.get('origin') || 'http://localhost:5173'

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: customerEmail,
            line_items,
            mode: 'payment',
            success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout`,
            metadata: {
                merchant_id: merchantId,
                customer_email: customerEmail,
                discount_code: discountCode || '',
            },
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB'],
            },
        })

        console.log(`[Stripe] ✅ Session created: ${session.id} for Merchant: ${merchantId}`)

        return new Response(
            JSON.stringify({ sessionId: session.id, checkoutUrl: session.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error(`[Stripe Error] ❌ ${error.message}`)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})