import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useStudyTimer } from '../../hooks/useStudyTimer'
import { supabase } from '../../lib/supabase'
import LangToggle from '../../components/LangToggle'

const MONTHLY_ID = 'pdt_0Ne7sWfihRRycFHWb1SB2'
const ANNUAL_ID  = 'pdt_0Ne7sn0u5XBSPuebqTIsh'

const NAV_KEYS = [
  { path: '/student/profile',        key: 'nav_profile',        shortKey: 'nav_profile',       heb: 'פְּרוֹפִיל',  icon: ProfileIcon },
  { path: '/student/study',          key: 'nav_study',          shortKey: 'nav_study',          heb: 'לִמּוּד',     icon: StudyIcon },
  { path: '/student/haftara',        key: 'nav_haftara',        shortKey: 'nav_haftara',        heb: 'הַפְטָרָה',   icon: HaftaraIcon },
  { path: '/student/notifications',  key: 'nav_notifications',  shortKey: 'nav_notifications',  heb: 'הֲעָרוֹת',   icon: NotifIcon, badge: true },
  { path: '/student/imprimir',       key: 'nav_print',          shortKey: 'nav_print',          heb: 'תִּקּוּן',    icon: PrintIcon },
  { path: '/student/subscription',   key: 'nav_subscription',   shortKey: 'nav_subscription',   heb: 'הַרְשָׁמָה',  icon: SubscriptionIcon },
  { path: '/student/account',        key: 'nav_account',        shortKey: 'nav_account',        heb: 'חֶשְׁבּוֹן',   icon: AccountIcon },
]

export default function StudentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isDark, toggle } = useTheme()
  const { user, profile, signOut } = useAuth()
  const { t, lang } = useLang()
  const isRTL = lang === 'he'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadEvals, setUnreadEvals] = useState(0)
  useStudyTimer(profile?.id)

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', profile.id)
      .eq('type', 'evaluation')
      .eq('read', false)
      .then(({ count }) => setUnreadEvals(count ?? 0))
  }, [profile?.id, location.pathname])

  const navItems = NAV_KEYS.map(n => ({ ...n, label: t(n.key) ?? n.heb, shortLabel: t(n.shortKey) ?? n.heb }))

  const go = (path) => { navigate(path); setSidebarOpen(false) }
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const justPaid = searchParams.get('success') === '1'
  const isSubscribed = profile?.subscription_status === 'active'

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
        style={{ background: 'var(--bg-deep)', borderInlineEnd: '1px solid var(--border-subtle)' }}>
        <SidebarContent profile={profile} location={location} isDark={isDark}
          toggle={toggle} go={go} signOut={signOut} navigate={navigate} showClose={false} navItems={navItems} unreadEvals={unreadEvals} />
      </aside>

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────── */}
      <aside className={`md:hidden fixed inset-y-0 z-50 w-64 flex flex-col px-4
        transition-transform duration-300 ease-in-out sidebar-drawer
        ${isRTL ? 'right-0' : 'left-0'}
        ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-deep)', borderInlineEnd: '1px solid var(--border-subtle)' }}>
        <SidebarContent profile={profile} location={location} isDark={isDark}
          toggle={toggle} go={go} signOut={signOut} navigate={navigate} showClose
          onClose={() => setSidebarOpen(false)} navItems={navItems} unreadEvals={unreadEvals} />
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto scroll-smooth-ios main-with-bottom-nav">

        {/* Header — mobile only (hamburger to open drawer) */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 flex-shrink-0 app-header"
          style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)', minHeight: '3.5rem' }}>
          <button className="p-2 rounded-xl" onClick={() => setSidebarOpen(true)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)' }}>
            <HamburgerIcon />
          </button>
          <StarOfDavidSmall />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Parashá</span>
          <span className="text-xs hebrew ml-1" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</span>
        </div>

        {/* Warning banner for non-subscribed students */}
        {profile && !isSubscribed && !justPaid && (
          <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
            style={{ background: 'rgba(251,191,36,0.12)', borderBottom: '1px solid rgba(251,191,36,0.25)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M8 2L14 13H2L8 2z" stroke="#f59e0b" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M8 6v3.5M8 11.5v.5" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <p className="text-xs flex-1" style={{ color: '#f59e0b' }}>{t('not_subscribed_banner')}</p>
            <button onClick={() => navigate('/student/subscription')}
              className="text-xs font-semibold px-3 py-1 rounded-lg flex-shrink-0 transition-all"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b', border: '1px solid rgba(251,191,36,0.3)' }}>
              {t('not_subscribed_cta')}
            </button>
          </div>
        )}

        <Outlet />
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex mobile-bottom-nav"
        style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-subtle)' }}>
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          const lockedMobile = !isSubscribed && item.path === '/student/imprimir'
          const showBadge = item.badge && unreadEvals > 0
          return (
            <button key={item.path} onClick={() => lockedMobile ? go('/student/subscription') : go(item.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 transition-colors relative"
              style={{ color: active ? '#8b5cf6' : lockedMobile ? 'var(--text-muted)' : 'var(--text-3)' }}>
              <Icon active={active} />
              {showBadge && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: '#ef4444', color: '#fff' }}>{unreadEvals > 9 ? '9+' : unreadEvals}</span>
              )}
              <span className="text-[10px] font-medium leading-none">{item.shortLabel}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function SidebarContent({ profile, location, isDark, toggle, go, signOut, navigate, showClose, onClose, navItems, unreadEvals = 0 }) {
  const { t } = useLang()
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  const isSubscribed = profile?.subscription_status === 'active'
  return (
    <>
      <div className="px-3 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarOfDavidSmall />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Parashá</span>
        </div>
        {showClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-3)' }}>
            <XIcon />
          </button>
        )}
      </div>

      <button onClick={() => go('/student/profile')}
        className="mx-3 mb-6 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
        style={{ background: 'rgba(108,51,230,0.08)', border: '1px solid rgba(108,51,230,0.15)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,51,230,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(108,51,230,0.08)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'rgba(108,51,230,0.3)', color: '#c4b5fd' }}>
          {profile?.name?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
            {profile?.name ?? 'Alumno'}
          </div>
          <div className="text-xs" style={{ color: '#a78bfa' }}>
            {isSubscribed ? t('subscribed_badge') : 'תַּלְמִיד'}
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: 'rgba(139,92,246,0.5)' }}>
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <nav className="flex flex-col gap-1">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          const lockedItem = !isSubscribed && item.path === '/student/imprimir'
          const showBadge = item.badge && unreadEvals > 0
          return (
            <button key={item.path} onClick={() => lockedItem ? go('/student/subscription') : go(item.path)}
              className="sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-left"
              style={{
                background: active ? 'rgba(108,51,230,0.13)' : 'transparent',
                borderInlineStart: active ? '2px solid #8b5cf6' : '2px solid transparent',
                color: active ? '#8b5cf6' : lockedItem ? 'var(--text-muted)' : 'var(--text-3)',
                opacity: lockedItem ? 0.7 : 1,
              }}>
              <Icon active={active} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{item.label}</div>
                <div className="text-xs hebrew" style={{ color: active ? 'var(--text-gold)' : 'var(--text-muted)' }}>
                  {item.heb}
                </div>
              </div>
              {showBadge && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: '#ef4444', color: '#fff' }}>{unreadEvals > 9 ? '9+' : unreadEvals}</span>
              )}
              {lockedItem && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                  <rect x="2" y="5.5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto px-3 flex flex-col gap-2">
        <LangToggle />
        <button onClick={toggle}
          className="w-full flex items-center gap-2 text-xs py-2.5 px-3 rounded-xl transition-all"
          style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '14px' }}>{isDark ? '☀️' : '🌙'}</span>
          {isDark ? t('light_mode') : t('dark_mode')}
        </button>
        <button onClick={async () => { await signOut(); navigate('/login') }}
          className="w-full text-xs py-2.5 px-3 rounded-xl text-left transition-all"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
          → {t('logout')}
        </button>
      </div>
    </>
  )
}

const FEATURES = [
  'Audio del profesor sincronizado palabra a palabra',
  'Todas las parashas del año',
  'Taamim, nikkud y modo sefer',
  'Envío de grabaciones al profesor',
  'Acceso desde cualquier dispositivo',
]

function Paywall({ user, profile, navigate }) {
  const [plan, setPlan] = useState('annual')
  const [paying, setPaying] = useState(false)
  const { signOut } = useAuth()

  const handleGuest = async () => {
    await signOut()
    navigate('/guest/study')
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          productId: plan === 'annual' ? ANNUAL_ID : MONTHLY_ID,
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

  const Spinner = () => (
    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
      style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#8b5cf6' }} />
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-10 overflow-y-auto"
      style={{ background: 'var(--bg)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Hola, {profile?.name?.split(' ')[0] ?? 'bienvenido'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Activa tu suscripción para estudiar con audio sincronizado
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">

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
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: plan === 'annual' ? '#f9b800' : 'var(--border)' }}>
                {plan === 'annual' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f9b800' }} />}
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Anual</span>
            </div>
            <div>
              <span className="text-xl font-light" style={{ color: 'var(--text)' }}>X$</span>
              <span className="text-xs ml-1" style={{ color: 'var(--text-3)' }}>/año</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-gold)' }}>La opción más económica</p>

          </button>

          <button onClick={() => setPlan('monthly')}
            className="rounded-2xl p-4 text-left transition-all"
            style={{
              background: plan === 'monthly' ? 'rgba(108,51,230,0.08)' : 'var(--bg-card)',
              border: `1.5px solid ${plan === 'monthly' ? '#8b5cf6' : 'var(--border)'}`,
            }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: plan === 'monthly' ? '#8b5cf6' : 'var(--border)' }}>
                {plan === 'monthly' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />}
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Mensual</span>
            </div>
            <div>
              <span className="text-xl font-light" style={{ color: 'var(--text)' }}>X$</span>
              <span className="text-xs ml-1" style={{ color: 'var(--text-3)' }}>/mes</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Cancela cuando quieras</p>
          </button>
        </div>

        {/* Features included */}
        <div className="rounded-2xl p-4 mb-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-2.5" style={{ color: 'var(--text-2)' }}>Incluye todo esto:</p>
          <ul className="flex flex-col gap-1.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="#22c55e" strokeWidth="1.1"/>
                  <path d="M4 6.5l2 2L9.5 4.5" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-2)' }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Primary CTA */}
        <button onClick={handlePay} disabled={paying}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-3"
          style={{
            background: paying ? 'var(--bg-card)' : 'linear-gradient(135deg, #6c33e6, #8b5cf6)',
            color: paying ? 'var(--text-3)' : '#fff',
            border: paying ? '1px solid var(--border)' : 'none',
            boxShadow: paying ? 'none' : '0 4px 20px rgba(108,51,230,0.35)',
          }}>
          {paying ? <><Spinner /> Redirigiendo…</> : 'Suscribirse →'}
        </button>

        <p className="text-xs text-center mb-5" style={{ color: 'var(--text-muted)' }}>
          Pago seguro · Cancela cuando quieras
        </p>

        {/* Dev bypass + guest */}
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => { sessionStorage.setItem('dev_bypass', '1'); navigate('/student/study') }}
            className="text-xs py-2 px-5 rounded-xl transition-all font-medium"
            style={{ color: '#8b5cf6', background: 'rgba(108,51,230,0.08)', border: '1px solid rgba(108,51,230,0.2)' }}>
            Iniciar sesión sin pagar (solo desarrollo)
          </button>
          <button onClick={handleGuest}
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

function NotifIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path d="M9 2C6 2 4 4.5 4 7v4l-1.5 2H15.5L14 11V7c0-2.5-2-5-5-5z" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M7.5 15a1.5 1.5 0 003 0" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function HaftaraIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path d="M3 4h12" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M3 7h8" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M3 10h10" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M3 13h6" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="14" cy="13" r="2.5" stroke={c} strokeWidth="1.2"/>
      <path d="M14 11.5v1.5l1 1" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function AccountIcon({ active }) {
  const c = active ? '#8b5cf6' : 'var(--text-3)'
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.3"/>
      <circle cx="9" cy="7" r="2.5" stroke={c} strokeWidth="1.2"/>
      <path d="M3.5 15c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
