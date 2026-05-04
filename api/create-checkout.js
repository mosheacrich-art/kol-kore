export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { productId, userId, email, name } = req.body ?? {}
  if (!productId || !email) return res.status(400).json({ error: 'productId y email requeridos' })

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
