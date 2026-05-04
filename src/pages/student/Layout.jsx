import { useState } from 'react'
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useStudyTimer } from '../../hooks/useStudyTimer'

const MONTHLY_ID = 'pdt_0Ne7sWfihRRycFHWb1SB2'
const ANNUAL_ID  = 'pdt_0Ne7sn0u5XBSPuebqTIsh'

const navItems = [
  { path: '/student/profile',       label: 'Mi Perfil',       shortLabel: 'Perfil',   heb: 'פְּרוֹפִיל',  icon: ProfileIcon },
  { path: '/student/study',         label: 'Estudiar Perashá', shortLabel: 'Estudiar', heb: 'לִמּוּד',     icon: StudyIcon },
  { path: '/student/imprimir',      label: 'Imprimir Tikún',   shortLabel: 'Imprimir', heb: 'תִּקּוּן',    icon: PrintIcon },
  { path: '/student/subscription',  label: 'Suscripción',      shortLabel: 'Cuenta',   heb: 'הַרְשָׁמָה',  icon: SubscriptionIcon },
]

export default function StudentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isDark, toggle } = useTheme()
  const { user, profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useStudyTimer(profile?.id)

  const go = (path) => { navigate(path); setSidebarOpen(false) }
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Show paywall if student has no active subscription.
  // Exception: if coming back from payment (?success=1), let Subscription.jsx handle the polling.
  const justPaid = searchParams.get('success') === '1'
  const isSubscribed = profile?.subscription_status === 'active'
  if (profile && !isSubscribed && !justPaid) {
    return <Paywall user={user} profile={profile} navigate={navigate} />
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>

      {/* Overlay for mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-shrink-0 flex-col py-8 px-4 w-64 sticky top-0 h-screen"
        style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}>
        <SidebarContent profile={profile} location={location} isDark={isDark}
          toggle={toggle} go={go} signOut={signOut} navigate={navigate} showClose={false} />
      </aside>

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────── */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col px-4
        transition-transform duration-300 ease-in-out sidebar-drawer
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}>
        <SidebarContent profile={profile} location={location} isDark={isDark}
          toggle={toggle} go={go} signOut={signOut} navigate={navigate} showClose
          onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto scroll-smooth-ios main-with-bottom-nav">

        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 flex-shrink-0 app-header"
          style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)', minHeight: '3.5rem' }}>
          <button className="md:hidden p-2 rounded-xl" onClick={() => setSidebarOpen(true)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)' }}>
            <HamburgerIcon />
          </button>
          <StarOfDavidSmall />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</span>
          <span className="text-xs hebrew ml-1" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</span>
        </div>

        <Outlet />
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex mobile-bottom-nav"
        style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-subtle)' }}>
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <button key={item.path} onClick={() => go(item.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 transition-colors"
              style={{ color: active ? '#8b5cf6' : 'var(--text-3)' }}>
              <Icon active={active} />
              <span className="text-[10px] font-medium leading-none">{item.shortLabel}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function SidebarContent({ profile, location, isDark, toggle, go, signOut, navigate, showClose, onClose }) {
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  return (
    <>
      <div className="px-3 mb-10 flex items-center justify-between">
        <button onClick={() => go('/student/profile')} className="flex items-center gap-3">
          <StarOfDavidSmall />
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Perashá</div>
            <div className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</div>
          </div>
        </button>
        {showClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-3)' }}>
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
          const active = isActive(item.path)
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
                <div className="text-xs hebrew" style={{ color: active ? 'var(--text-gold)' : 'var(--text-muted)' }}>
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
    </>
  )
}

function Paywall({ user, profile, navigate }) {
  const [plan, setPlan] = useState('annual')
  const [paying, setPaying] = useState(false)

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: plan === 'annual' ? ANNUAL_ID : MONTHLY_ID,
          userId: user?.id,
          email: user?.email,
          name: profile?.name,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Error al iniciar el pago')
      window.location.href = data.url
    } catch (err) {
      alert(err.message)
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
          <polygon points="14,3 18,10 22,10 18,14 22,18 14,15 6,18 10,14 6,10 10,10"
            fill="none" stroke="rgba(255,202,40,0.7)" strokeWidth="1.2" strokeLinejoin="round"/>
          <polygon points="14,25 10,18 6,18 10,14 6,10 14,13 22,10 18,14 22,18 18,18"
            fill="none" stroke="rgba(255,202,40,0.7)" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
        <div>
          <div className="text-base font-semibold" style={{ color: 'var(--text)' }}>Perashapp</div>
          <div className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</div>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light mb-2" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Hola, {profile?.name?.split(' ')[0] ?? 'bienvenido'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Activa tu acceso para estudiar con audio sincronizado
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">

          <button onClick={() => setPlan('annual')}
            className="rounded-2xl p-4 text-left transition-all relative"
            style={{
              background: plan === 'annual' ? 'rgba(249,184,0,0.07)' : 'var(--bg-card)',
              border: `1.5px solid ${plan === 'annual' ? '#f9b800' : 'var(--border)'}`,
            }}>
            <div className="absolute -top-2.5 right-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'linear-gradient(135deg, #f9b800, #ffd54f)', color: '#0d0b1e', fontSize: '10px' }}>
                Ahorra 17%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: plan === 'annual' ? '#f9b800' : 'var(--border)' }}>
                {plan === 'annual' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f9b800' }} />}
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Anual</span>
            </div>
            <div>
              <span className="text-xl font-light" style={{ color: 'var(--text)' }}>$99</span>
              <span className="text-xs ml-1" style={{ color: 'var(--text-3)' }}>/año</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-gold)' }}>= $8,25/mes</p>
          </button>

          <button onClick={() => setPlan('monthly')}
            className="rounded-2xl p-4 text-left transition-all"
            style={{
              background: plan === 'monthly' ? 'rgba(108,51,230,0.08)' : 'var(--bg-card)',
              border: `1.5px solid ${plan === 'monthly' ? '#8b5cf6' : 'var(--border)'}`,
            }}>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: plan === 'monthly' ? '#8b5cf6' : 'var(--border)' }}>
                {plan === 'monthly' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />}
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Mensual</span>
            </div>
            <div>
              <span className="text-xl font-light" style={{ color: 'var(--text)' }}>$9,99</span>
              <span className="text-xs ml-1" style={{ color: 'var(--text-3)' }}>/mes</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Cancela cuando quieras</p>
          </button>
        </div>

        {/* CTA */}
        <button onClick={handlePay} disabled={paying}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-3"
          style={{
            background: paying ? 'var(--bg-card)' : 'linear-gradient(135deg, #6c33e6, #8b5cf6)',
            color: paying ? 'var(--text-3)' : '#fff',
            border: paying ? '1px solid var(--border)' : 'none',
            boxShadow: paying ? 'none' : '0 4px 20px rgba(108,51,230,0.35)',
          }}>
          {paying ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#8b5cf6' }} />
              Redirigiendo…
            </>
          ) : (
            '14 días gratis · Empezar ahora →'
          )}
        </button>

        <p className="text-xs text-center mb-5" style={{ color: 'var(--text-muted)' }}>
          Sin cargo durante 14 días · Cancela cuando quieras
        </p>

        {/* Guest option */}
        <div className="text-center">
          <button onClick={() => navigate('/guest/study')}
            className="text-xs py-2 px-5 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            Continuar como invitado (sin audio)
          </button>
        </div>
      </div>
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
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke={c} strokeWidth="1.3"/>
      <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function StudyIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path d="M3 3h5l3 3h4v9H3V3z" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 9h6M6 12h4" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function PrintIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="6" width="12" height="8" rx="1" stroke={c} strokeWidth="1.3"/>
      <path d="M5 6V3h8v3" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5 11h8M5 13h5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function SubscriptionIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke={c} strokeWidth="1.3"/>
      <path d="M2 8h14" stroke={c} strokeWidth="1.3"/>
      <path d="M5 12h3M12 12h1" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
