import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useStudyTimer } from '../../hooks/useStudyTimer'

const navItems = [
  { path: '/student/profile', label: 'Mi Perfil', heb: 'פְּרוֹפִיל', icon: ProfileIcon },
  { path: '/student/study', label: 'Estudiar Perashá', heb: 'לִמּוּד', icon: StudyIcon },
  { path: '/student/imprimir', label: 'Imprimir Tikún', heb: 'תִּקּוּן', icon: PrintIcon },
  { path: '/student/subscription', label: 'Suscripción', heb: 'הַרְשָׁמָה', icon: SubscriptionIcon },
]

export default function StudentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useTheme()
  const { profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useStudyTimer(profile?.id)

  const isStudy = location.pathname.startsWith('/student/study')
  const go = (path) => { navigate(path); if (isStudy) setSidebarOpen(false) }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {isStudy && sidebarOpen && (
        <div className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`flex-shrink-0 flex flex-col py-8 px-4
          ${isStudy
            ? `fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'w-64'
          }`}
        style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}>

        <div className="px-3 mb-10 flex items-center justify-between">
          <button onClick={() => go('/student/profile')} className="flex items-center gap-3">
            <StarOfDavidSmall />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</div>
              <div className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</div>
            </div>
          </button>
          {isStudy && (
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg"
              style={{ color: 'var(--text-3)' }}>
              <XIcon />
            </button>
          )}
        </div>

        <div className="mx-3 mb-8 p-3 rounded-xl"
          style={{ background: 'rgba(108,51,230,0.12)', border: '1px solid rgba(108,51,230,0.18)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(108,51,230,0.3)', color: '#c4b5fd' }}>
              {profile?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div>
              <div className="text-xs font-medium truncate max-w-[120px]" style={{ color: 'var(--text)' }}>
                {profile?.name ?? 'Alumno'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-3)' }}>תַּלְמִיד</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button key={item.path} onClick={() => go(item.path)}
                className="sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-left"
                style={{
                  background: active ? 'rgba(108,51,230,0.13)' : 'transparent',
                  borderLeft: active ? '2px solid #8b5cf6' : '2px solid transparent',
                  color: active ? '#8b5cf6' : 'var(--text-3)',
                }}>
                <Icon active={active} />
                <div>
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-xs hebrew"
                    style={{ color: active ? 'var(--text-gold)' : 'var(--text-muted)' }}>
                    {item.heb}
                  </div>
                </div>
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

      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 flex-shrink-0"
          style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)' }}>
          {isStudy && (
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)' }}>
              <HamburgerIcon />
            </button>
          )}
          <StarOfDavidSmall />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</span>
          <span className="text-xs hebrew ml-1" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</span>
        </div>

        <Outlet />
      </main>
    </div>
  )
}

function StarOfDavidSmall() {
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

function ProfileIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke={c} strokeWidth="1.3"/>
      <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function StudyIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 3h5l3 3h4v9H3V3z" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 9h6M6 12h4" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function PrintIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="6" width="12" height="8" rx="1" stroke={c} strokeWidth="1.3"/>
      <path d="M5 6V3h8v3" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5 11h8M5 13h5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function SubscriptionIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke={c} strokeWidth="1.3"/>
      <path d="M2 8h14" stroke={c} strokeWidth="1.3"/>
      <path d="M5 12h3M12 12h1" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
