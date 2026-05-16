import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'

import { AudioProvider } from './context/AudioContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LangProvider, useLang } from './context/LangContext'
import { Capacitor } from '@capacitor/core'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

const AuthCallback        = lazy(() => import('./pages/AuthCallback'))
const Landing             = lazy(() => import('./pages/Landing'))
const Login               = lazy(() => import('./pages/Login'))
const ResetPassword       = lazy(() => import('./pages/ResetPassword'))
const Privacy             = lazy(() => import('./pages/legal/Privacy'))
const Terms               = lazy(() => import('./pages/legal/Terms'))
const ImprimirTikun       = lazy(() => import('./pages/ImprimirTikun'))

const StudentLayout        = lazy(() => import('./pages/student/Layout'))
const StudentProfile       = lazy(() => import('./pages/student/Profile'))
const StudentStudy         = lazy(() => import('./pages/student/Study'))
const StudentSubscription  = lazy(() => import('./pages/student/Subscription'))
const StudentNotifications = lazy(() => import('./pages/student/Notifications'))
const StudentHaftara       = lazy(() => import('./pages/student/HaftaraStudy'))
const StudentTefila        = lazy(() => import('./pages/student/TefilaStudy'))

const GuestLayout         = lazy(() => import('./pages/guest/Layout'))

const TeacherLayout       = lazy(() => import('./pages/teacher/Layout'))
const TeacherDashboard    = lazy(() => import('./pages/teacher/Dashboard'))
const TeacherStudents     = lazy(() => import('./pages/teacher/Students'))
const TeacherHomework     = lazy(() => import('./pages/teacher/Homework'))
const TeacherSchedule     = lazy(() => import('./pages/teacher/Schedule'))
const TeacherAudioPanel   = lazy(() => import('./pages/teacher/AudioPanel'))
const TeacherStudy        = lazy(() => import('./pages/teacher/Study'))
const TeacherHaftara      = lazy(() => import('./pages/teacher/HaftaraStudy'))
const TeacherTefila       = lazy(() => import('./pages/teacher/TefilaStudy'))
const TeacherNotifications = lazy(() => import('./pages/teacher/Notifications'))
const AccountSettings      = lazy(() => import('./pages/AccountSettings'))
const AdminPage            = lazy(() => import('./pages/admin/AdminPage'))

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
  const { recoveryMode } = useAuth()
  if (recoveryMode) return <ResetPassword />
  return (
    <>
      <AndroidBackHandler />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
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
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="haftara" element={<StudentHaftara />} />
            <Route path="haftara/:haftaraId" element={<StudentHaftara />} />
            <Route path="tefila" element={<StudentTefila />} />
            <Route path="tefila/:tefilaId" element={<StudentTefila />} />
            <Route path="imprimir" element={<ImprimirTikun />} />
            <Route path="account" element={<AccountSettings />} />
          </Route>

          <Route path="/guest" element={<GuestLayout />}>
            <Route index element={<Navigate to="study" replace />} />
            <Route path="study" element={<StudentStudy basePath="/guest/study" />} />
            <Route path="study/:parashaId" element={<StudentStudy basePath="/guest/study" />} />
          </Route>

          <Route path="/admin" element={<AdminPage />} />

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
            <Route path="haftara" element={<TeacherHaftara />} />
            <Route path="haftara/:haftaraId" element={<TeacherHaftara />} />
            <Route path="tefila" element={<TeacherTefila />} />
            <Route path="tefila/:tefilaId" element={<TeacherTefila />} />
            <Route path="notifications" element={<TeacherNotifications />} />
            <Route path="imprimir" element={<ImprimirTikun />} />
            <Route path="account" element={<AccountSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

// Use HashRouter on native (Capacitor), BrowserRouter on web
const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

function DirWrapper({ children }) {
  const { lang } = useLang()
  return <div dir={lang === 'he' ? 'rtl' : 'ltr'} style={{ display: 'contents' }}>{children}</div>
}

export default function App() {
  return (
    <LangProvider>
      <DirWrapper>
        <ThemeProvider>
          <AuthProvider>
            <AudioProvider>
              <Router>
                <AppRoutes />
              </Router>
              {!Capacitor.isNativePlatform() && <Analytics />}
              {!Capacitor.isNativePlatform() && <SpeedInsights />}
            </AudioProvider>
          </AuthProvider>
        </ThemeProvider>
      </DirWrapper>
    </LangProvider>
  )
}
