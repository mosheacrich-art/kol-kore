import { useState, useRef } from 'react'
import WordRangePicker from './WordRangePicker'
import { useAudio } from '../context/AudioContext'
import { useLang } from '../context/LangContext'

const LEAD = 0.25 // seconds of breath before the first word

function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

// Distribute `duration` seconds over words[start..end] by letter count.
// Everything outside the range stays null (reader interpolates gaps).
function buildTimestamps(allWords, start, end, duration) {
  const out = new Array(allWords.length).fill(null)
  const span = Math.max(0.1, duration - LEAD)
  const weights = []
  let total = 0
  for (let i = start; i <= end; i++) {
    const w = (allWords[i].match(/[א-ת]/g) || []).length + 1
    weights.push(w); total += w
  }
  let t = LEAD
  for (let i = start; i <= end; i++) {
    const d = (weights[i - start] / total) * span
    out[i] = { start: +t.toFixed(3), end: +(t + d).toFixed(3) }
    t += d
  }
  return out
}

export default function RangeRecorder({ parashaId, aliyahIdx, aliyahRef, heText, onSaved }) {
  const { upload } = useAudio()
  const { t } = useLang()
  const [picking, setPicking] = useState(false)
  const [range, setRange] = useState(null)       // { s, e, words }
  const [state, setState] = useState('idle')     // idle | recording | saving
  const [secs, setSecs] = useState(0)
  const [err, setErr] = useState('')
  const mrRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const t0Ref = useRef(0)
  const cancelRef = useRef(false)

  const reset = () => { setRange(null); setState('idle'); setSecs(0) }

  const start = async () => {
    setErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(m => MediaRecorder.isTypeSupported(m)) || ''
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      mrRef.current = mr
      chunksRef.current = []
      cancelRef.current = false
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(tr => tr.stop())
        clearInterval(timerRef.current)
        if (cancelRef.current) { reset(); return }
        const duration = (Date.now() - t0Ref.current) / 1000
        const type = mr.mimeType || 'audio/webm'
        const ext = type.split('/')[1]?.split(';')[0] || 'webm'
        const file = new File([new Blob(chunksRef.current, { type })], `tramo.${ext}`, { type })
        setState('saving')
        const ts = buildTimestamps(range.words, range.s, range.e, duration)
        const ok = await upload(parashaId, aliyahIdx, file, aliyahRef, ts)
        if (ok === false) setErr(t('x_save_audio_err'))
        else onSaved?.()
        reset()
      }
      t0Ref.current = Date.now()
      mr.start()
      setState('recording')
      setSecs(0)
      timerRef.current = setInterval(() => setSecs(s => s + 1), 1000)
    } catch (e) {
      setErr(e.name === 'NotAllowedError' ? t('x_mic_denied') : (e.message || t('x_mic_error')))
    }
  }

  const stop = () => mrRef.current?.stop()
  const cancel = () => { cancelRef.current = true; mrRef.current?.stop() }

  return (
    <>
      <button onClick={() => setPicking(true)} title={t('x_rec_range_title')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
        style={{ background: '#f6f7f9', color: '#1b2f6b', border: '1px solid rgba(27,47,107,0.3)' }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4M5.5 9.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {t('x_rec_range')}
      </button>
      {err && <span className="text-[10px]" style={{ color: '#b42318' }}>{err}</span>}

      {picking && (
        <WordRangePicker aliyahRef={aliyahRef} heText={heText} onClose={() => setPicking(false)}
          onConfirm={(s, e, words) => { setRange({ s, e, words }); setPicking(false) }} />
      )}

      {range && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-5"
          style={{ background: 'rgba(17,24,39,0.92)' }}>
          <div className="w-full max-w-2xl" style={{ background: '#fff', borderRadius: 6 }}>
            <div className="px-6 pt-5 pb-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <p className="eyebrow">{t('x_words')} {range.s + 1}–{range.e + 1}</p>
              <p className="text-sm tabular-nums" style={{ color: state === 'recording' ? '#b42318' : '#6b7280' }}>
                {state === 'recording' ? `● ${fmt(secs)}` : state === 'saving' ? t('saving') : t('x_ready')}
              </p>
            </div>
            <p dir="rtl" className="hebrew px-6 py-6 text-2xl leading-[2]" style={{ color: '#1b2f6b', maxHeight: '45vh', overflowY: 'auto' }}>
              {range.words.slice(range.s, range.e + 1).join(' ')}
            </p>
            <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid #e5e7eb' }}>
              <button onClick={state === 'recording' ? cancel : reset} disabled={state === 'saving'}
                className="text-sm underline underline-offset-4" style={{ color: '#6b7280' }}>{t('cancel')}</button>
              {state === 'idle' && <button onClick={start} className="btn-navy px-6 py-2.5 text-sm">● {t('x_record')}</button>}
              {state === 'recording' && <button onClick={stop} className="px-6 py-2.5 text-sm font-medium" style={{ background: '#b42318', color: '#fff', borderRadius: 4 }}>■ {t('x_stop_save')}</button>}
            </div>
          </div>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t('x_range_hint')}
          </p>
        </div>
      )}
    </>
  )
}
