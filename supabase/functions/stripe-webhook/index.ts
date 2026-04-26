import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { user_id, months } = session.metadata ?? {}
    if (!user_id) return new Response('ok')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const monthsNum = parseInt(months ?? '1')
    const expires = new Date()
    expires.setMonth(expires.getMonth() + monthsNum)

    await supabase.from('profiles').update({
      subscription_status: 'active',
      subscription_expires_at: expires.toISOString(),
    }).eq('id', user_id)
  }

  return new Response('ok')
})
