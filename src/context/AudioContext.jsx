import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AudioCtx = createContext(null)

export function AudioProvider({ children }) {
  const [audios, setAudios] = useState({})

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('audio_files').select('*')
      if (!data) return
      const map = {}
      data.forEach(row => {
        const key = `${row.parasha_id}-${row.aliyah_idx}`
        map[key] = {
          url: row.public_url,
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

    // Reload when auth state changes (covers refresh + login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    load()
    return () => subscription.unsubscribe()
  }, [])

  const upload = useCallback(async (parashaId, aliyahIdx, file, notifData = null) => {
    const key = `${parashaId}-${aliyahIdx}`

    // Teacher uploads directly → use their own auth UID
    // Student records and sends → teacherId comes from notifData
    let teacherId = notifData?.teacherId ?? null
    if (!teacherId) {
      const { data: { session } } = await supabase.auth.getSession()
      teacherId = session?.user?.id ?? null
    }
    if (!teacherId) {
      alert('No se pudo determinar el profesor. Inicia sesión de nuevo.')
      return
    }

    const storagePath = `${teacherId}/${parashaId}/${aliyahIdx}/audio`
    const contentType = file.type === 'video/mp4' ? 'audio/mp4' : (file.type || 'audio/mpeg')

    const { error: uploadError } = await supabase.storage
      .from('Audios')
      .upload(storagePath, file, { upsert: true, contentType })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert(`Error al subir el audio: ${uploadError.message}`)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('Audios').getPublicUrl(storagePath)

    const { error: dbError } = await supabase.from('audio_files').upsert({
      teacher_id: teacherId,
      parasha_id: parashaId,
      aliyah_idx: aliyahIdx,
      storage_path: storagePath,
      public_url: publicUrl,
      file_name: file.name,
      file_type: contentType,
    }, { onConflict: 'teacher_id,parasha_id,aliyah_idx' })

    if (dbError) {
      console.error('DB error:', dbError)
      alert(`Error al guardar el audio: ${dbError.message}`)
      return
    }

    if (notifData?.teacherId) {
      await supabase.from('notifications').insert({
        teacher_id: notifData.teacherId,
        student_id: notifData.studentId,
        student_name: notifData.studentName,
        parasha_id: parashaId,
        aliyah_idx: aliyahIdx,
        aliyah_label: notifData.aliyahLabel,
        message: `${notifData.studentName} ha subido audio de ${notifData.parashaName} · ${notifData.aliyahLabel}`,
        type: 'audio',
      })
    }

    setAudios(prev => ({
      ...prev,
      [key]: {
        url: publicUrl,
        name: file.name,
        type: file.type,
        uploadedAt: new Date().toLocaleString('es-ES', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        wordTimestamps: null,
        storagePath,
        teacherId,
      },
    }))

    // Process word-level timestamps via Whisper in the background (non-blocking)
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (apiKey && file.size < 24 * 1024 * 1024) {
      ;(async () => {
        try {
          const form = new FormData()
          form.append('file', file, file.name || 'audio.webm')
          form.append('model', 'whisper-1')
          form.append('response_format', 'verbose_json')
          form.append('timestamp_granularities[]', 'word')
          form.append('language', 'he')

          const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
          })
          if (!res.ok) return

          const json = await res.json()
          const wordTimestamps = json.words ?? []
          if (!wordTimestamps.length) return

          await supabase.from('audio_files')
            .update({ word_timestamps: wordTimestamps })
            .eq('teacher_id', teacherId)
            .eq('parasha_id', parashaId)
            .eq('aliyah_idx', aliyahIdx)

          setAudios(prev => ({
            ...prev,
            [key]: { ...prev[key], wordTimestamps },
          }))
        } catch (e) {
          console.error('Whisper sync error:', e)
        }
      })()
    }
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

  const generateSync = useCallback(async (parashaId, aliyahIdx) => {
    const key = `${parashaId}-${aliyahIdx}`
    const audio = audios[key]
    if (!audio?.url) return false

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) return false

    try {
      const audioRes = await fetch(audio.url)
      if (!audioRes.ok) return false
      const blob = await audioRes.blob()
      if (blob.size > 24 * 1024 * 1024) return false

      const file = new File([blob], audio.name, { type: audio.type || blob.type })
      const form = new FormData()
      form.append('file', file, file.name)
      form.append('model', 'whisper-1')
      form.append('response_format', 'verbose_json')
      form.append('timestamp_granularities[]', 'word')
      form.append('language', 'he')

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      })
      if (!res.ok) return false

      const json = await res.json()
      const wordTimestamps = json.words ?? []
      if (!wordTimestamps.length) return false

      let q = supabase.from('audio_files')
        .update({ word_timestamps: wordTimestamps })
        .eq('parasha_id', parashaId)
        .eq('aliyah_idx', aliyahIdx)
      if (audio.teacherId) q = q.eq('teacher_id', audio.teacherId)
      await q

      setAudios(prev => ({
        ...prev,
        [key]: { ...prev[key], wordTimestamps },
      }))
      return true
    } catch (e) {
      console.error('generateSync error:', e)
      return false
    }
  }, [audios])

  return (
    <AudioCtx.Provider value={{ upload, remove, get, hasAny, audios, generateSync }}>
      {children}
    </AudioCtx.Provider>
  )
}

export const useAudio = () => useContext(AudioCtx)
