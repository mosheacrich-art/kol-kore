import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AudioCtx = createContext(null)

// Call OpenAI Whisper with word-level timestamps.
// Accepts a File/Blob directly (no re-download needed when file is in memory).
async function transcribeWithWhisper(fileOrBlob, fileType) {
  const apiKey = (import.meta.env.VITE_OPENAI_API_KEY || '').trim()
  if (!apiKey || !apiKey.startsWith('sk-')) {
    // Fall back to Supabase Edge Function (requires it to be deployed)
    throw new Error('VITE_OPENAI_API_KEY not configured — cannot transcribe')
  }

  const MAX_BYTES = 24 * 1024 * 1024 // 24 MB (Whisper limit is 25 MB)
  if (fileOrBlob.size > MAX_BYTES) {
    throw new Error(`El archivo pesa ${(fileOrBlob.size / 1024 / 1024).toFixed(1)} MB. El límite de Whisper es 25 MB. Convierte el audio a MP3 antes de subirlo.`)
  }

  const ext = (fileType || 'audio/webm').split('/')[1]?.split(';')[0] || 'webm'
  const form = new FormData()
  form.append('file', new File([fileOrBlob], `audio.${ext}`, { type: fileType || 'audio/webm' }))
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'word')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Whisper error ${res.status}: ${err}`)
  }

  const json = await res.json()
  return (json.words ?? []).map(w => ({ word: w.word, start: w.start, end: w.end }))
}

// Download audio from a public URL and transcribe it.
async function transcribeFromUrl(audioUrl, fileType) {
  const audioRes = await fetch(audioUrl)
  if (!audioRes.ok) throw new Error(`Failed to download audio: ${audioRes.status}`)
  const blob = await audioRes.blob()
  return transcribeWithWhisper(blob, fileType)
}

export function AudioProvider({ children }) {
  const [audios, setAudios] = useState({})
  const [syncingKeys, setSyncingKeys] = useState(new Set())
  const [syncErrors, setSyncErrors] = useState({}) // key → error string

  useEffect(() => {
    const load = async (userId) => {
      if (!userId) { setAudios({}); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, teacher_id')
        .eq('id', userId)
        .maybeSingle()

      let teacherIdFilter = null
      if (profile?.role === 'teacher') teacherIdFilter = userId
      else if (profile?.role === 'student') teacherIdFilter = profile.teacher_id

      if (!teacherIdFilter) { setAudios({}); return }

      const { data } = await supabase
        .from('audio_files')
        .select('*')
        .eq('teacher_id', teacherIdFilter)

      if (!data) return
      const map = {}
      data.forEach(row => {
        const key = `${row.parasha_id}-${row.aliyah_idx}`
        const vParam = row.uploaded_at ? new Date(row.uploaded_at).getTime() : Date.now()
        map[key] = {
          url: `${row.public_url}?v=${vParam}`,
          name: row.file_name,
          type: row.file_type || 'audio/webm',
          uploadedAt: new Date(row.uploaded_at).toLocaleString('es-ES', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          }),
          wordTimestamps: row.word_timestamps ?? null,
          storagePath: row.storage_path,
          teacherId: row.teacher_id,
        }
      })
      setAudios(map)
    }

    supabase.auth.getSession().then(({ data: { session } }) => load(session?.user?.id ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const upload = useCallback(async (parashaId, aliyahIdx, file) => {
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
      word_timestamps: null,
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
        uploadedAt: new Date(uploadedAt).toLocaleString('es-ES', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        wordTimestamps: null,
        storagePath,
        teacherId,
      },
    }))

    // Auto-sync: pass the original file directly to avoid re-downloading
    setSyncingKeys(prev => new Set([...prev, key]))
    setSyncErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    transcribeWithWhisper(file, contentType)
      .then(async (wordTimestamps) => {
        if (!wordTimestamps.length) { console.warn('Auto-sync: no words returned'); return }
        await supabase
          .from('audio_files')
          .update({ word_timestamps: wordTimestamps })
          .eq('parasha_id', parashaId)
          .eq('aliyah_idx', aliyahIdx)
          .eq('teacher_id', teacherId)
        setAudios(prev => ({
          ...prev,
          [key]: { ...prev[key], wordTimestamps },
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
  const generateSync = useCallback(async (parashaId, aliyahIdx) => {
    const key = `${parashaId}-${aliyahIdx}`

    const { data: row } = await supabase
      .from('audio_files')
      .select('public_url, file_type, teacher_id')
      .eq('parasha_id', parashaId)
      .eq('aliyah_idx', aliyahIdx)
      .maybeSingle()
    if (!row?.public_url) return false

    setSyncingKeys(prev => new Set([...prev, key]))
    setSyncErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    try {
      // Use the clean URL (no cache-buster) for fetching the audio to transcribe
      const cleanUrl = row.public_url.split('?')[0]
      const wordTimestamps = await transcribeFromUrl(cleanUrl, row.file_type || 'audio/webm')

      if (!wordTimestamps.length) {
        console.error('generateSync: no words returned')
        setSyncErrors(prev => ({ ...prev, [key]: 'Whisper no devolvió palabras. Prueba con otro formato de audio.' }))
        return false
      }

      await supabase
        .from('audio_files')
        .update({ word_timestamps: wordTimestamps })
        .eq('parasha_id', parashaId)
        .eq('aliyah_idx', aliyahIdx)
        .eq('teacher_id', row.teacher_id)

      setAudios(prev => ({
        ...prev,
        [key]: { ...prev[key], wordTimestamps },
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

  return (
    <AudioCtx.Provider value={{ upload, uploadStudentRecording, remove, get, hasAny, audios, generateSync, syncingKeys, syncErrors }}>
      {children}
    </AudioCtx.Provider>
  )
}

export const useAudio = () => useContext(AudioCtx)
