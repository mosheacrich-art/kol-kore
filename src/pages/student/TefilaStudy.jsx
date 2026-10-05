import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAudio } from '../../context/AudioContext'

// Tefilá = the full siddur, embedded (public/sidur/index.html).
// Teachers get a word-range recorder inside it (public/sidur/embed.js); the audio is stored
// with parasha_id "sidur:<sectionId>" and aliyah_idx = first word of the range.
export default function TefilaStudy() {
  const { profile } = useAuth()
  const { upload, audios } = useAudio()
  const frameRef = useRef(null)
  const readyRef = useRef(false)
  const isTeacher = profile?.role === 'teacher'

  const sendRanges = useCallback(() => {
    const win = frameRef.current?.contentWindow
    if (!win || !readyRef.current) return
    const ranges = Object.entries(audios || {})
      .filter(([k, a]) => k.startsWith('sidur:') && a?.url && Array.isArray(a.wordTimestamps))
      .map(([k, a]) => ({ secId: k.slice(6).replace(/-\d+$/, ''), url: a.url, ts: a.wordTimestamps }))
    win.postMessage({ type: 'sidur:ranges', ranges }, window.location.origin)
  }, [audios])

  useEffect(() => { sendRanges() }, [sendRanges])

  useEffect(() => {
    const onMsg = async (e) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return
      const m = e.data || {}
      if (m.type === 'sidur:ready') { readyRef.current = true; sendRanges() }
      if (m.type === 'sidur:save' && isTeacher) {
        const first = m.ts.findIndex(Boolean)
        const file = new File([m.blob], 'audio', { type: m.mime || 'audio/webm' })
        const ok = first >= 0 && await upload(`sidur:${m.secId}`, first, file, null, m.ts)
        e.source.postMessage(ok ? { type: 'sidur:saved' } : { type: 'sidur:error', error: 'No se pudo guardar el audio' }, window.location.origin)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [isTeacher, upload, sendRanges])

  return (
    <iframe
      ref={frameRef}
      title="Sidur"
      src={`/sidur/index.html?embed=1${isTeacher ? '&teacher=1' : ''}`}
      allow="microphone"
      className="w-full flex-1 border-0 bg-white"
      style={{ minHeight: '100%' }}
    />
  )
}
