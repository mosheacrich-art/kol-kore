import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

function fmtSec(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

async function submitAudio({ parashaId, aliyahIdx, aliyahRef, label, file, onStatus }) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const fileType = file.type || 'audio/webm'
  const ext = fileType.split('/')[1]?.split(';')[0] || 'webm'

  onStatus('uploading')
  const urlRes = await fetch('/api/admin-audio-upload-url', {
    method: 'POST', headers,
    body: JSON.stringify({ parashaId, aliyahIdx, label, ext }),
  })
  if (!urlRes.ok) throw new Error((await urlRes.json()).error || 'Upload URL failed')
  const { token: uploadToken, storagePath, publicUrl } = await urlRes.json()

  const { error: uploadErr } = await supabase.storage
    .from('public-audios')
    .uploadToSignedUrl(storagePath, uploadToken, file, { contentType: fileType, upsert: true })
  if (uploadErr) throw new Error(uploadErr.message)

  const saveRes = await fetch('/api/admin-audio-save', {
    method: 'POST', headers,
    body: JSON.stringify({ parashaId, aliyahIdx, label, publicUrl, fileType }),
  })
  if (!saveRes.ok) throw new Error((await saveRes.json()).error || 'Save failed')

  onStatus('syncing')
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
}

function ModalShell({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Upload modal ──────────────────────────────────────────────────────────────

export function AdminUploadModal({ parashaId, aliyahIdx, aliyahRef, onClose, onSaved }) {
  const [label, setLabel] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef()

  const run = async () => {
    if (!label.trim() || !file) return
    setErrorMsg('')
    try {
      await submitAudio({ parashaId, aliyahIdx, aliyahRef, label: label.trim(), file, onStatus: setStatus })
      setStatus('done')
      onSaved?.()
    } catch (e) {
      setErrorMsg(e.message || 'Error desconocido')
      setStatus('error')
    }
  }

  const busy = status === 'uploading' || status === 'syncing'

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>Subir audio (admin)</h2>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="text-xs font-mono opacity-50" style={{ color: 'var(--text-3)' }}>{aliyahRef}</div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Nombre del audio</label>
        <input value={label} onChange={e => setLabel(e.target.value)}
          placeholder="ej. Ashkenazi, Sefardí, Beit Knesset…"
          disabled={busy || status === 'done'}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Archivo de audio</label>
        <button onClick={() => fileRef.current?.click()} disabled={busy || status === 'done'}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: file ? '#10b981' : 'var(--text-3)' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v8M3.5 4l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 10h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {file ? file.name : 'Elegir archivo…'}
        </button>
        <input ref={fileRef} type="file" accept="audio/*,.m4a" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>

      {errorMsg && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{errorMsg}</p>}
      {status === 'done' && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Subido y sincronizado.</p>}

      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          {status === 'done' ? 'Cerrar' : 'Cancelar'}
        </button>
        {status !== 'done' && (
          <button onClick={run} disabled={!label.trim() || !file || busy}
            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
              opacity: (!label.trim() || !file || busy) ? 0.45 : 1 }}>
            {busy && <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(245,158,11,0.3)', borderTopColor: '#f59e0b' }} />}
            {status === 'uploading' ? 'Subiendo…' : status === 'syncing' ? 'Sincronizando…' : 'Subir y sincronizar'}
          </button>
        )}
      </div>
    </ModalShell>
  )
}

// ── Record modal ──────────────────────────────────────────────────────────────

export function AdminRecordModal({ parashaId, aliyahIdx, aliyahRef, onClose, onSaved }) {
  const [recState, setRecState] = useState('idle')   // idle | recording | done
  const [recSeconds, setRecSeconds] = useState(0)
  const [file, setFile] = useState(null)
  const [label, setLabel] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const previewRef = useRef(null)

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredMime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
        .find(t => MediaRecorder.isTypeSupported(t)) || ''
      const mr = preferredMime ? new MediaRecorder(stream, { mimeType: preferredMime }) : new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm'
        const ext = mimeType.split('/')[1]?.split(';')[0] || 'webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const f = new File([blob], `grabacion-admin.${ext}`, { type: mimeType })
        setFile(f)
        if (previewRef.current) previewRef.current.src = URL.createObjectURL(blob)
        stream.getTracks().forEach(t => t.stop())
        clearInterval(timerRef.current)
        setRecState('done')
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

  const run = async () => {
    if (!label.trim() || !file) return
    setErrorMsg('')
    try {
      await submitAudio({ parashaId, aliyahIdx, aliyahRef, label: label.trim(), file, onStatus: setStatus })
      setStatus('done')
      onSaved?.()
    } catch (e) {
      setErrorMsg(e.message || 'Error desconocido')
      setStatus('error')
    }
  }

  const busy = status === 'uploading' || status === 'syncing'

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>Grabar audio (admin)</h2>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="text-xs font-mono opacity-50" style={{ color: 'var(--text-3)' }}>{aliyahRef}</div>

      {/* Step 1: record */}
      {recState === 'idle' && (
        <button onClick={startRec}
          className="flex items-center justify-center gap-3 py-8 rounded-2xl text-base font-medium transition-all"
          style={{ background: 'rgba(239,68,68,0.08)', border: '2px dashed rgba(239,68,68,0.3)', color: '#ef4444' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="7" y="1" width="8" height="13" rx="4" fill="currentColor" opacity=".9"/>
            <path d="M3 11a8 8 0 0016 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M11 19v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Pulsa para grabar
        </button>
      )}

      {recState === 'recording' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
            <span className="text-2xl font-mono font-semibold" style={{ color: '#ef4444' }}>
              {fmtSec(recSeconds)}
            </span>
          </div>
          <button onClick={stopRec}
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            Parar grabación
          </button>
        </div>
      )}

      {/* Step 2: name + submit */}
      {recState === 'done' && (
        <>
          <div className="flex flex-col gap-1">
            <audio ref={previewRef} controls className="w-full rounded-xl" style={{ height: 36 }} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Nombre del audio</label>
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder="ej. Ashkenazi, Sefardí, Beit Knesset…"
              disabled={busy || status === 'done'}
              autoFocus
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>

          {errorMsg && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{errorMsg}</p>}
          {status === 'done' && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Subido y sincronizado.</p>}

          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              {status === 'done' ? 'Cerrar' : 'Cancelar'}
            </button>
            {status !== 'done' && (
              <button onClick={run} disabled={!label.trim() || busy}
                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                  opacity: (!label.trim() || busy) ? 0.45 : 1 }}>
                {busy && <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(245,158,11,0.3)', borderTopColor: '#f59e0b' }} />}
                {status === 'uploading' ? 'Subiendo…' : status === 'syncing' ? 'Sincronizando…' : 'Subir y sincronizar'}
              </button>
            )}
          </div>
        </>
      )}

      {recState !== 'done' && (
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            Cancelar
          </button>
        </div>
      )}
    </ModalShell>
  )
}
