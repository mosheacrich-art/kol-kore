import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      navigate('/login', { replace: true })
      return
    }

    supabase.auth.exchangeCodeForSession(window.location.href)
      .catch(() => navigate('/login', { replace: true }))
  }, [navigate])

  useEffect(() => {
    const t = setTimeout(() => navigate('/login', { replace: true }), 20000)
    return () => clearTimeout(t)
  }, [navigate])

  useEffect(() => {
    if (loading || !profile) return
    const isNew = sessionStorage.getItem('new_student')
    if (isNew && profile.role === 'student') {
      sessionStorage.removeItem('new_student')
      navigate('/student/subscription', { replace: true })
    } else {
      navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/student/profile', { replace: true })
    }
  }, [profile, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#6c33e6' }} />
    </div>
  )
}
