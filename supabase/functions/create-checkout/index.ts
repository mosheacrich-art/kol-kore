import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = 'https://mosheacrich-art.github.io/kol-kore'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return new Response(
      JSON.stringify({ error: 'Stripe no configurado todavía' }),
      { status: 503, headers: corsHeaders }
    )

    // Verify auth
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: corsHeaders })

    const { plan, months } = await req.json() as { plan: string; months: number }
    const isAnnual = plan === 'annual'
    const totalMonths = isAnnual ? 12 : Math.max(1, Math.min(24, months))
    const amountCents = isAnnual ? 5000 : totalMonths * 500

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: amountCents,
          product_data: {
            name: isAnnual
              ? 'Perashá · Suscripción anual'
              : `Perashá · ${totalMonths} mes${totalMonths > 1 ? 'es' : ''}`,
            description: 'Acceso completo · Sin renovación automática',
          },
        },
        quantity: 1,
      }],
      metadata: { user_id: user.id, plan, months: String(totalMonths) },
      success_url: `${APP_URL}/#/student/subscription?success=1`,
      cancel_url: `${APP_URL}/#/student/subscription`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
