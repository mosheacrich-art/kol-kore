import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, createPortal } from 'react'
import { Capacitor } from '@capacitor/core'
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
  { path: '/teacher/notifications',  key: 'nav_notifications',  shortKey: 'nav_notifications', heb: 'הוֹדָעוֹת', badge: true },
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
  const [contactOpen, setContactOpen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const allNavItems = NAV_KEYS.filter(n => !n.hidden).map(n => ({ ...n, label: t(n.key), shortLabel: t(n.shortKey) }))

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('teacher_id', profile.id).eq('read', false).in('type', ['audio', 'listen'])
      .then(({ count }) => setUnreadCount(count || 0))
  }, [profile?.id, location.pathname])

  const refetchTeacherCount = () => {
    supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('teacher_id', profile.id).eq('read', false).in('type', ['audio', 'listen'])
      .then(({ count }) => setUnreadCount(count || 0))
  }

  // Real-time badge update when a new notification arrives
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`teacher-badge-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `teacher_id=eq.${profile.id}`,
      }, ({ new: row }) => {
        if (['audio', 'listen'].includes(row.type)) refetchTeacherCount()
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `teacher_id=eq.${profile.id}`,
      }, () => {
        refetchTeacherCount()
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const isNative = Capacitor.isNativePlatform()
  const go = (path) => { navigate(path); setSidebarOpen(false) }
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>

      {/* Overlay for mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className={`${isLandscape ? 'hidden' : 'hidden md:flex'} flex-shrink-0 flex-col py-8 px-4 w-64 sticky top-0 h-screen`}
        style={{ background: 'var(--bg-deep)', borderInlineEnd: '1px solid var(--border-subtle)' }}>
        <SidebarContent profile={profile} location={location}
          go={go} unreadCount={unreadCount} showClose={false} allNavItems={allNavItems}
          isDark={isDark} toggle={toggle} onContactOpen={() => setContactOpen(true)} signOut={signOut} navigate={navigate} />
      </aside>

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────── */}
      <aside className={`md:hidden fixed inset-y-0 z-50 w-64 flex flex-col px-4
        transition-transform duration-300 ease-in-out sidebar-drawer
        ${isRTL ? 'right-0' : 'left-0'}
        ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-deep)', borderInlineEnd: '1px solid var(--border-subtle)' }}>
        <SidebarContent profile={profile} location={location}
          go={go} unreadCount={unreadCount} showClose onClose={() => setSidebarOpen(false)} allNavItems={allNavItems}
          isDark={isDark} toggle={toggle} onContactOpen={() => setContactOpen(true)} signOut={signOut} navigate={navigate} />
      </aside>

      {/* Mobile: floating hamburger — outside <main> to fix iOS Safari touch bug
           (fixed elements inside overflow-auto lose touch events on iOS) */}
      {!isLandscape && !sidebarOpen && (
        <button className="fixed z-50 md:hidden p-2.5 rounded-xl"
          style={{
            top: isNative ? 'calc(env(safe-area-inset-top, 0px) + 8px)' : '8px',
            left: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-2)',
          }}
          onClick={() => setSidebarOpen(true)}>
          <HamburgerIcon />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
              style={{ background: '#6c33e6', fontSize: '8px' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-auto scroll-smooth-ios"
        style={{ paddingTop: isNative ? 'calc(env(safe-area-inset-top, 0px) + 8px)' : undefined }}>


        {/* Desktop only: full header bar */}
        {!isNative && !isLandscape && (
          <div className="hidden md:flex sticky top-0 z-30 items-center gap-3 px-4 flex-shrink-0 app-header"
            style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)', minHeight: '3.5rem' }}>
            <StarSvg />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Parashapp</span>
            <div className="ml-auto flex items-center gap-2">
              <LangToggle />
              <button onClick={() => setContactOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}
                title={t('contact_us')}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 4l5.5 4L12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('contact_us')}
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
        )}

        {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
        <Outlet />
        {/* Bottom-center fallback menu button for mobile web (iOS touch fix) */}
        {!isLandscape && !sidebarOpen && (
          <button className="fixed md:hidden z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg"
            style={{
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-2)',
            }}
            onClick={() => setSidebarOpen(true)}>
            <HamburgerIcon />
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full text-white flex items-center justify-center flex-shrink-0"
                style={{ background: '#6c33e6', fontSize: '8px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </main>
    </div>
  )
}

function SidebarContent({ profile, location, go, unreadCount, showClose, onClose, allNavItems, isDark, toggle, onContactOpen, signOut, navigate }) {
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
            <div className="text-xs" style={{ color: 'var(--text-gold)' }}>{t('role_teacher') ?? 'Profesor'}</div>
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

      <TeacherLangSheet t={t} />
      <div className="mt-auto px-3 flex flex-col gap-2">
        {/* Mobile-only: lang, dark mode, contact */}
        <div className="md:hidden flex flex-col gap-2 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <TeacherLangButton t={t} />
          <button onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '14px' }}>{isDark ? '☀️' : '🌙'}</span>
            {isDark ? (t ? t('light_mode') ?? 'Modo claro' : 'Modo claro') : (t ? t('dark_mode') ?? 'Modo oscuro' : 'Modo oscuro')}
          </button>
          {onContactOpen && (
            <button onClick={() => { onContactOpen(); onClose?.() }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 4l5.5 4L12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t ? t('contact_us') ?? 'Contáctanos' : 'Contáctanos'}
            </button>
          )}
        </div>
        <button onClick={async () => { await signOut(); navigate('/login') }}
          className="w-full text-xs py-2.5 px-3 rounded-xl text-left transition-all"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
          → {t('logout')}
        </button>
      </div>
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

const LANGS_T = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'he', flag: '🇮🇱', label: 'עברית' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
]

function TeacherLangButton({ t }) {
  const { lang } = useLang()
  const current = LANGS_T.find(l => l.code === lang) || LANGS_T[0]
  return (
    <button onClick={() => window.__teacherLangSheetOpen?.()}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all"
      style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
      <span>{t ? t('language') ?? 'Idioma' : 'Idioma'}</span>
      <span>{current.flag} {current.label}</span>
    </button>
  )
}

function TeacherLangSheet({ t }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  useEffect(() => { window.__teacherLangSheetOpen = () => setOpen(true) }, [])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col justify-end" onClick={() => setOpen(false)}>
      <div className="rounded-t-2xl p-5 flex flex-col gap-3"
        style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'var(--border)' }} />
        <p className="text-xs font-medium px-1" style={{ color: 'var(--text-3)' }}>
          {t ? t('language') ?? 'Idioma' : 'Idioma'}
        </p>
        {LANGS_T.map(l => (
          <button key={l.code} onClick={() => { setLang(l.code); setOpen(false) }}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all"
            style={{
              background: lang === l.code ? 'rgba(249,184,0,0.1)' : 'var(--bg-card)',
              border: `1px solid ${lang === l.code ? 'rgba(249,184,0,0.3)' : 'var(--border-subtle)'}`,
              color: lang === l.code ? '#b8860b' : 'var(--text)',
            }}>
            <span style={{ fontSize: '20px' }}>{l.flag}</span>
            <span className="font-medium">{l.label}</span>
            {lang === l.code && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-auto">
                <path d="M2.5 7l3 3L11.5 4" stroke="#b8860b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}

