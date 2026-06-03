import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import useTikkunWords from '../hooks/useTikkunWords'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useAliyahText } from '../hooks/useSefaria'
import { processVerse, splitWords } from '../utils/hebrew'
import { useAudio } from '../context/AudioContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { sendPushToUser } from '../lib/sendPush'
import AudioPlayer from './AudioPlayer'
import { BOOK_COLORS } from '../data/parashot'
import { useLang } from '../context/LangContext'
import { AdminUploadButton, AdminRecordButton } from './AdminAudioUpload'

function fmtSec(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const MODE_IDS = ['taamim', 'nikkud', 'plain', 'split', 'sefer']
const MODE_HEB = ['טְעָמִים', 'נִקּוּד', 'כְּתָב', 'מְפוּצָּל', 'סֵפֶר']
const MODE_TKEYS = ['mode_taamim', 'mode_nikkud', 'mode_plain', 'mode_split', 'mode_sefer']

const MIN_FONT = 14
const MAX_FONT = 56

export default function ParashaReader({ parasha, initialAliyah = 0, availableModes = null, adminSync = true }) {
  const { t } = useLang()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const ALL_MODES = MODE_IDS.map((id, i) => ({ id, heb: MODE_HEB[i], label: t(MODE_TKEYS[i]) }))
  const MODES = availableModes ? ALL_MODES.filter(m => availableModes.includes(m.id)) : ALL_MODES
  const ssKey = `aliyah_${parasha.id}`
  const [aliyahIdx, setAliyahIdx] = useState(() => {
    try {
      const saved = sessionStorage.getItem(ssKey)
      if (saved !== null) {
        const n = parseInt(saved, 10)
        if (!isNaN(n) && n < parasha.aliyot.length) return n
      }
    } catch {}
    return initialAliyah
  })

  const setAliyahIdxPersisted = (val) => {
    setAliyahIdx(prev => {
      const next = typeof val === 'function' ? val(prev) : val
      try { sessionStorage.setItem(ssKey, String(next)) } catch {}
      return next
    })
  }
  const [mode, setMode] = useState(availableModes ? availableModes[0] : 'taamim')
  const [cursorEnabled, setCursorEnabled] = useState(true)
  const [fontSize, setFontSize] = useState(() => Capacitor.isNativePlatform() ? 22 : 36)
  const [audioCurrentTime, setAudioCurrentTime] = useState(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [studyMode, setStudyMode] = useState('full') // 'full' | 'word' | 'phrase'
  const [seferFont, setSeferFont] = useState(() => { try { return localStorage.getItem('seferFont') || 'stam' } catch { return 'stam' } })
  const [studyDropdownOpen, setStudyDropdownOpen] = useState(false)
  const [studyDropdownPos, setStudyDropdownPos] = useState({ top: 0, left: 0 })
  const studyBtnRef = useRef(null)
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  const [mobileAliyahOpen, setMobileAliyahOpen] = useState(false)
  const [isMobileUI, setIsMobileUI] = useState(Capacitor.isNativePlatform())
  const [recordingMode, setRecordingMode] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const studyPauseRef = useRef(-1)
  const phraseBoundariesRef = useRef(new Set())
  const audioPlayerRef = useRef(null)

  const handleSeek = useCallback((time) => {
    studyPauseRef.current = -1  // reset so study mode resumes correctly after manual seek
    audioPlayerRef.current?.seekTo(time)
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      const check = () => setIsMobileUI(window.innerWidth < 768)
      check()
      window.addEventListener('resize', check)
      return () => window.removeEventListener('resize', check)
    }
  }, [])

  // Spacebar toggles play/pause (skip when typing in inputs)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return
      e.preventDefault()
      audioPlayerRef.current?.toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close study dropdown on outside click
  useEffect(() => {
    if (!studyDropdownOpen) return
    const close = () => setStudyDropdownOpen(false)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [studyDropdownOpen])
  const [pendingHomework, setPendingHomework] = useState(null)
  const pendingHomeworkRef = useRef(null)
  const [hwMinimized, setHwMinimized] = useState(false)
  const [studentAudios, setStudentAudios] = useState([])
  const [studentAudiosOpen, setStudentAudiosOpen] = useState(false)
  const [playingStudentUrl, setPlayingStudentUrl] = useState(null)
  const [evalMode, setEvalMode] = useState(false)
  const [evalTarget, setEvalTarget] = useState(null)
  const [evalErrors, setEvalErrors] = useState([])
  const [evalComment, setEvalComment] = useState('')
  const [evalSending, setEvalSending] = useState(false)
  const evalAudioRef = useRef(null)
  const { get, upload, uploadStudentRecording, remove } = useAudio()
  const { profile, user } = useAuth()
  const isAdmin = user?.id === '1f4d0329-ddf5-48a4-965f-5f37d7416447'
  const notifiedRef = useRef(new Set())    // aliyot ya notificadas en esta sesión
  const aliyahStartRef = useRef(Date.now()) // para medir tiempo por aliyá

  const buildNotifData = () =>
    profile?.role === 'student' && profile?.teacher_id ? {
      teacherId: profile.teacher_id,
      studentId: profile.id,
      studentName: profile.name,
      parashaName: parasha.name,
      aliyahLabel: currentAliyah.n === 8 ? 'Maftir' : t('aliyah_n_label').replace('{n}', currentAliyah.n),
    } : null

  const handlePlay = () => {
    if (profile?.role !== 'student' || !profile?.id) return

    supabase.rpc('increment_audio_listen', {
      p_student_id: profile.id,
      p_parasha_id: parasha.id,
      p_aliyah_idx: aliyahIdx,
    }).then(({ error }) => { if (error) console.error('increment_audio_listen:', error) })

    if (profile.teacher_id) {
      const notifKey = `${parasha.id}-${aliyahIdx}`
      const aliyahLabel = currentAliyah.n === 8 ? 'Maftir' : t('aliyah_n_label').replace('{n}', currentAliyah.n)
      const notifBase = {
        teacher_id: profile.teacher_id,
        student_id: profile.id,
        student_name: profile.name,
        parasha_id: parasha.id,
        aliyah_idx: aliyahIdx,
        aliyah_label: aliyahLabel,
        message: `${profile.name} ha escuchado ${parasha.name} · ${aliyahLabel}`,
      }
      // Always insert a raw event for the dashboard chart
      supabase.from('notifications').insert({ ...notifBase, type: 'listen_event' })
      // Notify teacher only once per aliyah per session
      if (!notifiedRef.current.has(notifKey)) {
        notifiedRef.current.add(notifKey)
        supabase.from('notifications').insert({ ...notifBase, type: 'listen' })
      }
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

  const currentAliyah = parasha.aliyot[aliyahIdx]
  const bookColor = parasha.color || BOOK_COLORS[parasha.book] || '#6c33e6'
  const teacherAudio = get(parasha.id, aliyahIdx)

  // Generic public audios for this parasha/aliyah
  const [genericAudios, setGenericAudios] = useState([])
  const [audioRefreshKey, setAudioRefreshKey] = useState(0)
  useEffect(() => {
    supabase
      .from('public_audios')
      .select('*')
      .eq('parasha_id', parasha.id)
      .eq('aliyah_idx', aliyahIdx)
      .order('label')
      .then(({ data }) => setGenericAudios(data || []))
  }, [parasha.id, aliyahIdx, audioRefreshKey])

  const deleteGenericAudio = useCallback(async (audioId) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    await fetch('/api/admin-audio-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ audioId }),
    })
    setGenericAudios(prev => prev.filter(a => a.id !== audioId))
    setAudioSourceKey(null)
  }, [])

  const [audioSourceKey, setAudioSourceKey] = useState('teacher')
  const [audioSrcOpen, setAudioSrcOpen] = useState(false)
  const [audioSrcPos, setAudioSrcPos] = useState({ top: 0, left: 0 })
  const audioSrcBtnRef = useRef(null)

  const isTeacher = profile?.role === 'teacher'

  // Reset source when aliyah/parasha changes — teachers default to their slot, students to auto
  useEffect(() => { setAudioSourceKey(isTeacher ? 'teacher' : null) }, [parasha.id, aliyahIdx, isTeacher])

  // Close dropdown on outside click
  useEffect(() => {
    if (!audioSrcOpen) return
    const close = () => setAudioSrcOpen(false)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [audioSrcOpen])

  const allAudioSources = useMemo(() => [
    // Teachers always see "Mi audio"; students only see it if teacher has uploaded
    ...(isTeacher
      ? [{ key: 'teacher', label: t('audio_my') || 'Mi audio' }]
      : teacherAudio ? [{ key: 'teacher', label: t('audio_teacher') || 'Profesor' }] : []),
    ...genericAudios.map(g => ({ key: g.id, label: g.label })),
  ], [isTeacher, teacherAudio, genericAudios, t])

  const audio = useMemo(() => {
    const makeGeneric = g => ({ url: g.public_url, name: g.label, type: g.file_type || 'audio/mp4', wordTimestamps: g.word_timestamps ?? null })
    if (audioSourceKey === 'teacher') {
      // Teachers: show upload/record panel when no audio yet; never fall back to generic
      return teacherAudio || null
    }
    if (audioSourceKey) {
      const g = genericAudios.find(a => a.id === audioSourceKey)
      if (g) return makeGeneric(g)
    }
    // null key (student default) or unresolved key → best available
    if (teacherAudio) return teacherAudio
    if (genericAudios.length > 0) return makeGeneric(genericAudios[0])
    return null
  }, [audioSourceKey, teacherAudio, genericAudios])

  // Fetch student audio recordings for this aliyah (teacher only)
  useEffect(() => {
    if (profile?.role !== 'teacher' || !profile?.id) return
    setStudentAudios([])
    supabase
      .from('notifications')
      .select('id, student_name, student_id, recording_url, created_at, aliyah_label')
      .eq('teacher_id', profile.id)
      .eq('type', 'audio')
      .eq('parasha_id', parasha.id)
      .eq('aliyah_idx', aliyahIdx)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setStudentAudios(data || []))
  }, [profile?.id, profile?.role, parasha.id, aliyahIdx])

  // Fetch pending homework with audio requirement for this aliyah
  useEffect(() => {
    if (profile?.role !== 'student' || !profile?.id) return
    supabase
      .from('homework')
      .select('*')
      .eq('student_id', profile.id)
      .eq('parasha_id', parasha.id)
      .eq('aliyah_idx', aliyahIdx)
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
    setPlayingStudentUrl(null)
    setStudentAudiosOpen(false)
    setEvalMode(false)
    setEvalTarget(null)
    setEvalErrors([])
    setEvalComment('')
    studyPauseRef.current = -1
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

  // Auto-pause based on studyMode
  useEffect(() => {
    if (studyMode === 'full' || !audioPlaying || !audio?.wordTimestamps?.length) return
    if (audioCurrentTime == null) return

    const wt = audio.wordTimestamps
    const v2 = wt[0] != null && !('word' in wt[0])

    let activeIdx = -1
    if (v2) {
      for (let i = 0; i < wt.length; i++) {
        const ts = wt[i]
        if (!ts) continue
        if (ts.start > audioCurrentTime) break
        if (ts.end > audioCurrentTime) { activeIdx = i; break }
        activeIdx = i
      }
    } else {
      let lo = 0, hi = wt.length - 1
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        if (wt[mid].start <= audioCurrentTime) { activeIdx = mid; lo = mid + 1 }
        else hi = mid - 1
      }
    }

    if (activeIdx <= 0 || activeIdx <= studyPauseRef.current) return

    const prevIdx = studyPauseRef.current

    if (studyMode === 'phrase') {
      let shouldPause = false
      for (let i = Math.max(0, prevIdx); i < activeIdx; i++) {
        if (phraseBoundariesRef.current.has(i)) { shouldPause = true; break }
      }
      if (shouldPause) audioPlayerRef.current?.pause()
      studyPauseRef.current = activeIdx
    }
  }, [audioCurrentTime, audioPlaying, studyMode, audio?.wordTimestamps])

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredMime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
        .find(t => MediaRecorder.isTypeSupported(t)) || ''
      const mr = preferredMime ? new MediaRecorder(stream, { mimeType: preferredMime }) : new MediaRecorder(stream)
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
        }
        stream.getTracks().forEach(t => t.stop())
        setRecState('idle')
      }
      mr.start()
      setRecState('recording')
      setRecSeconds(0)
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch (err) {
      setRecordingMode(false)
      setCountdown(null)
      alert(err.name === 'NotAllowedError'
        ? 'Permiso de micrófono denegado. Actívalo en Ajustes → Permisos.'
        : err.message || err)
    }
  }

  const stopRec = () => {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setRecordingMode(false)
  }

  const startRecordingMode = () => {
    if (!isMobileUI) { startRec(); return }
    setRecordingMode(true)
    setCountdown(3)
    let n = 3
    const iv = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(iv)
        setCountdown(null)
        startRec()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      alert(t('audio_file_error'))
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
    }
    e.target.value = ''
  }

  const handleWordMark = (wordIdx, wordText) => {
    const time = evalAudioRef.current?.currentTime ?? 0
    setEvalErrors(prev => {
      const exists = prev.findIndex(e => e.wordIdx === wordIdx)
      if (exists >= 0) return prev.filter((_, i) => i !== exists)
      return [...prev, { wordIdx, word: wordText, time, label: fmtSec(Math.round(time)) }]
    })
  }

  const handleSendEval = async () => {
    if (!evalTarget || !profile) return
    setEvalSending(true)
    const aliyahLabel = currentAliyah.n === 8 ? 'Maftir' : t('aliyah_n_label').replace('{n}', currentAliyah.n)
    const sortedErrors = [...evalErrors].sort((a, b) => a.time - b.time)
    await supabase.from('notifications').insert({
      teacher_id: profile.id,
      student_id: evalTarget.student_id,
      student_name: evalTarget.student_name,
      parasha_id: parasha.id,
      aliyah_idx: aliyahIdx,
      aliyah_label: aliyahLabel,
      type: 'evaluation',
      recording_url: evalTarget.recording_url,
      message: JSON.stringify({ errors: sortedErrors, comment: evalComment, teacherName: profile.name }),
      read: false,
    })
    sendPushToUser(evalTarget.student_id, {
      title: '📝 Nueva evaluación',
      body: `${profile.name} ha evaluado tu lectura de ${parasha.name} · ${aliyahLabel}`,
    })
    setEvalMode(false)
    setEvalTarget(null)
    setEvalErrors([])
    setEvalComment('')
    setEvalSending(false)
  }

  const { verses, loading, error } = useAliyahText(currentAliyah.ref, true, currentAliyah.heText || null)

  // Build phrase boundaries (sof pasuk ׃) for study mode
  useEffect(() => {
    const boundaries = new Set()
    let idx = 0
    for (const verse of verses) {
      verse.split(/\s+/).filter(Boolean).forEach(w => {
        if (w.includes('׃')) boundaries.add(idx)
        idx++
      })
    }
    phraseBoundariesRef.current = boundaries
  }, [verses])

  const nextAliyah = parasha.aliyot[aliyahIdx + 1]
  useAliyahText(nextAliyah?.ref, !!nextAliyah, nextAliyah?.heText || null)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

      {/* ── Recording mode fullscreen overlay ─────────────────────────────── */}
      {recordingMode && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: 'var(--bg)', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

          {/* Text — ocupa todo el espacio disponible */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
            {verses.length > 0 && (
              mode === 'split'
                ? <SplitView verses={verses} bookColor={bookColor} fontSize={fontSize}
                    wordTimestamps={null} audioCurrentTime={null} audioPlaying={false} audioDuration={0}
                    onWordClick={null} onWordMark={null} markedWordIndices={null} />
                : <SingleView verses={verses} mode={mode} bookColor={bookColor} fontSize={fontSize}
                    wordTimestamps={null} audioCurrentTime={null} audioPlaying={false} audioDuration={0}
                    onWordClick={null} onWordMark={null} markedWordIndices={null} homeworkRange={null} />
            )}

            {/* Countdown overlay encima del texto */}
            {countdown !== null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)' }}>
                <div className="text-9xl font-bold tabular-nums"
                  style={{ color: '#fff', lineHeight: 1, textShadow: `0 0 40px ${bookColor}` }}>
                  {countdown}
                </div>
              </div>
            )}
          </div>

          {/* Barra inferior: cronómetro + botón parar */}
          {countdown === null && recState === 'recording' && (
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4"
              style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-deep)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                <span className="text-sm font-medium tabular-nums" style={{ color: '#ef4444' }}>
                  {fmtSec(recSeconds)}
                </span>
              </div>
              <button onClick={stopRec}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{ background: '#ef4444', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="4" y="4" width="14" height="14" rx="2" fill="white"/>
                </svg>
              </button>
              <div style={{ width: 60 }} />
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Top bar */}
      <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>

        {/* Row 1: Parasha info — hidden on mobile */}
        {!isMobileUI && (
          <div className="px-4 sm:px-6 pt-2 pb-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${bookColor}20`, color: bookColor, border: `1px solid ${bookColor}30` }}>
              {parasha.num}
            </div>
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span className="hebrew text-base leading-none" style={{ color: bookColor }}>{parasha.heb}</span>
              <span className="text-sm font-medium truncate" style={{ color: 'var(--text-2)' }}>{parasha.name}</span>
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>{currentAliyah.ref}</span>
            </div>
          </div>
        )}

        {/* Row 2: Mobile compact toolbar OR desktop full toolbar */}
        {isMobileUI ? (
          <div className="flex items-center gap-2 px-4 pb-2">
            {/* Settings button */}
            <button
              onClick={() => setMobileSettingsOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
              א ▾
            </button>

            {/* Aliyah picker button */}
            <button
              onClick={() => setMobileAliyahOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: `${bookColor}18`, color: bookColor, border: `1px solid ${bookColor}35` }}>
              {currentAliyah.n === 8 ? 'Maftir' : `${currentAliyah.n}ª`} Aliyá ▾
            </button>

            {/* Audio source cycle — only when sources available */}
            {allAudioSources.length > 0 && (
              <button
                onClick={() => {
                  if (allAudioSources.length <= 1) return
                  const currentIdx = allAudioSources.findIndex(s => s.key === audioSourceKey)
                  const nextIdx = (currentIdx + 1) % allAudioSources.length
                  setAudioSourceKey(allAudioSources[nextIdx].key)
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4h2l2-2 2 2h2v5H2V4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <circle cx="6" cy="7" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
                </svg>
              </button>
            )}

            {/* Prev/next aliyah arrows */}
            <div className="ml-auto flex items-center gap-1">
              <button
                disabled={aliyahIdx === 0}
                onClick={() => setAliyahIdxPersisted(i => Math.max(0, i - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                disabled={aliyahIdx === parasha.aliyot.length - 1}
                onClick={() => setAliyahIdxPersisted(i => Math.min(parasha.aliyot.length - 1, i + 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="no-scrollbar flex items-center gap-2 px-4 sm:px-6 pb-2 overflow-x-auto">
            <div className="flex items-center gap-1 flex-shrink-0" style={{ display: mode === 'sefer' ? 'none' : undefined }}>
                <button onClick={() => setFontSize(f => Math.max(MIN_FONT, f - 2))}
                  title={t('tooltip_reduce_font')}
                  className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
                  א−
                </button>
                <span className="text-xs w-6 text-center tabular-nums" style={{ color: 'var(--text-muted)' }}>{fontSize}</span>
                <button onClick={() => setFontSize(f => Math.min(MAX_FONT, f + 2))}
                  title={t('tooltip_increase_font')}
                  className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
                  א+
                </button>
              </div>
            <div className="flex-shrink-0 w-px h-5" style={{ background: 'var(--border)' }} />
            {(
              <button
                onClick={() => setCursorEnabled(c => !c)}
                title={cursorEnabled ? t('tooltip_cursor_off') : t('tooltip_cursor_on')}
                className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-all"
                style={{
                  background: cursorEnabled ? `${bookColor}18` : 'var(--bg-card)',
                  border: `1px solid ${cursorEnabled ? bookColor + '40' : 'var(--border-subtle)'}`,
                  color: cursorEnabled ? bookColor : 'var(--text-muted)',
                }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 2l4 9 1.5-3.5L11 6 2 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {MODES.length > 1 && <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  title={m.desc}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                  style={{
                    background: mode === m.id ? `${bookColor}20` : 'transparent',
                    color: mode === m.id ? bookColor : 'var(--text-3)',
                    border: mode === m.id ? `1px solid ${bookColor}35` : '1px solid transparent',
                  }}>
                  <span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>}

            {/* Font toggle — only in sefer mode */}
            {mode === 'sefer' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {[{ id: 'stam', label: 'סטם' }, { id: 'keter', label: 'כתר' }, { id: 'frank', label: 'פרנק' }].map(({ id, label }) => (
                  <button key={id} onClick={() => { setSeferFont(id); try { localStorage.setItem('seferFont', id) } catch {} }}
                    className="px-2 py-1 rounded text-xs transition-all"
                    style={{
                      fontFamily: '"KeterYG", serif',
                      background: seferFont === id ? `${bookColor}20` : 'var(--bg-card)',
                      color: seferFont === id ? bookColor : 'var(--text-3)',
                      border: `1px solid ${seferFont === id ? bookColor + '35' : 'var(--border-subtle)'}`,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Study mode dropdown — only when synced audio exists */}
            {audio?.wordTimestamps && (
              <div className="flex-shrink-0">
                <button
                  ref={studyBtnRef}
                  onClick={() => {
                    const rect = studyBtnRef.current?.getBoundingClientRect()
                    if (rect) setStudyDropdownPos({ top: rect.bottom + 6, left: rect.left })
                    setStudyDropdownOpen(o => !o)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: studyMode !== 'full' ? `${bookColor}18` : 'var(--bg-card)',
                    border: `1px solid ${studyMode !== 'full' ? bookColor + '40' : 'var(--border-subtle)'}`,
                    color: studyMode !== 'full' ? bookColor : 'var(--text-3)',
                  }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M6 3.5v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {t(studyMode === 'full' ? 'study_full' : 'study_phrase')}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Study dropdown rendered via portal so it's never clipped by overflow */}
            {studyDropdownOpen && createPortal(
              <div
                style={{ position: 'fixed', top: studyDropdownPos.top, left: studyDropdownPos.left, zIndex: 9999,
                  background: 'var(--bg-deep)', border: '1px solid var(--border)', borderRadius: '12px',
                  overflow: 'hidden', minWidth: '170px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                onMouseDown={e => e.stopPropagation()}>
                {[
                  { id: 'full',   icon: '▶', tkey: 'study_full' },
                  { id: 'phrase', icon: '↵', tkey: 'study_phrase' },
                ].map(opt => (
                  <button key={opt.id}
                    onClick={() => { setStudyMode(opt.id); setStudyDropdownOpen(false); studyPauseRef.current = -1 }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-all"
                    style={{
                      background: studyMode === opt.id ? `${bookColor}15` : 'transparent',
                      color: studyMode === opt.id ? bookColor : 'var(--text-2)',
                    }}>
                    <span style={{ fontSize: '11px' }}>{opt.icon}</span>
                    {t(opt.tkey)}
                    {studyMode === opt.id && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto">
                        <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>,
              document.body
            )}

            {/* Audio source selector */}
            {allAudioSources.length > 0 && (
              <div className="flex-shrink-0" onMouseDown={e => e.stopPropagation()}>
                <button
                  ref={audioSrcBtnRef}
                  onClick={() => {
                    if (allAudioSources.length <= 1) return
                    const rect = audioSrcBtnRef.current?.getBoundingClientRect()
                    if (rect) setAudioSrcPos({ top: rect.bottom + 6, left: rect.left })
                    setAudioSrcOpen(o => !o)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: audioSourceKey !== 'teacher' ? `${bookColor}18` : 'var(--bg-card)',
                    border: `1px solid ${audioSourceKey !== 'teacher' ? bookColor + '40' : 'var(--border-subtle)'}`,
                    color: audioSourceKey !== 'teacher' ? bookColor : 'var(--text-3)',
                  }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4h2l2-2 2 2h2v5H2V4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <circle cx="6" cy="7" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
                  </svg>
                  {allAudioSources.find(s => s.key === audioSourceKey)?.label || allAudioSources[0]?.label}
                  {allAudioSources.length > 1 && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            )}
            {audioSrcOpen && allAudioSources.length > 1 && createPortal(
              <div
                style={{ position: 'fixed', top: audioSrcPos.top, left: audioSrcPos.left, zIndex: 9999,
                  background: 'var(--bg-deep)', border: '1px solid var(--border)', borderRadius: '12px',
                  overflow: 'hidden', minWidth: '160px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                onMouseDown={e => e.stopPropagation()}>
                {allAudioSources.map(src => {
                  const isGeneric = src.key !== 'teacher'
                  return (
                    <div key={src.key} className="flex items-center"
                      style={{ background: audioSourceKey === src.key ? `${bookColor}15` : 'transparent' }}>
                      <button
                        onClick={() => { setAudioSourceKey(src.key); setAudioSrcOpen(false) }}
                        className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-all"
                        style={{ color: audioSourceKey === src.key ? bookColor : 'var(--text-2)' }}>
                        {src.label}
                        {audioSourceKey === src.key && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto">
                            <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      {isAdmin && isGeneric && (
                        <button
                          onClick={e => { e.stopPropagation(); deleteGenericAudio(src.key) }}
                          className="px-2.5 py-2.5 flex-shrink-0 transition-all"
                          style={{ color: 'rgba(239,68,68,0.5)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}>
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M2 3h7M4.5 3V2h2v1M4 3l.5 6M7 3l-.5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>,
              document.body
            )}

            {/* Aliyah nav — right side of same row */}
            <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
              <button
                disabled={aliyahIdx === 0}
                onClick={() => setAliyahIdxPersisted(i => Math.max(0, i - 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {parasha.aliyot.map((a, i) => {
                const aliyahAudio = get(parasha.id, i)
                return (
                  <button key={i}
                    onClick={() => setAliyahIdxPersisted(i)}
                    className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all relative"
                    style={{
                      background: aliyahIdx === i ? bookColor : 'var(--bg-card)',
                      color: aliyahIdx === i ? '#fff' : 'var(--text-3)',
                      border: `1px solid ${aliyahIdx === i ? 'transparent' : 'var(--border-subtle)'}`,
                    }}>
                    {a.n === 8 ? 'Maftir' : `${a.n}ª`}
                    {aliyahAudio && (
                      <span
                        title={aliyahAudio.wordTimestamps ? t('tooltip_audio_synced') : t('tooltip_audio_available')}
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
              <button
                disabled={aliyahIdx === parasha.aliyot.length - 1}
                onClick={() => setAliyahIdxPersisted(i => Math.min(parasha.aliyot.length - 1, i + 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile settings bottom sheet */}
      {mobileSettingsOpen && createPortal(
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileSettingsOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl pb-safe"
            style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-subtle)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: 'var(--border)' }} />
            <div className="px-5 pb-2 flex flex-col gap-5">
              {/* Font size */}
              {mode !== 'sefer' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Tamaño fuente</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setFontSize(f => Math.max(MIN_FONT, f - 2))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
                      א−
                    </button>
                    <span className="text-sm w-8 text-center tabular-nums font-medium" style={{ color: 'var(--text)' }}>{fontSize}</span>
                    <button onClick={() => setFontSize(f => Math.min(MAX_FONT, f + 2))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
                      א+
                    </button>
                  </div>
                </div>
              )}

              {/* Modes */}
              {MODES.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Modo</span>
                  <div className="flex gap-2 flex-wrap">
                    {MODES.map(m => (
                      <button key={m.id} onClick={() => { setMode(m.id); setMobileSettingsOpen(false) }}
                        className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: mode === m.id ? `${bookColor}20` : 'var(--bg-card)',
                          color: mode === m.id ? bookColor : 'var(--text-3)',
                          border: `1px solid ${mode === m.id ? bookColor + '35' : 'var(--border-subtle)'}`,
                        }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sefer fonts */}
              {mode === 'sefer' && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Fuente sefer</span>
                  <div className="flex gap-2">
                    {[{ id: 'stam', label: 'סטם' }, { id: 'keter', label: 'כתר' }, { id: 'frank', label: 'פרנק' }].map(({ id, label }) => (
                      <button key={id} onClick={() => { setSeferFont(id); try { localStorage.setItem('seferFont', id) } catch {} setMobileSettingsOpen(false) }}
                        className="px-4 py-2 rounded-xl text-xs transition-all"
                        style={{
                          background: seferFont === id ? `${bookColor}20` : 'var(--bg-card)',
                          color: seferFont === id ? bookColor : 'var(--text-3)',
                          border: `1px solid ${seferFont === id ? bookColor + '35' : 'var(--border-subtle)'}`,
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Mobile aliyah bottom sheet */}
      {mobileAliyahOpen && createPortal(
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileAliyahOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
            style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-subtle)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: 'var(--border)' }} />
            <div className="px-4 pb-2 grid grid-cols-4 gap-2">
              {parasha.aliyot.map((a, i) => {
                const aliyahAudio = get(parasha.id, i)
                return (
                  <button key={i}
                    onClick={() => { setAliyahIdxPersisted(i); setMobileAliyahOpen(false) }}
                    className="relative flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
                    style={{
                      background: aliyahIdx === i ? `${bookColor}20` : 'var(--bg-card)',
                      border: `1px solid ${aliyahIdx === i ? bookColor + '35' : 'var(--border-subtle)'}`,
                      color: aliyahIdx === i ? bookColor : 'var(--text-2)',
                    }}>
                    <span className="text-sm font-semibold">{a.n === 8 ? 'M' : a.n}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{a.n === 8 ? 'Maftir' : `${a.n}ª`}</span>
                    {aliyahAudio && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                        style={{ background: aliyahAudio.wordTimestamps ? '#22c55e' : bookColor, border: '1px solid var(--bg)' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Hidden file input — accessible from banner and audio bar */}
      <input ref={uploadInputRef} type="file" accept="audio/*,video/mp4,.mp4" className="hidden"
        onChange={handleUploadFile} />

      {/* Homework banner */}
      {pendingHomework && (
        hwMinimized ? (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5"
            style={{ background: 'rgba(108,51,230,0.08)', borderBottom: '1px solid rgba(108,51,230,0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6c33e6' }} />
            <span className="text-xs flex-1 truncate" style={{ color: '#6c33e6' }}>{t('pending_hw')}</span>
            <button onClick={() => setHwMinimized(false)}
              className="text-xs px-2 py-0.5 rounded transition-all"
              style={{ color: '#6c33e6', background: 'rgba(108,51,230,0.12)', border: '1px solid rgba(108,51,230,0.2)' }}>
              ▾
            </button>
          </div>
        ) : (
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
                <p className="text-xs font-semibold" style={{ color: '#6c33e6' }}>{t('pending_hw')}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{pendingHomework.task}</p>
                {pendingHomework.word_start != null && (
                  <p className="text-xs mt-0.5" style={{ color: '#d97706' }}>
                    📍 Palabras {pendingHomework.word_start + 1}–{pendingHomework.word_end + 1}
                  </p>
                )}
              </div>
              <button onClick={() => setHwMinimized(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: 'rgba(108,51,230,0.15)', color: '#6c33e6', border: '1px solid rgba(108,51,230,0.25)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 6.5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {recState === 'idle' && pendingHomework.require_audio && (
              <div className="flex gap-2 pl-10">
                <button onClick={startRecordingMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(108,51,230,0.18)', color: '#6c33e6', border: '1px solid rgba(108,51,230,0.3)' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M5.5 9.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {t('record')}
                </button>
                <button onClick={() => uploadInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1v7M2 5l3.5-4L9 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 9.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  {t('upload')}
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Student upload success message */}
      {uploadedMsg && (
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2"
          style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="5" stroke="#16a34a" strokeWidth="1.2"/>
            <path d="M3.5 6l2 2L8.5 4" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-medium" style={{ color: '#16a34a' }}>{t('audio_sent')}</span>
        </div>
      )}


      {/* Student audios panel — teacher only */}
      {profile?.role === 'teacher' && studentAudios.length > 0 && (
        <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setStudentAudiosOpen(o => !o)}
            className="w-full flex items-center gap-2 px-5 py-2 text-xs font-medium transition-all"
            style={{ background: evalMode ? 'rgba(239,68,68,0.06)' : 'rgba(108,51,230,0.06)', color: evalMode ? '#ef4444' : '#8b5cf6' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3.5" y="0.5" width="3" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
              <path d="M1.5 5c0 2 1.5 3.5 3.5 3.5S8.5 7 8.5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              <path d="M8 7l3 3M11 7l-3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            {evalMode ? t('eval_evaluating').replace('{name}', evalTarget?.student_name) : t('eval_student_audios').replace('{n}', studentAudios.length)}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto"
              style={{ transform: studentAudiosOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {studentAudiosOpen && (
            <div className="flex flex-col gap-1 px-4 pb-3 pt-1"
              style={{ background: 'rgba(108,51,230,0.04)' }}>
              {studentAudios.map((sa, i) => {
                const isEvalTarget = evalMode && evalTarget?.id === sa.id
                return (
                  <div key={sa.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{
                      background: isEvalTarget ? 'rgba(239,68,68,0.08)' : playingStudentUrl === sa.recording_url ? 'rgba(108,51,230,0.1)' : 'var(--bg-card)',
                      border: `1px solid ${isEvalTarget ? 'rgba(239,68,68,0.25)' : playingStudentUrl === sa.recording_url ? 'rgba(108,51,230,0.25)' : 'var(--border-subtle)'}`,
                    }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                      style={{ background: isEvalTarget ? 'rgba(239,68,68,0.15)' : 'rgba(108,51,230,0.15)', color: isEvalTarget ? '#ef4444' : '#8b5cf6' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-2)' }}>{sa.student_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(sa.created_at).toLocaleDateString(t('date_locale'), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <audio
                      ref={isEvalTarget ? evalAudioRef : null}
                      controls
                      src={sa.recording_url}
                      preload="none"
                      onPlay={() => setPlayingStudentUrl(sa.recording_url)}
                      onPause={() => setPlayingStudentUrl(null)}
                      onEnded={() => setPlayingStudentUrl(null)}
                      style={{ height: '28px', width: '140px', borderRadius: '6px', flexShrink: 0 }}
                    />
                    {!evalMode ? (
                      <button
                        onClick={() => { setEvalMode(true); setEvalTarget(sa); setEvalErrors([]); setEvalComment('') }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1 7.5V9h1.5l4.5-4.5-1.5-1.5L1 7.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                          <path d="M6.5 2l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                        {t('eval_evaluate')}
                      </button>
                    ) : isEvalTarget ? (
                      <button
                        onClick={() => { setEvalMode(false); setEvalTarget(null); setEvalErrors([]); setEvalComment('') }}
                        className="px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                        {t('cancel')}
                      </button>
                    ) : null}
                  </div>
                )
              })}

              {/* Eval panel */}
              {evalMode && (
                <div className="mt-2 rounded-xl p-3 flex flex-col gap-2.5"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>
                      {evalErrors.length === 0
                        ? t('eval_errors_hint')
                        : evalErrors.length === 1
                          ? t('eval_one_error')
                          : t('eval_n_errors').replace('{n}', evalErrors.length)}
                    </p>
                  </div>
                  {evalErrors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {[...evalErrors].sort((a, b) => a.time - b.time).map((err, i) => (
                        <button key={i}
                          onClick={() => setEvalErrors(prev => prev.filter(e => e.wordIdx !== err.wordIdx))}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                          title={t('eval_remove_error')}>
                          <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>{err.label}</span>
                          <span className="hebrew text-sm" style={{ color: '#ef4444' }}>{err.word}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>×</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={evalComment}
                    onChange={e => setEvalComment(e.target.value)}
                    placeholder={t('eval_comment_placeholder')}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl text-xs resize-none outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                  <button
                    onClick={handleSendEval}
                    disabled={evalSending || evalErrors.length === 0}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: evalErrors.length === 0 || evalSending ? 'var(--bg-card)' : 'rgba(239,68,68,0.12)',
                      color: evalErrors.length === 0 || evalSending ? 'var(--text-muted)' : '#ef4444',
                      border: `1px solid ${evalErrors.length === 0 || evalSending ? 'var(--border)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                    {evalSending ? t('sending') : evalErrors.length === 0 ? t('eval_send_no_errors') : t('eval_send').replace('{name}', evalTarget?.student_name)}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {loading && <LoadingState bookColor={bookColor} />}
        {error && <ErrorState error={error} ref_={currentAliyah.ref} />}
        {mode === 'sefer'
          ? <SeferView
              parasha={parasha}
              isDark={isDark}
              aliyahRef={currentAliyah.ref}
              wordTimestamps={cursorEnabled ? (audio?.wordTimestamps ?? null) : null}
              audioCurrentTime={cursorEnabled ? audioCurrentTime : null}
              seferFont={seferFont}
            />
          : !loading && !error && verses.length > 0 && (
              mode === 'split'
                ? <SplitView
                    verses={verses}
                    bookColor={bookColor}
                    fontSize={fontSize}
                    wordTimestamps={cursorEnabled && !evalMode ? (audio?.wordTimestamps ?? null) : null}
                    audioCurrentTime={cursorEnabled && !evalMode ? audioCurrentTime : null}
                    audioPlaying={audioPlaying}
                    audioDuration={audioDuration}
                    onWordClick={cursorEnabled && audio && !evalMode ? handleSeek : null}
                    onWordMark={evalMode ? handleWordMark : null}
                    markedWordIndices={evalMode ? new Set(evalErrors.map(e => e.wordIdx)) : null}
                  />
                : <SingleView
                    verses={verses}
                    mode={mode}
                    bookColor={bookColor}
                    fontSize={fontSize}
                    wordTimestamps={cursorEnabled && !evalMode ? (audio?.wordTimestamps ?? null) : null}
                    audioCurrentTime={cursorEnabled && !evalMode ? audioCurrentTime : null}
                    audioPlaying={audioPlaying}
                    audioDuration={audioDuration}
                    onWordClick={cursorEnabled && audio && !evalMode ? handleSeek : null}
                    onWordMark={evalMode ? handleWordMark : null}
                    markedWordIndices={evalMode ? new Set(evalErrors.map(e => e.wordIdx)) : null}
                    homeworkRange={pendingHomework?.word_start != null ? { start: pendingHomework.word_start, end: pendingHomework.word_end } : null}
                  />
            )
        }
        {!loading && !error && verses.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>
          </div>
        )}
      </div>

      {/* Audio bar */}
      {<div className="flex-shrink-0 px-4 py-2.5 flex items-center justify-end gap-2"
        style={isMobileUI && profile?.role === 'student' ? {} : { borderTop: '1px solid var(--border-subtle)', background: 'var(--overlay)' }}>

        {recState === 'recording' ? (
          <>
            <div className="flex items-center gap-2 flex-1 justify-start">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-medium tabular-nums" style={{ color: '#ef4444' }}>
                {t('record')}… {fmtSec(recSeconds)}
              </span>
            </div>
            <button onClick={stopRec}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1.5" y="1.5" width="7" height="7" rx="1" fill="#ef4444"/>
              </svg>
              {t('stop')}
            </button>
          </>
        ) : isMobileUI && audio ? (
          <>
            <div className="flex-1 min-w-0">
              <AudioPlayer
                ref={audioPlayerRef}
                audio={audio}
                label={currentAliyah.label}
                onPlay={handlePlay}
                onTimeUpdate={setAudioCurrentTime}
                onPlayingChange={setAudioPlaying}
                onDurationChange={setAudioDuration}
              />
            </div>
            <button onClick={startRecordingMode} title={t('tooltip_record_send')}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              🎙️
            </button>
          </>
        ) : isMobileUI && !audio ? (
          <div className="w-full flex items-center justify-end">
            <button onClick={startRecordingMode} title={t('tooltip_record_send')}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-lg"
              style={{ background: `${bookColor}15`, border: `1px solid ${bookColor}30` }}>
              🎙️
            </button>
          </div>
        ) : audio ? (
          <>
            <div className="flex-1 min-w-0">
              <AudioPlayer
                ref={audioPlayerRef}
                audio={audio}
                label={currentAliyah.label}
                onPlay={handlePlay}
                onTimeUpdate={setAudioCurrentTime}
                onPlayingChange={setAudioPlaying}
                onDurationChange={setAudioDuration}
              />
            </div>
            {profile?.role === 'student' && (
              <button onClick={startRec} title={t('tooltip_record_send')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M5.5 9.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {t('record')}
              </button>
            )}
            {profile?.role !== 'student' && (
              <button onClick={startRec} title={t('tooltip_record_replace')}
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
              <button onClick={() => remove(parasha.id, aliyahIdx)} title={t('tooltip_delete_audio')}
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
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
                <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke={bookColor} strokeWidth="1.2" opacity="0.5"/>
                <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke={bookColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
              </svg>
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {profile?.role === 'student' ? t('no_audio') : t('no_audio_teacher')}
              </span>
            </div>
            <button onClick={() => uploadInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v7M2 5l3.5-4L9 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 9.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {t('upload')}
            </button>
            <button onClick={startRec}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
              style={{ background: `${bookColor}15`, color: bookColor, border: `1px solid ${bookColor}30` }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="3.5" y="0.5" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M5.5 9.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {t('record')}
            </button>
          </>
        )}
        {isAdmin && (
          <AdminUploadButton
            parashaId={parasha.id}
            aliyahIdx={aliyahIdx}
            aliyahRef={currentAliyah?.ref || parasha.id}
            noSync={!adminSync}
            onSaved={() => setAudioRefreshKey(k => k + 1)}
          />
        )}
        {isAdmin && (
          <AdminRecordButton
            parashaId={parasha.id}
            aliyahIdx={aliyahIdx}
            aliyahRef={currentAliyah?.ref || parasha.id}
            noSync={!adminSync}
            onSaved={() => setAudioRefreshKey(k => k + 1)}
          />
        )}
      </div>}
    </div>
  )
}

function lineHeightForSize(fs) {
  return fs <= 20 ? 3.4 : fs <= 28 ? 3.2 : 3.0
}

function colorWord(text) {
  return text
}

// Strip nikud and trope marks, keep only Hebrew consonants for comparison.
function stripHebrew(s) {
  return s.replace(/[^א-ת]/g, '')
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++)
      curr[j] = a[i-1] === b[j-1] ? prev[j-1] : 1 + Math.min(prev[j], curr[j-1], prev[j-1])
    prev.splice(0, prev.length, ...curr)
  }
  return prev[b.length]
}

// Align Whisper word indices to Sefaria word indices.
// Returns { w2s: whisperIdx→sefariaIdx, s2w: sefariaIdx→whisperIdx }.
// Uses greedy anchor matching + linear interpolation between anchors.
function buildAlignMap(whisperWords, sefariaTexts) {
  const wn = whisperWords.map(w => stripHebrew(w.word))
  const sn = sefariaTexts.map(stripHebrew)
  const wLen = wn.length, sLen = sn.length
  if (!wLen || !sLen) return { w2s: [], s2w: [] }
  if (wLen === 1) return { w2s: [0], s2w: Array.from({ length: sLen }, () => 0) }

  const WINDOW = 8
  const anchors = [{ wi: 0, si: 0 }]
  let sStart = 0
  for (let wi = 0; wi < wLen; wi++) {
    if (!wn[wi].length) continue
    let best = -1, bestScore = 0
    const sEnd = Math.min(sStart + WINDOW, sLen)
    for (let si = sStart; si < sEnd; si++) {
      if (!sn[si]) continue
      const maxLen = Math.max(wn[wi].length, sn[si].length)
      const score = 1 - levenshtein(wn[wi], sn[si]) / maxLen
      const minScore = maxLen <= 3 ? 1 : maxLen <= 4 ? 0.75 : 0.85
      if (score >= minScore && score > bestScore) { bestScore = score; best = si }
    }
    if (best >= 0) { anchors.push({ wi, si: best }); sStart = best + 1 }
  }
  anchors.push({ wi: wLen - 1, si: sLen - 1 })

  const w2s = new Array(wLen)
  for (let ai = 0; ai < anchors.length - 1; ai++) {
    const { wi: w0, si: s0 } = anchors[ai]
    const { wi: w1, si: s1 } = anchors[ai + 1]
    for (let wi = w0; wi <= w1; wi++) {
      const t = w1 > w0 ? (wi - w0) / (w1 - w0) : 0
      w2s[wi] = Math.min(Math.round(s0 + t * (s1 - s0)), sLen - 1)
    }
  }

  const s2w = new Array(sLen).fill(-1)
  for (let wi = 0; wi < wLen; wi++) { const si = w2s[wi]; if (s2w[si] < 0) s2w[si] = wi }
  let last = 0
  for (let si = 0; si < sLen; si++) { if (s2w[si] >= 0) last = s2w[si]; else s2w[si] = last }

  return { w2s, s2w }
}

// v2 timestamps: [{start,end}, ...] indexed by sefariaWordIdx (no `word` field)
// v1 timestamps: [{word, start, end}, ...] raw Whisper output
function isV2(wordTimestamps) {
  const first = wordTimestamps?.find(x => x != null)
  return first != null && !('word' in first)
}

// Map a Sefaria word index to a playback time.
function wordIdxToTime(wordIdx, wordTimestamps, s2w, duration) {
  if (!wordTimestamps?.length) {
    return duration > 0 && s2w?.length > 0 ? (wordIdx / Math.max(1, s2w.length - 1)) * duration : null
  }
  if (isV2(wordTimestamps)) {
    return wordTimestamps[wordIdx]?.start ?? null
  }
  // v1: use inverse align map
  if (s2w?.length) {
    const wi = s2w[wordIdx] ?? -1
    if (wi >= 0 && wi < wordTimestamps.length) return wordTimestamps[wi].start
  }
  const wLen = wordTimestamps.length
  const totalWords = s2w?.length ?? 0
  const wi = wLen === 1 ? 0 : Math.min(Math.round(wordIdx * (wLen - 1) / Math.max(1, totalWords - 1)), wLen - 1)
  return wordTimestamps[wi].start
}

function SingleView({ verses, mode, bookColor, fontSize, wordTimestamps, audioCurrentTime, audioPlaying, audioDuration, onWordClick, onWordMark, markedWordIndices, homeworkRange }) {
  const wordRefs = useRef([])
  const [hoverIdx, setHoverIdx] = useState(-1)


  const allWords = useMemo(() => {
    const result = []
    verses.forEach((verse, vi) => {
      const processed = processVerse(verse, mode)
      splitWords(processed).forEach(text => result.push({ text, verse: vi }))
    })
    return result
  }, [verses, mode])

  const alignMap = useMemo(
    () => isV2(wordTimestamps) ? null : buildAlignMap(wordTimestamps ?? [], allWords.map(w => w.text)),
    [wordTimestamps, allWords]
  )

  // Fill null gaps in v2 timestamps by interpolating between surrounding anchors
  const filledTimestamps = useMemo(() => {
    if (!wordTimestamps?.length || !isV2(wordTimestamps)) return wordTimestamps
    const result = [...wordTimestamps]
    let i = 0
    while (i < result.length) {
      if (result[i] !== null) { i++; continue }
      const gapStart = i
      while (i < result.length && result[i] === null) i++
      const gapEnd = i
      const prevTs = gapStart > 0 ? result[gapStart - 1] : null
      const nextTs = gapEnd < result.length ? result[gapEnd] : null
      const t0 = prevTs ? prevTs.end : nextTs ? nextTs.start : 0
      const t1 = nextTs ? nextTs.start : prevTs ? prevTs.end : 0
      const count = gapEnd - gapStart
      const step = count > 0 ? (t1 - t0) / count : 0
      for (let j = gapStart; j < gapEnd; j++) {
        const s = t0 + step * (j - gapStart)
        result[j] = { start: s, end: s + step }
      }
    }
    return result
  }, [wordTimestamps])

  const activeWordIdx = useMemo(() => {
    if (!filledTimestamps?.length || audioCurrentTime == null || !allWords.length) return -1
    if (isV2(filledTimestamps)) {
      const limit = Math.min(filledTimestamps.length, allWords.length)
      // Highlight first word from the moment audio starts, before first timestamp
      const firstTs = filledTimestamps.find(ts => ts != null)
      if (firstTs && audioCurrentTime < firstTs.start) return 0
      let best = -1
      for (let i = 0; i < limit; i++) {
        const ts = filledTimestamps[i]
        if (!ts) continue
        if (ts.start > audioCurrentTime) break
        if (ts.end > audioCurrentTime) return i
        best = i
      }
      return best
    }
    // v1 path
    const firstTs = filledTimestamps[0]
    if (firstTs && audioCurrentTime < firstTs.start) return alignMap?.w2s[0] ?? 0
    let lo = 0, hi = filledTimestamps.length - 1, best = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (filledTimestamps[mid].start <= audioCurrentTime) { best = mid; lo = mid + 1 }
      else hi = mid - 1
    }
    if (best < 0) return -1
    return alignMap?.w2s[best] ?? 0
  }, [filledTimestamps, audioCurrentTime, allWords, alignMap])

  useEffect(() => {
    if (!audioPlaying || activeWordIdx < 0) return
    const el = wordRefs.current[activeWordIdx]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeWordIdx, audioPlaying])

  const handleClick = (i) => {
    if (onWordMark) { onWordMark(i, allWords[i].text); return }
    if (!onWordClick) return
    const t = wordIdxToTime(i, wordTimestamps, alignMap?.s2w, audioDuration)
    if (t != null) onWordClick(t)
  }

  const canInteract = !!onWordClick || !!onWordMark

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="hebrew-reader" style={{
          fontSize: fontSize + 'px',
          lineHeight: lineHeightForSize(fontSize),
          textAlign: 'justify',
          direction: 'rtl',
          color: 'var(--text)',
        }}>
          {allWords.map((w, i) => {
            const isActive = activeWordIdx === i
            const isMarked = markedWordIndices?.has(i)
            const isHover = hoverIdx === i && !isActive && !isMarked
            const inHwRange = homeworkRange != null && i >= homeworkRange.start && i <= homeworkRange.end
            let color = 'inherit'
            if (isMarked) color = '#ef4444'
            else if (isActive) color = '#3b82f6'
            else if (isHover) color = onWordMark ? '#ef4444' : '#3b82f6'
            return (
              <span
                key={i}
                ref={el => { wordRefs.current[i] = el }}
                onClick={() => handleClick(i)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(-1)}
                style={{
                  color,
                  cursor: canInteract ? 'pointer' : 'default',
                  transition: 'color 0.08s',
                  textDecoration: isMarked ? 'underline wavy #ef4444' : 'none',
                  background: inHwRange ? 'rgba(249,184,0,0.22)' : 'transparent',
                  borderRadius: inHwRange ? '3px' : '0',
                  padding: inHwRange ? '2px 1px' : '0',
                }}
              >
                {colorWord(w.text, mode)}{' '}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const BASE_URL = import.meta.env.BASE_URL

function _parseAliyahRef(ref) {
  const m = String(ref || '').match(/^(\w+)\s+(\d+):(\d+)-(\d+):(\d+)$/)
  if (!m) return null
  return { startCh: parseInt(m[2]), startV: parseInt(m[3]), endCh: parseInt(m[4]), endV: parseInt(m[5]) }
}

function _inRange(word, range) {
  if (!range) return true
  if (word.c < range.startCh || word.c > range.endCh) return false
  if (word.c === range.startCh && word.v < range.startV) return false
  if (word.c === range.endCh   && word.v > range.endV)   return false
  return true
}

function SeferView({ parasha, isDark, aliyahRef, wordTimestamps, audioCurrentTime, seferFont = 'stam' }) {
  const iframeRef = useRef(null)
  const seferFontRef = useRef(seferFont)
  const heb = parasha?.heb || ''
  const src = `${BASE_URL}imprimir-tikun/index.html?embed=1&theme=${isDark ? 'dark' : 'light'}#parasha=${encodeURIComponent(heb)}`

  const { words: allWords } = useTikkunWords(parasha?.id, parasha?.combined ? parasha.parts : null)

  const ALIYAH_LABELS = ['שני', 'שלישי', 'רביעי', 'חמישי', 'ששי', 'שביעי', 'מפטיר']
  const aliyotMarkersRef = useRef([])
  const aliyotMarkers = useMemo(() => {
    if (!allWords?.length || !parasha?.aliyot?.length) return []
    return parasha.aliyot.slice(1).map((aliyah, idx) => {
      const r = _parseAliyahRef(aliyah.ref)
      if (!r) return null
      let count = 0
      for (const w of allWords) { if (_inRange(w, r)) break; count++ }
      return { wordIdx: count, label: ALIYAH_LABELS[idx] || String(aliyah.n) }
    }).filter(Boolean)
  }, [allWords, parasha?.aliyot])

  const range = useMemo(() => _parseAliyahRef(aliyahRef), [aliyahRef])

  const aliyahWordOffset = useMemo(() => {
    if (!allWords || !range) return 0
    let count = 0
    for (const w of allWords) {
      if (_inRange(w, range)) break
      count++
    }
    return count
  }, [allWords, range])

  const aliyahWords = useMemo(() => {
    if (!allWords) return []
    return allWords.filter(w => _inRange(w, range))
  }, [allWords, range])

  const isV2Ts = useMemo(() => {
    const first = wordTimestamps?.find(x => x != null)
    return first != null && !('word' in first)
  }, [wordTimestamps])

  const aliyahWordIdx = useMemo(() => {
    if (!wordTimestamps?.length || audioCurrentTime == null || !aliyahWords.length) return -1
    if (isV2Ts) {
      let best = -1
      const limit = Math.min(wordTimestamps.length, aliyahWords.length)
      for (let i = 0; i < limit; i++) {
        const ts = wordTimestamps[i]
        if (!ts) continue
        if (ts.start > audioCurrentTime) break
        if (ts.end > audioCurrentTime) return i
        best = i
      }
      return best
    }
    let lo = 0, hi = wordTimestamps.length - 1, best = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (wordTimestamps[mid].start <= audioCurrentTime) { best = mid; lo = mid + 1 }
      else hi = mid - 1
    }
    if (best < 0) return -1
    const wLen = wordTimestamps.length, sLen = aliyahWords.length
    return wLen === 1 ? 0 : Math.min(Math.round(best * (sLen - 1) / (wLen - 1)), sLen - 1)
  }, [wordTimestamps, audioCurrentTime, aliyahWords, isV2Ts])

  const globalWordIdx = aliyahWordIdx >= 0 ? aliyahWordOffset + aliyahWordIdx : -1

  const globalWordIdxRef = useRef(-1)
  const aliyahWordOffsetRef = useRef(0)

  useEffect(() => {
    globalWordIdxRef.current = globalWordIdx
    iframeRef.current?.contentWindow?.postMessage({ wordIdx: globalWordIdx }, '*')
  }, [globalWordIdx])

  // Scroll iframe to aliyah start whenever aliyah or data changes
  useEffect(() => {
    if (!allWords) return
    aliyahWordOffsetRef.current = aliyahWordOffset
    iframeRef.current?.contentWindow?.postMessage({ scrollToWord: aliyahWordOffset }, '*')
  }, [aliyahWordOffset, allWords])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const onLoad = () => {
      const win = iframe.contentWindow
      if (!win) return
      win.postMessage({ scrollToWord: aliyahWordOffsetRef.current }, '*')
      win.postMessage({ wordIdx: globalWordIdxRef.current }, '*')
      win.postMessage({ setFont: seferFontRef.current }, '*')
      win.postMessage({ aliyotMarkers: aliyotMarkersRef.current }, '*')
    }
    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [])

  useEffect(() => {
    seferFontRef.current = seferFont
    iframeRef.current?.contentWindow?.postMessage({ setFont: seferFont }, '*')
  }, [seferFont])

  useEffect(() => {
    aliyotMarkersRef.current = aliyotMarkers
    iframeRef.current?.contentWindow?.postMessage({ aliyotMarkers }, '*')
  }, [aliyotMarkers])

  return (
    <iframe
      ref={iframeRef}
      key={`${isDark ? 'dark' : 'light'}-${parasha?.id ?? ''}`}
      src={src}
      style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
      title="תיקון קוראים"
    />
  )
}

function SplitView({ verses, bookColor, fontSize, wordTimestamps, audioCurrentTime, audioPlaying, audioDuration, onWordClick, onWordMark, markedWordIndices }) {
  const flexRef = useRef(null)
  const [leftPct, setLeftPct] = useState(50)
  const [hoverIdx, setHoverIdx] = useState(-1)

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  const dragging = useRef(false)
  const wordRefsLeft = useRef([])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

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

  const alignMap = useMemo(
    () => isV2(wordTimestamps) ? null : buildAlignMap(wordTimestamps ?? [], allWordsTaamim),
    [wordTimestamps, allWordsTaamim]
  )

  const activeWordIdx = useMemo(() => {
    if (!wordTimestamps?.length || audioCurrentTime == null || !allWordsTaamim.length) return -1
    if (isV2(wordTimestamps)) {
      let best = -1
      const limit = Math.min(wordTimestamps.length, allWordsTaamim.length)
      for (let i = 0; i < limit; i++) {
        const ts = wordTimestamps[i]
        if (ts && ts.start <= audioCurrentTime) best = i
        else if (ts && ts.start > audioCurrentTime) break
      }
      return best
    }
    let lo = 0, hi = wordTimestamps.length - 1, best = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (wordTimestamps[mid].start <= audioCurrentTime) { best = mid; lo = mid + 1 }
      else hi = mid - 1
    }
    if (best < 0) return -1
    return alignMap?.w2s[best] ?? 0
  }, [wordTimestamps, audioCurrentTime, allWordsTaamim, alignMap])

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

  const canInteract = !!onWordClick || !!onWordMark

  const handleClickLeft = (i) => {
    if (onWordMark) { onWordMark(i, allWordsTaamim[i]); return }
    if (!onWordClick) return
    const t = wordIdxToTime(i, wordTimestamps, alignMap?.s2w, audioDuration)
    if (t != null) onWordClick(t)
  }

  const wordStyle = (i, forLeft = false) => {
    const isActive = activeWordIdx === i
    const isMarked = forLeft && markedWordIndices?.has(i)
    const isHover = forLeft && hoverIdx === i && !isActive && !isMarked
    let color = 'inherit'
    if (isMarked) color = '#ef4444'
    else if (isActive) color = '#3b82f6'
    else if (isHover) color = onWordMark ? '#ef4444' : '#3b82f6'
    return {
      color,
      cursor: forLeft && canInteract ? 'pointer' : 'default',
      transition: 'color 0.08s',
      textDecoration: isMarked ? 'underline wavy #ef4444' : 'none',
    }
  }

  // Mobile: stack panels vertically
  if (isMobile) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div style={{ padding: '16px 20px 20px', background: `${bookColor}05`, borderBottom: '1px solid var(--border-subtle)' }}>
          <p className="text-xs mb-3" style={{ color: bookColor }}>
            <span className="hebrew">עִם טְעָמִים</span> · Con taamim
          </p>
          <div className="hebrew-reader" style={{ ...textBase, color: 'var(--text)' }}>
            {allWordsTaamim.map((w, i) => (
              <span key={i} ref={el => { wordRefsLeft.current[i] = el }}
                style={wordStyle(i, true)}
                onClick={() => handleClickLeft(i)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(-1)}>
                {w}{' '}
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 20px 40px', background: 'var(--bg-card)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
            <span className="hebrew">כְּתָב בִּלְבָד</span> · Solo consonantes
          </p>
          <div className="hebrew-reader" style={{ ...textBase, color: 'var(--text-3)' }}>
            {allWordsPlain.map((w, i) => (
              <span key={i} style={wordStyle(i)}>{w}{' '}</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

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
            <div className="hebrew-reader" style={{ ...textBase, color: 'var(--text)' }}>
              {allWordsTaamim.map((w, i) => (
                <span key={i} ref={el => { wordRefsLeft.current[i] = el }}
                  style={wordStyle(i, true)}
                  onClick={() => handleClickLeft(i)}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(-1)}>
                  {colorWord(w, 'taamim')}{' '}
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
            <div className="hebrew-reader" style={{ ...textBase, color: 'var(--text-3)' }}>
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
      <p className="text-sm font-medium" style={{ color: '#f87171' }}>{t('text_load_error')}</p>
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {ref_} · {error}
      </p>
    </div>
  )
}
