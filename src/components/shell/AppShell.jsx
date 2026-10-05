import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import { ChevronRight, LogOut, Mail, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import Logo from '../Logo'
import LangToggle from '../LangToggle'
import ContactModal from '../ContactModal'
import { Avatar } from '../ui'

const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'it', flag: '🇮🇹', label: 'IT' },
  { code: 'he', flag: '🇮🇱', label: 'HE' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
]

/**
 * Shared app chrome for teacher and student areas: sidebar with sections,
 * top header (language, contact, logout) and a mobile drawer.
 * The header lives outside the scroll container (avoids the iOS fixed-element
 * touch bug inside overflow:auto).
 */
export default function AppShell({ sections, profilePath, roleLabel, homePath }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const { t, lang } = useLang()
  const isRTL = lang === 'he'
  const isNative = Capacitor.isNativePlatform()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    if (!isNative) return
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [isNative])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const go = (path) => { navigate(path); setDrawerOpen(false) }

  const sidebarProps = { sections, profile, roleLabel, profilePath, homePath, location, go, onSignOut: handleSignOut }

  return (
    <div className="flex h-[100svh]" style={{ background: 'var(--bg)' }}>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      {!isLandscape && (
        <aside className="hidden lg:flex flex-col flex-shrink-0 h-full"
          style={{ width: 264, background: 'var(--surface)', borderInlineEnd: '1px solid var(--border-subtle)' }}>
          <SidebarContent {...sidebarProps} />
        </aside>
      )}

      {/* ── Mobile / tablet drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div key="scrim" className="fixed inset-0 z-[90] lg:hidden" style={{ background: 'rgba(17,24,39,0.35)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)} />
            <motion.aside key="drawer" role="dialog" aria-modal="true" aria-label={t('ui_navigation')}
              className={`fixed inset-y-0 z-[100] lg:hidden flex flex-col sidebar-drawer ${isRTL ? 'right-0' : 'left-0'}`}
              style={{ width: 'min(86vw, 300px)', background: 'var(--surface)', boxShadow: 'var(--shadow-lg)' }}
              initial={{ x: isRTL ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
              <button onClick={() => setDrawerOpen(false)} aria-label={t('close')}
                className="btn btn-ghost btn-sm btn-icon absolute end-3" style={{ top: 'max(env(safe-area-inset-top, 0px), 1rem)' }}>
                <X size={18} strokeWidth={1.8} />
              </button>
              <SidebarContent {...sidebarProps} drawer
                extras={
                  <div className="flex flex-col gap-3 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="shell-section-label px-1">{t('language')}</p>
                    <DrawerLangList />
                    <button onClick={() => { setContactOpen(true); setDrawerOpen(false) }} className="btn btn-secondary btn-sm">
                      <Mail size={15} />{t('contact_us')}
                    </button>
                  </div>
                } />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main column ────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {!isLandscape && (
          <header className="flex-shrink-0 app-header z-30" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2 px-3 sm:px-6 lg:px-8" style={{ height: 60 }}>
              <button className="btn btn-ghost btn-icon lg:hidden" onClick={() => setDrawerOpen(true)}
                aria-label={t('ui_open_menu')} aria-expanded={drawerOpen}>
                <Menu size={20} strokeWidth={1.8} />
              </button>
              <button className="lg:hidden flex items-center" onClick={() => navigate(homePath)} aria-label="Parashapp">
                <Logo size={24} />
              </button>

              <div className="ms-auto flex items-center gap-2">
                <div className="hidden sm:block"><LangToggle /></div>
                <button onClick={() => setContactOpen(true)} className="btn btn-secondary btn-sm hidden md:inline-flex">
                  <Mail size={15} strokeWidth={1.8} />{t('contact_us')}
                </button>
                <button onClick={handleSignOut} className="btn btn-secondary btn-sm btn-icon hidden md:inline-flex"
                  aria-label={t('logout')} title={t('logout')}>
                  <LogOut size={16} strokeWidth={1.8} className="rtl:rotate-180" />
                </button>
              </div>
            </div>
          </header>
        )}

        <main id="main" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col scroll-smooth-ios">
          <Outlet />
        </main>
      </div>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </div>
  )
}

function DrawerLangList() {
  const { lang, setLang } = useLang()
  return (
    <div role="radiogroup" className="grid grid-cols-3 gap-1.5">
      {LANGS.map(l => (
        <button key={l.code} role="radio" aria-checked={lang === l.code} onClick={() => setLang(l.code)}
          className="flex items-center justify-center gap-1.5 h-10 text-[13px] font-medium transition-colors"
          style={{
            borderRadius: 4,
            background: lang === l.code ? 'rgba(var(--accent-rgb),0.06)' : 'transparent',
            border: `1px solid ${lang === l.code ? 'rgba(var(--accent-rgb),0.35)' : 'var(--border-subtle)'}`,
            color: lang === l.code ? 'rgb(var(--accent-rgb))' : 'var(--text-3)',
          }}>
          <span aria-hidden="true">{l.flag}</span>{l.label}
        </button>
      ))}
    </div>
  )
}

function SidebarContent({ sections, profile, roleLabel, profilePath, homePath, location, go, onSignOut, drawer = false, extras }) {
  const { t } = useLang()
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className={`flex flex-col h-full min-h-0 ${drawer ? 'px-4' : 'px-4 pt-6 pb-4'}`}>
      <button onClick={() => go(homePath)} className="flex items-center px-2 mb-6 self-start" aria-label="Parashapp">
        <Logo size={28} />
      </button>

      <button onClick={() => go(profilePath)}
        className="group flex items-center gap-3 p-3 mb-6 text-start transition-colors hover:bg-surface-2"
        style={{ border: '1px solid var(--border)', borderRadius: 6 }}>
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
            <p className="shell-section-label px-3 mb-2">{section.label}</p>
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
                        <span className="min-w-[20px] h-5 px-1.5 text-[11px] font-semibold flex items-center justify-center"
                          style={{ borderRadius: 3, background: 'rgb(var(--gold-rgb))', color: '#fff' }}>
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
        <button onClick={onSignOut} className="btn btn-secondary w-full justify-start">
          <LogOut size={16} strokeWidth={1.8} className="rtl:rotate-180" />{t('logout')}
        </button>
      </div>
    </div>
  )
}
