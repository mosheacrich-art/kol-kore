import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

function fmtSec(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function AdminAudioUpload({ parashaId, aliyahIdx, aliyahRef, onClose, onSaved }) {
  const [label, setLabel] = useState('')
  const [file, setFile] = useState(null)
  const [fileLabel, setFileLabel] = useState('')
  const [recState, setRecState] = useState('idle') // idle | recording
  const [recSeconds, setRecSeconds] = useState(0)
  const [status, setStatus] = useState('idle') // idle | uploading | syncing | done | error
  const [errorMsg, setErrorMsg] = useState('')

  const fileRef = useRef()
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredMime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
        .find(t => MediaRecorder.isTypeSupported(t)) || ''
      const mr = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm'
        const ext = mimeType.split('/')[1]?.split(';')[0] || 'webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const secs = recSeconds
        const f = new File([blob], `grabacion-admin.${ext}`, { type: mimeType })
        setFile(f)
        setFileLabel(`Grabación (${fmtSec(secs)})`)
        stream.getTracks().forEach(t => t.stop())
        setRecState('idle')
        clearInterval(timerRef.current)
      }
      mr.start()
      setRecState('recording')
      setRecSeconds(0)
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al acceder al micrófono')
    }
  }

  const stopRec = () => {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setFileLabel(f.name)
  }

  const run = async () => {
    if (!label.trim() || !file) return
    setStatus('uploading')
    setErrorMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

      const fileType = file.type || 'audio/webm'
      const ext = fileType.split('/')[1]?.split(';')[0] || 'webm'

      // 1. Get signed upload URL
      const urlRes = await fetch('/api/admin-audio-upload-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ parashaId, aliyahIdx, label: label.trim(), ext }),
      })
      if (!urlRes.ok) throw new Error((await urlRes.json()).error || 'Upload URL failed')
      const { signedUrl: _su, token: uploadToken, storagePath, publicUrl } = await urlRes.json()

      // 2. Upload directly to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('public-audios')
        .uploadToSignedUrl(storagePath, uploadToken, file, { contentType: fileType, upsert: true })
      if (uploadErr) throw new Error(uploadErr.message)

      // 3. Save DB record
      const saveRes = await fetch('/api/admin-audio-save', {
        method: 'POST',
        headers,
        body: JSON.stringify({ parashaId, aliyahIdx, label: label.trim(), publicUrl, fileType }),
      })
      if (!saveRes.ok) throw new Error((await saveRes.json()).error || 'Save failed')

      // 4. Generate word timestamps
      setStatus('syncing')
      const syncRes = await fetch('/api/generate-sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ audioUrl: publicUrl, fileType, aliyahRef }),
      })
      if (syncRes.ok) {
        const syncData = await syncRes.json()
        await fetch('/api/admin-audio-save', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parashaId, aliyahIdx, label: label.trim(), publicUrl, fileType,
            wordTimestamps: syncData.words ?? null,
            anchorPct: syncData.anchor_pct ?? null,
            needsReview: syncData.needs_review ?? false,
          }),
        })
      }

      setStatus('done')
      onSaved?.()
    } catch (e) {
      setErrorMsg(e.message || 'Error desconocido')
      setStatus('error')
    }
  }

  const busy = status === 'uploading' || status === 'syncing'
  const canSubmit = label.trim() && file && !busy && status !== 'done'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
            Audio admin
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="text-xs font-mono opacity-50" style={{ color: 'var(--text-3)' }}>{aliyahRef}</div>

        {/* Label */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Nombre del audio</label>
          <input
            value={label} onChange={e => setLabel(e.target.value)}
            placeholder="ej. Ashkenazi, Sefardí, Beit Knesset…"
            disabled={busy || status === 'done'}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        {/* Recording / file area */}
        {recState === 'recording' ? (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
              <span className="text-sm font-medium" style={{ color: '#ef4444' }}>
                Grabando… {fmtSec(recSeconds)}
              </span>
            </div>
            <button onClick={stopRec}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              Parar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Audio</label>
            <div className="flex gap-2">
              {/* Record button */}
              <button onClick={startRec} disabled={busy || status === 'done'}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="4" y="1" width="5" height="8" rx="2.5" fill="currentColor"/>
                  <path d="M2 7a4.5 4.5 0 009 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M6.5 11.5v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Grabar
              </button>
              {/* Upload button */}
              <button onClick={() => fileRef.current?.click()} disabled={busy || status === 'done'}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v8M3.5 4l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 10h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Subir archivo
              </button>
              <input ref={fileRef} type="file" accept="audio/*,.m4a" className="hidden"
                onChange={handleFileChange} />
            </div>
            {/* Selected file */}
            {file && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {fileLabel}
                {!busy && status !== 'done' && (
                  <button onClick={() => { setFile(null); setFileLabel('') }} className="ml-auto opacity-60 hover:opacity-100">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            {errorMsg}
          </p>
        )}

        {/* Done */}
        {status === 'done' && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            Audio subido y sincronizado correctamente.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {status === 'done' ? 'Cerrar' : 'Cancelar'}
          </button>
          {status !== 'done' && (
            <button onClick={run} disabled={!canSubmit}
              className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
                opacity: canSubmit ? 1 : 0.45,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}>
              {busy && (
                <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(245,158,11,0.3)', borderTopColor: '#f59e0b' }} />
              )}
              {status === 'uploading' ? 'Subiendo…' : status === 'syncing' ? 'Sincronizando…' : 'Subir y sincronizar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
