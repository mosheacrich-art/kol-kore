import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function GuestLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useTheme()

  const active = location.pathname === '/guest/study' || location.pathname.startsWith('/guest/study/')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <aside className="w-64 flex-shrink-0 flex flex-col py-8 px-4 h-screen sticky top-0"
        style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}>

        <div className="px-3 mb-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <StarSvg />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</div>
              <div className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</div>
            </div>
          </button>
        </div>

        <div className="mx-3 mb-8 p-3 rounded-xl"
          style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.18)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(45,212,191,0.2)', color: '#0d9488' }}>?</div>
            <div>
              <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>Invitado</div>
              <div className="text-xs hebrew" style={{ color: 'rgba(45,212,191,0.7)' }}>אוֹרֵחַ</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <button onClick={() => navigate('/guest/study')}
            className="sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-left"
            style={{
              background: active ? 'rgba(45,212,191,0.1)' : 'transparent',
              borderLeft: active ? '2px solid #2dd4bf' : '2px solid transparent',
              color: active ? '#0d9488' : 'var(--text-3)',
            }}>
            <StudyIcon active={active} />
            <div>
              <div className="text-xs font-medium">Estudiar Perashá</div>
              <div className="text-xs hebrew" style={{ color: active ? 'var(--text-gold)' : 'var(--text-muted)' }}>לִמּוּד</div>
            </div>
          </button>
        </nav>

        <div className="mt-auto px-3 flex flex-col gap-2">
          <button onClick={toggle}
            className="w-full flex items-center gap-2 text-xs py-2.5 px-3 rounded-xl transition-all"
            style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '14px' }}>{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button onClick={() => navigate('/login')}
            className="w-full text-xs py-2.5 px-3 rounded-xl text-left transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            ← Volver al inicio
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
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

function StudyIcon({ active }) {
  const c = active ? '#0d9488' : 'var(--text-3)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 3h5l3 3h4v9H3V3z" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 9h6M6 12h4" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
