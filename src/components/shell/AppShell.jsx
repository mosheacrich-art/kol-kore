import { createContext, useContext, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import { ChevronRight, LogOut, Mail, Menu, Moon, Sun, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import LangToggle from '../LangToggle'
import ContactModal from '../ContactModal'
import { Avatar, Logo } from '../ui'

/* Focus mode lets reading surfaces (Tikkun, reader) hide the app chrome. */
const ShellCtx = createContext({ focusMode: false, setFocusMode: () => {} })
export const useShell = () => useContext(ShellCtx)

export default function AppShell({ sections, profilePath, roleLabel, homePath }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useTheme()
  const { profile, signOut } = useAuth()
  const { t, lang } = useLang()
  const isRTL = lang === 'he'
  const isNative = Capacitor.isNativePlatform()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    if (!isNative) return
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [isNative])

  // Leave focus mode and close the drawer whenever the route changes
  useEffect(() => { setDrawerOpen(false); setFocusMode(false) }, [location.pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const hideChrome = focusMode || isLandscape

  const sidebarProps = {
    sections, profile, roleLabel, profilePath, homePath, location,
    go: (path) => { navigate(path); setDrawerOpen(false) },
    onSignOut: handleSignOut,
  }

  return (
    <ShellCtx.Provider value={{ focusMode, setFocusMode }}>
      <div className="flex h-[100svh] bg-canvas">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[400] btn btn-secondary">
          {t('ui_skip_to_content')}
        </a>

        {/* ── Desktop sidebar ─────────────────────────────────────────── */}
        {!hideChrome && (
          <aside className="hidden lg:flex flex-col flex-shrink-0 h-full bg-sidebar"
            style={{ width: 'var(--sidebar-w)', borderInlineEnd: '1px solid var(--border-subtle)' }}>
            <SidebarContent {...sidebarProps} />
          </aside>
        )}

        {/* ── Mobile / tablet drawer ─────────────────────────────────── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div key="scrim" className="fixed inset-0 z-[90] lg:hidden"
                style={{ background: 'var(--overlay)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} onClick={() => setDrawerOpen(false)} />
              <motion.aside key="drawer" role="dialog" aria-modal="true" aria-label={t('ui_navigation')}
                className={`fixed inset-y-0 z-[100] lg:hidden flex flex-col bg-sidebar sidebar-drawer shadow-modal ${isRTL ? 'right-0' : 'left-0'}`}
                style={{ width: 'min(86vw, 300px)' }}
                initial={{ x: isRTL ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isRTL ? '100%' : '-100%' }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
                <button onClick={() => setDrawerOpen(false)} aria-label={t('close')}
                  className="btn btn-ghost btn-sm btn-icon absolute top-4 end-3"
                  style={{ top: 'max(env(safe-area-inset-top, 0px), 1rem)' }}>
                  <X size={18} strokeWidth={1.8} />
                </button>
                <SidebarContent {...sidebarProps} drawer
                  extras={
                    <div className="flex flex-col gap-3 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <p className="eyebrow px-1">{t('language')}</p>
                      <LangToggle variant="list" />
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={toggle} className="btn btn-secondary btn-sm">
                          {isDark ? <Sun size={15} /> : <Moon size={15} />}
                          {isDark ? t('light_mode') : t('dark_mode')}
                        </button>
                        <button onClick={() => { setContactOpen(true); setDrawerOpen(false) }} className="btn btn-secondary btn-sm">
                          <Mail size={15} />
                          {t('contact_us')}
                        </button>
                      </div>
                    </div>
                  } />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {!hideChrome && (
            <header className="flex-shrink-0 app-header z-30"
              style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'saturate(1.4) blur(12px)' }}>
              <div className="flex items-center gap-2 px-3 sm:px-6 lg:px-8" style={{ height: 'var(--header-h)' }}>
                <button className="btn btn-ghost btn-icon lg:hidden" onClick={() => setDrawerOpen(true)}
                  aria-label={t('ui_open_menu')} aria-expanded={drawerOpen}>
                  <Menu size={20} strokeWidth={1.8} />
                </button>
                <button className="lg:hidden flex items-center" onClick={() => navigate(homePath)} aria-label="Parashapp">
                  <Logo size={28} />
                </button>

                <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
                  <div className="hidden sm:block"><LangToggle /></div>
                  <span className="hidden sm:block w-px h-5 mx-1.5" style={{ background: 'var(--border)' }} aria-hidden="true" />
                  <button onClick={toggle} className="btn btn-ghost btn-icon"
                    aria-label={isDark ? t('light_mode') : t('dark_mode')} title={isDark ? t('light_mode') : t('dark_mode')}>
                    {isDark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
                  </button>
                  <button onClick={() => setContactOpen(true)} className="btn btn-secondary btn-sm hidden md:inline-flex ms-1">
                    <Mail size={15} strokeWidth={1.8} />
                    {t('contact_us')}
                  </button>
                </div>
              </div>
            </header>
          )}

          <main id="main" tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col scroll-smooth-ios focus:outline-none">
            <Outlet />
          </main>
        </div>

        <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      </div>
    </ShellCtx.Provider>
  )
}

function SidebarContent({ sections, profile, roleLabel, profilePath, homePath, location, go, onSignOut, drawer = false, extras }) {
  const { t } = useLang()
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className={`flex flex-col h-full min-h-0 ${drawer ? 'px-4' : 'px-4 pt-6 pb-4'}`}>
      <button onClick={() => go(homePath)} className="flex items-center px-2 mb-6 self-start rounded-lg" aria-label="Parashapp">
        <Logo size={34} />
      </button>

      <button onClick={() => go(profilePath)}
        className="group flex items-center gap-3 p-3 mb-6 rounded-2xl text-start bg-surface transition-colors hover:border-[color:var(--border-strong)]"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <Avatar name={profile?.name || ''} size={38} />
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold text-ink truncate">{profile?.name ?? '—'}</span>
          <span className="block text-[12px] text-ink-3 truncate">{roleLabel}</span>
        </span>
        <ChevronRight size={16} strokeWidth={1.8} className="text-ink-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" />
      </button>

      <nav aria-label={t('ui_navigation')} className="flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1">
        {sections.map((section, si) => (
          <div key={section.label} className={si > 0 ? 'mt-6' : ''}>
            <p className="eyebrow px-3 mb-2">{section.label}</p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <li key={item.path}>
                    <button onClick={() => go(item.path)} className="nav-item" aria-current={active ? 'page' : undefined}>
                      <Icon size={18} strokeWidth={1.7} className={active ? '' : 'text-ink-3'} />
                      <span className="flex-1 text-start truncate">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center"
                          style={{ background: 'rgb(var(--gold-rgb))', color: '#1A1204' }}>
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {extras && <div className="mt-6">{extras}</div>}
      </nav>

      <div className="pt-4 flex-shrink-0">
        <button onClick={onSignOut} className="btn btn-danger w-full justify-start">
          <LogOut size={16} strokeWidth={1.8} className="rtl:rotate-180" />
          {t('logout')}
        </button>
      </div>
    </div>
  )
}

