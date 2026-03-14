import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import Stripe from "https://esm.sh/stripe@14.16.0"

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req: Request) => {
    const signature = req.headers.get('Stripe-Signature')

    if (!signature) {
        return new Response('No signature', { status: 400 })
    }

    try {
        const body = await req.text()
        
        // Initial parse to get the merchant structure from the unverified event
        const unverifiedEvent = JSON.parse(body)
        const merchantId = unverifiedEvent.data?.object?.metadata?.merchant_id

        if (!merchantId) {
            console.error('❌ Webhook missing merchant_id in metadata')
            return new Response('Missing merchant_id', { status: 400 })
        }

        // ── 1. Initialize Supabase Admin ──────────────────────────────────
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // ── 2. Fetch Merchant Details & Stripe Keys ───────────────────────
        const { data: merchant, error: merchantErr } = await supabaseAdmin
            .from('merchants')
            .select('payment_settings')
            .eq('id', merchantId)
            .single()

        if (merchantErr || !merchant) {
            throw new Error(`Merchant not found: ${merchantId}`)
        }

        const stripeSecretKey = merchant.payment_settings?.stripeSecretKey
        const stripeWebhookSecret = merchant.payment_settings?.stripeWebhookSecret

        if (!stripeSecretKey || !stripeWebhookSecret) {
            throw new Error('Merchant Stripe configuration incomplete.')
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // ── 3. Verify Signature with Merchant's Secret ────────────────────
        let event
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                stripeWebhookSecret,
                undefined,
                cryptoProvider
            )
        } catch (err: any) {
            console.error(`❌ Webhook signature verification failed for merchant ${merchantId}: ${err.message}`)
            return new Response(`Webhook Error: ${err.message}`, { status: 400 })
        }

        // ── 4. Handle checkout.session.completed ──────────────────────────
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const metadata = session.metadata || {}

            const customerEmail = metadata.customer_email
            const discountCode = metadata.discount_code

            console.log(`✅ [Stripe BYOK] Payment successful for Session: ${session.id}`)

            // Fetch line items using the merchant's initialized stripe instance
            const { data: lineItems } = await stripe.checkout.sessions.listLineItems(session.id)

            // Insert Order into 'orders' table
            const { data: order, error: orderErr } = await supabaseAdmin
                .from('orders')
                .insert({
                    merchant_id: merchantId,
                    customer_email: customerEmail,
                    customer_name: session.customer_details?.name || 'Unknown',
                    subtotal: (session.amount_subtotal || 0) / 100,
                    grand_total: (session.amount_total || 0) / 100,
                    currency: session.currency?.toUpperCase() || 'USD',
                    financial_status: 'paid', // Mark as paid!
                    fulfillment_status: 'unfulfilled',
                    shipping_address: {
                        address: session.shipping_details?.address?.line1 || '',
                        city: session.shipping_details?.address?.city || '',
                        zip: session.shipping_details?.address?.postal_code || '',
                        phone: session.customer_details?.phone || '',
                    },
                    stripe_session_id: session.id,
                })
                .select()
                .single()

            if (orderErr) throw new Error(`Order insertion failed: ${orderErr.message}`)

            // Insert Order Items
            const itemsToInsert = lineItems.data.map((item: any) => ({
                order_id: order.id,
                product_id: item.price?.product || null, // Best effort from Stripe
                title: item.description,
                quantity: item.quantity,
                unit_price: (item.price?.unit_amount || 0) / 100,
                total_price: (item.amount_total || 0) / 100,
            }))

            const { error: itemsErr } = await supabaseAdmin
                .from('order_items')
                .insert(itemsToInsert)

            if (itemsErr) throw new Error(`Order items insertion failed: ${itemsErr.message}`)

            console.log(`📦 Order created: ${order.id} for Merchant: ${merchantId}`)
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 })

    } catch (err: any) {
        console.error(`❌ Webhook Error: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }
})
