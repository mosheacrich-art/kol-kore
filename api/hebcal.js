export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const { endpoint, ...params } = req.query
  if (!endpoint || !['converter', 'shabbat'].includes(endpoint)) {
    return res.status(400).json({ error: 'endpoint must be converter or shabbat' })
  }

  const qs = new URLSearchParams(params).toString()
  const upstreamUrl = `https://www.hebcal.com/${endpoint}?${qs}`

  try {
    const upstream = await fetch(upstreamUrl)
    if (!upstream.ok) return res.status(upstream.status).json({ error: `Hebcal ${upstream.status}` })
    const data = await upstream.json()
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
