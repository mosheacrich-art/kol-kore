import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnon    = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROL_KEY || ''

const anonClient = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon)
  : null

const adminClient = supabaseUrl && supabaseService
  ? createClient(supabaseUrl, supabaseService, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://perashapp.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  if (!anonClient) return res.status(500).json({ error: 'Server misconfigured' })
  if (!adminClient) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROL_KEY not configured' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const uid = user.id

  // Fetch profile to know role
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', uid).maybeSingle()
  const isTeacher = profile?.role === 'teacher'

  if (isTeacher) {
    // Unlink students before deleting teacher
    await adminClient.from('profiles').update({ teacher_id: null }).eq('teacher_id', uid)
    await adminClient.from('notifications').delete().eq('teacher_id', uid)
    await adminClient.from('homework').delete().eq('teacher_id', uid)
    await adminClient.from('audio_files').delete().eq('teacher_id', uid)
    await adminClient.from('classes').delete().eq('teacher_id', uid)
  } else {
    // Delete all student data
    await adminClient.from('audio_listens').delete().eq('student_id', uid)
    await adminClient.from('study_sessions').delete().eq('student_id', uid)
    await adminClient.from('aliyah_time').delete().eq('student_id', uid)
    await adminClient.from('notifications').delete().eq('student_id', uid)
    await adminClient.from('audio_files').delete().eq('student_id', uid)
    await adminClient.from('homework').delete().eq('student_id', uid)
  }

  // Delete profile row
  await adminClient.from('profiles').delete().eq('id', uid)

  // Delete auth user
  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(uid)
  if (deleteErr) return res.status(500).json({ error: deleteErr.message })

  return res.status(200).json({ ok: true })
}
