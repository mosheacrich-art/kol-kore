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

async function del(table, col, val) {
  const { error } = await adminClient.from(table).delete().eq(col, val)
  if (error) console.error(`[delete-account] del ${table}.${col}:`, error.message)
  return error
}

async function nullify(table, col, val) {
  const { error } = await adminClient.from(table).update({ [col]: null }).eq(col, val)
  if (error) console.error(`[delete-account] nullify ${table}.${col}:`, error.message)
  return error
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://perashapp.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  if (!anonClient) return res.status(500).json({ error: 'Server misconfigured (anon)' })
  if (!adminClient) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROL_KEY not configured' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const uid = user.id
  const errors = {}

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', uid).maybeSingle()
  const isTeacher = profile?.role === 'teacher'

  if (isTeacher) {
    // Nullify FK references in students before deleting teacher profile
    const e1 = await nullify('profiles', 'teacher_id', uid)
    const e2 = await del('notifications', 'teacher_id', uid)
    const e3 = await del('homework', 'teacher_id', uid)
    const e4 = await del('audio_files', 'teacher_id', uid)
    const e5 = await del('classes', 'teacher_id', uid)
    if (e1) errors.unlink_students = e1.message
    if (e2) errors.notifications = e2.message
    if (e3) errors.homework = e3.message
    if (e4) errors.audio_files = e4.message
    if (e5) errors.classes = e5.message
  } else {
    // Nullify homework FK (preserves teacher record, removes the constraint)
    const e1 = await nullify('homework', 'student_id', uid)
    const e2 = await del('audio_listens', 'student_id', uid)
    const e3 = await del('study_sessions', 'student_id', uid)
    const e4 = await del('aliyah_time', 'student_id', uid)
    const e5 = await del('notifications', 'student_id', uid)
    const e6 = await del('audio_files', 'student_id', uid)
    if (e1) errors.homework_nullify = e1.message
    if (e2) errors.audio_listens = e2.message
    if (e3) errors.study_sessions = e3.message
    if (e4) errors.aliyah_time = e4.message
    if (e5) errors.notifications = e5.message
    if (e6) errors.audio_files = e6.message
  }

  // Delete profile row — must come after all FK references above are cleared
  const { error: profileErr } = await adminClient.from('profiles').delete().eq('id', uid)
  if (profileErr) errors.profile = profileErr.message

  // Delete auth user
  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(uid)
  if (deleteErr) {
    return res.status(500).json({
      error: deleteErr.message,
      debug: Object.keys(errors).length ? errors : undefined,
    })
  }

  return res.status(200).json({ ok: true })
}
