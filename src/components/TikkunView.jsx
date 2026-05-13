import { useState, useEffect, useRef, useMemo } from 'react'

const BASE = import.meta.env.BASE_URL

function parseAliyahRef(ref) {
  const m = String(ref || '').match(/^(\w+)\s+(\d+):(\d+)-(\d+):(\d+)$/)
  if (!m) return null
  return {
    startCh: parseInt(m[2]), startV: parseInt(m[3]),
    endCh:   parseInt(m[4]), endV:   parseInt(m[5]),
  }
}

function inRange(word, range) {
  if (!range) return true
  if (word.c < range.startCh || word.c > range.endCh) return false
  if (word.c === range.startCh && word.v < range.startV) return false
  if (word.c === range.endCh   && word.v > range.endV)   return false
  return true
}

function useTikkunWords(parashaId, parts) {
  const [words, setWords]   = useState(null)
  const [error, setError]   = useState(null)
  const keyRef              = useRef(null)

  useEffect(() => {
    if (!parashaId) return
    const ids = parts ?? [parashaId]
    const key = ids.join(',')
    if (keyRef.current === key) return
    keyRef.current = key
    setWords(null)
    setError(null)

    Promise.all(ids.map(id =>
      fetch(`${BASE}tikkun-words/${id}.json`).then(r => {
        if (!r.ok) throw new Error(`${id}: ${r.status}`)
        return r.json()
      })
    ))
      .then(results => setWords(results.flat()))
      .catch(err   => setError(err.message))
  }, [parashaId, parts?.join?.(',')])

  return { words, error }
}

export default function TikkunView({
  parasha,
  aliyahRef,
  bookColor,
  fontSize = 24,
  wordTimestamps,
  audioCurrentTime,
  audioPlaying,
}) {
  const { words: allWords, error } = useTikkunWords(
    parasha.id,
    parasha.combined ? parasha.parts : null
  )

  const range = useMemo(() => parseAliyahRef(aliyahRef), [aliyahRef])

  const words = useMemo(() => {
    if (!allWords) return []
    return allWords.filter(w => inRange(w, range))
  }, [allWords, range])

  const wordRefs = useRef([])

  const isV2 = useMemo(() => {
    const first = wordTimestamps?.find(x => x != null)
    return first != null && !('word' in first)
  }, [wordTimestamps])

  const activeIdx = useMemo(() => {
    if (!wordTimestamps?.length || audioCurrentTime == null || !words.length) return -1
    if (isV2) {
      let best = -1
      const limit = Math.min(wordTimestamps.length, words.length)
      for (let i = 0; i < limit; i++) {
        const ts = wordTimestamps[i]
        if (ts && ts.start <= audioCurrentTime) best = i
        else if (ts && ts.start > audioCurrentTime) break
      }
      return best
    }

    // Legacy raw Whisper timestamps: keep proportional fallback for old data.
    let lo = 0, hi = wordTimestamps.length - 1, best = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (wordTimestamps[mid].start <= audioCurrentTime) { best = mid; lo = mid + 1 }
      else hi = mid - 1
    }
    if (best < 0) return -1
    const wLen = wordTimestamps.length
    const sLen = words.length
    return wLen === 1 ? 0 : Math.min(Math.round(best * (sLen - 1) / (wLen - 1)), sLen - 1)
  }, [wordTimestamps, audioCurrentTime, words, isV2])

  useEffect(() => {
    if (!audioPlaying || activeIdx < 0) return
    wordRefs.current[activeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeIdx, audioPlaying])

  if (error) return (
    <div className="flex-1 flex items-center justify-center px-6">
      <p className="text-sm" style={{ color: '#f87171' }}>Sin datos del tikún · {error}</p>
    </div>
  )

  if (!allWords) return (
    <div className="flex-1 flex items-center justify-center gap-3">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: `${bookColor}30`, borderTopColor: bookColor }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando tikún…</p>
    </div>
  )

  if (!words.length) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin palabras para esta aliyá</p>
    </div>
  )

  const lh = fontSize <= 20 ? 3.2 : fontSize <= 28 ? 2.9 : 2.6

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <div dir="rtl" style={{
          fontFamily: '"Taamey Frank CLM", "SBL Hebrew", "Ezra SIL", "Times New Roman", serif',
          fontSize: fontSize + 'px',
          lineHeight: lh,
          textAlign: 'justify',
          color: 'var(--text)',
          wordSpacing: '0.06em',
        }}>
          {words.map((w, i) => {
            const active = activeIdx === i
            return (
              <span
                key={w.id}
                ref={el => { wordRefs.current[i] = el }}
                style={{
                  color: active ? '#3b82f6' : 'inherit',
                  transition: 'color 0.12s',
                }}
              >
                {w.t}{' '}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
