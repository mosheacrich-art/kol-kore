const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Config error' })

  // Verify caller is admin via Supabase JWT
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': anonKey || serviceKey, 'Authorization': `Bearer ${token}` },
  })
  const caller = await callerRes.json()
  if (caller?.id !== ADMIN_USER_ID) return res.status(403).json({ error: 'Forbidden' })

  // Fetch all profiles
  const profilesRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=id,name,role,subscription_status,subscription_plan,subscription_end_date`,
    { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
  )
  const profiles = await profilesRes.json()

  // Fetch auth users for emails
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
  })
  const authData = await authRes.json()
  const emailMap = {}
  for (const u of authData?.users || []) emailMap[u.id] = u.email

  const users = (Array.isArray(profiles) ? profiles : []).map(p => ({
    ...p,
    email: emailMap[p.id] || null,
  }))

  return res.status(200).json({ users })
}
