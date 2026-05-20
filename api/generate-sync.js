import { createClient } from '@supabase/supabase-js'

export const config = { maxDuration: 60 }

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

function isAllowedAudioUrl(url) {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== 'https:') return false
    return hostname.endsWith('.supabase.co') || hostname.endsWith('.supabase.in')
  } catch { return false }
}

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

// Redistribute word timestamps within Whisper segments when compression is detected.
// Whisper sometimes compresses repeated phrases (e.g. ארצה כנען ויבאו ארצה כנען)
// into a small time window. Segment timestamps are more accurate than word timestamps,
// so we use them to spread words proportionally when coverage < 60% of segment duration.
function redistributeSegmentWords(words, segments) {
  if (!segments?.length || !words.length) return words
  const result = words.map(w => ({ word: w.word, start: w.start, end: w.end }))

  for (const seg of segments) {
    const segDur = seg.end - seg.start
    if (segDur < 0.3) continue // too short to matter

    // Collect indices of words in this segment (by start time)
    const idxs = []
    for (let i = 0; i < result.length; i++) {
      if (result[i].start >= seg.start - 0.1 && result[i].start < seg.end) idxs.push(i)
    }
    if (idxs.length < 2) continue

    const first = result[idxs[0]]
    const last = result[idxs[idxs.length - 1]]
    const coverage = (last.end - first.start) / segDur

    // Only redistribute if words cover < 60% of segment duration
    if (coverage >= 0.6) continue

    console.log(`Sync: redistributing ${idxs.length} words in segment [${seg.start.toFixed(2)}-${seg.end.toFixed(2)}] (coverage ${Math.round(coverage*100)}%)`)
    const n = idxs.length
    idxs.forEach((wi, pos) => {
      const t0 = seg.start + (pos / n) * segDur
      const t1 = seg.start + ((pos + 1) / n) * segDur
      result[wi] = { word: result[wi].word, start: +t0.toFixed(3), end: +t1.toFixed(3) }
    })
  }

  return result
}

// Align whisper words to sefaria words using Needleman-Wunsch global alignment.
// Handles insertions/deletions robustly — Whisper missing a section no longer
// throws off all subsequent matches the way the old greedy search could.
// Returns a fully-populated array indexed by sefariaWordIdx: [{start, end}, ...]
function align(whisperWords, sefariaWords) {
  const wn = whisperWords.map(w => normalizeWord(w.word))
  const sn = sefariaWords.map(w => stripHeb(w))
  const wLen = wn.length
  const sLen = sn.length

  // Per-cell score: how well whisper word wi matches sefaria word si.
  // normalizeWord already maps equivalences (אדוני→יהוה, לומר→לאמר ...) so exact match
  // after normalization catches those cases with full score.
  function matchScore(wi, si) {
    if (!wn[wi] || !sn[si]) return -2
    let textScore
    if (wn[wi] === sn[si]) {
      // Exact match always anchors, even for short words (הוא, את, כי…).
      // Only FUZZY matching of short words is risky (אשר/אמר look alike).
      textScore = 4
    } else {
      const maxLen = Math.max(wn[wi].length, sn[si].length)
      const sim = 1 - levenshtein(wn[wi], sn[si]) / maxLen
      // Fuzzy matching of short words is too risky — common words look similar.
      if (maxLen <= 3) return -3
      // Lowered from 0.85 → 0.80 so that יהושע/יהוש (5-char, 1-letter diff,
      // sim ≈ 0.83) still anchors instead of being skipped.
      if (sim >= 0.80) textScore = 2
      else if (maxLen >= 4 && sim >= 0.75) textScore = 1
      else return -3                      // mismatch — prefer gaps over false anchors
    }
    // Positional bias: when the same word appears twice (e.g. עבר לפניך repeated in
    // the same passage), prefer the occurrence whose relative position in Sefaria
    // is closest to the word's relative position in Whisper. Max bonus = 0.5,
    // enough to break ties without overriding genuine textual differences.
    const wPct = wLen > 1 ? wi / (wLen - 1) : 0
    const sPct = sLen > 1 ? si / (sLen - 1) : 0
    return textScore + 0.5 * (1 - Math.abs(wPct - sPct))
  }

  const GAP = -1   // cost of one insertion or deletion

  // Regular Array (Float64) — NOT Float32Array. The positional bias produces
  // non-integer scores; storing them in Float32 causes precision loss that
  // breaks the traceback's exact-equality comparison (dp[i][j] === dp[i-1][j-1]+score).
  const dp = Array.from({ length: sLen + 1 }, (_, i) =>
    Array.from({ length: wLen + 1 }, (_, j) => (i === 0 ? j * GAP : j === 0 ? i * GAP : 0))
  )
  for (let i = 1; i <= sLen; i++) {
    for (let j = 1; j <= wLen; j++) {
      const diag = dp[i-1][j-1] + matchScore(j-1, i-1)
      const up   = dp[i-1][j]   + GAP   // sefaria word unmatched (whisper gap)
      const left = dp[i][j-1]   + GAP   // extra whisper word, skip it
      dp[i][j] = Math.max(diag, up, left)
    }
  }

  // Traceback — prefer diagonal (match) on tie to minimise gaps
  const sparse = new Array(sLen).fill(null)
  let matched = 0
  let i = sLen, j = wLen
  while (i > 0 || j > 0) {
    const score = i > 0 && j > 0 ? matchScore(j-1, i-1) : -Infinity
    if (i > 0 && j > 0 && dp[i][j] === dp[i-1][j-1] + score) {
      if (score > 0) {
        sparse[i-1] = { start: whisperWords[j-1].start, end: whisperWords[j-1].end }
        matched++
      }
      i--; j--
    } else if (i > 0 && dp[i][j] === dp[i-1][j] + GAP) {
      i--   // sefaria word with no whisper match → will be interpolated
    } else {
      j--   // extra whisper word → discard
    }
  }

  const anchorPct = sLen > 0 ? matched / sLen : 0

  // Interpolate nulls between known anchors
  const knownIdxs = []
  for (let i = 0; i < sLen; i++) if (sparse[i] !== null) knownIdxs.push(i)

  const out = [...sparse]

  // Between anchors
  for (let ki = 0; ki < knownIdxs.length - 1; ki++) {
    const li = knownIdxs[ki], ri = knownIdxs[ki + 1]
    if (ri - li <= 1) continue
    const gap = ri - li
    const rStart = out[ri].start
    // If the left anchor's end overshoots the right anchor's start (long sung note),
    // distribute from left.start instead so interpolated times stay monotonic.
    const lRef = (out[li].end < rStart) ? out[li].end : out[li].start
    const span = Math.max(0.05 * gap, rStart - lRef)
    for (let i = li + 1; i < ri; i++) {
      const t = (i - li) / gap
      const start = lRef + t * span
      const dur = Math.max(0.05, span / gap * 0.7)
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

  // Final guardrail: enforce monotonic starts with min 50ms step.
  // Whisper sometimes assigns duplicate/near-duplicate timestamps to repeated phrases;
  // 50ms spacing ensures each word is visible for at least 3 frames at 60fps.
  // For normally-spaced words (200ms+ apart), this has zero effect.
  let lastStart = -0.05
  for (let i = 0; i < sLen; i++) {
    const start = Math.max(out[i].start, lastStart + 0.05)
    const end = Math.max(out[i].end, start + 0.05)
    out[i] = { start: +start.toFixed(3), end: +end.toFixed(3) }
    lastStart = out[i].start
  }

  return { aligned: out, anchorPct }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // C-02: Verify Supabase JWT
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || !supabaseAdmin) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { audioUrl, fileType, aliyahRef, prompt } = req.body ?? {}
  if (!audioUrl) return res.status(400).json({ error: 'audioUrl required' })

  // C-01: SSRF — only allow Supabase Storage URLs
  if (!isAllowedAudioUrl(audioUrl)) return res.status(400).json({ error: 'Invalid audio URL' })

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

    // 3. Wait for Sefaria now so Whisper gets the actual aliyah as context.
    sefariaWords = await sefariaPromise
    const whisperPrompt = prompt || sefariaWords.join(' ').slice(0, 900)

    // 4. Transcribe with Whisper
    const MIME_TO_EXT = {
      'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a', 'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/ogg': 'ogg',
      'audio/flac': 'flac', 'audio/wav': 'wav', 'audio/wave': 'wav',
      'audio/webm': 'webm', 'video/mp4': 'mp4', 'video/webm': 'webm',
    }
    const mime = (fileType || 'audio/webm').split(';')[0].trim().toLowerCase()
    const ext = MIME_TO_EXT[mime] || mime.split('/')[1]?.split(';')[0] || 'webm'
    const form = new FormData()
    form.append('file', new File([blob], `audio.${ext}`, { type: fileType || 'audio/webm' }))
    form.append('model', 'whisper-1')
    form.append('language', 'he')
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'word')
    form.append('timestamp_granularities[]', 'segment')
    if (whisperPrompt) form.append('prompt', whisperPrompt)

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.text()
      return res.status(500).json({ error: `Whisper ${whisperRes.status}: ${err}` })
    }

    const whisperData = await whisperRes.json()
    const rawWords = whisperData.words
    if (!rawWords?.length) return res.status(200).json({ words: [] })
    const whisperWords = redistributeSegmentWords(rawWords, whisperData.segments)

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
