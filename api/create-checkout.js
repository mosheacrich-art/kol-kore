import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const ALLOWED_PRODUCTS = new Set([
  'pdt_0Ne7sWfihRRycFHWb1SB2', // monthly
  'pdt_0Ne7sn0u5XBSPuebqTIsh', // annual
])

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://perashapp.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // Verify JWT — user must be authenticated and userId must match token
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || !supabaseAdmin) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { productId, name } = req.body ?? {}

  // userId and email come from the verified JWT, not from the client body
  const userId = user.id
  const email = user.email

  if (!productId) return res.status(400).json({ error: 'productId requerido' })
  if (!ALLOWED_PRODUCTS.has(productId)) return res.status(400).json({ error: 'Producto no válido' })

  const apiKey = process.env.DODO_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'DODO_API_KEY no configurada en el servidor' })

  try {
    const response = await fetch('https://live.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email, name: name || email },
        return_url: 'https://perashapp.com/student/subscription?success=1',
        metadata: { user_id: userId },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Dodo checkout error:', data)
      return res.status(500).json({ error: data.message || 'Error al crear el checkout' })
    }

    return res.status(200).json({ url: data.checkout_url })
  } catch (err) {
    console.error('create-checkout exception:', err)
    return res.status(500).json({ error: err.message })
  }
}
