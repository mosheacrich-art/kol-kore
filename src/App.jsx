import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AudioProvider } from './context/AudioContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Capacitor } from '@capacitor/core'

const Landing            = lazy(() => import('./pages/Landing'))
const Login              = lazy(() => import('./pages/Login'))
const ResetPassword      = lazy(() => import('./pages/ResetPassword'))
const Privacy            = lazy(() => import('./pages/legal/Privacy'))
const Terms              = lazy(() => import('./pages/legal/Terms'))
const ImprimirTikun      = lazy(() => import('./pages/ImprimirTikun'))

const StudentLayout      = lazy(() => import('./pages/student/Layout'))
const StudentProfile     = lazy(() => import('./pages/student/Profile'))
const StudentStudy       = lazy(() => import('./pages/student/Study'))
const StudentSubscription = lazy(() => import('./pages/student/Subscription'))

const GuestLayout        = lazy(() => import('./pages/guest/Layout'))

const TeacherLayout      = lazy(() => import('./pages/teacher/Layout'))
const TeacherDashboard   = lazy(() => import('./pages/teacher/Dashboard'))
const TeacherStudents    = lazy(() => import('./pages/teacher/Students'))
const TeacherHomework    = lazy(() => import('./pages/teacher/Homework'))
const TeacherSchedule    = lazy(() => import('./pages/teacher/Schedule'))
const TeacherAudioPanel  = lazy(() => import('./pages/teacher/AudioPanel'))
const TeacherStudy       = lazy(() => import('./pages/teacher/Study'))
const TeacherNotifications = lazy(() => import('./pages/teacher/Notifications'))

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#6c33e6' }} />
    </div>
  )
}

function ProtectedRoute({ role, children }) {
  const { profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!profile) return <Navigate to="/login" replace />
  if (role && profile.role !== role) return <Navigate to="/login" replace />
  return children
}

function AndroidBackHandler() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let appPlugin
    import('@capacitor/app').then(({ App }) => {
      appPlugin = App
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) navigate(-1)
        else App.exitApp()
      })
    })
    return () => { appPlugin?.removeAllListeners() }
  }, [navigate])
  return null
}

function AppRoutes() {
  const { recoveryMode, profile, loading } = useAuth()
  const navigate = useNavigate()

  // Supabase OAuth puts tokens in the URL hash, conflicting with HashRouter.
  // Detect the callback synchronously so we can show a spinner immediately.
  const isOAuthCallback = window.location.hash.includes('access_token=')

  useEffect(() => {
    if (!isOAuthCallback || loading || !profile) return
    const isNew = sessionStorage.getItem('new_student')
    if (isNew && profile.role === 'student') {
      sessionStorage.removeItem('new_student')
      navigate('/student/subscription', { replace: true })
    } else {
      navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/student/profile', { replace: true })
    }
  }, [isOAuthCallback, profile, loading, navigate])

  if (recoveryMode) return <ResetPassword />

  // Show spinner immediately during OAuth callback — don't let HashRouter
  // try to parse the token as a route and render a blank page.
  if (isOAuthCallback && !profile) return <Spinner />
  return (
    <>
      <AndroidBackHandler />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          <Route path="/student" element={
            <ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="study" element={<StudentStudy />} />
            <Route path="study/:parashaId" element={<StudentStudy />} />
            <Route path="subscription" element={<StudentSubscription />} />
            <Route path="imprimir" element={<ImprimirTikun />} />
          </Route>

          <Route path="/guest" element={<GuestLayout />}>
            <Route index element={<Navigate to="study" replace />} />
            <Route path="study" element={<StudentStudy basePath="/guest/study" />} />
            <Route path="study/:parashaId" element={<StudentStudy basePath="/guest/study" />} />
          </Route>

          <Route path="/teacher" element={
            <ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="homework" element={<TeacherHomework />} />
            <Route path="schedule" element={<TeacherSchedule />} />
            <Route path="audio" element={<TeacherAudioPanel />} />
            <Route path="study" element={<TeacherStudy />} />
            <Route path="study/:parashaId" element={<TeacherStudy />} />
            <Route path="notifications" element={<TeacherNotifications />} />
            <Route path="imprimir" element={<ImprimirTikun />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AudioProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AudioProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
