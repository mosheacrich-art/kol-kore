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

  // Send welcome email only on first activation (not on renewals)
  if (type === 'subscription.active') {
    try {
      // Fetch user email from Supabase auth
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      })
      const userData = userRes.ok ? await userRes.json() : null
      const userEmail = userData?.email
      const userName = userData?.user_metadata?.name || userData?.user_metadata?.full_name || null

      if (userEmail) {
        const resendKey = process.env.RESEND_API_KEY
        if (resendKey) {
          const planLabel = subscriptionPlan === 'annual' ? 'Anual' : 'Mensual'
          const greeting = userName ? `Hola, ${userName.split(' ')[0]}` : 'Hola'
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Perashapp <noreply@perashapp.com>',
              to: userEmail,
              subject: '¡Bienvenido a Perashapp Pro! 🌟',
              html: `
                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1a1a2e;">
                  <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="font-size: 22px; font-weight: 300; letter-spacing: -0.5px; margin: 0 0 4px;">Perashapp</h1>
                    <p style="color: #c9a227; font-size: 14px; margin: 0;">פָּרָשָׁה</p>
                  </div>

                  <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px;">${greeting} 👋</h2>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                    Tu suscripción <strong>${planLabel}</strong> ya está activa. Ahora tienes acceso completo a Perashapp Pro.
                  </p>

                  <div style="background: #f7f4ff; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
                    <p style="font-weight: 600; font-size: 13px; margin: 0 0 12px; color: #6c33e6;">Incluye todo esto:</p>
                    <ul style="margin: 0; padding: 0 0 0 16px; color: #444; font-size: 14px; line-height: 2;">
                      <li>Audio del profesor sincronizado palabra a palabra</li>
                      <li>Todas las parashas del año</li>
                      <li>Taamim, nikkud y modo sefer</li>
                      <li>Envío de grabaciones al profesor</li>
                      <li>Acceso desde cualquier dispositivo</li>
                    </ul>
                  </div>

                  <div style="text-align: center; margin-bottom: 32px;">
                    <a href="https://perashapp.com/student/study"
                      style="display: inline-block; background: linear-gradient(135deg, #6c33e6, #8b5cf6); color: #fff;
                             text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                      Empezar a estudiar →
                    </a>
                  </div>

                  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                    Para cualquier consulta escríbenos a
                    <a href="mailto:mosheacrichcohen@gmail.com" style="color: #6c33e6;">mosheacrichcohen@gmail.com</a>
                  </p>
                </div>
              `,
            }),
          })
          console.log(`Welcome email sent to ${userEmail}`)
        }
      }
    } catch (emailErr) {
      console.error('Welcome email failed (non-fatal):', emailErr.message)
    }
  }

  return res.status(200).json({ received: true })
}
