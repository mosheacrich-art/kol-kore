import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AudioProvider } from './context/AudioContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import StudentProfile from './pages/student/Profile'
import StudentStudy from './pages/student/Study'
import StudentLayout from './pages/student/Layout'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherStudents from './pages/teacher/Students'
import TeacherHomework from './pages/teacher/Homework'
import TeacherSchedule from './pages/teacher/Schedule'
import TeacherAudioPanel from './pages/teacher/AudioPanel'
import TeacherStudy from './pages/teacher/Study'
import TeacherNotifications from './pages/teacher/Notifications'
import TeacherLayout from './pages/teacher/Layout'
import GuestLayout from './pages/guest/Layout'

function ProtectedRoute({ role, children }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#6c33e6' }} />
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  if (role && profile.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AudioProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/student" element={
                <ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>
              }>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="study" element={<StudentStudy />} />
                <Route path="study/:parashaId" element={<StudentStudy />} />
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
              </Route>
            </Routes>
          </HashRouter>
        </AudioProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
