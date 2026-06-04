import { createClient } from '@supabase/supabase-js'

const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'
const BUCKET = 'public-audios'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

async function verifyAdmin(req) {
  if (!supabaseAdmin) throw new Error('Supabase not configured')
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user || user.id !== ADMIN_USER_ID) return null
  return user
}

export default async function handler(req, res) {
  const action = req.query.action

  if (!action) return res.status(400).json({ error: 'Missing action' })
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured' })

  try {
    // ── GET users ──────────────────────────────────────────────────────────────
    if (action === 'users') {
      if (req.method !== 'GET') return res.status(405).end()
      const admin = await verifyAdmin(req)
      if (!admin) return res.status(403).json({ error: 'Forbidden' })

      const profilesRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=id,name,role,subscription_status,subscription_plan,subscription_end_date`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      )
      const profiles = await profilesRes.json()

      const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
      })
      const authData = await authRes.json()
      const emailMap = {}
      for (const u of authData?.users || []) emailMap[u.id] = u.email

      const users = (Array.isArray(profiles) ? profiles : []).map(p => ({
        ...p, email: emailMap[p.id] || null,
      }))
      return res.status(200).json({ users })
    }

    // ── POST audio-upload-url ──────────────────────────────────────────────────
    if (action === 'audio-upload-url') {
      if (req.method !== 'POST') return res.status(405).end()
      const admin = await verifyAdmin(req)
      if (!admin) return res.status(403).json({ error: 'Forbidden' })

      const { parashaId, aliyahIdx, label, ext = 'm4a' } = req.body
      if (!parashaId || aliyahIdx == null || !label) return res.status(400).json({ error: 'Missing fields' })

      const labelSlug = label.toLowerCase().replace(/\s+/g, '_')
      const safeExt = ext.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'm4a'
      const storagePath = `${labelSlug}/${parashaId}/${aliyahIdx}.${safeExt}`

      const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(storagePath)
      if (error) return res.status(500).json({ error: error.message })

      const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath)
      return res.json({ signedUrl: data.signedUrl, token: data.token, storagePath, publicUrl })
    }

    // ── POST audio-save ────────────────────────────────────────────────────────
    if (action === 'audio-save') {
      if (req.method !== 'POST') return res.status(405).end()
      const admin = await verifyAdmin(req)
      if (!admin) return res.status(403).json({ error: 'Forbidden' })

      const { parashaId, aliyahIdx, label, publicUrl, fileType, wordTimestamps, anchorPct, needsReview } = req.body
      if (!parashaId || aliyahIdx == null || !label || !publicUrl) return res.status(400).json({ error: 'Missing fields' })

      const row = {
        parasha_id: parashaId,
        aliyah_idx: aliyahIdx,
        label,
        public_url: publicUrl,
        file_type: fileType || 'audio/x-m4a',
        needs_review: needsReview !== undefined ? needsReview : true,
        word_timestamps: wordTimestamps !== undefined ? wordTimestamps : null,
        anchor_pct: anchorPct !== undefined ? anchorPct : null,
      }

      const { error } = await supabaseAdmin.from('public_audios').upsert(row, { onConflict: 'parasha_id,aliyah_idx,label' })
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }

    // ── POST audio-delete ──────────────────────────────────────────────────────
    if (action === 'audio-delete') {
      if (req.method !== 'POST') return res.status(405).end()
      const admin = await verifyAdmin(req)
      if (!admin) return res.status(403).json({ error: 'Forbidden' })

      const { audioId } = req.body
      if (!audioId) return res.status(400).json({ error: 'Missing audioId' })

      const { data: row, error: fetchErr } = await supabaseAdmin
        .from('public_audios').select('public_url').eq('id', audioId).single()
      if (fetchErr || !row) return res.status(404).json({ error: 'Audio not found' })

      const urlParts = row.public_url.split(`/storage/v1/object/public/${BUCKET}/`)
      if (urlParts.length === 2) {
        await supabaseAdmin.storage.from(BUCKET).remove([decodeURIComponent(urlParts[1])])
      }

      const { error: delErr } = await supabaseAdmin.from('public_audios').delete().eq('id', audioId)
      if (delErr) return res.status(500).json({ error: delErr.message })
      return res.json({ ok: true })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })

  } catch (err) {
    console.error(`admin?action=${action} error:`, err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
