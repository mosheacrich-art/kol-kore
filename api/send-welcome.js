export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Protect with admin secret
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret || req.headers['x-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { userId, plan } = req.body ?? {}
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY

  if (!supabaseUrl || !serviceKey || !resendKey) {
    return res.status(500).json({ error: 'Server config error' })
  }

  // Fetch user email from Supabase auth
  const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  })
  if (!userRes.ok) return res.status(404).json({ error: 'User not found' })

  const userData = await userRes.json()
  const userEmail = userData?.email
  const userName = userData?.user_metadata?.name || userData?.user_metadata?.full_name || null

  if (!userEmail) return res.status(400).json({ error: 'User has no email' })

  const planLabel = plan === 'annual' ? 'Annual' : 'Monthly'
  const greeting = userName ? `Hi, ${userName.split(' ')[0]}` : 'Hi there'

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Perashapp <noreply@perashapp.com>',
      to: userEmail,
      subject: 'Welcome to Perashapp Pro! 🌟',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1a1a2e;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 300; letter-spacing: -0.5px; margin: 0 0 4px;">Perashapp</h1>
            <p style="color: #c9a227; font-size: 14px; margin: 0;">פָּרָשָׁה</p>
          </div>

          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px;">${greeting} 👋</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Your <strong>${planLabel}</strong> subscription is now active. You have full access to Perashapp Pro.
          </p>

          <div style="background: #f7f4ff; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
            <p style="font-weight: 600; font-size: 13px; margin: 0 0 12px; color: #6c33e6;">What's included:</p>
            <ul style="margin: 0; padding: 0 0 0 16px; color: #444; font-size: 14px; line-height: 2;">
              <li>Teacher audio synced word by word</li>
              <li>All parashot of the year</li>
              <li>Taamim, nikkud and sefer mode</li>
              <li>Send recordings to your teacher</li>
              <li>Access from any device</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://perashapp.com/student/study"
              style="display: inline-block; background: linear-gradient(135deg, #6c33e6, #8b5cf6); color: #fff;
                     text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
              Start studying →
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            For any questions contact us at
            <a href="mailto:mosheacrichcohen@gmail.com" style="color: #6c33e6;">mosheacrichcohen@gmail.com</a>
          </p>
        </div>
      `,
    }),
  })

  if (!emailRes.ok) {
    const err = await emailRes.text()
    console.error('Resend error:', err)
    return res.status(500).json({ error: 'Email failed', detail: err })
  }

  console.log(`Manual welcome email sent to ${userEmail} (userId=${userId})`)
  return res.status(200).json({ ok: true, email: userEmail })
}
