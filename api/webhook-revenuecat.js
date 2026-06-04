const ACTIVE_EVENTS   = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']
const INACTIVE_EVENTS = ['EXPIRATION', 'CANCELLATION']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verify RevenueCat webhook secret
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET
  if (secret && req.headers.authorization !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { event } = req.body
  if (!event) return res.status(400).json({ error: 'No event' })

  const { type, app_user_id: userId, product_id: productId, expiration_at_ms } = event

  if (!ACTIVE_EVENTS.includes(type) && !INACTIVE_EVENTS.includes(type)) {
    return res.status(200).json({ received: true })
  }
  if (!userId) return res.status(200).json({ received: true })

  const isActive = ACTIVE_EVENTS.includes(type)
  const plan = productId?.includes('annual') ? 'annual' : 'monthly'
  const endDate = expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Server config error' })
  }

  const patch = {
    subscription_status: isActive ? 'active' : 'expired',
    ...(isActive ? { subscription_plan: plan } : {}),
    ...(endDate ? { subscription_end_date: endDate } : {}),
  }

  const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(patch),
  })

  if (!updateRes.ok) {
    const err = await updateRes.text()
    console.error('Supabase update failed:', err)
    return res.status(500).json({ error: 'DB update failed' })
  }

  console.log(`RevenueCat ${type}: user ${userId} → ${patch.subscription_status} plan=${plan}`)
  return res.status(200).json({ received: true })
}
