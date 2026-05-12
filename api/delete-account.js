import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnon    = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Anon client — only used to verify the user's JWT
const anonClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null
// Admin client — needed to call auth.admin.deleteUser
const adminClient = supabaseUrl && supabaseService ? createClient(supabaseUrl, supabaseService, {
  auth: { autoRefreshToken: false, persistSession: false },
}) : null

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://perashapp.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  if (!anonClient || !adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Delete the profile row first (cascade will handle related data if FK set up;
  // if not, the auth delete alone will orphan the profile row which is fine)
  await adminClient.from('profiles').delete().eq('id', user.id)

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id)
  if (deleteErr) {
    return res.status(500).json({ error: deleteErr.message })
  }

  return res.status(200).json({ ok: true })
}
