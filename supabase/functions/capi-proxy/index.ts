import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0'

/**
 * 🛰️ INDUSTRIAL CAPI RELAY (Task 7.3)
 * Non-blocking relay with Retry Queue integration.
 */
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { event, eventId, data } = await req.json()

  // 1. Initial Success Log (Optimistic)
  await supabase.from('analytics_events').update({ 
    capi_status: 'pending', 
    retry_count: 0 
  }).eq('id', eventId)

  try {
    // 🛡️ NON-BLOCKING FORWARDING (Fire and Forget)
    // In Deno Edge, we can't easily background a task without awaiting,
    // so we use a fast timeout for the 3rd party call.
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000) // 2s cap

    const response = await fetch('https://graph.facebook.com/v17.0/...', {
      method: 'POST',
      body: JSON.stringify({ /* CAPI Payload */ }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (response.ok) {
        await supabase.from('analytics_events').update({ capi_status: 'synced' }).eq('id', eventId)
    } else {
        throw new Error(`Platform rejected: ${response.status}`)
    }

  } catch (err) {
    // 🚨 RETRY QUEUE REGISTRATION (Industrial Rule)
    console.error(`[CAPI Failure] Event: ${eventId}, Error: ${err.message}`)
    
    await supabase.from('analytics_events').update({ 
      capi_status: 'failed', 
      last_fail_reason: err.message,
      retry_count: 1 // Next cron will pick this up
    }).eq('id', eventId)
  }

  return new Response(JSON.stringify({ status: 'queued' }), { headers: { 'Content-Type': 'application/json' } })
})
