import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Tracks active time a student spends in the app.
// Pauses counting when the tab is hidden, saves to DB every 60s and on unmount.
export function useStudyTimer(studentId) {
  const activeStartRef = useRef(null) // timestamp when counting started/resumed
  const pendingRef = useRef(0)        // accumulated seconds not yet saved

  useEffect(() => {
    if (!studentId) return

    activeStartRef.current = Date.now()
    pendingRef.current = 0

    const flush = async (minSeconds = 1) => {
      let seconds = pendingRef.current
      if (activeStartRef.current) {
        seconds += (Date.now() - activeStartRef.current) / 1000
        activeStartRef.current = Date.now()
      }
      pendingRef.current = 0
      if (seconds < minSeconds) return
      const today = new Date().toISOString().split('T')[0]
      await supabase.rpc('increment_study_time', {
        p_student_id: studentId,
        p_date: today,
        p_seconds: Math.round(seconds),
      })
    }

    const handleVisibility = () => {
      if (document.hidden) {
        // Tab hidden — bank the elapsed time, stop counting
        if (activeStartRef.current) {
          pendingRef.current += (Date.now() - activeStartRef.current) / 1000
          activeStartRef.current = null
        }
        flush(5)
      } else {
        // Tab visible again — resume
        activeStartRef.current = Date.now()
      }
    }

    const interval = setInterval(() => flush(30), 60_000)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      // Save any remaining time on unmount (page close / sign-out)
      if (activeStartRef.current) {
        pendingRef.current += (Date.now() - activeStartRef.current) / 1000
        activeStartRef.current = null
      }
      flush(1)
    }
  }, [studentId])
}
