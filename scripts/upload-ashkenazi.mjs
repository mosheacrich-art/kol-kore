/**
 * Batch upload Ashkenazi Torah readings to Supabase + generate Whisper sync.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   OPENAI_API_KEY=sk-... \
 *   AUDIO_DIR="C:/Users/moshe/Desktop/audios perashiot" \
 *   node scripts/upload-ashkenazi.mjs
 *
 * Options (env vars):
 *   CONCURRENCY=3          parallel Whisper calls (default 3)
 *   SKIP_UPLOAD=1          skip re-uploading files already in storage
 *   DRY_RUN=1              print plan, don't call Whisper or write to DB
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { PARASHOT } from '../src/data/parashot.js'

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL     = process.env.SUPABASE_URL     || ''
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_KEY || '' // service role key
const OPENAI_KEY       = process.env.OPENAI_API_KEY   || ''
const AUDIO_DIR        = process.env.AUDIO_DIR        || 'C:/Users/moshe/Desktop/audios perashiot'
const CONCURRENCY      = parseInt(process.env.CONCURRENCY || '3', 10)
const DRY_RUN          = !!process.env.DRY_RUN
const SKIP_UPLOAD      = !!process.env.SKIP_UPLOAD
const BUCKET           = 'public-audios'
const LABEL            = 'Ashkenazi'

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1) }
if (!OPENAI_KEY && !DRY_RUN)        { console.error('Missing OPENAI_API_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Folder name → parasha ID mapping ─────────────────────────────────────────

const FOLDER_TO_ID = {
  'bereshit':            'bereshit',
  'noaj':                'noach',
  'lej-leja':            'lech-lecha',
  'vaiera':              'vayera',
  'jaye-sara':           'chayei-sara',
  'toledot':             'toldot',
  'vayetze':             'vayetzei',
  'vayshlaj':            'vayishlach',
  'vayeshev':            'vayeshev',
  'miketz':              'miketz',
  'vayeji':              'vayechi',
  'shemot':              'shemot',
  'vaera':               'vaera',
  'bo':                  'bo',
  'beshalaj':            'beshalach',
  'ytro':                'yitro',
  'mishpatim':           'mishpatim',
  'teruma':              'terumah',
  'tetzave':             'tetzaveh',
  'ki-tisa':             'ki-tisa',
  'vayakhel':            'vayakhel',
  'vaykra':              'vayikra',
  'tzav':                'tzav',
  'shemini':             'shemini',
  'tazria':              'tazria',
  'metzora':             'metzora',
  'ajarei-mot':          'achrei-mot',
  'kedoshim':            'kedoshim',
  'emor':                'emor',
  'behar':               'behar',
  'tazria-metzora':      'tazria-metzora',
  'ajarei-mot-kedoshim': 'achrei-mot-kedoshim',
  'behar-bejukotai':     'behar-bechukotai',
}

// ── Whisper / alignment logic (ported from api/generate-sync.js) ──────────────

const WHISPER_TO_TEXT = { 'אדוני': 'יהוה', 'ה': 'יהוה', 'לומר': 'לאמר', 'ואומר': 'ויאמר', 'אומר': 'ויאמר', 'ויוא': 'וירא' }
function stripHeb(s) { return s.replace(/[^א-ת]/g, '') }
function normalizeWord(w) {
  const s = stripHeb(w)
  return WHISPER_TO_TEXT[s] ? stripHeb(WHISPER_TO_TEXT[s]) : s
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
  return str.replace(/<[^>]+>/g, ' ').replace(/[{(\[][פספס][)}\]]/g, '')
    .replace(/\s*\|\s*/g, ' ').replace(/־/g, ' ').replace(/[\s ]+/g, ' ').trim()
}
function splitWords(text) { return text.split(/\s+/).filter(w => w.length > 0) }

function align(whisperWords, sefariaWords) {
  const wn = whisperWords.map(w => normalizeWord(w.word))
  const sn = sefariaWords.map(w => stripHeb(w))
  const wLen = wn.length, sLen = sn.length
  function matchScore(wi, si) {
    if (!wn[wi] || !sn[si]) return -2
    let textScore
    if (wn[wi] === sn[si]) { textScore = 4 }
    else {
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
    Array.from({ length: wLen + 1 }, (_, j) => (i === 0 ? j * GAP : j === 0 ? i * GAP : 0)))
  for (let i = 1; i <= sLen; i++)
    for (let j = 1; j <= wLen; j++) {
      const diag = dp[i-1][j-1] + matchScore(j-1, i-1)
      dp[i][j] = Math.max(diag, dp[i-1][j] + GAP, dp[i][j-1] + GAP)
    }
  const sparse = new Array(sLen).fill(null)
  const anchorSet = new Set()
  let matched = 0, i = sLen, j = wLen
  while (i > 0 || j > 0) {
    const score = i > 0 && j > 0 ? matchScore(j-1, i-1) : -Infinity
    if (i > 0 && j > 0 && dp[i][j] === dp[i-1][j-1] + score) {
      if (score > 0) { sparse[i-1] = { start: whisperWords[j-1].start, end: whisperWords[j-1].end }; anchorSet.add(i-1); matched++ }
      i--; j--
    } else if (i > 0 && dp[i][j] === dp[i-1][j] + GAP) { i-- } else { j-- }
  }
  const anchorPct = sLen > 0 ? matched / sLen : 0
  const knownIdxs = [...anchorSet].sort((a, b) => a - b)
  const out = [...sparse]
  {
    const totalDur = whisperWords[whisperWords.length - 1]?.end ?? 1
    const globalSpeed = sLen / totalDur
    const MAX_SPEED = Math.max(4.0, globalSpeed * 3)
    let changed = true
    while (changed) {
      changed = false
      for (let ki = 1; ki < knownIdxs.length; ki++) {
        const prev = knownIdxs[ki - 1], curr = knownIdxs[ki]
        const timeSpan = out[curr].start - out[prev].start
        if (timeSpan <= 0 || (curr - prev) / timeSpan > MAX_SPEED) {
          anchorSet.delete(curr); out[curr] = null; knownIdxs.splice(ki, 1); changed = true; break
        }
      }
    }
  }
  for (let ki = 0; ki < knownIdxs.length - 1; ki++) {
    const li = knownIdxs[ki], ri = knownIdxs[ki + 1]
    if (ri - li <= 1) continue
    const gap = ri - li, rStart = out[ri].start
    const lRef = (out[li].end < rStart) ? out[li].end : out[li].start
    const span = Math.max(0.05 * gap, rStart - lRef)
    for (let i = li + 1; i < ri; i++) {
      const t = (i - li) / gap, start = lRef + t * span, dur = Math.max(0.05, span / gap * 0.7)
      out[i] = { start: +start.toFixed(3), end: +(start + dur).toFixed(3) }
    }
  }
  if (knownIdxs.length && knownIdxs[0] > 0) {
    const count = knownIdxs[0]
    const span = out[knownIdxs[0]].start
    for (let i = 0; i < count; i++) {
      const t0 = (i / count) * span
      const t1 = ((i + 1) / count) * span
      out[i] = { start: +t0.toFixed(3), end: +t1.toFixed(3) }
    }
  }
  if (knownIdxs.length && knownIdxs[knownIdxs.length - 1] < sLen - 1) {
    const last = out[knownIdxs[knownIdxs.length - 1]]
    for (let i = knownIdxs[knownIdxs.length - 1] + 1; i < sLen; i++) {
      const d = i - knownIdxs[knownIdxs.length - 1]
      out[i] = { start: +(last.end + (d - 1) * 0.15).toFixed(3), end: +(last.end + d * 0.15).toFixed(3) }
    }
  }
  const totalDuration = whisperWords[whisperWords.length - 1]?.end ?? 1
  for (let i = 0; i < sLen; i++) {
    if (out[i] === null) {
      const t = (i / Math.max(1, sLen - 1)) * totalDuration
      out[i] = { start: +t.toFixed(3), end: +(t + 0.3).toFixed(3) }
    }
  }
  return { aligned: out, anchorPct, anchorSet }
}

function postRedistribute(aligned, anchorSet, segments) {
  if (!segments?.length) return aligned
  const out = aligned.map(x => ({ ...x }))
  for (const seg of segments) {
    const segDur = seg.end - seg.start
    if (segDur < 0.3) continue
    const idxs = []
    for (let i = 0; i < out.length; i++)
      if (out[i] && out[i].start >= seg.start - 0.1 && out[i].start < seg.end) idxs.push(i)
    if (idxs.length < 2) continue
    const coverage = (out[idxs[idxs.length-1]].end - out[idxs[0]].start) / segDur
    if (coverage >= 0.6) continue
    const n = idxs.length
    idxs.forEach((wi, pos) => {
      out[wi] = { start: +(seg.start + (pos/n)*segDur).toFixed(3), end: +(seg.start + ((pos+1)/n)*segDur).toFixed(3) }
    })
  }
  return out
}

function finalGuardrail(redistributed) {
  let lastStart = -0.05
  for (let i = 0; i < redistributed.length; i++) {
    const start = Math.max(redistributed[i].start, lastStart + 0.05)
    const end   = Math.max(redistributed[i].end, start + 0.05)
    redistributed[i] = { start: +start.toFixed(3), end: +end.toFixed(3) }
    lastStart = redistributed[i].start
  }
  let wi = 0
  while (wi < redistributed.length) {
    if (redistributed[wi].end - redistributed[wi].start >= 0.12) { wi++; continue }
    let wj = wi
    while (wj < redistributed.length && redistributed[wj].end - redistributed[wj].start < 0.12) wj++
    wj--
    const prevEnd   = wi > 0 ? redistributed[wi - 1].end : 0
    const nextStart = wj < redistributed.length - 1 ? redistributed[wj + 1].start : redistributed[wj].end + 2.0
    const count = wj - wi + 1, span = nextStart - prevEnd
    if (span / count >= 0.15)
      for (let k = 0; k < count; k++)
        redistributed[wi + k] = { start: +(prevEnd + (k/count)*span).toFixed(3), end: +(prevEnd + ((k+1)/count)*span).toFixed(3) }
    wi = wj + 1
  }
  return redistributed
}

// ── Sefaria fetch ─────────────────────────────────────────────────────────────

async function fetchSefariaWords(aliyahRef) {
  try {
    const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(aliyahRef)}?commentary=0&context=0&pad=0&wrapLinks=0`
    const r = await fetch(url)
    if (!r.ok) return []
    const data = await r.json()
    return flattenVerses(data.he || []).flatMap(v => splitWords(stripHtml(v)))
  } catch { return [] }
}

// ── Whisper call ──────────────────────────────────────────────────────────────

async function whisperTranscribe(fileBuffer, fileName, sefariaWords) {
  const form = new FormData()
  form.append('file', new File([fileBuffer], fileName, { type: 'audio/x-m4a' }))
  form.append('model', 'whisper-1')
  form.append('language', 'he')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'word')
  form.append('timestamp_granularities[]', 'segment')
  if (sefariaWords.length) form.append('prompt', sefariaWords.join(' ').slice(0, 900))

  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${OPENAI_KEY}` }, body: form,
  })
  if (!r.ok) throw new Error(`Whisper ${r.status}: ${await r.text()}`)
  return r.json()
}

// ── Build job list ─────────────────────────────────────────────────────────────

function buildJobs() {
  const jobs = []
  const folders = fs.readdirSync(AUDIO_DIR).filter(f =>
    fs.statSync(path.join(AUDIO_DIR, f)).isDirectory())

  for (const folder of folders) {
    const parashaId = FOLDER_TO_ID[folder]
    if (!parashaId) { console.warn(`SKIP unknown folder: ${folder}`); continue }
    const parasha = PARASHOT.find(p => p.id === parashaId)
    if (!parasha) { console.warn(`SKIP no parasha data for: ${parashaId}`); continue }

    const folderPath = path.join(AUDIO_DIR, folder)
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.m4a'))
      .sort()

    const seenAliyot = new Set()
    for (const file of files) {
      // Parse aliyah index from Hebrew ordinal in filename (more reliable than file number)
      const HEB_ORDINAL = { 'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שביעי':6,'מפטיר':7 }
      let aliyahIdx = null
      for (const [heb, idx] of Object.entries(HEB_ORDINAL)) { if (file.includes(heb)) { aliyahIdx = idx; break } }
      if (aliyahIdx === null) { console.warn(`SKIP cannot parse ordinal: ${file}`); continue }
      if (seenAliyot.has(aliyahIdx)) { console.warn(`SKIP duplicate aliyah ${aliyahIdx + 1}: ${file}`); continue }
      seenAliyot.add(aliyahIdx)
      const aliyah = parasha.aliyot[aliyahIdx]
      if (!aliyah) { console.warn(`SKIP no aliyah[${aliyahIdx}] in ${parashaId}`); continue }

      jobs.push({
        folder, file, parashaId, aliyahIdx,
        aliyahRef: aliyah.ref,
        filePath: path.join(folderPath, file),
        storagePath: `ashkenazi/${parashaId}/${aliyahIdx}.m4a`,
      })
    }
  }
  return jobs
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.find(b => b.name === BUCKET)) return
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
  if (error) throw new Error(`Create bucket: ${error.message}`)
  console.log(`Created bucket: ${BUCKET}`)
}

async function uploadFile(job) {
  if (SKIP_UPLOAD) {
    // Check if already in storage
    const { data } = await supabase.storage.from(BUCKET).list(`ashkenazi/${job.parashaId}`)
    if (data?.find(f => f.name === `${job.aliyahIdx}.m4a`)) {
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(job.storagePath)
      return publicUrl
    }
  }
  const buffer = fs.readFileSync(job.filePath)
  const { error } = await supabase.storage.from(BUCKET).upload(job.storagePath, buffer, {
    contentType: 'audio/x-m4a', upsert: true,
  })
  if (error) throw new Error(`Upload ${job.storagePath}: ${error.message}`)
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(job.storagePath)
  return publicUrl
}

async function getExistingRows() {
  const { data, error } = await supabase.from('public_audios').select('parasha_id, aliyah_idx').eq('label', LABEL)
  if (error) {
    console.warn('Could not fetch existing rows (table may not exist yet):', error.message)
    return new Set()
  }
  return new Set(data.map(r => `${r.parasha_id}:${r.aliyah_idx}`))
}

// ── Process one job ───────────────────────────────────────────────────────────

async function processJob(job, existing) {
  const key = `${job.parashaId}:${job.aliyahIdx}`
  const tag = `[${job.parashaId} aliyah ${job.aliyahIdx + 1}]`

  if (existing.has(key)) {
    console.log(`${tag} already done, skipping`)
    return { status: 'skipped' }
  }

  console.log(`${tag} start — ${job.file}`)

  if (DRY_RUN) {
    console.log(`${tag} DRY RUN: would upload ${job.storagePath} + Whisper ${job.aliyahRef}`)
    return { status: 'dry_run' }
  }

  // 1. Upload to storage
  let publicUrl
  try {
    publicUrl = await uploadFile(job)
    console.log(`${tag} uploaded → ${publicUrl}`)
  } catch (e) {
    console.error(`${tag} upload failed: ${e.message}`)
    return { status: 'error', stage: 'upload', error: e.message }
  }

  // 2. Fetch Sefaria text
  const sefariaWords = await fetchSefariaWords(job.aliyahRef)
  console.log(`${tag} sefaria ${sefariaWords.length} words`)

  // 3. Whisper transcription
  let whisperData
  try {
    const buffer = fs.readFileSync(job.filePath)
    whisperData = await whisperTranscribe(buffer, `${job.parashaId}_${job.aliyahIdx}.m4a`, sefariaWords)
    console.log(`${tag} whisper ${whisperData.words?.length ?? 0} words`)
  } catch (e) {
    console.error(`${tag} whisper failed: ${e.message}`)
    return { status: 'error', stage: 'whisper', error: e.message }
  }

  // 4. Align
  let wordTimestamps = null, needsReview = false, anchorPct = 0
  const rawWords = whisperData.words
  if (rawWords?.length && sefariaWords.length) {
    const { aligned, anchorPct: ap, anchorSet } = align(rawWords, sefariaWords)
    const redistributed = postRedistribute(aligned, anchorSet, whisperData.segments)
    wordTimestamps = finalGuardrail(redistributed)
    needsReview = ap < 0.4
    anchorPct = ap
    console.log(`${tag} aligned ${Math.round(ap * 100)}% anchors needs_review=${needsReview}`)
  }

  // 5. Upsert into public_audios
  const { error } = await supabase.from('public_audios').upsert({
    parasha_id:       job.parashaId,
    aliyah_idx:       job.aliyahIdx,
    label:            LABEL,
    public_url:       publicUrl,
    file_type:        'audio/x-m4a',
    word_timestamps:  wordTimestamps,
    needs_review:     needsReview,
    anchor_pct:       +anchorPct.toFixed(3),
  }, { onConflict: 'parasha_id,aliyah_idx,label' })

  if (error) {
    console.error(`${tag} DB upsert failed: ${error.message}`)
    return { status: 'error', stage: 'db', error: error.message }
  }

  console.log(`${tag} ✓ done`)
  return { status: 'done' }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Ashkenazi audio batch upload ===`)
  console.log(`Audio dir:   ${AUDIO_DIR}`)
  console.log(`Bucket:      ${BUCKET}`)
  console.log(`Concurrency: ${CONCURRENCY}`)
  console.log(`Dry run:     ${DRY_RUN}\n`)

  const jobs = buildJobs()
  console.log(`Total jobs: ${jobs.length}\n`)
  if (!jobs.length) { console.log('Nothing to do.'); return }

  if (!DRY_RUN) {
    await ensureBucket()
  }

  const existing = await getExistingRows()
  console.log(`Already in DB: ${existing.size}\n`)

  // Run with limited concurrency
  const results = { done: 0, skipped: 0, error: 0, dry_run: 0 }
  const queue = [...jobs]

  async function worker() {
    while (queue.length) {
      const job = queue.shift()
      const result = await processJob(job, existing)
      results[result.status] = (results[result.status] || 0) + 1
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  console.log(`\n=== Done ===`)
  console.log(`Processed: ${results.done}  Skipped: ${results.skipped}  Errors: ${results.error}  DryRun: ${results.dry_run}`)
}

main().catch(e => { console.error(e); process.exit(1) })
