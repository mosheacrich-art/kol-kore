import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()
  const hasCode = window.location.search.includes('code=')

  useEffect(() => {
    if (loading) return
    if (!profile) {
      // If there's still a code in the URL, the exchange may still be in flight
      if (hasCode) return
      navigate('/login', { replace: true })
      return
    }
    const isNew = sessionStorage.getItem('new_student')
    if (isNew && profile.role === 'student') {
      sessionStorage.removeItem('new_student')
      navigate('/student/subscription', { replace: true })
    } else {
      navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/student/profile', { replace: true })
    }
  }, [profile, loading, navigate, hasCode])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#6c33e6' }} />
    </div>
  )
}
