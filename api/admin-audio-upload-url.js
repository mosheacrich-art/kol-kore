import { createClient } from '@supabase/supabase-js'

const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'
const BUCKET = 'public-audios'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user || user.id !== ADMIN_USER_ID) return res.status(403).json({ error: 'Forbidden' })

  const { parashaId, aliyahIdx, label } = req.body
  if (!parashaId || aliyahIdx == null || !label) return res.status(400).json({ error: 'Missing fields' })

  const labelSlug = label.toLowerCase().replace(/\s+/g, '_')
  const storagePath = `${labelSlug}/${parashaId}/${aliyahIdx}.m4a`

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(storagePath)
  if (error) return res.status(500).json({ error: error.message })

  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath)

  res.json({ signedUrl: data.signedUrl, token: data.token, storagePath, publicUrl })
}
