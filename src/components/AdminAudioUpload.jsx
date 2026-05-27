import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

function fmtSec(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

async function safeJson(res) {
  try { return await res.json() } catch { return {} }
}

async function submitAudio({ parashaId, aliyahIdx, aliyahRef, label, file, onStatus }) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const fileType = file.type || 'audio/webm'
  const ext = fileType.split('/')[1]?.split(';')[0] || 'webm'

  onStatus('uploading')

  // Step 1: get a signed upload URL from the server (bypasses storage RLS)
  const urlRes = await fetch('/api/admin-audio-upload-url', {
    method: 'POST', headers,
    body: JSON.stringify({ parashaId, aliyahIdx, label, ext }),
  })
  if (!urlRes.ok) {
    const body = await safeJson(urlRes)
    throw new Error(body.error || `Error ${urlRes.status} al obtener URL`)
  }
  const { signedUrl, token: uploadToken, publicUrl } = await urlRes.json()

  // Step 2: upload directly to signed URL (no RLS check)
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': fileType, 'x-upsert': 'true' },
    body: file,
  })
  if (!uploadRes.ok) throw new Error(`Error ${uploadRes.status} al subir el archivo`)

  // Step 3: save metadata to DB via server (needs service key for RLS bypass)
  const saveRes = await fetch('/api/admin-audio-save', {
    method: 'POST', headers,
    body: JSON.stringify({ parashaId, aliyahIdx, label, publicUrl, fileType }),
  })
  if (!saveRes.ok) {
    const body = await safeJson(saveRes)
    throw new Error(body.error || `Error ${saveRes.status} al guardar`)
  }

  // Step 3: sync with Whisper — same endpoint as regular audio, non-fatal
  onStatus('syncing')
  try {
    const syncRes = await fetch('/api/generate-sync', {
      method: 'POST', headers,
      body: JSON.stringify({ audioUrl: publicUrl, fileType, aliyahRef }),
    })
    if (syncRes.ok) {
      const syncData = await syncRes.json()
      await fetch('/api/admin-audio-save', {
        method: 'POST', headers,
        body: JSON.stringify({
          parashaId, aliyahIdx, label, publicUrl, fileType,
          wordTimestamps: syncData.words ?? null,
          anchorPct: syncData.anchor_pct ?? null,
          needsReview: syncData.needs_review ?? false,
        }),
      })
    }
  } catch (syncErr) {
    console.warn('Sync failed (non-fatal):', syncErr.message)
  }
}

// Minimal popup that only asks for a name (+ optional audio preview)
function NameModal({ file, status, errorMsg, onSubmit, onCancel }) {
  const [label, setLabel] = useState('')
  const previewUrl = useRef(file ? URL.createObjectURL(file) : null).current
  const busy = status === 'uploading' || status === 'syncing'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => e.target === e.currentTarget && !busy && status !== 'done' && onCancel()}>
      <div className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>

        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Nombre del audio</h2>

        {previewUrl && (
          <audio src={previewUrl} controls className="w-full rounded-xl" style={{ height: 36 }} />
        )}

        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && label.trim() && !busy && status !== 'done' && onSubmit(label.trim())}
          placeholder="ej. Ashkenazi, Sefardí, Beit Knesset…"
          autoFocus
          disabled={busy || status === 'done'}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        {errorMsg && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            {errorMsg}
          </p>
        )}
        {status === 'done' && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            Subido y sincronizado.
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={busy}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)', opacity: busy ? 0.5 : 1 }}>
            {status === 'done' ? 'Cerrar' : 'Cancelar'}
          </button>
          {status !== 'done' && (
            <button onClick={() => onSubmit(label.trim())} disabled={!label.trim() || busy}
              className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
                opacity: (!label.trim() || busy) ? 0.45 : 1,
              }}>
              {busy && (
                <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(245,158,11,0.3)', borderTopColor: '#f59e0b' }} />
              )}
              {status === 'uploading' ? 'Subiendo…' : status === 'syncing' ? 'Sincronizando…' : 'Subir'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Upload button: file picker → naming modal → upload
export function AdminUploadButton({ parashaId, aliyahIdx, aliyahRef, onSaved }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setStatus('idle'); setErrorMsg('') }
    e.target.value = ''
  }

  const submit = async (label) => {
    setErrorMsg('')
    try {
      await submitAudio({ parashaId, aliyahIdx, aliyahRef, label, file, onStatus: setStatus })
      setStatus('done')
      onSaved?.()
    } catch (e) {
      setErrorMsg(e.message || 'Error desconocido')
      setStatus('error')
    }
  }

  const reset = () => { setFile(null); setStatus('idle'); setErrorMsg('') }

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
        style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1v6M2.5 4l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 9h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        Subir admin
      </button>
      <input ref={fileRef} type="file" accept="audio/*,.m4a" className="hidden" onChange={handleFile} />
      {file && (
        <NameModal file={null} status={status} errorMsg={errorMsg} onSubmit={submit} onCancel={reset} />
      )}
    </>
  )
}

// Record button: inline recording (no popup) → naming modal after stop
export function AdminRecordButton({ parashaId, aliyahIdx, aliyahRef, onSaved }) {
  const [recState, setRecState] = useState('idle')  // idle | recording | naming
  const [recSeconds, setRecSeconds] = useState(0)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [micError, setMicError] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const startRec = async () => {
    setMicError('')
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
        setFile(new File([blob], `admin.${ext}`, { type: mimeType }))
        stream.getTracks().forEach(t => t.stop())
        clearInterval(timerRef.current)
        setRecState('naming')
      }
      mr.start()
      setRecState('recording')
      setRecSeconds(0)
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch (err) {
      setMicError(err.message || 'No se pudo acceder al micrófono')
    }
  }

  const stopRec = () => {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }

  const submit = async (label) => {
    setErrorMsg('')
    try {
      await submitAudio({ parashaId, aliyahIdx, aliyahRef, label, file, onStatus: setStatus })
      setStatus('done')
      onSaved?.()
    } catch (e) {
      setErrorMsg(e.message || 'Error desconocido')
      setStatus('error')
    }
  }

  const reset = () => { setRecState('idle'); setFile(null); setStatus('idle'); setErrorMsg(''); setMicError('') }

  if (recState === 'recording') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#ef4444' }} />
        <span className="text-xs font-mono tabular-nums font-medium" style={{ color: '#ef4444' }}>
          {fmtSec(recSeconds)}
        </span>
        <button
          onClick={stopRec}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <rect x="1" y="1" width="7" height="7" rx="1" fill="#ef4444"/>
          </svg>
          Parar
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={startRec}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="3" y="0.5" width="5" height="7" rx="2.5" fill="currentColor"/>
            <path d="M1.5 6a4 4 0 008 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M5.5 10v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Grabar admin
        </button>
        {micError && (
          <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            {micError}
          </span>
        )}
      </div>
      {recState === 'naming' && file && (
        <NameModal file={file} status={status} errorMsg={errorMsg} onSubmit={submit} onCancel={reset} />
      )}
    </>
  )
}
