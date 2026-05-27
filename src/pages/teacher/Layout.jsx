import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import LangToggle from '../../components/LangToggle'
import ContactModal from '../../components/ContactModal'

const NAV_KEYS = [
  { path: '/teacher/dashboard',      key: 'nav_dashboard',      shortKey: 'nav_dashboard', heb: 'לוּחַ' },
  { path: '/teacher/students',       key: 'nav_students',       shortKey: 'nav_students',  heb: 'תַּלְמִידִים' },
  { path: '/teacher/homework',       key: 'nav_homework',       shortKey: 'nav_homework',  heb: 'שִׁעוּרֵי בַּיִת' },
  { path: '/teacher/schedule',       key: 'nav_schedule',       shortKey: 'nav_schedule',  heb: 'שִׁעוּרִים' },
  { path: '/teacher/study',          key: 'nav_parashot',       shortKey: 'nav_parashot',  heb: 'פָּרָשִׁיּוֹת' },
  { path: '/teacher/haftara',        key: 'nav_haftara',        shortKey: 'nav_haftara',   heb: 'הַפְטָרָה' },
  { path: '/teacher/tefila',         key: 'nav_tefila',         shortKey: 'nav_tefila',    heb: 'תְּפִלָּה' },
  { path: '/teacher/tikun',          key: 'nav_tikun_teacher',  shortKey: 'nav_tikun_teacher', heb: 'תִּקּוּן' },
  { path: '/teacher/notifications',  key: 'nav_notifications',  shortKey: 'nav_notifications', heb: 'הוֹדָעוֹת', badge: true, hidden: true },
  { path: '/teacher/account',        key: 'nav_account',        shortKey: 'nav_account',   heb: 'חֶשְׁבּוֹן' },
]

const BOTTOM_NAV_INDICES = [0, 1, 2, 6]

export default function TeacherLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useTheme()
  const { profile, signOut } = useAuth()
  const { t, lang } = useLang()
  const isRTL = lang === 'he'
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  const allNavItems = NAV_KEYS.filter(n => !n.hidden).map(n => ({ ...n, label: t(n.key), shortLabel: t(n.shortKey) }))
  const bottomNavItems = BOTTOM_NAV_INDICES.map(i => allNavItems[i])
  const moreItems = allNavItems.filter((_, i) => !BOTTOM_NAV_INDICES.includes(i))

  useEffect(() => {
    if (!profile?.id) return
    Promise.all([
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('teacher_id', profile.id).eq('read', false),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true })
        .eq('read', false),
    ]).then(([notifRes, contactRes]) => {
      setUnreadCount((notifRes.count || 0) + (contactRes.count || 0))
    })
  }, [profile?.id, location.pathname])

  const go = (path) => { navigate(path); setSidebarOpen(false); setMoreOpen(false) }
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>

      {/* Overlay for mobile drawer */}
      {(sidebarOpen || moreOpen) && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => { setSidebarOpen(false); setMoreOpen(false) }} />
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-shrink-0 flex-col py-8 px-4 w-64 sticky top-0 h-screen"
        style={{ background: 'var(--bg-deep)', borderInlineEnd: '1px solid var(--border-subtle)' }}>
        <SidebarContent profile={profile} location={location}
          go={go} unreadCount={unreadCount} showClose={false} allNavItems={allNavItems} />
      </aside>

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────── */}
      <aside className={`md:hidden fixed inset-y-0 z-50 w-64 flex flex-col px-4
        transition-transform duration-300 ease-in-out sidebar-drawer
        ${isRTL ? 'right-0' : 'left-0'}
        ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-deep)', borderInlineEnd: '1px solid var(--border-subtle)' }}>
        <SidebarContent profile={profile} location={location}
          go={go} unreadCount={unreadCount} showClose onClose={() => setSidebarOpen(false)} allNavItems={allNavItems} />
      </aside>

      {/* ── "Más" bottom sheet ────────────────────────────────────────────── */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl
        transition-transform duration-300 ease-in-out mobile-bottom-nav
        ${moreOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-subtle)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: 'var(--border)' }} />
        <div className="px-4 pb-2 grid grid-cols-2 gap-2">
          {moreItems.map(item => (
            <button key={item.path} onClick={() => go(item.path)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-left"
              style={{
                background: isActive(item.path) ? 'rgba(249,184,0,0.1)' : 'var(--bg-card)',
                border: `1px solid ${isActive(item.path) ? 'rgba(249,184,0,0.25)' : 'var(--border-subtle)'}`,
                color: isActive(item.path) ? '#b8860b' : 'var(--text-2)',
              }}>
              <div>
                <div className="text-xs font-medium">{item.label}</div>
                <div className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>{item.heb}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-auto scroll-smooth-ios main-with-bottom-nav">

        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 flex-shrink-0 app-header"
          style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)', minHeight: '3.5rem' }}>
          <button className="md:hidden p-2 rounded-xl relative" onClick={() => setSidebarOpen(true)}
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
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Parashá</span>
          <span className="text-xs hebrew ml-1" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה</span>
          <div className="ml-auto flex items-center gap-2">
            <LangToggle />
            <button onClick={() => setContactOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}
              title={t('contact_us')}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 4l5.5 4L12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('contact_us')}
            </button>
            <button onClick={() => setContactOpen(true)}
              className="sm:hidden p-2 rounded-xl transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}
              title={t('contact_us')}>
              <svg width="15" height="15" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 4l5.5 4L12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={toggle}
              className="p-2 rounded-xl text-xs transition-all"
              style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              title={isDark ? t('light_mode') : t('dark_mode')}>
              <span style={{ fontSize: '14px' }}>{isDark ? '☀️' : '🌙'}</span>
            </button>
            <button onClick={async () => { await signOut(); navigate('/login') }}
              className="p-2 rounded-xl transition-all"
              title={t('logout')}
              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <LogoutIcon />
            </button>
          </div>
        </div>

        {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex mobile-bottom-nav"
        style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-subtle)' }}>
        {bottomNavItems.map(item => {
          const active = isActive(item.path)
          const showBadge = item.badge && unreadCount > 0
          return (
            <button key={item.path} onClick={() => { setMoreOpen(false); go(item.path) }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 relative transition-colors"
              style={{ color: active ? '#f9b800' : 'var(--text-3)' }}>
              <NavDot active={active} />
              <span className="text-[10px] font-medium leading-none">{item.shortLabel}</span>
              {showBadge && (
                <span className="absolute top-1.5 right-[calc(50%-18px)] w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#6c33e6', fontSize: '8px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )
        })}
        {/* Más */}
        <button onClick={() => setMoreOpen(v => !v)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 transition-colors"
          style={{ color: moreOpen ? '#f9b800' : 'var(--text-3)' }}>
          <MoreIcon active={moreOpen} />
          <span className="text-[10px] font-medium leading-none">Más</span>
        </button>
      </nav>
    </div>
  )
}

function SidebarContent({ profile, location, go, unreadCount, showClose, onClose, allNavItems }) {
  const { t } = useLang()
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  return (
    <>
      {showClose && (
        <div className="px-3 mb-6 flex items-center justify-end">
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-3)' }}>
            <XIcon />
          </button>
        </div>
      )}

      <div className="mx-3 mb-8 mt-2 p-3 rounded-xl"
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
        {allNavItems.map(item => {
          const active = isActive(item.path)
          return (
            <button key={item.path} onClick={() => go(item.path)}
              className="sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-left"
              style={{
                background: active ? 'rgba(249,184,0,0.1)' : 'transparent',
                borderInlineStart: active ? '2px solid #f9b800' : '2px solid transparent',
                color: active ? '#b8860b' : 'var(--text-3)',
              }}>
              <NavDot active={active} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{item.label}</div>
                <div className="text-xs hebrew" style={{ color: active ? 'var(--text-gold)' : 'var(--text-muted)' }}>
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

    </>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 11l3-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
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

function MoreIcon({ active }) {
  const c = active ? '#f9b800' : 'currentColor'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="4" cy="10" r="1.5" fill={c}/>
      <circle cx="10" cy="10" r="1.5" fill={c}/>
      <circle cx="16" cy="10" r="1.5" fill={c}/>
    </svg>
  )
}
