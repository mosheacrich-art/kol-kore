import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminAudioUpload({ parashaId, aliyahIdx, aliyahRef, onClose, onSaved }) {
  const [label, setLabel] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | syncing | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef()

  const run = async () => {
    if (!label.trim() || !file) return
    setStatus('uploading')
    setErrorMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

      // 1. Get signed upload URL
      const urlRes = await fetch('/api/admin-audio-upload-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ parashaId, aliyahIdx, label: label.trim() }),
      })
      if (!urlRes.ok) throw new Error((await urlRes.json()).error || 'Upload URL failed')
      const { signedUrl, token: uploadToken, storagePath, publicUrl } = await urlRes.json()

      // 2. Upload file directly to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('public-audios')
        .uploadToSignedUrl(storagePath, uploadToken, file, { contentType: 'audio/x-m4a', upsert: true })
      if (uploadErr) throw new Error(uploadErr.message)

      // 3. Save DB record (no timestamps yet)
      const saveRes = await fetch('/api/admin-audio-save', {
        method: 'POST',
        headers,
        body: JSON.stringify({ parashaId, aliyahIdx, label: label.trim(), publicUrl }),
      })
      if (!saveRes.ok) throw new Error((await saveRes.json()).error || 'Save failed')

      // 4. Generate sync timestamps
      setStatus('syncing')
      const syncRes = await fetch('/api/generate-sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ audioUrl: publicUrl, fileType: 'audio/x-m4a', aliyahRef }),
      })
      if (syncRes.ok) {
        const syncData = await syncRes.json()
        // 5. Update record with timestamps
        await fetch('/api/admin-audio-save', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parashaId, aliyahIdx, label: label.trim(), publicUrl,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
            Subir audio (admin)
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="text-xs" style={{ color: 'var(--text-3)' }}>
          <span className="font-mono opacity-60">{aliyahRef}</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Nombre del audio</label>
          <input
            value={label} onChange={e => setLabel(e.target.value)}
            placeholder="ej. Ashkenazi, Sefardí, Beit Knesset..."
            disabled={status !== 'idle' && status !== 'error'}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Archivo de audio (.m4a)</label>
          <input ref={fileRef} type="file" accept="audio/*,.m4a"
            disabled={status !== 'idle' && status !== 'error'}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
            style={{ color: 'var(--text-2)' }}
          />
        </div>

        {status === 'error' && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            {errorMsg}
          </p>
        )}

        {status === 'done' && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            Audio subido y sincronizado correctamente.
          </p>
        )}

        <div className="flex gap-2 justify-end mt-1">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {status === 'done' ? 'Cerrar' : 'Cancelar'}
          </button>
          {status !== 'done' && (
            <button
              onClick={run}
              disabled={!label.trim() || !file || (status !== 'idle' && status !== 'error')}
              className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
                opacity: (!label.trim() || !file || (status !== 'idle' && status !== 'error')) ? 0.5 : 1,
              }}>
              {status === 'uploading' && (
                <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(245,158,11,0.3)', borderTopColor: '#f59e0b' }} />
              )}
              {status === 'syncing' && (
                <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(245,158,11,0.3)', borderTopColor: '#f59e0b' }} />
              )}
              {status === 'uploading' ? 'Subiendo...' : status === 'syncing' ? 'Sincronizando...' : 'Subir y sincronizar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
