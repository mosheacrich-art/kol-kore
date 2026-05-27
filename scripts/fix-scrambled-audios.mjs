/**
 * Re-uploads scrambled parasha audios using Hebrew ordinal names instead of file numbers.
 *
 * Usage:
 *   node scripts/fix-scrambled-audios.mjs
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { PARASHOT } from '../src/data/parashot.js'

const SUPABASE_URL  = process.env.SUPABASE_URL     || ''
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY || ''
const OPENAI_KEY    = process.env.OPENAI_API_KEY   || ''
const AUDIO_DIR     = process.env.AUDIO_DIR        || 'C:/Users/moshe/Desktop/audios perashiot'
const BUCKET        = 'public-audios'
const LABEL         = 'Ashkenazi'
const CONCURRENCY   = 3

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Hebrew ordinal → aliyah index
const HEB_ORDINAL = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3,
  'חמישי': 4, 'שישי': 5, 'שביעי': 6, 'מפטיר': 7,
}

// Folders that were scrambled and need re-processing
const FIX_FOLDERS = {
  'kedoshim': 'kedoshim',
  'emor':     'emor',
  'vayakhel': 'vayakhel',
}

// ── Alignment logic (same as upload-ashkenazi.mjs) ────────────────────────────

const WHISPER_TO_TEXT = { 'אדוני': 'יהוה', 'ה': 'יהוה', 'לומר': 'לאמר', 'ואומר': 'ויאמר' }
const stripHeb = s => s.replace(/[^א-ת]/g, '')
const normalizeWord = w => { const s = stripHeb(w); return WHISPER_TO_TEXT[s] ? stripHeb(WHISPER_TO_TEXT[s]) : s }
function levenshtein(a, b) {
  if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++)
      curr[j] = a[i-1]===b[j-1] ? prev[j-1] : 1+Math.min(prev[j],curr[j-1],prev[j-1])
    prev.splice(0, prev.length, ...curr)
  }
  return prev[b.length]
}
const flattenVerses = arr => { if (!Array.isArray(arr)||!arr.length) return []; if (typeof arr[0]==='string') return arr; return arr.flat(Infinity).filter(v=>typeof v==='string'&&v.trim()) }
const stripHtml = str => str.replace(/<[^>]+>/g,' ').replace(/[{(\[][פספס][)}\]]/g,'').replace(/\s*\|\s*/g,' ').replace(/־/g,' ').replace(/[\s ]+/g,' ').trim()
const splitWords = text => text.split(/\s+/).filter(w=>w.length>0)

function align(whisperWords, sefariaWords) {
  const wn=whisperWords.map(w=>normalizeWord(w.word)), sn=sefariaWords.map(w=>stripHeb(w))
  const wLen=wn.length, sLen=sn.length
  function matchScore(wi,si) {
    if(!wn[wi]||!sn[si]) return -2
    let ts; if(wn[wi]===sn[si]){ts=4}else{const ml=Math.max(wn[wi].length,sn[si].length),sim=1-levenshtein(wn[wi],sn[si])/ml;if(ml<=3)return -3;if(sim>=0.80)ts=2;else if(ml>=4&&sim>=0.75)ts=1;else return -3}
    return ts+0.5*(1-Math.abs((wLen>1?wi/(wLen-1):0)-(sLen>1?si/(sLen-1):0)))
  }
  const GAP=-1, dp=Array.from({length:sLen+1},(_,i)=>Array.from({length:wLen+1},(_,j)=>i===0?j*GAP:j===0?i*GAP:0))
  for(let i=1;i<=sLen;i++) for(let j=1;j<=wLen;j++){const d=dp[i-1][j-1]+matchScore(j-1,i-1);dp[i][j]=Math.max(d,dp[i-1][j]+GAP,dp[i][j-1]+GAP)}
  const sparse=new Array(sLen).fill(null),anchorSet=new Set();let matched=0,i=sLen,j=wLen
  while(i>0||j>0){const sc=i>0&&j>0?matchScore(j-1,i-1):-Infinity;if(i>0&&j>0&&dp[i][j]===dp[i-1][j-1]+sc){if(sc>0){sparse[i-1]={start:whisperWords[j-1].start,end:whisperWords[j-1].end};anchorSet.add(i-1);matched++};i--;j--}else if(i>0&&dp[i][j]===dp[i-1][j]+GAP){i--}else{j--}}
  const ap=sLen>0?matched/sLen:0, ki=[...anchorSet].sort((a,b)=>a-b), out=[...sparse]
  {const td=whisperWords[whisperWords.length-1]?.end??1,gs=sLen/td,MS=Math.max(5.0,gs*3.5);let ch=true;while(ch){ch=false;for(let x=1;x<ki.length;x++){const p=ki[x-1],c=ki[x],ws=c-p,ts=out[c].start-out[p].start;if(ws>=8&&(ts<=0||ws/ts>MS)){anchorSet.delete(c);out[c]=null;ki.splice(x,1);ch=true;break}}}}
  for(let x=0;x<ki.length-1;x++){const li=ki[x],ri=ki[x+1];if(ri-li<=1)continue;const gap=ri-li,rs=out[ri].start,lr=(out[li].end<rs)?out[li].end:out[li].start,sp=Math.max(0.05*gap,rs-lr);for(let i=li+1;i<ri;i++){const t=(i-li)/gap,s=lr+t*sp,d=Math.max(0.05,sp/gap*0.7);out[i]={start:+s.toFixed(3),end:+(s+d).toFixed(3)}}}
  if(ki.length&&ki[0]>0){const f=out[ki[0]];for(let i=ki[0]-1;i>=0;i--){const d=ki[0]-i;out[i]={start:+(f.start-d*0.15).toFixed(3),end:+(f.start-(d-1)*0.15).toFixed(3)}}}
  if(ki.length&&ki[ki.length-1]<sLen-1){const l=out[ki[ki.length-1]];for(let i=ki[ki.length-1]+1;i<sLen;i++){const d=i-ki[ki.length-1];out[i]={start:+(l.end+(d-1)*0.15).toFixed(3),end:+(l.end+d*0.15).toFixed(3)}}}
  const td=whisperWords[whisperWords.length-1]?.end??1
  for(let i=0;i<sLen;i++){if(out[i]===null){const t=(i/Math.max(1,sLen-1))*td;out[i]={start:+t.toFixed(3),end:+(t+0.3).toFixed(3)}}}
  return{aligned:out,anchorPct:ap,anchorSet}
}
function postRedistribute(aligned,anchorSet,segments){
  if(!segments?.length) return aligned; const out=aligned.map(x=>({...x}))
  for(const seg of segments){const sd=seg.end-seg.start;if(sd<0.3)continue;const idxs=[];for(let i=0;i<out.length;i++)if(out[i]&&out[i].start>=seg.start-0.1&&out[i].start<seg.end)idxs.push(i);if(idxs.length<2)continue;const cov=(out[idxs[idxs.length-1]].end-out[idxs[0]].start)/sd;if(cov>=0.6)continue;const n=idxs.length;idxs.forEach((wi,pos)=>{out[wi]={start:+(seg.start+(pos/n)*sd).toFixed(3),end:+(seg.start+((pos+1)/n)*sd).toFixed(3)}})};return out
}
function finalGuardrail(r){
  let ls=-0.05;for(let i=0;i<r.length;i++){const s=Math.max(r[i].start,ls+0.05),e=Math.max(r[i].end,s+0.05);r[i]={start:+s.toFixed(3),end:+e.toFixed(3)};ls=r[i].start}
  let wi=0;while(wi<r.length){if(r[wi].end-r[wi].start>=0.12){wi++;continue};let wj=wi;while(wj<r.length&&r[wj].end-r[wj].start<0.12)wj++;wj--;const pe=wi>0?r[wi-1].end:0,ns=wj<r.length-1?r[wj+1].start:r[wj].end+2.0,cnt=wj-wi+1,sp=ns-pe;if(sp/cnt>=0.15)for(let k=0;k<cnt;k++)r[wi+k]={start:+(pe+(k/cnt)*sp).toFixed(3),end:+(pe+((k+1)/cnt)*sp).toFixed(3)};wi=wj+1};return r
}
async function fetchSefariaWords(ref){
  try{const r=await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?commentary=0&context=0&pad=0&wrapLinks=0`);if(!r.ok)return[];const d=await r.json();return flattenVerses(d.he||[]).flatMap(v=>splitWords(stripHtml(v))).filter(w=>/[א-ת]/.test(w))}catch{return[]}
}
async function whisper(buffer, fileName, sefariaWords){
  const form=new FormData()
  form.append('file',new File([buffer],fileName,{type:'audio/x-m4a'}))
  form.append('model','whisper-1');form.append('language','he');form.append('response_format','verbose_json')
  form.append('timestamp_granularities[]','word');form.append('timestamp_granularities[]','segment')
  if(sefariaWords.length) form.append('prompt',sefariaWords.join(' ').slice(0,900))
  const r=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${OPENAI_KEY}`},body:form})
  if(!r.ok) throw new Error(`Whisper ${r.status}: ${await r.text()}`)
  return r.json()
}

// ── Parse Hebrew ordinal from filename ───────────────────────────────────────

function parseAliyahIdx(filename) {
  for (const [heb, idx] of Object.entries(HEB_ORDINAL)) {
    if (filename.includes(heb)) return idx
  }
  return null
}

// ── Build corrected jobs ──────────────────────────────────────────────────────

function buildJobs() {
  const jobs = []
  for (const [folder, parashaId] of Object.entries(FIX_FOLDERS)) {
    const folderPath = path.join(AUDIO_DIR, folder)
    if (!fs.existsSync(folderPath)) { console.warn(`Folder not found: ${folder}`); continue }

    const parasha = PARASHOT.find(p => p.id === parashaId)
    if (!parasha) { console.warn(`No parasha data: ${parashaId}`); continue }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.m4a')).sort()
    const seen = new Set() // skip duplicate ordinals

    for (const file of files) {
      const aliyahIdx = parseAliyahIdx(file)
      if (aliyahIdx === null) { console.warn(`Cannot parse ordinal: ${file}`); continue }
      if (aliyahIdx === 7) { console.log(`SKIP maftir: ${file}`); continue }
      if (seen.has(aliyahIdx)) { console.log(`SKIP duplicate ${file} (aliyah ${aliyahIdx + 1} already mapped)`); continue }
      seen.add(aliyahIdx)

      const aliyah = parasha.aliyot[aliyahIdx]
      if (!aliyah) { console.warn(`No aliyah[${aliyahIdx}] in ${parashaId}`); continue }

      jobs.push({ folder, file, parashaId, aliyahIdx, aliyahRef: aliyah.ref, filePath: path.join(folderPath, file), storagePath: `ashkenazi/${parashaId}/${aliyahIdx}.m4a` })
    }
  }
  return jobs
}

// ── Process one job ───────────────────────────────────────────────────────────

async function processJob(job) {
  const tag = `[${job.parashaId} aliyah ${job.aliyahIdx + 1}]`
  console.log(`${tag} start — ${job.file}`)

  // Upload (overwrite)
  let publicUrl
  try {
    const buffer = fs.readFileSync(job.filePath)
    const { error } = await supabase.storage.from(BUCKET).upload(job.storagePath, buffer, { contentType: 'audio/x-m4a', upsert: true })
    if (error) throw new Error(error.message)
    const { data: { publicUrl: u } } = supabase.storage.from(BUCKET).getPublicUrl(job.storagePath)
    publicUrl = u
    console.log(`${tag} uploaded`)
  } catch (e) { console.error(`${tag} upload error: ${e.message}`); return }

  const sefariaWords = await fetchSefariaWords(job.aliyahRef)

  let wordTimestamps = null, needsReview = false, anchorPct = 0
  try {
    const buffer = fs.readFileSync(job.filePath)
    const wd = await whisper(buffer, `${job.parashaId}_${job.aliyahIdx}.m4a`, sefariaWords)
    const raw = wd.words
    if (raw?.length && sefariaWords.length) {
      const { aligned, anchorPct: ap, anchorSet } = align(raw, sefariaWords)
      const redis = postRedistribute(aligned, anchorSet, wd.segments)
      wordTimestamps = finalGuardrail(redis)
      needsReview = ap < 0.4; anchorPct = ap
      console.log(`${tag} aligned ${Math.round(ap * 100)}% anchors needs_review=${needsReview}`)
    }
  } catch (e) { console.error(`${tag} whisper error: ${e.message}`); return }

  const { error } = await supabase.from('public_audios').upsert({
    parasha_id: job.parashaId, aliyah_idx: job.aliyahIdx, label: LABEL,
    public_url: publicUrl, file_type: 'audio/x-m4a',
    word_timestamps: wordTimestamps, needs_review: needsReview,
    anchor_pct: +anchorPct.toFixed(3),
  }, { onConflict: 'parasha_id,aliyah_idx,label' })

  if (error) { console.error(`${tag} DB error: ${error.message}`); return }
  console.log(`${tag} ✓ done`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const jobs = buildJobs()
  console.log(`\nFix jobs: ${jobs.length}\n`)
  jobs.forEach(j => console.log(`  ${j.parashaId} aliyah ${j.aliyahIdx + 1} ← ${j.file}`))
  console.log()

  const queue = [...jobs]
  async function worker() { while (queue.length) { const job = queue.shift(); await processJob(job) } }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  console.log('\n=== Fix complete ===')
}

main().catch(e => { console.error(e); process.exit(1) })
