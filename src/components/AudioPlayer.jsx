import { useState, useRef, useEffect } from 'react'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]

export default function AudioPlayer({ audio, label, onPlay, onTimeUpdate, onPlayingChange }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(2)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setCurrent(0)
    onPlayingChange?.(false)
  }, [audio?.url])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      onPlayingChange?.(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
      onPlay?.()
      onPlayingChange?.(true)
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const c = audioRef.current.currentTime
    const d = audioRef.current.duration || 1
    setCurrent(c)
    setProgress((c / d) * 100)
    onTimeUpdate?.(c)
  }

  const handleLoaded = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
    audioRef.current.playbackRate = SPEEDS[speedIdx]
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
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * audioRef.current.duration
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

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
        preload="metadata"
      />

      <button onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: playing ? '#6c33e6' : 'rgba(108,51,230,0.3)' }}>
        {playing ? (
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
          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-2)' }}>
            🎧 {label}
          </span>
          <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full cursor-pointer relative"
          style={{ background: 'var(--bg-card)' }}
          onClick={seek}>
          <div className="h-full rounded-full transition-none"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6c33e6, #a78bfa)' }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full -translate-x-1/2 transition-none"
            style={{ left: `${progress}%`, background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.5)' }} />
        </div>
      </div>

      <button onClick={cycleSpeed}
        className="text-xs flex-shrink-0 px-2 py-1 rounded-lg font-mono font-medium transition-all"
        style={{ background: 'rgba(108,51,230,0.15)', color: '#a78bfa', border: '1px solid rgba(108,51,230,0.25)', minWidth: '38px' }}>
        {SPEEDS[speedIdx]}×
      </button>
    </div>
  )
}
