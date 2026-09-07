import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]

// Cross-instance coordination: only one <audio> (this player or any other
// audio element on the page, e.g. a student recording) should play at once.
const activePlayers = new Set()
function pauseOthers(me) {
  for (const p of activePlayers) {
    if (p !== me) p.pause()
  }
  // Also pause any plain <audio>/<video> elements elsewhere on the page
  // (e.g. student recording playback) that aren't registered players.
  document.querySelectorAll('audio, video').forEach(el => {
    if (el !== me.audioEl && !el.paused) el.pause()
  })
}

const AudioPlayer = forwardRef(function AudioPlayer({ audio, label, onPlay, onTimeUpdate, onPlayingChange, onDurationChange }, ref) {
  const audioRef = useRef(null)

  const attemptPlay = () => {
    if (!audioRef.current) return
    const p = audioRef.current.play()
    if (p?.catch) {
      p.catch((err) => {
        // Autoplay blocked, interrupted by another source, etc. — the
        // onPause/onError listeners below will reconcile `playing`.
        console.warn('Audio play() failed:', err)
      })
    }
  }

  useImperativeHandle(ref, () => ({
    seekTo(t) {
      if (!audioRef.current) return
      audioRef.current.currentTime = t
      if (audioRef.current.paused) {
        pauseOthers({ audioEl: audioRef.current, pause: () => audioRef.current?.pause() })
        attemptPlay()
      }
    },
    pause() {
      if (!audioRef.current || audioRef.current.paused) return
      audioRef.current.pause()
    },
    toggle() {
      if (!audioRef.current) return
      if (audioRef.current.paused) {
        pauseOthers({ audioEl: audioRef.current, pause: () => audioRef.current?.pause() })
        attemptPlay()
      } else {
        audioRef.current.pause()
      }
    },
  }))
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(2)
  const [error, setError] = useState(false)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setCurrent(0)
    setDuration(0)
    setError(false)
    onPlayingChange?.(false)
  }, [audio?.url])

  // Register/unregister this player so other players (and the module-level
  // pauseOthers helper) can pause it when a different source starts.
  useEffect(() => {
    const entry = { audioEl: audioRef.current, pause: () => audioRef.current?.pause() }
    activePlayers.add(entry)
    return () => activePlayers.delete(entry)
  }, [])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      pauseOthers({ audioEl: audioRef.current, pause: () => audioRef.current?.pause() })
      attemptPlay()
    }
  }

  // Sync UI state from the real <audio> element instead of guessing —
  // catches autoplay rejection, OS/lock-screen pause, call interruptions, etc.
  const handlePlaying = () => {
    setError(false)
    setPlaying(true)
    onPlay?.()
    onPlayingChange?.(true)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing'
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: label || 'Kol Koré',
        artist: 'Kol Koré',
      })
    }
  }

  const handlePause = () => {
    setPlaying(false)
    onPlayingChange?.(false)
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  }

  const handleError = () => {
    setPlaying(false)
    setError(true)
    onPlayingChange?.(false)
  }

  // rAF loop: drives word cursor at ~60fps while playing (timeupdate fires only ~4fps)
  useEffect(() => {
    if (!playing) return
    let id
    const tick = () => {
      if (audioRef.current) onTimeUpdate?.(audioRef.current.currentTime)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [playing, onTimeUpdate])

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const c = audioRef.current.currentTime
    const d = audioRef.current.duration || 1
    setCurrent(c)
    setProgress((c / d) * 100)
  }

  const handleLoaded = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
    audioRef.current.playbackRate = SPEEDS[speedIdx]
    onDurationChange?.(audioRef.current.duration)
  }

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length
    setSpeedIdx(next)
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next]
  }

  const handleEnded = () => {
    setPlaying(false)
    setProgress(0)
    setCurrent(0)
    onPlayingChange?.(false)
  }

  const seek = (e) => {
    if (!audioRef.current) return
    const d = audioRef.current.duration
    if (!d || !isFinite(d)) return // metadata not loaded yet — nothing to seek to
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0]?.clientX ?? e.clientX : e.clientX
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * d
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  // Let the OS media notification / lock screen control play & pause.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.setActionHandler('play', () => {
      pauseOthers({ audioEl: audioRef.current, pause: () => audioRef.current?.pause() })
      attemptPlay()
    })
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause())
    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
    }
  }, [])

  if (!audio) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: 'rgba(108,51,230,0.1)', border: '1px solid rgba(108,51,230,0.2)' }}>
      <audio
        ref={audioRef}
        src={audio.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoaded}
        onEnded={handleEnded}
        onPlaying={handlePlaying}
        onPause={handlePause}
        onError={handleError}
        preload="metadata"
      />

      <button onClick={toggle} disabled={error}
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: error ? 'rgba(220,38,38,0.3)' : playing ? '#6c33e6' : 'rgba(108,51,230,0.3)', opacity: error ? 0.6 : 1, cursor: error ? 'not-allowed' : 'pointer' }}>
        {error ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2.5v4M6 8.5h.01" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        ) : playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="1" width="3" height="10" rx="1" fill="white"/>
            <rect x="7" y="1" width="3" height="10" rx="1" fill="white"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 1.5l7 4.5-7 4.5V1.5z" fill="white"/>
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium truncate" style={{ color: error ? '#f87171' : 'var(--text-2)' }}>
            {error ? '⚠️ Audio no disponible' : `🎧 ${label}`}
          </span>
          <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
        <div className="w-full py-2 -my-2 cursor-pointer relative"
          onClick={seek} onTouchStart={seek}>
          <div className="w-full h-1.5 rounded-full relative" style={{ background: 'var(--bg-card)' }}>
            <div className="h-full rounded-full transition-none"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6c33e6, #a78bfa)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full -translate-x-1/2 transition-none"
              style={{ left: `${progress}%`, background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.5)' }} />
          </div>
        </div>
      </div>

      <button onClick={cycleSpeed}
        className="text-xs flex-shrink-0 px-2 py-1 rounded-lg font-mono font-medium transition-all"
        style={{ background: 'rgba(108,51,230,0.15)', color: '#a78bfa', border: '1px solid rgba(108,51,230,0.25)', minWidth: '38px' }}>
        {SPEEDS[speedIdx]}×
      </button>
    </div>
  )
})

export default AudioPlayer
