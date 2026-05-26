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
  'ה': 'יהוה',
  'לומר': 'לאמר',
  'ואומר': 'ויאמר',
  'אומר': 'ויאמר',  // Ashkenazi: "ויאמר" heard as two words "ויוא" + "אומר"
  'ויוא': 'וירא',   // Ashkenazi: "וירא" heard as "ויוא"
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
    .replace(/[\s ]+/g, ' ')
    .trim()
}

function splitWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0)
}

// Align whisper words to sefaria words using Needleman-Wunsch global alignment.
// Returns { aligned, anchorPct, anchorSet } where anchorSet is the Set of Sefaria
// indices directly matched to a Whisper word (not interpolated).
function align(whisperWords, sefariaWords) {
  const wn = whisperWords.map(w => normalizeWord(w.word))
  const sn = sefariaWords.map(w => stripHeb(w))
  const wLen = wn.length
  const sLen = sn.length

  function matchScore(wi, si) {
    if (!wn[wi] || !sn[si]) return -2
    let textScore
    if (wn[wi] === sn[si]) {
      textScore = 4
    } else {
      const maxLen = Math.max(wn[wi].length, sn[si].length)
      const sim = 1 - levenshtein(wn[wi], sn[si]) / maxLen
      if (maxLen <= 3) return -3
      if (sim >= 0.80) textScore = 2
      else if (maxLen >= 4 && sim >= 0.75) textScore = 1
      else return -3
    }
    const wPct = wLen > 1 ? wi / (wLen - 1) : 0
    const sPct = sLen > 1 ? si / (sLen - 1) : 0
    return textScore + 0.5 * (1 - Math.abs(wPct - sPct))
  }

  const GAP = -1
  const dp = Array.from({ length: sLen + 1 }, (_, i) =>
    Array.from({ length: wLen + 1 }, (_, j) => (i === 0 ? j * GAP : j === 0 ? i * GAP : 0))
  )
  for (let i = 1; i <= sLen; i++) {
    for (let j = 1; j <= wLen; j++) {
      const diag = dp[i-1][j-1] + matchScore(j-1, i-1)
      const up   = dp[i-1][j]   + GAP
      const left = dp[i][j-1]   + GAP
      dp[i][j] = Math.max(diag, up, left)
    }
  }

  const sparse = new Array(sLen).fill(null)
  const anchorSet = new Set()
  let matched = 0
  let i = sLen, j = wLen
  while (i > 0 || j > 0) {
    const score = i > 0 && j > 0 ? matchScore(j-1, i-1) : -Infinity
    if (i > 0 && j > 0 && dp[i][j] === dp[i-1][j-1] + score) {
      if (score > 0) {
        sparse[i-1] = { start: whisperWords[j-1].start, end: whisperWords[j-1].end }
        anchorSet.add(i-1)
        matched++
      }
      i--; j--
    } else if (i > 0 && dp[i][j] === dp[i-1][j] + GAP) {
      i--
    } else {
      j--
    }
  }

  const anchorPct = sLen > 0 ? matched / sLen : 0
  const knownIdxs = [...anchorSet].sort((a, b) => a - b)
  const out = [...sparse]

  // False anchor removal: if consecutive anchors imply impossible reading speed,
  // remove the later anchor. Torah reading is ~1-2 words/sec; anything over 3×
  // the global average or 4 w/s absolute is almost certainly a misalignment.
  {
    const totalDur = whisperWords[whisperWords.length - 1]?.end ?? 1
    const globalSpeed = sLen / totalDur
    const MAX_SPEED = Math.max(5.0, globalSpeed * 3.5)
    let changed = true
    while (changed) {
      changed = false
      for (let ki = 1; ki < knownIdxs.length; ki++) {
        const prev = knownIdxs[ki - 1], curr = knownIdxs[ki]
        const wordSpan = curr - prev
        const timeSpan = out[curr].start - out[prev].start
        if (wordSpan >= 8 && (timeSpan <= 0 || wordSpan / timeSpan > MAX_SPEED)) {
          anchorSet.delete(curr)
          out[curr] = null
          knownIdxs.splice(ki, 1)
          changed = true
          break
        }
      }
    }
  }

  // Between anchors
  for (let ki = 0; ki < knownIdxs.length - 1; ki++) {
    const li = knownIdxs[ki], ri = knownIdxs[ki + 1]
    if (ri - li <= 1) continue
    const gap = ri - li
    const rStart = out[ri].start
    const lRef = (out[li].end < rStart) ? out[li].end : out[li].start
    const span = Math.max(0.05 * gap, rStart - lRef)
    for (let i = li + 1; i < ri; i++) {
      const t = (i - li) / gap
      const start = lRef + t * span
      const dur = Math.max(0.05, span / gap * 0.7)
      out[i] = { start: +start.toFixed(3), end: +(start + dur).toFixed(3) }
    }
  }

  // Leading nulls — spread evenly from t=0 to first anchor (avoids cursor rush at start)
  if (knownIdxs.length && knownIdxs[0] > 0) {
    const count = knownIdxs[0]
    const span = out[knownIdxs[0]].start
    for (let i = 0; i < count; i++) {
      const t0 = (i / count) * span
      const t1 = ((i + 1) / count) * span
      out[i] = { start: +t0.toFixed(3), end: +t1.toFixed(3) }
    }
  }

  // Trailing nulls
  if (knownIdxs.length && knownIdxs[knownIdxs.length - 1] < sLen - 1) {
    const last = out[knownIdxs[knownIdxs.length - 1]]
    for (let i = knownIdxs[knownIdxs.length - 1] + 1; i < sLen; i++) {
      const d = i - knownIdxs[knownIdxs.length - 1]
      out[i] = { start: +(last.end + (d - 1) * 0.15).toFixed(3), end: +(last.end + d * 0.15).toFixed(3) }
    }
  }

  // Fallback
  const totalDuration = whisperWords[whisperWords.length - 1]?.end ?? 1
  for (let i = 0; i < sLen; i++) {
    if (out[i] === null) {
      const t = (i / Math.max(1, sLen - 1)) * totalDuration
      out[i] = { start: +t.toFixed(3), end: +(t + 0.3).toFixed(3) }
    }
  }

  return { aligned: out, anchorPct, anchorSet }
}

// Post-process aligned timestamps using Whisper segments.
// Runs AFTER align() so we know exactly how many Sefaria words fall between each
// whole block — anchors + interpolated — across the real segment time.
// Operates on the aligned Sefaria output (not raw Whisper words), so it knows
// exactly how many Sefaria words map to each Whisper segment.
// For each segment whose aligned words cover < 60% of the segment duration,
// redistributes all those words evenly across the full segment time.
function postRedistribute(aligned, anchorSet, segments) {
  if (!segments?.length) return aligned
  const out = aligned.map(x => ({ ...x }))

  for (const seg of segments) {
    const segDur = seg.end - seg.start
    if (segDur < 0.3) continue

    // Collect aligned-word indices whose start time falls in this segment
    const idxs = []
    for (let i = 0; i < out.length; i++) {
      if (out[i] && out[i].start >= seg.start - 0.1 && out[i].start < seg.end) idxs.push(i)
    }
    if (idxs.length < 2) continue

    const first = out[idxs[0]]
    const last  = out[idxs[idxs.length - 1]]
    const coverage = (last.end - first.start) / segDur

    // Only redistribute when words are compressed into < 60% of the segment
    if (coverage >= 0.6) continue

    console.log(`Sync: post-redistribute ${idxs.length} Sefaria words in segment [${seg.start.toFixed(2)}-${seg.end.toFixed(2)}] (coverage ${Math.round(coverage * 100)}%)`)

    const n = idxs.length
    idxs.forEach((wi, pos) => {
      const t0 = seg.start + (pos / n) * segDur
      const t1 = seg.start + ((pos + 1) / n) * segDur
      out[wi] = { start: +t0.toFixed(3), end: +t1.toFixed(3) }
    })
  }

  return out
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || !supabaseAdmin) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { audioUrl, fileType, aliyahRef, prompt } = req.body ?? {}
  if (!audioUrl) return res.status(400).json({ error: 'audioUrl required' })

  if (!isAllowedAudioUrl(audioUrl)) return res.status(400).json({ error: 'Invalid audio URL' })

  const apiKey = (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '').trim()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY no configurada en el servidor' })

  try {
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

    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) return res.status(500).json({ error: `No se pudo descargar el audio: ${audioRes.status}` })
    const blob = await audioRes.blob()

    sefariaWords = await sefariaPromise
    const whisperPrompt = prompt || sefariaWords.join(' ').slice(0, 900)

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

    if (!sefariaWords.length) {
      console.warn('Sync: no aliyahRef or Sefaria fetch failed, returning raw Whisper output')
      return res.status(200).json({ words: rawWords.map(w => ({ word: w.word, start: w.start, end: w.end })) })
    }

    // Align, then post-redistribute tight blocks over Whisper segment boundaries
    const { aligned, anchorPct, anchorSet } = align(rawWords, sefariaWords)
    const redistributed = postRedistribute(aligned, anchorSet, whisperData.segments)

    // Final guardrail: monotonic starts, min 50ms step
    let lastStart = -0.05
    for (let i = 0; i < redistributed.length; i++) {
      const start = Math.max(redistributed[i].start, lastStart + 0.05)
      const end   = Math.max(redistributed[i].end, start + 0.05)
      redistributed[i] = { start: +start.toFixed(3), end: +end.toFixed(3) }
      lastStart = redistributed[i].start
    }

    // 7. Final pass: redistribute runs of short words over surrounding context gap.
    // After the guardrail, words at ~50ms were originally compressed by Whisper.
    // We spread each such run over the time between the surrounding normal-length words.
    let wi = 0
    while (wi < redistributed.length) {
      if (redistributed[wi].end - redistributed[wi].start >= 0.12) { wi++; continue }
      let wj = wi
      while (wj < redistributed.length && redistributed[wj].end - redistributed[wj].start < 0.12) wj++
      wj--
      const prevEnd   = wi > 0 ? redistributed[wi - 1].end : 0
      const nextStart = wj < redistributed.length - 1 ? redistributed[wj + 1].start : redistributed[wj].end + 2.0
      const count  = wj - wi + 1
      const span   = nextStart - prevEnd
      if (span / count >= 0.15) {
        console.log(`Sync: final-fix ${count} short words [${wi}-${wj}] over [${prevEnd.toFixed(2)}-${nextStart.toFixed(2)}] -> ${(span/count).toFixed(2)}s/word`)
        for (let k = 0; k < count; k++) {
          const t0 = prevEnd + (k / count) * span
          const t1 = prevEnd + ((k + 1) / count) * span
          redistributed[wi + k] = { start: +t0.toFixed(3), end: +t1.toFixed(3) }
        }
      }
      wi = wj + 1
    }

    const needsReview = anchorPct < 0.4
    console.log(`Sync: ${rawWords.length} whisper / ${sefariaWords.length} sefaria / ${Math.round(anchorPct * 100)}% anchors / needs_review=${needsReview}`)

    return res.status(200).json({
      words: redistributed,
      needs_review: needsReview,
      anchor_pct: +anchorPct.toFixed(3),
      format: 'v2',
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
