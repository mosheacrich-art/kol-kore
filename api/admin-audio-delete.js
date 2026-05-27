import { createClient } from '@supabase/supabase-js'

const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'
const BUCKET = 'public-audios'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!supabaseAdmin) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' })

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user || user.id !== ADMIN_USER_ID) return res.status(403).json({ error: 'Forbidden' })

    const { audioId } = req.body
    if (!audioId) return res.status(400).json({ error: 'Missing audioId' })

    // Look up the record to get the storage path
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('public_audios')
      .select('public_url')
      .eq('id', audioId)
      .single()
    if (fetchErr || !row) return res.status(404).json({ error: 'Audio not found' })

    // Extract storage path from public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/public-audios/<path>
    const urlParts = row.public_url.split(`/storage/v1/object/public/${BUCKET}/`)
    if (urlParts.length === 2) {
      const storagePath = decodeURIComponent(urlParts[1])
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath])
    }

    // Delete from DB
    const { error: delErr } = await supabaseAdmin.from('public_audios').delete().eq('id', audioId)
    if (delErr) return res.status(500).json({ error: delErr.message })

    res.json({ ok: true })
  } catch (err) {
    console.error('admin-audio-delete error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
