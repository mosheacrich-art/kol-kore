import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const navItems = [
  { path: '/teacher/dashboard', label: 'Dashboard', heb: 'לוּחַ' },
  { path: '/teacher/students', label: 'Alumnos', heb: 'תַּלְמִידִים' },
  { path: '/teacher/homework', label: 'Deberes', heb: 'שִׁעוּרֵי בַּיִת' },
  { path: '/teacher/schedule', label: 'Clases', heb: 'שִׁעוּרִים' },
  { path: '/teacher/audio', label: 'Audios', heb: 'הֶקְלָטוֹת' },
  { path: '/teacher/study', label: 'Perashiot', heb: 'פָּרָשִׁיּוֹת' },
  { path: '/teacher/notifications', label: 'Notificaciones', heb: 'הוֹדָעוֹת', badge: true },
  { path: '/teacher/imprimir', label: 'Imprimir Tikún', heb: 'תִּקּוּן' },
]

export default function TeacherLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useTheme()
  const { profile, signOut } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('teacher_id', profile.id)
      .eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0))
  }, [profile?.id, location.pathname])

  const go = (path) => { navigate(path); setSidebarOpen(false) }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col py-8 px-4
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}>
        <div className="px-3 mb-10 flex items-center justify-between">
          <button onClick={() => go('/teacher/dashboard')} className="flex items-center gap-3">
            <StarSvg />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</div>
              <div className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</div>
            </div>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg"
            style={{ color: 'var(--text-3)' }}>
            <XIcon />
          </button>
        </div>

        <div className="mx-3 mb-8 p-3 rounded-xl"
          style={{ background: 'rgba(249,184,0,0.1)', border: '1px solid rgba(249,184,0,0.18)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'rgba(249,184,0,0.25)', color: '#92610a' }}>
              {profile?.name?.[0]?.toUpperCase() ?? 'M'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                {profile?.name ?? 'Profesor'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-gold)' }}>מוֹרֶה · Profesor</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button key={item.path} onClick={() => go(item.path)}
                className="sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-left"
                style={{
                  background: active ? 'rgba(249,184,0,0.1)' : 'transparent',
                  borderLeft: active ? '2px solid #f9b800' : '2px solid transparent',
                  color: active ? '#b8860b' : 'var(--text-3)',
                }}>
                <NavDot active={active} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-xs hebrew"
                    style={{ color: active ? 'var(--text-gold)' : 'var(--text-muted)' }}>
                    {item.heb}
                  </div>
                </div>
                {item.badge && unreadCount > 0 && (
                  <span className="ml-auto text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#6c33e6', color: 'white', fontSize: '9px' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto px-3 flex flex-col gap-2">
          <button onClick={toggle}
            className="w-full flex items-center gap-2 text-xs py-2.5 px-3 rounded-xl transition-all"
            style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '14px' }}>{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button onClick={async () => { await signOut(); navigate('/login') }}
            className="w-full text-xs py-2.5 px-3 rounded-xl text-left transition-all"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
            → Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-auto">
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 flex-shrink-0"
          style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl relative"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)' }}>
            <HamburgerIcon />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                style={{ background: '#6c33e6', fontSize: '8px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <StarSvg />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</span>
          <span className="text-xs hebrew ml-1" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</span>
        </div>

        <Outlet />
      </main>
    </div>
  )
}

function NavDot({ active }) {
  return (
    <span className="w-4 h-4 rounded-full flex-shrink-0"
      style={{ background: active ? '#f9b800' : 'transparent', border: `1px solid ${active ? '#f9b800' : 'var(--text-3)'}` }} />
  )
}

function StarSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <polygon points="14,3 18,10 22,10 18,14 22,18 14,15 6,18 10,14 6,10 10,10"
        fill="none" stroke="rgba(255,202,40,0.6)" strokeWidth="1.2" strokeLinejoin="round"/>
      <polygon points="14,25 10,18 6,18 10,14 6,10 14,13 22,10 18,14 22,18 18,18"
        fill="none" stroke="rgba(255,202,40,0.6)" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
