import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import LangToggle from '../../components/LangToggle'

export default function GuestLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useTheme()
  const { t } = useLang()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const active = location.pathname === '/guest/study' || location.pathname.startsWith('/guest/study/')
  const go = (path) => { navigate(path); setSidebarOpen(false) }

  const SidebarInner = ({ showClose }) => (
    <>
      <div className="px-3 mb-10 flex items-center justify-between"
        style={{ paddingTop: showClose ? '0' : undefined }}>
        <button onClick={() => go('/')} className="flex items-center gap-3">
          <StarSvg />
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</div>
            <div className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</div>
          </div>
        </button>
        {showClose && (
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg"
            style={{ color: 'var(--text-3)' }}>
            <XIcon />
          </button>
        )}
      </div>

      <div className="mx-3 mb-8 p-3 rounded-xl"
        style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.18)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(45,212,191,0.2)', color: '#0d9488' }}>?</div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{t('guest')}</div>
            <div className="text-xs hebrew" style={{ color: 'rgba(45,212,191,0.7)' }}>אוֹרֵחַ</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <button onClick={() => go('/guest/study')}
          className="sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-left"
          style={{
            background: active ? 'rgba(45,212,191,0.1)' : 'transparent',
            borderLeft: active ? '2px solid #2dd4bf' : '2px solid transparent',
            color: active ? '#0d9488' : 'var(--text-3)',
          }}>
          <StudyIcon active={active} />
          <div>
            <div className="text-xs font-medium">{t('nav_study')}</div>
            <div className="text-xs hebrew" style={{ color: active ? 'var(--text-gold)' : 'var(--text-muted)' }}>לִמּוּד</div>
          </div>
        </button>
      </nav>

      <div className="mt-auto px-3 flex flex-col gap-2">
        <button onClick={toggle}
          className="w-full flex items-center gap-2 text-xs py-2.5 px-3 rounded-xl transition-all"
          style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '14px' }}>{isDark ? '☀️' : '🌙'}</span>
          {isDark ? t('light_mode') : t('dark_mode')}
        </button>
        <LangToggle />
        <button onClick={() => navigate('/login')}
          className="w-full text-xs py-2.5 px-3 rounded-xl text-left transition-all"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          {t('back_to_home')}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col py-8 px-4 h-screen sticky top-0"
        style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}>
        <SidebarInner showClose={false} />
      </aside>

      {/* Mobile sidebar drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col px-4 transition-transform duration-300 ease-in-out sidebar-drawer ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}>
        <SidebarInner showClose />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto scroll-smooth-ios">

        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 flex-shrink-0 app-header"
          style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)', minHeight: '3.5rem' }}>
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)' }}>
            <HamburgerIcon />
          </button>
          <StarSvg size={24} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</span>
          <span className="text-xs hebrew ml-1" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(45,212,191,0.1)', color: '#0d9488', border: '1px solid rgba(45,212,191,0.2)' }}>
            {t('guest')}
          </span>
        </div>

        <Outlet />
      </main>
    </div>
  )
}

function StarSvg({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
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

function StudyIcon({ active }) {
  const c = active ? '#0d9488' : 'var(--text-3)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 3h5l3 3h4v9H3V3z" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 9h6M6 12h4" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
