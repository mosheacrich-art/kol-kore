import { createClient } from '@supabase/supabase-js'

const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!supabaseAdmin) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured in Vercel env vars' })

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user || user.id !== ADMIN_USER_ID) return res.status(403).json({ error: 'Forbidden' })

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

    res.json({ ok: true })
  } catch (err) {
    console.error('admin-audio-save error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
