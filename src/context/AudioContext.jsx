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
    console.warn('Audio sync generation requires a protected backend and is disabled on GitHub Pages.', { parashaId, aliyahIdx })
    return false
  }, [])

  return (
    <AudioCtx.Provider value={{ upload, remove, get, hasAny, audios, generateSync }}>
      {children}
    </AudioCtx.Provider>
  )
}

export const useAudio = () => useContext(AudioCtx)
