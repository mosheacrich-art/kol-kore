export const config = { maxDuration: 60 }

// Words Whisper hears that differ from the written text
const WHISPER_TO_TEXT = {
  'אדוני': 'יהוה',
  'ה': 'יהוה',   // ה׳ abbreviated
  'לומר': 'לאמר',
  'ואומר': 'ויאמר',
}

function stripHeb(s) {
  return s.replace(/[^א-ת]/g, '')
}

function normalizeWord(w) {
  const stripped = stripHeb(w)
  return WHISPER_TO_TEXT[stripped] ? stripHeb(WHISPER_TO_TEXT[stripped]) : stripped
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++)
      curr[j] = a[i-1] === b[j-1] ? prev[j-1] : 1 + Math.min(prev[j], curr[j-1], prev[j-1])
    prev.splice(0, prev.length, ...curr)
  }
  return prev[b.length]
}

function flattenVerses(arr) {
  if (!Array.isArray(arr) || !arr.length) return []
  if (typeof arr[0] === 'string') return arr
  return arr.flat(Infinity).filter(v => typeof v === 'string' && v.trim())
}

function stripHtml(str) {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/[{(\[][פספס][)}\]]/g, '')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/־/g, ' ')
    .replace(/[\s ]+/g, ' ')
    .trim()
}

function splitWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0)
}

// Align whisper words to sefaria words using greedy anchor matching + interpolation.
// Returns a fully-populated array indexed by sefariaWordIdx: [{start, end}, ...]
function align(whisperWords, sefariaWords) {
  const wn = whisperWords.map(w => normalizeWord(w.word))
  const sn = sefariaWords.map(w => stripHeb(w))
  const wLen = wn.length
  const sLen = sn.length

  // Find anchor matches: whisper word → sefaria word
  const WINDOW = 10
  const anchors = [{ wi: 0, si: 0 }]
  let sStart = 0
  for (let wi = 0; wi < wLen; wi++) {
    if (wn[wi].length < 2) continue
    let best = -1, bestScore = 0.5
    const sEnd = Math.min(sStart + WINDOW, sLen)
    for (let si = sStart; si < sEnd; si++) {
      if (!sn[si]) continue
      const maxLen = Math.max(wn[wi].length, sn[si].length)
      const score = 1 - levenshtein(wn[wi], sn[si]) / maxLen
      if (score > bestScore) { bestScore = score; best = si }
    }
    if (best >= 0) { anchors.push({ wi, si: best }); sStart = best + 1 }
  }
  anchors.push({ wi: wLen - 1, si: sLen - 1 })

  const realAnchors = anchors.length - 2  // exclude virtual start/end
  const anchorPct = sLen > 0 ? realAnchors / sLen : 0

  // Build whisperIdx → sefariaIdx map
  const w2s = new Array(wLen)
  for (let ai = 0; ai < anchors.length - 1; ai++) {
    const { wi: w0, si: s0 } = anchors[ai]
    const { wi: w1, si: s1 } = anchors[ai + 1]
    for (let wi = w0; wi <= w1; wi++) {
      const t = w1 > w0 ? (wi - w0) / (w1 - w0) : 0
      w2s[wi] = Math.min(Math.round(s0 + t * (s1 - s0)), sLen - 1)
    }
  }

  // Build sparse sefariaIdx → timestamp (first whisper word that maps here)
  const sparse = new Array(sLen).fill(null)
  for (let wi = 0; wi < wLen; wi++) {
    const si = w2s[wi]
    if (sparse[si] === null)
      sparse[si] = { start: whisperWords[wi].start, end: whisperWords[wi].end }
  }

  // Interpolate nulls between known anchors
  const knownIdxs = []
  for (let i = 0; i < sLen; i++) if (sparse[i] !== null) knownIdxs.push(i)

  const out = [...sparse]

  // Between anchors
  for (let ki = 0; ki < knownIdxs.length - 1; ki++) {
    const li = knownIdxs[ki], ri = knownIdxs[ki + 1]
    if (ri - li <= 1) continue
    const gap = ri - li
    const lEnd = out[li].end, rStart = out[ri].start
    for (let i = li + 1; i < ri; i++) {
      const t = (i - li) / gap
      const start = lEnd + t * (rStart - lEnd)
      const dur = Math.max(0.05, (rStart - lEnd) / gap * 0.7)
      out[i] = { start: +start.toFixed(3), end: +(start + dur).toFixed(3) }
    }
  }

  // Leading nulls (before first known)
  if (knownIdxs.length && knownIdxs[0] > 0) {
    const first = out[knownIdxs[0]]
    for (let i = knownIdxs[0] - 1; i >= 0; i--) {
      const d = knownIdxs[0] - i
      out[i] = { start: +(first.start - d * 0.15).toFixed(3), end: +(first.start - (d - 1) * 0.15).toFixed(3) }
    }
  }

  // Trailing nulls (after last known)
  if (knownIdxs.length && knownIdxs[knownIdxs.length - 1] < sLen - 1) {
    const last = out[knownIdxs[knownIdxs.length - 1]]
    for (let i = knownIdxs[knownIdxs.length - 1] + 1; i < sLen; i++) {
      const d = i - knownIdxs[knownIdxs.length - 1]
      out[i] = { start: +(last.end + (d - 1) * 0.15).toFixed(3), end: +(last.end + d * 0.15).toFixed(3) }
    }
  }

  // Fallback: if everything is null (alignment completely failed)
  const totalDuration = whisperWords[whisperWords.length - 1]?.end ?? 1
  for (let i = 0; i < sLen; i++) {
    if (out[i] === null) {
      const t = (i / Math.max(1, sLen - 1)) * totalDuration
      out[i] = { start: +t.toFixed(3), end: +(t + 0.3).toFixed(3) }
    }
  }

  return { aligned: out, anchorPct }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { audioUrl, fileType, aliyahRef, prompt } = req.body ?? {}
  if (!audioUrl) return res.status(400).json({ error: 'audioUrl required' })

  const apiKey = (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '').trim()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY no configurada en el servidor' })

  try {
    // 1. Fetch Sefaria text (parallel with audio download)
    let sefariaWords = []
    const sefariaPromise = aliyahRef
      ? fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(aliyahRef)}?commentary=0&context=0&pad=0&wrapLinks=0`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data) return []
            return flattenVerses(data.he || []).flatMap(v => splitWords(stripHtml(v)))
          })
          .catch(() => [])
      : Promise.resolve([])

    // 2. Download audio
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) return res.status(500).json({ error: `No se pudo descargar el audio: ${audioRes.status}` })
    const blob = await audioRes.blob()

    // 3. Transcribe with Whisper
    const ext = (fileType || 'audio/webm').split('/')[1]?.split(';')[0] || 'webm'
    const form = new FormData()
    form.append('file', new File([blob], `audio.${ext}`, { type: fileType || 'audio/webm' }))
    form.append('model', 'whisper-1')
    form.append('language', 'he')
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'word')
    form.append('prompt', prompt || 'בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.text()
      return res.status(500).json({ error: `Whisper ${whisperRes.status}: ${err}` })
    }

    const { words: whisperWords } = await whisperRes.json()
    if (!whisperWords?.length) return res.status(200).json({ words: [] })

    // 4. Wait for Sefaria and align
    sefariaWords = await sefariaPromise

    if (!sefariaWords.length) {
      // No Sefaria text — return raw Whisper (old format, client does alignment)
      console.warn('Sync: no aliyahRef or Sefaria fetch failed, returning raw Whisper output')
      return res.status(200).json({ words: whisperWords.map(w => ({ word: w.word, start: w.start, end: w.end })) })
    }

    const { aligned, anchorPct } = align(whisperWords, sefariaWords)
    const needsReview = anchorPct < 0.4

    console.log(`Sync: ${whisperWords.length} whisper / ${sefariaWords.length} sefaria / ${Math.round(anchorPct * 100)}% anchors / needs_review=${needsReview}`)

    return res.status(200).json({
      words: aligned,
      needs_review: needsReview,
      anchor_pct: +anchorPct.toFixed(3),
      format: 'v2',
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
