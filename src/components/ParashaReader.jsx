import { useState, useEffect, useRef, useMemo } from 'react'
import { useAliyahText } from '../hooks/useSefaria'
import { processVerse, splitWords } from '../utils/hebrew'
import { useAudio } from '../context/AudioContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AudioPlayer from './AudioPlayer'
import { BOOK_COLORS } from '../data/parashot'

function fmtSec(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const MODES = [
  { id: 'taamim', label: 'Taamim', heb: 'טְעָמִים', desc: 'Con taamim y nikkud' },
  { id: 'nikkud', label: 'Nikkud', heb: 'נִקּוּד', desc: 'Solo nikkud' },
  { id: 'plain',  label: 'Llano',  heb: 'כְּתָב',   desc: 'Sin marcas' },
  { id: 'split',  label: 'Partida',heb: 'מְפוּצָּל', desc: 'Pantalla partida' },
  { id: 'sefer',  label: 'Sefer',  heb: 'סֵפֶר',    desc: 'Modo tikkun (tikkun.io)' },
]

const BOOK_TO_NUM = { Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5 }
const MIN_FONT = 14
const MAX_FONT = 44

function tikkunHash(ref) {
  const m = String(ref || '').match(/^(\w+)\s+(\d+):(\d+)/)
  if (!m || !BOOK_TO_NUM[m[1]]) return '#/next'
  return `#/r/${BOOK_TO_NUM[m[1]]}-${m[2]}-${m[3]}`
}

export default function ParashaReader({ parasha, guestMode = false, initialAliyah = 0 }) {
  const [aliyahIdx, setAliyahIdx] = useState(initialAliyah)
  const [mode, setMode] = useState('taamim')
  const [fontSize, setFontSize] = useState(22)
  const [audioCurrentTime, setAudioCurrentTime] = useState(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [pendingHomework, setPendingHomework] = useState(null)
  const pendingHomeworkRef = useRef(null)
  const { get, upload, uploadStudentRecording, remove, generateSync } = useAudio()
  const { profile } = useAuth()
  const notifiedRef = useRef(new Set())    // aliyot ya notificadas en esta sesión
  const aliyahStartRef = useRef(Date.now()) // para medir tiempo por aliyá

  const buildNotifData = () =>
    profile?.role === 'student' && profile?.teacher_id ? {
      teacherId: profile.teacher_id,
      studentId: profile.id,
      studentName: profile.name,
      parashaName: parasha.name,
      aliyahLabel: currentAliyah.n === 8 ? 'Maftir' : `${currentAliyah.n}ª aliyá`,
    } : null

  const handlePlay = () => {
    if (profile?.role !== 'student' || !profile?.id) return

    supabase.rpc('increment_audio_listen', {
      p_student_id: profile.id,
      p_parasha_id: parasha.id,
      p_aliyah_idx: aliyahIdx,
    }).then(({ error }) => { if (error) console.error('increment_audio_listen:', error) })

    // Notificar al profesor solo la primera vez por aliyá en esta sesión
    const notifKey = `${parasha.id}-${aliyahIdx}`
    if (profile.teacher_id && !notifiedRef.current.has(notifKey)) {
      notifiedRef.current.add(notifKey)
      const aliyahLabel = currentAliyah.n === 8 ? 'Maftir' : `${currentAliyah.n}ª aliyá`
      supabase.from('notifications').insert({
        teacher_id: profile.teacher_id,
        student_id: profile.id,
        student_name: profile.name,
        parasha_id: parasha.id,
        aliyah_idx: aliyahIdx,
        aliyah_label: aliyahLabel,
        message: `${profile.name} ha escuchado ${parasha.name} · ${aliyahLabel}`,
        type: 'listen',
      })
    }
  }

  // Recording state
  const [recState, setRecState] = useState('idle')
  const [recSeconds, setRecSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const uploadInputRef = useRef(null)
  const [uploadedMsg, setUploadedMsg] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const currentAliyah = parasha.aliyot[aliyahIdx]
  const bookColor = BOOK_COLORS[parasha.book] || '#6c33e6'
  const audio = get(parasha.id, aliyahIdx)

  // Fetch pending homework with audio requirement for this aliyah
  useEffect(() => {
    if (profile?.role !== 'student' || !profile?.id) return
    supabase
      .from('homework')
      .select('*')
      .eq('student_id', profile.id)
      .eq('parasha_id', parasha.id)
      .eq('aliyah_idx', aliyahIdx)
      .eq('require_audio', true)
      .eq('status', 'pending')
      .maybeSingle()
      .then(({ data }) => {
        setPendingHomework(data ?? null)
        pendingHomeworkRef.current = data ?? null
      })
  }, [profile?.id, profile?.role, parasha.id, aliyahIdx])

  const autoSubmitHomework = async (recordingUrl = null) => {
    const hw = pendingHomeworkRef.current
    if (!hw) return
    const update = { status: 'submitted' }
    if (recordingUrl) update.recording_url = recordingUrl
    await supabase.from('homework').update(update).eq('id', hw.id)
    setPendingHomework(null)
    pendingHomeworkRef.current = null
  }

  // Reset audio sync state when aliyáh changes
  useEffect(() => {
    setAudioCurrentTime(null)
    setAudioPlaying(false)
    return () => {
      clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setRecState('idle')
    }
  }, [aliyahIdx])

  // Guardar tiempo por aliyá al cambiar de aliyá o salir del lector
  useEffect(() => {
    aliyahStartRef.current = Date.now()
    return () => {
      if (profile?.role !== 'student' || !profile?.id) return
      const seconds = Math.round((Date.now() - aliyahStartRef.current) / 1000)
      if (seconds < 5) return
      supabase.rpc('increment_aliyah_time', {
        p_student_id: profile.id,
        p_parasha_id: parasha.id,
        p_aliyah_idx: aliyahIdx,
        p_seconds: seconds,
      })
    }
  }, [aliyahIdx, parasha.id])

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        const mimeType = mr.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const ext = mimeType.split('/')[1]?.split(';')[0] || 'webm'
        const file = new File([blob], `grabacion-aliyá${aliyahIdx + 1}.${ext}`, { type: mimeType })
        const notifData = buildNotifData()
        if (notifData) {
          const url = await uploadStudentRecording(parasha.id, aliyahIdx, file, notifData)
          if (url) {
            setUploadedMsg(true)
            setTimeout(() => setUploadedMsg(false), 3000)
          }
          await autoSubmitHomework(url)
        } else {
          await upload(parasha.id, aliyahIdx, file)
          await autoSubmitHomework()
          if (import.meta.env.VITE_SYNC_ENABLED === 'true') {
            setSyncing(true)
            generateSync(parasha.id, aliyahIdx).finally(() => setSyncing(false))
          }
        }
        stream.getTracks().forEach(t => t.stop())
        setRecState('idle')
      }
      mr.start()
      setRecState('recording')
      setRecSeconds(0)
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch (err) {
      alert('No se pudo acceder al micrófono: ' + (err.message || err))
    }
  }

  const stopRec = () => {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      alert('Solo se aceptan archivos de audio (mp3, wav, m4a, mp4…)')
      return
    }
    const notifData = buildNotifData()
    if (notifData) {
      const url = await uploadStudentRecording(parasha.id, aliyahIdx, file, notifData)
      if (url) {
        setUploadedMsg(true)
        setTimeout(() => setUploadedMsg(false), 3000)
      }
      await autoSubmitHomework(url)
    } else {
      await upload(parasha.id, aliyahIdx, file)
      await autoSubmitHomework()
      if (import.meta.env.VITE_SYNC_ENABLED === 'true') {
        setSyncing(true)
        generateSync(parasha.id, aliyahIdx).finally(() => setSyncing(false))
      }
    }
    e.target.value = ''
  }

  const { verses, loading, error } = useAliyahText(currentAliyah.ref, true)

  const nextAliyah = parasha.aliyot[aliyahIdx + 1]
  useAliyahText(nextAliyah?.ref, !!nextAliyah)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>

        {/* Parasha info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: `${bookColor}20`, color: bookColor, border: `1px solid ${bookColor}30` }}>
            {parasha.num}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="hebrew text-xl" style={{ color: bookColor }}>{parasha.heb}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{parasha.name}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentAliyah.ref}</p>
          </div>
        </div>

        {/* Font size + mode switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {mode !== 'sefer' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFontSize(f => Math.max(MIN_FONT, f - 2))}
                title="Reducir fuente"
                className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
                א−
              </button>
              <span className="text-xs w-6 text-center tabular-nums" style={{ color: 'var(--text-muted)' }}>{fontSize}</span>
              <button
                onClick={() => setFontSize(f => Math.min(MAX_FONT, f + 2))}
                title="Aumentar fuente"
                className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
                א+
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 p-1 rounded-xl flex-wrap"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                title={m.desc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: mode === m.id ? `${bookColor}20` : 'transparent',
                  color: mode === m.id ? bookColor : 'var(--text-3)',
                  border: mode === m.id ? `1px solid ${bookColor}35` : '1px solid transparent',
                }}>
                <span className="hebrew text-xs">{m.heb}</span>
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aliyah nav */}
      <div className="flex-shrink-0 px-6 py-3 flex items-center gap-2 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {parasha.aliyot.map((a, i) => {
          const aliyahAudio = get(parasha.id, i)
          return (
            <button key={i} onClick={() => setAliyahIdx(i)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all relative"
              style={{
                background: aliyahIdx === i ? bookColor : 'var(--bg-card)',
                color: aliyahIdx === i ? '#fff' : 'var(--text-3)',
                border: `1px solid ${aliyahIdx === i ? 'transparent' : 'var(--border-subtle)'}`,
              }}>
              {a.n === 8 ? 'Maftir' : `${a.n}ª`}
              {aliyahAudio && !guestMode && (
                <span
                  title={aliyahAudio.wordTimestamps ? 'Audio con sincronización palabra a palabra' : 'Audio disponible'}
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{
                    background: aliyahAudio.wordTimestamps ? '#22c55e' : bookColor,
                    border: '1px solid var(--bg)',
                  }}
                />
              )}
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <button
            disabled={aliyahIdx === 0}
            onClick={() => setAliyahIdx(i => Math.max(0, i - 1))}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            disabled={aliyahIdx === parasha.aliyot.length - 1}
            onClick={() => setAliyahIdx(i => Math.min(parasha.aliyot.length - 1, i + 1))}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Hidden file input — accessible from banner and audio bar */}
      {!guestMode && (
        <input ref={uploadInputRef} type="file" accept="audio/*,video/mp4,.mp4" className="hidden"
          onChange={handleUploadFile} />
      )}

      {/* Homework banner */}
      {pendingHomework && !guestMode && (
        <div className="flex-shrink-0 px-5 py-3 flex flex-col gap-2"
          style={{ background: 'rgba(108,51,230,0.1)', borderBottom: '1px solid rgba(108,51,230,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(108,51,230,0.2)' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h6l3 3v7H2V2z" stroke="#6c33e6" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M8 2v3h3" stroke="#6c33e6" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M4 7h5M4 9.5h3" stroke="#6c33e6" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: '#6c33e6' }}>Tienes un deber aquí</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{pendingHomework.task}</p>
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#6c33e6' }} />
          </div>
          {recState === 'idle' && (
            <div className="flex gap-2 pl-10">
              <button onClick={startRec}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(108,51,230,0.18)', color: '#6c33e6', border: '1px solid rgba(108,51,230,0.3)' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M5.5 9.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Grabar
              </button>
              <button onClick={() => uploadInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v7M2 5l3.5-4L9 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 9.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Subir
              </button>
            </div>
          )}
        </div>
      )}

      {/* Teacher sync indicator */}
      {syncing && (
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2"
          style={{ background: 'rgba(108,51,230,0.07)', borderBottom: '1px solid rgba(108,51,230,0.15)' }}>
          <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin flex-shrink-0"
            style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#6c33e6' }} />
          <span className="text-xs" style={{ color: '#6c33e6' }}>Generando sync de palabras…</span>
        </div>
      )}

      {/* Student upload success message */}
      {uploadedMsg && (
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2"
          style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="5" stroke="#16a34a" strokeWidth="1.2"/>
            <path d="M3.5 6l2 2L8.5 4" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Audio enviado al profesor</span>
        </div>
      )}

      {/* No-audio notice */}
      {!audio && recState === 'idle' && !guestMode && (
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-1.5"
          style={{ background: `${bookColor}08`, borderBottom: '1px solid var(--border-subtle)' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
            <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke={bookColor} strokeWidth="1.2" opacity="0.5"/>
            <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke={bookColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {profile?.role === 'student'
              ? 'Sin audio del profesor · graba y envíaselo'
              : 'Sin audio para esta aliyá · graba o sube uno abajo'}
          </span>
        </div>
      )}

      {/* Text area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {mode === 'sefer' && (
          <SeferView ref_={currentAliyah.ref} />
        )}
        {mode !== 'sefer' && loading && <LoadingState bookColor={bookColor} />}
        {mode !== 'sefer' && error && <ErrorState error={error} ref_={currentAliyah.ref} />}
        {mode !== 'sefer' && !loading && !error && verses.length > 0 && (
          mode === 'split'
            ? <SplitView
                verses={verses}
                bookColor={bookColor}
                fontSize={fontSize}
                wordTimestamps={audio?.wordTimestamps ?? null}
                audioCurrentTime={audioCurrentTime}
                audioPlaying={audioPlaying}
              />
            : <SingleView
                verses={verses}
                mode={mode}
                bookColor={bookColor}
                fontSize={fontSize}
                wordTimestamps={audio?.wordTimestamps ?? null}
                audioCurrentTime={audioCurrentTime}
                audioPlaying={audioPlaying}
              />
        )}
        {mode !== 'sefer' && !loading && !error && verses.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin texto disponible</p>
          </div>
        )}
      </div>

      {/* Audio bar */}
      {!guestMode && <div className="flex-shrink-0 px-4 py-2.5 flex items-center justify-end gap-2"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--overlay)' }}>

        {recState === 'recording' ? (
          <>
            <div className="flex items-center gap-2 flex-1 justify-start">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-medium tabular-nums" style={{ color: '#ef4444' }}>
                Grabando… {fmtSec(recSeconds)}
              </span>
            </div>
            <button onClick={stopRec}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1.5" y="1.5" width="7" height="7" rx="1" fill="#ef4444"/>
              </svg>
              Parar
            </button>
          </>
        ) : audio ? (
          <>
            <div className="flex-1 min-w-0">
              <AudioPlayer
                audio={audio}
                label={currentAliyah.label}
                onPlay={handlePlay}
                onTimeUpdate={setAudioCurrentTime}
                onPlayingChange={setAudioPlaying}
              />
            </div>
            {profile?.role === 'student' && (
              <button onClick={startRec} title="Grabar y enviar al profesor"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M5.5 9.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Grabar
              </button>
            )}
            {profile?.role !== 'student' && (
              <button onClick={startRec} title="Grabar nuevo audio (reemplazará el actual)"
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="4" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 6c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M6 10v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            {profile?.role !== 'student' && (
              <button onClick={() => remove(parasha.id, aliyahIdx)} title="Eliminar audio"
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 3h7M3.5 3V2h3v1M4 5v2.5M6 5v2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                  <path d="M2.5 3l.5 5h4l.5-5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </>
        ) : (
          <>
            <button onClick={() => uploadInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v7M2 5l3.5-4L9 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 9.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Subir
            </button>
            <button onClick={startRec}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
              style={{ background: `${bookColor}15`, color: bookColor, border: `1px solid ${bookColor}30` }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M5.5 9.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Grabar
            </button>
          </>
        )}
      </div>}
    </div>
  )
}

function lineHeightForSize(fs) {
  return fs <= 20 ? 3.4 : fs <= 28 ? 3.2 : 3.0
}

function SingleView({ verses, mode, bookColor, fontSize, wordTimestamps, audioCurrentTime, audioPlaying }) {
  const wordRefs = useRef([])

  // Flat array of all words across all verses
  const allWords = useMemo(() => {
    const result = []
    verses.forEach((verse, vi) => {
      const processed = processVerse(verse, mode)
      splitWords(processed).forEach(text => result.push({ text, verse: vi }))
    })
    return result
  }, [verses, mode])

  // Find the active word index using binary search on Whisper timestamps,
  // then map proportionally to the Sefaria word list (counts may differ slightly)
  const activeWordIdx = useMemo(() => {
    if (!wordTimestamps?.length || audioCurrentTime == null || !allWords.length) return -1

    // Binary search: largest index where ts.start <= audioCurrentTime
    let lo = 0, hi = wordTimestamps.length - 1, best = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (wordTimestamps[mid].start <= audioCurrentTime) { best = mid; lo = mid + 1 }
      else hi = mid - 1
    }
    if (best < 0) return -1

    // Proportional mapping from Whisper word index to Sefaria word index
    const wLen = wordTimestamps.length
    const sLen = allWords.length
    if (wLen === 1) return 0
    return Math.min(Math.round(best * (sLen - 1) / (wLen - 1)), sLen - 1)
  }, [wordTimestamps, audioCurrentTime, allWords])

  // Auto-scroll active word into view while audio is playing
  useEffect(() => {
    if (!audioPlaying || activeWordIdx < 0) return
    const el = wordRefs.current[activeWordIdx]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeWordIdx, audioPlaying])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="hebrew" style={{
          fontSize: fontSize + 'px',
          lineHeight: lineHeightForSize(fontSize),
          textAlign: 'justify',
          direction: 'rtl',
          color: 'var(--text)',
          wordSpacing: '0.04em',
        }}>
          {allWords.map((w, i) => (
            <span
              key={i}
              ref={el => { wordRefs.current[i] = el }}
              style={{
                borderRadius: '4px',
                padding: activeWordIdx === i ? '1px 3px' : '1px 0',
                backgroundColor: activeWordIdx === i ? `${bookColor}35` : 'transparent',
                color: activeWordIdx === i ? bookColor : 'inherit',
                boxShadow: activeWordIdx === i ? `0 0 0 1.5px ${bookColor}50` : 'none',
                transition: 'background-color 0.12s, color 0.12s, box-shadow 0.12s',
              }}
            >
              {w.text}{' '}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SplitView({ verses, bookColor, fontSize, wordTimestamps, audioCurrentTime, audioPlaying }) {
  const flexRef = useRef(null)
  const [leftPct, setLeftPct] = useState(50)
  const dragging = useRef(false)
  const wordRefsLeft = useRef([])

  useEffect(() => {
    const onMove = e => {
      if (!dragging.current || !flexRef.current) return
      const rect = flexRef.current.getBoundingClientRect()
      const pct = Math.min(75, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100))
      setLeftPct(pct)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  const allWordsTaamim = useMemo(() => {
    const result = []
    verses.forEach(v => splitWords(processVerse(v, 'taamim')).forEach(t => result.push(t)))
    return result
  }, [verses])

  const allWordsPlain = useMemo(() => {
    const result = []
    verses.forEach(v => splitWords(processVerse(v, 'plain')).forEach(t => result.push(t)))
    return result
  }, [verses])

  const activeWordIdx = useMemo(() => {
    if (!wordTimestamps?.length || audioCurrentTime == null || !allWordsTaamim.length) return -1
    let lo = 0, hi = wordTimestamps.length - 1, best = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (wordTimestamps[mid].start <= audioCurrentTime) { best = mid; lo = mid + 1 }
      else hi = mid - 1
    }
    if (best < 0) return -1
    const wLen = wordTimestamps.length
    const sLen = allWordsTaamim.length
    if (wLen === 1) return 0
    return Math.min(Math.round(best * (sLen - 1) / (wLen - 1)), sLen - 1)
  }, [wordTimestamps, audioCurrentTime, allWordsTaamim])

  useEffect(() => {
    if (!audioPlaying || activeWordIdx < 0) return
    const el = wordRefsLeft.current[activeWordIdx]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeWordIdx, audioPlaying])

  const textBase = {
    fontSize: `${fontSize}px`,
    lineHeight: lineHeightForSize(fontSize),
    textAlign: 'justify',
    direction: 'rtl',
    wordSpacing: '0.04em',
  }

  const startDrag = () => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const wordStyle = (i) => ({
    borderRadius: '4px',
    padding: activeWordIdx === i ? '1px 3px' : '1px 0',
    backgroundColor: activeWordIdx === i ? `${bookColor}35` : 'transparent',
    color: activeWordIdx === i ? bookColor : 'inherit',
    boxShadow: activeWordIdx === i ? `0 0 0 1.5px ${bookColor}50` : 'none',
    transition: 'background-color 0.12s, color 0.12s, box-shadow 0.12s',
  })

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Column headers */}
      <div className="flex-shrink-0 flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="px-5 py-2 text-xs text-center"
          style={{ flex: `0 0 ${leftPct}%`, background: `${bookColor}10`, color: bookColor }}>
          <span className="hebrew">עִם טְעָמִים</span>
          <span className="hidden sm:inline"> · Con taamim</span>
        </div>
        <div style={{ width: '6px', flexShrink: 0, background: 'var(--bg-card)' }} />
        <div className="px-5 py-2 text-xs text-center"
          style={{ flex: 1, background: 'var(--bg-card)', color: 'var(--text-3)' }}>
          <span className="hebrew">כְּתָב בִּלְבָד</span>
          <span className="hidden sm:inline"> · Solo consonantes</span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div ref={flexRef} className="flex" style={{ alignItems: 'flex-start' }}>

          {/* Left pane — taamim with word highlighting */}
          <div style={{
            flex: `0 0 ${leftPct}%`,
            padding: '20px 24px 40px',
            borderRight: '1px solid var(--border-subtle)',
            background: `${bookColor}05`,
          }}>
            <div className="hebrew" style={{ ...textBase, color: 'var(--text)' }}>
              {allWordsTaamim.map((w, i) => (
                <span key={i} ref={el => { wordRefsLeft.current[i] = el }} style={wordStyle(i)}>
                  {w}{' '}
                </span>
              ))}
            </div>
          </div>

          {/* Draggable divider */}
          <div
            onMouseDown={startDrag}
            style={{
              width: '6px',
              flexShrink: 0,
              alignSelf: 'stretch',
              cursor: 'col-resize',
              background: 'var(--bg-card)',
              borderLeft: '1px solid var(--border-subtle)',
              borderRight: '1px solid var(--border-subtle)',
              position: 'relative',
              minHeight: '100%',
            }}
          >
            <span style={{
              position: 'sticky',
              top: '50vh',
              display: 'block',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '16px',
              pointerEvents: 'none',
              lineHeight: 1,
            }}>⋮</span>
          </div>

          {/* Right pane — plain with word highlighting */}
          <div style={{
            flex: 1,
            padding: '20px 24px 40px',
            background: 'var(--bg-card)',
          }}>
            <div className="hebrew" style={{ ...textBase, color: 'var(--text-3)' }}>
              {allWordsPlain.map((w, i) => (
                <span key={i} style={wordStyle(i)}>
                  {w}{' '}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function SeferView({ ref_ }) {
  const { isDark } = useTheme()
  const theme = isDark ? '?theme=dark' : '?theme=light'
  const src = `${import.meta.env.BASE_URL}tikkun/index.html${theme}${tikkunHash(ref_)}`
  return (
    <div className="flex-1 min-h-0">
      <iframe
        key={src}
        src={src}
        title="Modo Sefer · tikkun.io"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        loading="lazy"
      />
    </div>
  )
}

function LoadingState({ bookColor }) {
  const color = bookColor || '#6c33e6'
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: `${color}30`, borderTopColor: color }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Cargando desde Sefaria…
      </p>
      <p className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>
        טוֹעֵן…
      </p>
    </div>
  )
}

function ErrorState({ error, ref_ }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
      <div className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="#f87171" strokeWidth="1.3"/>
          <path d="M9 5.5v4M9 11.5v1" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: '#f87171' }}>No se pudo cargar el texto</p>
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {ref_} · {error}
      </p>
    </div>
  )
}
