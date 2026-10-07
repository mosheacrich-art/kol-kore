import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { sendPushToUser } from '../lib/sendPush'
import { useLang } from './LangContext'
import { ALL_PARASHOT } from '../data/parashot'
import { ALL_HAFTAROT } from '../data/haftarot'
import { ALL_MOADIM } from '../data/moadim'

const AudioCtx = createContext(null)

// Sefaria ref of an aliyah, for parashot, combined parashot, haftarot and moadim.
function resolveAliyahRef(id, idx) {
  const e = ALL_PARASHOT.find(p => p.id === id) || ALL_HAFTAROT.find(h => h.id === id) || ALL_MOADIM.find(m => m.id === id)
  return e?.aliyot?.[idx]?.ref || null
}

// Persist sync results. word_timestamps is written on its own so it always saves; the
// quality columns (anchor_pct / needs_review) are best-effort because they may not exist
// in audio_files — bundling them made every save fail since 2026-09-07.
// Returns the number of rows updated (0 = nothing matched or the write failed).
async function saveSync({ teacherId, parashaId, aliyahIdx, uploadedAt = null }, wordTimestamps, anchorPct = null, needsReview = false) {
  const match = q => {
    q = q.eq('teacher_id', teacherId).eq('parasha_id', parashaId).eq('aliyah_idx', aliyahIdx)
    return uploadedAt ? q.eq('uploaded_at', uploadedAt) : q
  }
  const { data, error } = await match(supabase.from('audio_files').update({ word_timestamps: wordTimestamps })).select('parasha_id')
  if (error) { console.error('saveSync failed:', error); return 0 }
  if (data?.length) {
    const { error: qErr } = await match(supabase.from('audio_files').update({ anchor_pct: anchorPct, needs_review: needsReview }))
    if (qErr) console.warn('saveSync: quality columns not saved:', qErr.message)
  }
  return data?.length || 0
}

async function callSyncApi(audioUrl, fileType, aliyahRef, prompt, words) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/generate-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ audioUrl, fileType, ...(aliyahRef ? { aliyahRef } : {}), ...(prompt ? { prompt } : {}), ...(words ? { words } : {}) }),
  })
  // A Vercel timeout/crash returns plain text, not JSON — surface the status instead of a parse error
  const raw = await res.text()
  let json
  try { json = JSON.parse(raw) } catch {
    throw new Error(`Error ${res.status}${res.status === 504 ? ' (tiempo agotado en el servidor)' : ''}: ${raw.slice(0, 120)}`)
  }
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`)
  if (json.format === 'v2') {
    if (json.needs_review) console.warn(`Sync needs_review: anchor_pct=${json.anchor_pct}`)
    return { words: json.words, anchorPct: json.anchor_pct ?? null, needsReview: json.needs_review ?? false }
  }
  return {
    words: (json.words ?? []).map(w => ({ word: w.word, start: w.start, end: w.end })),
    anchorPct: null,
    needsReview: false,
  }
}

export function AudioProvider({ children }) {
  const { t } = useLang()
  const [audios, setAudios] = useState({})
  const [syncingKeys, setSyncingKeys] = useState(new Set())
  const [syncErrors, setSyncErrors] = useState({}) // key → error string
  const [teacherSessionId, setTeacherSessionId] = useState(null) // signed-in teacher, for the background re-sync

  // Guards against overlapping load() calls (e.g. rapid tab focus/blur)
  // overwriting fresher data with a stale, slower response.
  const loadSeqRef = useRef(0)

  useEffect(() => {
    const load = async (userId) => {
      const seq = ++loadSeqRef.current
      const isStale = () => seq !== loadSeqRef.current

      if (!userId) { setAudios({}); setTeacherSessionId(null); return }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, teacher_id')
        .eq('id', userId)
        .maybeSingle()

      if (isStale()) return
      if (profileErr) { console.error('Failed to load profile for audio list:', profileErr); return }

      let teacherIdFilter = null
      if (profile?.role === 'teacher') teacherIdFilter = userId
      else if (profile?.role === 'student') teacherIdFilter = profile.teacher_id
      setTeacherSessionId(profile?.role === 'teacher' ? userId : null)

      if (!teacherIdFilter) { setAudios({}); return }

      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('teacher_id', teacherIdFilter)

      if (isStale()) return
      if (error) { console.error('Failed to load audio files:', error); return }
      if (!data) return
      const map = {}
      data.forEach(row => {
        const key = `${row.parasha_id}-${row.aliyah_idx}`
        const vParam = row.uploaded_at ? new Date(row.uploaded_at).getTime() : Date.now()
        map[key] = {
          url: `${row.public_url}?v=${vParam}`,
          name: row.file_name,
          type: row.file_type || 'audio/webm',
          uploadedAt: new Date(row.uploaded_at).toLocaleString(t('date_locale'), {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          }),
          wordTimestamps: row.word_timestamps ?? null,
          anchorPct: row.anchor_pct ?? null,
          needsReview: row.needs_review ?? false,
          storagePath: row.storage_path,
          teacherId: row.teacher_id,
        }
      })
      setAudios(map)
    }

    supabase.auth.getSession().then(({ data: { session } }) => load(session?.user?.id ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return
      load(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const upload = useCallback(async (parashaId, aliyahIdx, file, aliyahRef, manualTimestamps = null, syncRange = null) => {
    const key = `${parashaId}-${aliyahIdx}`

    const { data: { session } } = await supabase.auth.getSession()
    const teacherId = session?.user?.id ?? null
    if (!teacherId) {
      alert('No se pudo determinar el profesor. Inicia sesión de nuevo.')
      return false
    }

    const storagePath = `${teacherId}/${parashaId}/${aliyahIdx}/audio`
    const contentType = file.type === 'video/mp4' ? 'audio/mp4' : (file.type || 'audio/mpeg')

    const { error: uploadError } = await supabase.storage
      .from('Audios')
      .upload(storagePath, file, { upsert: true, contentType })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert(`Error al subir el audio: ${uploadError.message}`)
      return false
    }

    const { data: { publicUrl } } = supabase.storage.from('Audios').getPublicUrl(storagePath)

    const uploadedAt = new Date().toISOString()
    const { error: dbError } = await supabase.from('audio_files').upsert({
      teacher_id: teacherId,
      parasha_id: parashaId,
      aliyah_idx: aliyahIdx,
      storage_path: storagePath,
      public_url: publicUrl,
      file_name: file.name,
      file_type: contentType,
      word_timestamps: manualTimestamps,
      uploaded_at: uploadedAt,
    }, { onConflict: 'teacher_id,parasha_id,aliyah_idx' })

    if (dbError) {
      console.error('DB error:', dbError)
      alert(`Error al guardar el audio: ${dbError.message}`)
      return false
    }

    // Append cache-buster so AudioPlayer reloads even if the storage path is identical
    const cacheBustUrl = `${publicUrl}?v=${new Date(uploadedAt).getTime()}`
    setAudios(prev => ({
      ...prev,
      [key]: {
        url: cacheBustUrl,
        name: file.name,
        type: contentType,
        uploadedAt: new Date(uploadedAt).toLocaleString(t('date_locale'), {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        wordTimestamps: manualTimestamps,
        storagePath,
        teacherId,
      },
    }))

    // Manual range sync: proportional timestamps are the fallback; refine with Whisper when a text range is given
    if (manualTimestamps) {
      if (syncRange) {
        setSyncingKeys(prev => new Set([...prev, key]))
        callSyncApi(publicUrl, contentType, null, null, syncRange.words)
          .then(async ({ words: res, anchorPct, needsReview }) => {
            if (!res.length || needsReview) return
            const full = new Array(syncRange.size).fill(null)
            res.forEach((x, i) => { if (x && syncRange.indices[i] != null) full[syncRange.indices[i]] = { start: x.start, end: x.end } })
            await saveSync({ teacherId, parashaId, aliyahIdx }, full, anchorPct, false)
            setAudios(prev => ({ ...prev, [key]: { ...prev[key], wordTimestamps: full, anchorPct, needsReview: false } }))
          })
          .catch(err => console.error('Range auto-sync failed (keeping manual timing):', err))
          .finally(() => setSyncingKeys(prev => { const s = new Set([...prev]); s.delete(key); return s }))
      }
      return true
    }

    // Auto-sync via server-side Vercel API (avoids CORS with OpenAI)
    setSyncingKeys(prev => new Set([...prev, key]))
    setSyncErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    callSyncApi(publicUrl, contentType, aliyahRef)
      .then(async ({ words: wordTimestamps, anchorPct, needsReview }) => {
        if (!wordTimestamps.length) { console.warn('Auto-sync: no words returned'); return }
        const saved = await saveSync({ teacherId, parashaId, aliyahIdx }, wordTimestamps, anchorPct, needsReview)
        if (!saved) setSyncErrors(prev => ({ ...prev, [key]: 'No se pudo guardar la sincronización' }))
        setAudios(prev => ({
          ...prev,
          [key]: { ...prev[key], wordTimestamps, anchorPct, needsReview },
        }))
      })
      .catch(err => {
        console.error('Auto-sync failed:', err)
        setSyncErrors(prev => ({ ...prev, [key]: err.message }))
      })
      .finally(() => {
        setSyncingKeys(prev => { const s = new Set([...prev]); s.delete(key); return s })
      })

    return true
  }, [])

  const uploadStudentRecording = useCallback(async (parashaId, aliyahIdx, file, notifData) => {
    const { studentId, teacherId, studentName, parashaName, aliyahLabel } = notifData
    const storagePath = `students/${studentId}/${parashaId}/${aliyahIdx}/${Date.now()}`
    const contentType = file.type === 'video/mp4' ? 'audio/mp4' : (file.type || 'audio/webm')

    const { error: uploadError } = await supabase.storage
      .from('Audios')
      .upload(storagePath, file, { upsert: false, contentType })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert(`Error al subir el audio: ${uploadError.message}`)
      return null
    }

    const { data: { publicUrl } } = supabase.storage.from('Audios').getPublicUrl(storagePath)

    await supabase.from('notifications').insert({
      teacher_id: teacherId,
      student_id: studentId,
      student_name: studentName,
      parasha_id: parashaId,
      aliyah_idx: aliyahIdx,
      aliyah_label: aliyahLabel,
      message: `${studentName} ha subido audio de ${parashaName} · ${aliyahLabel}`,
      type: 'audio',
      recording_url: publicUrl,
    })

    sendPushToUser(teacherId, {
      title: '🎙️ Nuevo audio de alumno',
      body: `${studentName} ha grabado ${parashaName} · ${aliyahLabel}`,
    })

    return publicUrl
  }, [])

  const remove = useCallback(async (parashaId, aliyahIdx) => {
    const key = `${parashaId}-${aliyahIdx}`
    const stored = audios[key]
    const storagePath = stored?.storagePath ?? `${parashaId}/${aliyahIdx}/audio`

    await supabase.storage.from('Audios').remove([storagePath])

    let q = supabase.from('audio_files')
      .delete()
      .eq('parasha_id', parashaId)
      .eq('aliyah_idx', aliyahIdx)
    if (stored?.teacherId) q = q.eq('teacher_id', stored.teacherId)
    await q

    setAudios(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [audios])

  const get = useCallback((parashaId, aliyahIdx) => {
    return audios[`${parashaId}-${aliyahIdx}`] ?? null
  }, [audios])

  const hasAny = useCallback((parashaId) => {
    return Object.keys(audios).some(k => k.startsWith(`${parashaId}-`))
  }, [audios])

  // Re-generate sync for an already-uploaded audio (e.g. retry button).
  const generateSync = useCallback(async (parashaId, aliyahIdx, aliyahRef) => {
    const key = `${parashaId}-${aliyahIdx}`

    const { data: { session } } = await supabase.auth.getSession()
    let q = supabase
      .from('audio_files')
      .select('public_url, file_type, teacher_id')
      .eq('parasha_id', parashaId)
      .eq('aliyah_idx', aliyahIdx)
    if (session?.user?.id) q = q.eq('teacher_id', session.user.id)
    const { data: row } = await q.maybeSingle()
    if (!row?.public_url) return false

    setSyncingKeys(prev => new Set([...prev, key]))
    setSyncErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    try {
      const cleanUrl = row.public_url.split('?')[0]
      const { words: wordTimestamps, anchorPct, needsReview } = await callSyncApi(cleanUrl, row.file_type || 'audio/webm', aliyahRef)

      if (!wordTimestamps.length) {
        console.error('generateSync: no words returned')
        setSyncErrors(prev => ({ ...prev, [key]: 'Whisper no devolvió palabras. Prueba con otro formato de audio.' }))
        return false
      }

      const saved = await saveSync({ teacherId: row.teacher_id, parashaId, aliyahIdx }, wordTimestamps, anchorPct, needsReview)
      if (!saved) {
        setSyncErrors(prev => ({ ...prev, [key]: 'No se pudo guardar la sincronización' }))
        return false
      }

      setAudios(prev => ({
        ...prev,
        [key]: { ...prev[key], wordTimestamps, anchorPct, needsReview },
      }))

      return true
    } catch (err) {
      console.error('generateSync error:', err)
      setSyncErrors(prev => ({ ...prev, [key]: err.message }))
      return false
    } finally {
      setSyncingKeys(prev => { const s = new Set([...prev]); s.delete(key); return s })
    }
  }, [])

  // Re-sync the signed-in teacher's own audios whose timing was never aligned to the text
  // (raw Whisper output from the old record button, or no sync at all).
  // Safe by design: one audio at a time, a backup of the old timing is kept in localStorage,
  // a result is only written if alignment succeeded, and never if the audio was re-uploaded meanwhile.
  // Untouched: already-aligned audios, word-range recordings, sidur audios and the audio files.
  const resyncMine = useCallback(async (onProgress) => {
    const { data: { session } } = await supabase.auth.getSession()
    const teacherId = session?.user?.id
    if (!teacherId) return { error: 'no-session' }

    const { data: rows, error } = await supabase.from('audio_files')
      .select('parasha_id, aliyah_idx, public_url, file_type, word_timestamps, uploaded_at')
      .eq('teacher_id', teacherId)
    if (error) return { error: error.message }

    const targets = (rows || []).filter(r => {
      if (String(r.parasha_id).includes(':')) return false        // sidur:/berajot: ranges
      const ts = r.word_timestamps
      if (Array.isArray(ts) && ts.length) {
        if (ts.some(x => x == null)) return false                   // word-range recording
        if (!('word' in ts[0])) return false                         // already aligned to the text (v2)
      }
      return !!resolveAliyahRef(r.parasha_id, r.aliyah_idx)
    })

    const backup = targets.map(r => ({
      parasha_id: r.parasha_id, aliyah_idx: r.aliyah_idx, uploaded_at: r.uploaded_at,
      word_timestamps: r.word_timestamps,
    }))
    try { if (backup.length) localStorage.setItem(`resync-backup-${teacherId}`, JSON.stringify(backup)) } catch { /* storage unavailable */ }

    let fixed = 0, failed = 0
    for (let i = 0; i < targets.length; i++) {
      const r = targets[i]
      const key = `${r.parasha_id}-${r.aliyah_idx}`
      onProgress?.({ done: i, total: targets.length })
      setSyncingKeys(prev => new Set([...prev, key]))
      try {
        const { words, anchorPct, needsReview } = await callSyncApi(
          r.public_url.split('?')[0], r.file_type || 'audio/webm', resolveAliyahRef(r.parasha_id, r.aliyah_idx))
        if (!words.length || anchorPct == null) { failed++; continue }
        const saved = await saveSync({ teacherId, parashaId: r.parasha_id, aliyahIdx: r.aliyah_idx, uploadedAt: r.uploaded_at },
          words, anchorPct, needsReview)
        if (!saved) { failed++; continue }
        setAudios(prev => prev[key] ? { ...prev, [key]: { ...prev[key], wordTimestamps: words, anchorPct, needsReview } } : prev)
        fixed++
      } catch (err) {
        console.error(`Resync ${key} failed:`, err)
        failed++
      } finally {
        setSyncingKeys(prev => { const n = new Set([...prev]); n.delete(key); return n })
      }
    }
    onProgress?.({ done: targets.length, total: targets.length })
    return { total: targets.length, fixed, failed }
  }, [])

  // Background re-sync: when a teacher signs in, quietly repair their audios left without
  // timing (at most once a day per teacher, so failures are not retried on every load).
  useEffect(() => {
    if (!teacherSessionId) return
    const flag = `auto-resync-${teacherSessionId}`
    const today = new Date().toISOString().slice(0, 10)
    try {
      if (localStorage.getItem(flag) === today) return
      localStorage.setItem(flag, today)
    } catch { /* storage unavailable: still run once this session */ }
    resyncMine().then(r => { if (r?.total) console.info('Auto re-sync:', r) })
  }, [teacherSessionId, resyncMine])

  // Undo resyncMine using the localStorage backup (skips audios re-uploaded since).
  const restoreResync = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const teacherId = session?.user?.id
    if (!teacherId) return 0
    let backup = []
    try { backup = JSON.parse(localStorage.getItem(`resync-backup-${teacherId}`) || '[]') } catch { backup = [] }
    let restored = 0
    for (const b of backup) {
      const { data } = await supabase.from('audio_files')
        .update({ word_timestamps: b.word_timestamps })
        .eq('teacher_id', teacherId).eq('parasha_id', b.parasha_id).eq('aliyah_idx', b.aliyah_idx)
        .eq('uploaded_at', b.uploaded_at)
        .select('parasha_id')
      if (data?.length) {
        restored++
        const key = `${b.parasha_id}-${b.aliyah_idx}`
        setAudios(prev => prev[key] ? { ...prev, [key]: { ...prev[key], wordTimestamps: b.word_timestamps, anchorPct: null, needsReview: false } } : prev)
      }
    }
    return restored
  }, [])

  return (
    <AudioCtx.Provider value={{ upload, uploadStudentRecording, remove, get, hasAny, audios, generateSync, resyncMine, restoreResync, syncingKeys, syncErrors }}>
      {children}
    </AudioCtx.Provider>
  )
}

export const useAudio = () => useContext(AudioCtx)
