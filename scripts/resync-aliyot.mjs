/**
 * Re-sync specific aliyot using chunked Whisper for better word coverage.
 * Chunks audio into CHUNK_SEC-second windows with OVERLAP_SEC overlap,
 * merges word timestamps, then runs the full alignment pipeline.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... OPENAI_API_KEY=...
 *   node scripts/resync-aliyot.mjs shemot:3 shemot:5 vaera:0
 *   (aliyah index is 0-based)
 *
 * Or re-sync all aliyot below an anchor threshold:
 *   MIN_ANCHOR=0.25 node scripts/resync-aliyot.mjs --all-below-threshold
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { PARASHOT } from '../src/data/parashot.js'

const SUPABASE_URL  = process.env.SUPABASE_URL || ''
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY || ''
const OPENAI_KEY    = process.env.OPENAI_API_KEY || ''
const AUDIO_DIR     = process.env.AUDIO_DIR || 'C:/Users/moshe/Desktop/audios perashiot'
const CHUNK_SEC     = parseInt(process.env.CHUNK_SEC || '45', 10)
const OVERLAP_SEC   = parseFloat(process.env.OVERLAP_SEC || '3')
const BUCKET        = 'public-audios'
const LABEL         = 'Ashkenazi'
const MIN_ANCHOR    = parseFloat(process.env.MIN_ANCHOR || '0.25')

const FFMPEG = process.env.FFMPEG_PATH ||
  'C:/Users/moshe/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe'

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Folder name → parasha ID ──────────────────────────────────────────────────

const FOLDER_TO_ID = {
  'bereshit':'bereshit','noaj':'noach','lej-leja':'lech-lecha','vaiera':'vayera',
  'jaye-sara':'chayei-sara','toledot':'toldot','vayetze':'vayetzei','vayshlaj':'vayishlach',
  'vayeshev':'vayeshev','miketz':'miketz','vayeji':'vayechi','vayigash':'vayigash',
  'shemot':'shemot','vaera':'vaera','bo':'bo','beshalaj':'beshalach',
  'ytro':'yitro','mishpatim':'mishpatim','teruma':'terumah','tetzave':'tetzaveh',
  'ki-tisa':'ki-tisa','vayakhel':'vayakhel','pekudei':'pekudei',
  'vaykra':'vayikra','tzav':'tzav','shemini':'shemini','tazria':'tazria',
  'metzora':'metzora','ajarei-mot':'achrei-mot','kedoshim':'kedoshim',
  'emor':'emor','behar':'behar','bejukotai':'bechukotai',
  'tazria-metzora':'tazria-metzora','ajarei-mot-kedoshim':'achrei-mot-kedoshim',
  'behar-bejukotai':'behar-bechukotai',
}

const ID_TO_FOLDER = Object.fromEntries(Object.entries(FOLDER_TO_ID).map(([k,v])=>[v,k]))

// ── Alignment logic ───────────────────────────────────────────────────────────

const WHISPER_TO_TEXT = { 'אדוני':'יהוה','ה':'יהוה','לומר':'לאמר','ואומר':'ויאמר','אומר':'ויאמר','ויוא':'וירא' }
const stripHeb = s => s.replace(/[^א-ת]/g, '')
const normalizeWord = w => { const s=stripHeb(w); return WHISPER_TO_TEXT[s] ? stripHeb(WHISPER_TO_TEXT[s]) : s }
function levenshtein(a,b){if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;const prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const curr=[i];for(let j=1;j<=b.length;j++)curr[j]=a[i-1]===b[j-1]?prev[j-1]:1+Math.min(prev[j],curr[j-1],prev[j-1]);prev.splice(0,prev.length,...curr)}return prev[b.length]}
const flattenVerses=arr=>{if(!Array.isArray(arr)||!arr.length)return[];if(typeof arr[0]==='string')return arr;return arr.flat(Infinity).filter(v=>typeof v==='string'&&v.trim())}
const stripHtml=str=>str.replace(/<[^>]+>/g,' ').replace(/[{(\[][פספס][)}\]]/g,'').replace(/\s*\|\s*/g,' ').replace(/־/g,' ').replace(/[\s ]+/g,' ').trim()
const splitWords=text=>text.split(/\s+/).filter(w=>w.length>0)

function align(whisperWords, sefariaWords) {
  const wn=whisperWords.map(w=>normalizeWord(w.word)), sn=sefariaWords.map(w=>stripHeb(w))
  const wLen=wn.length, sLen=sn.length
  function matchScore(wi,si){if(!wn[wi]||!sn[si])return -2;let ts;if(wn[wi]===sn[si]){ts=4}else{const ml=Math.max(wn[wi].length,sn[si].length),sim=1-levenshtein(wn[wi],sn[si])/ml;if(ml<=3)return -3;if(sim>=0.80)ts=2;else if(ml>=4&&sim>=0.75)ts=1;else return -3}return ts+0.5*(1-Math.abs((wLen>1?wi/(wLen-1):0)-(sLen>1?si/(sLen-1):0)))}
  const GAP=-1,dp=Array.from({length:sLen+1},(_,i)=>Array.from({length:wLen+1},(_,j)=>i===0?j*GAP:j===0?i*GAP:0))
  for(let i=1;i<=sLen;i++)for(let j=1;j<=wLen;j++){const d=dp[i-1][j-1]+matchScore(j-1,i-1);dp[i][j]=Math.max(d,dp[i-1][j]+GAP,dp[i][j-1]+GAP)}
  const sparse=new Array(sLen).fill(null),anchorSet=new Set();let matched=0,i=sLen,j=wLen
  while(i>0||j>0){const sc=i>0&&j>0?matchScore(j-1,i-1):-Infinity;if(i>0&&j>0&&dp[i][j]===dp[i-1][j-1]+sc){if(sc>0){sparse[i-1]={start:whisperWords[j-1].start,end:whisperWords[j-1].end};anchorSet.add(i-1);matched++};i--;j--}else if(i>0&&dp[i][j]===dp[i-1][j]+GAP){i--}else{j--}}
  const anchorPct=sLen>0?matched/sLen:0
  const knownIdxs=[...anchorSet].sort((a,b)=>a-b)
  const out=[...sparse]
  // False anchor removal
  {const td=whisperWords[whisperWords.length-1]?.end??1,gs=sLen/td,MS=Math.max(4.0,gs*3);let ch=true;while(ch){ch=false;for(let ki=1;ki<knownIdxs.length;ki++){const p=knownIdxs[ki-1],c=knownIdxs[ki],ts=out[c].start-out[p].start;if(ts<=0||(c-p)/ts>MS){anchorSet.delete(c);out[c]=null;knownIdxs.splice(ki,1);ch=true;break}}}}
  // Between anchors
  for(let ki=0;ki<knownIdxs.length-1;ki++){const li=knownIdxs[ki],ri=knownIdxs[ki+1];if(ri-li<=1)continue;const gap=ri-li,rStart=out[ri].start,lRef=(out[li].end<rStart)?out[li].end:out[li].start,span=Math.max(0.05*gap,rStart-lRef);for(let i=li+1;i<ri;i++){const t=(i-li)/gap,s=lRef+t*span,d=Math.max(0.05,span/gap*0.7);out[i]={start:+s.toFixed(3),end:+(s+d).toFixed(3)}}}
  // Leading nulls
  if(knownIdxs.length&&knownIdxs[0]>0){const count=knownIdxs[0],span=out[knownIdxs[0]].start;for(let i=0;i<count;i++){const t0=(i/count)*span,t1=((i+1)/count)*span;out[i]={start:+t0.toFixed(3),end:+t1.toFixed(3)}}}
  // Trailing nulls
  if(knownIdxs.length&&knownIdxs[knownIdxs.length-1]<sLen-1){const last=out[knownIdxs[knownIdxs.length-1]];for(let i=knownIdxs[knownIdxs.length-1]+1;i<sLen;i++){const d=i-knownIdxs[knownIdxs.length-1];out[i]={start:+(last.end+(d-1)*0.15).toFixed(3),end:+(last.end+d*0.15).toFixed(3)}}}
  // Fallback
  const totalDuration=whisperWords[whisperWords.length-1]?.end??1
  for(let i=0;i<sLen;i++){if(out[i]===null){const t=(i/Math.max(1,sLen-1))*totalDuration;out[i]={start:+t.toFixed(3),end:+(t+0.3).toFixed(3)}}}
  return{aligned:out,anchorPct,anchorSet}
}
function postRedistribute(aligned,anchorSet,segments){if(!segments?.length)return aligned;const out=aligned.map(x=>({...x}));for(const seg of segments){const sd=seg.end-seg.start;if(sd<0.3)continue;const idxs=[];for(let i=0;i<out.length;i++)if(out[i]&&out[i].start>=seg.start-0.1&&out[i].start<seg.end)idxs.push(i);if(idxs.length<2)continue;const cov=(out[idxs[idxs.length-1]].end-out[idxs[0]].start)/sd;if(cov>=0.6)continue;const n=idxs.length;idxs.forEach((wi,pos)=>{out[wi]={start:+(seg.start+(pos/n)*sd).toFixed(3),end:+(seg.start+((pos+1)/n)*sd).toFixed(3)}})};return out}
function finalGuardrail(r){let ls=-0.05;for(let i=0;i<r.length;i++){const s=Math.max(r[i].start,ls+0.05),e=Math.max(r[i].end,s+0.05);r[i]={start:+s.toFixed(3),end:+e.toFixed(3)};ls=r[i].start};let wi=0;while(wi<r.length){if(r[wi].end-r[wi].start>=0.12){wi++;continue};let wj=wi;while(wj<r.length&&r[wj].end-r[wj].start<0.12)wj++;wj--;const pe=wi>0?r[wi-1].end:0,ns=wj<r.length-1?r[wj+1].start:r[wj].end+2.0,cnt=wj-wi+1,sp=ns-pe;if(sp/cnt>=0.15)for(let k=0;k<cnt;k++)r[wi+k]={start:+(pe+(k/cnt)*sp).toFixed(3),end:+(pe+((k+1)/cnt)*sp).toFixed(3)};wi=wj+1};return r}

// ── Sefaria fetch ─────────────────────────────────────────────────────────────

async function fetchSefariaWords(ref) {
  try {
    const r = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?commentary=0&context=0&pad=0&wrapLinks=0`)
    if (!r.ok) return []
    const d = await r.json()
    return flattenVerses(d.he || []).flatMap(v => splitWords(stripHtml(v)))
  } catch { return [] }
}

// ── Chunked Whisper ───────────────────────────────────────────────────────────

async function whisperChunk(buffer, fileName, sefariaWords) {
  const form = new FormData()
  form.append('file', new File([buffer], fileName, { type: 'audio/x-m4a' }))
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

function getAudioDuration(filePath) {
  try {
    const out = execSync(
      `"${FFMPEG}" -i "${filePath}" 2>&1 || true`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    const m = out.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/)
    if (m) return parseInt(m[1])*3600 + parseInt(m[2])*60 + parseFloat(m[3])
  } catch {}
  return null
}

async function transcribeChunked(filePath, sefariaWords, parashaId, aliyahIdx) {
  const duration = getAudioDuration(filePath)
  if (!duration || duration <= CHUNK_SEC + OVERLAP_SEC) {
    // Short audio — single Whisper call
    const buf = fs.readFileSync(filePath)
    return whisperChunk(buf, `${parashaId}_${aliyahIdx}.m4a`, sefariaWords)
  }

  const tmpDir = path.join(os.tmpdir(), `resync_${parashaId}_${aliyahIdx}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  const starts = []
  for (let t = 0; t < duration; t += CHUNK_SEC - OVERLAP_SEC) starts.push(t)

  console.log(`  Chunking ${Math.round(duration)}s audio into ${starts.length} chunks of ${CHUNK_SEC}s`)

  const allWords = []
  const allSegments = []

  for (let ci = 0; ci < starts.length; ci++) {
    const start = starts[ci]
    const chunkPath = path.join(tmpDir, `chunk_${ci}.m4a`)
    execSync(
      `"${FFMPEG}" -y -i "${filePath}" -ss ${start} -t ${CHUNK_SEC} -c copy "${chunkPath}"`,
      { stdio: 'pipe' }
    )
    if (!fs.existsSync(chunkPath) || fs.statSync(chunkPath).size < 1000) {
      console.log(`  chunk ${ci} empty, skipping`)
      continue
    }
    const buf = fs.readFileSync(chunkPath)
    const wd = await whisperChunk(buf, `chunk_${ci}.m4a`, sefariaWords)
    const words = (wd.words || []).map(w => ({ ...w, start: w.start + start, end: w.end + start }))
    const segs  = (wd.segments || []).map(s => ({ ...s, start: s.start + start, end: s.end + start }))
    allWords.push(...words)
    allSegments.push(...segs)
    console.log(`  chunk ${ci}/${starts.length-1} (t=${Math.round(start)}s): ${words.length} words`)
  }

  // Dedup words in overlap zones: keep the one with lower start uncertainty
  // Simple approach: sort by start, remove words with start within 0.3s of the previous
  allWords.sort((a, b) => a.start - b.start)
  const deduped = []
  for (const w of allWords) {
    if (!deduped.length || w.start - deduped[deduped.length-1].start > 0.3) deduped.push(w)
  }

  // Clean up temp files
  fs.rmSync(tmpDir, { recursive: true, force: true })

  return { words: deduped, segments: allSegments }
}

// ── Find audio file for a parasha/aliyah ─────────────────────────────────────

function findAudioFile(parashaId, aliyahIdx) {
  const HEB_ORDINAL = { 'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שביעי':6,'מפטיר':7 }
  const folder = ID_TO_FOLDER[parashaId]
  if (!folder) return null
  const folderPath = path.join(AUDIO_DIR, folder)
  if (!fs.existsSync(folderPath)) return null
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.m4a'))
  for (const file of files) {
    for (const [heb, idx] of Object.entries(HEB_ORDINAL)) {
      if (idx === aliyahIdx && file.includes(heb)) return path.join(folderPath, file)
    }
  }
  return null
}

// ── Process one aliyah ────────────────────────────────────────────────────────

async function processAliyah(parashaId, aliyahIdx) {
  const tag = `[${parashaId} aliyah ${aliyahIdx + 1}]`
  const parasha = PARASHOT.find(p => p.id === parashaId)
  if (!parasha) { console.error(`${tag} No parasha data`); return }
  const aliyah = parasha.aliyot[aliyahIdx]
  if (!aliyah) { console.error(`${tag} No aliyah[${aliyahIdx}]`); return }

  const filePath = findAudioFile(parashaId, aliyahIdx)
  if (!filePath) { console.error(`${tag} Audio file not found in ${AUDIO_DIR}`); return }

  console.log(`\n${tag} ${aliyah.ref}`)
  console.log(`  file: ${path.basename(filePath)}`)

  const sefariaWords = await fetchSefariaWords(aliyah.ref)
  console.log(`  sefaria: ${sefariaWords.length} words`)

  const wd = await transcribeChunked(filePath, sefariaWords, parashaId, aliyahIdx)
  console.log(`  whisper total: ${wd.words?.length ?? 0} words`)

  let wordTimestamps = null, needsReview = false, anchorPct = 0
  const rawWords = wd.words
  if (rawWords?.length && sefariaWords.length) {
    const { aligned, anchorPct: ap, anchorSet } = align(rawWords, sefariaWords)
    const redis = postRedistribute(aligned, anchorSet, wd.segments)
    wordTimestamps = finalGuardrail(redis)
    needsReview = ap < 0.4
    anchorPct = ap
    console.log(`  aligned: ${Math.round(ap * 100)}% anchors  needs_review=${needsReview}`)
  }

  const { error } = await supabase.from('public_audios')
    .update({ word_timestamps: wordTimestamps, needs_review: needsReview, anchor_pct: +anchorPct.toFixed(3) })
    .eq('parasha_id', parashaId).eq('aliyah_idx', aliyahIdx).eq('label', LABEL)

  if (error) { console.error(`${tag} DB error: ${error.message}`); return }
  console.log(`${tag} ✓ done`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  let targets = []

  if (args.includes('--all-below-threshold')) {
    const { data, error } = await supabase
      .from('public_audios')
      .select('parasha_id, aliyah_idx, anchor_pct')
      .eq('label', LABEL)
      .lt('anchor_pct', MIN_ANCHOR)
      .order('anchor_pct')
    if (error) { console.error(error.message); process.exit(1) }
    targets = data.map(r => ({ parashaId: r.parasha_id, aliyahIdx: r.aliyah_idx, anchor: r.anchor_pct }))
    console.log(`\nRe-syncing ${targets.length} aliyot with anchor_pct < ${MIN_ANCHOR}`)
    targets.forEach(t => console.log(`  ${t.parashaId} aliyah ${t.aliyahIdx + 1}  (${Math.round(t.anchor * 100)}%)`))
  } else {
    // Parse "parasha_id:aliyah_idx" args (0-based)
    for (const arg of args) {
      const [parashaId, idxStr] = arg.split(':')
      if (!parashaId || idxStr === undefined) { console.warn(`Skip bad arg: ${arg}`); continue }
      targets.push({ parashaId, aliyahIdx: parseInt(idxStr, 10) })
    }
    if (!targets.length) {
      console.log('Usage: node scripts/resync-aliyot.mjs parasha_id:aliyah_idx ...')
      console.log('       MIN_ANCHOR=0.25 node scripts/resync-aliyot.mjs --all-below-threshold')
      process.exit(0)
    }
  }

  console.log(`\nStarting re-sync of ${targets.length} aliyot\n`)
  for (const t of targets) {
    await processAliyah(t.parashaId, t.aliyahIdx)
  }
  console.log('\n=== Done ===')
}

main().catch(e => { console.error(e); process.exit(1) })
