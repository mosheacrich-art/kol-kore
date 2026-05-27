const CACHE = new Map()
const CACHE_TTL = 1000 * 60 * 60 * 6 // 6h

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const { ref, index } = req.query
  if (!ref && !index) return res.status(400).json({ error: 'ref or index required' })

  const upstreamUrl = index
    ? `https://www.sefaria.org/api/v2/index/${encodeURIComponent(index)}`
    : `https://www.sefaria.org/api/texts/${ref.replace(/ /g, '_')}?commentary=0&context=0&pad=0&wrapLinks=0&transLangPref=en`

  const cached = CACHE.get(upstreamUrl)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT')
    return res.json(cached.data)
  }

  try {
    const upstream = await fetch(upstreamUrl)
    if (!upstream.ok) return res.status(upstream.status).json({ error: `Sefaria ${upstream.status}` })
    const data = await upstream.json()
    CACHE.set(upstreamUrl, { data, ts: Date.now() })
    res.setHeader('Cache-Control', 'public, max-age=21600')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
