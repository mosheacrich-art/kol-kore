import crypto from 'crypto'

export const config = { api: { bodyParser: false } }

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function verifySignature(rawBody, headers, secret) {
  const id = headers['webhook-id']
  const timestamp = headers['webhook-timestamp']
  const signature = headers['webhook-signature']
  if (!id || !timestamp || !signature) return false

  // Secret format: "whsec_<base64>"
  const secretBytes = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64')
  const signedContent = `${id}.${timestamp}.${rawBody}`
  const computed = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  // Signature header may contain multiple values like "v1,<sig> v1,<sig>"
  return signature.split(' ').some(s => {
    const val = s.includes(',') ? s.split(',')[1] : s
    return val === computed
  })
}

const STATUS_MAP = {
  'subscription.active':    'active',
  'subscription.renewed':   'active',
  'subscription.cancelled': 'cancelled',
  'subscription.expired':   'expired',
  'subscription.on_hold':   'on_hold',
}

const MONTHLY_PRODUCT_ID = 'pdt_0Ne7sWfihRRycFHWb1SB2'
const ANNUAL_PRODUCT_ID  = 'pdt_0Ne7sn0u5XBSPuebqTIsh'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await readRawBody(req)
  const secret = process.env.DODO_WEBHOOK_SECRET

  if (!secret || !verifySignature(rawBody, req.headers, secret)) {
    console.error('Webhook signature invalid')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let event
  try { event = JSON.parse(rawBody) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }

  const { type, data } = event
  const newStatus = STATUS_MAP[type]
  if (!newStatus) return res.status(200).json({ received: true }) // ignore unknown events

  const userId = data?.metadata?.user_id
  const subscriptionId = data?.subscription_id

  if (!userId) {
    console.warn(`Webhook ${type}: no user_id in metadata, cannot update profile`)
    return res.status(200).json({ received: true })
  }

  // Determine plan type from product_id
  const productId = data?.product_id
  const subscriptionPlan = productId === ANNUAL_PRODUCT_ID ? 'annual'
    : productId === MONTHLY_PRODUCT_ID ? 'monthly'
    : null

  // Extract end date — Dodo may send next_billing_date or expiry_date
  const rawEndDate = data?.next_billing_date || data?.expiry_date || data?.current_period_end || null
  const subscriptionEndDate = rawEndDate ? new Date(rawEndDate).toISOString() : null

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('Supabase env vars missing in webhook handler')
    return res.status(500).json({ error: 'Server config error' })
  }

  const patch = {
    subscription_status: newStatus,
    subscription_id: subscriptionId,
    ...(subscriptionPlan ? { subscription_plan: subscriptionPlan } : {}),
    ...(subscriptionEndDate ? { subscription_end_date: subscriptionEndDate } : {}),
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

  console.log(`Webhook ${type}: user ${userId} → ${newStatus} plan=${subscriptionPlan} end=${subscriptionEndDate}`)
  return res.status(200).json({ received: true })
}
