import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0'
import Stripe from 'https://esm.sh/stripe@12.6.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2022-11-15' })

/**
 * 🛡️ INDUSTRIAL WEBHOOK SHIELD (Task 7.3)
 * Idempotency + Pessimistic Stock Locking + Auto-Refund.
 */
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const signature = req.headers.get('stripe-signature') || ''
  const body = await req.text()
  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET') || '')
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // 1. Idempotency Shield (Law 6)
  const { data: alreadyProcessed } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (alreadyProcessed) return new Response('Already Processed', { status: 200 })

  // 2. Process Checkout Success
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const cart = JSON.parse(session.metadata.cart || '[]')

    for (const item of cart) {
      // 🛡️ PESSIMISTIC LOCK: Atomic Decrement (Industrial Rule)
      const { data: success, error } = await supabase.rpc('atomic_stock_decrement', {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity
      })

      if (!success || error) {
        // 🚨 RACE CONDITION DETECTED: Stock hit 0 during charge window
        console.error(`[Stock Failure] Refund triggered for Session: ${session.id}`)
        
        await stripe.refunds.create({ payment_intent: session.payment_intent })
        
        // Notify Customer (Simulated)
        // sendEmail(session.customer_details.email, 'Stock Error', 'Refund processed.')
        
        return new Response('Stock Conflict: Refunded', { status: 200 })
      }
    }

    // 3. Register Idempotency (Final Step)
    await supabase.from('processed_webhook_events').insert({ stripe_event_id: event.id })
    
    // 4. Create Order
    // await createOrder(session, cart)
  }

  return new Response('Processed', { status: 200 })
})