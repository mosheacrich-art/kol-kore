import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useLang } from '../context/LangContext'

export const LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'he', label: 'עברית' },
  { code: 'de', label: 'Deutsch' },
]

/* Minimal geometric flags — consistent rendering on every OS (no emoji). */
export function Flag({ code, size = 18 }) {
  const w = size, h = Math.round(size * 0.7)
  const common = { width: w, height: h, viewBox: '0 0 30 21', className: 'flex-shrink-0 rounded-[3px]', style: { boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }, 'aria-hidden': true }
  switch (code) {
    case 'es': return (
      <svg {...common}><rect width="30" height="21" fill="#C60B1E"/><rect y="5.25" width="30" height="10.5" fill="#FFC400"/></svg>)
    case 'fr': return (
      <svg {...common}><rect width="10" height="21" fill="#0055A4"/><rect x="10" width="10" height="21" fill="#fff"/><rect x="20" width="10" height="21" fill="#EF4135"/></svg>)
    case 'it': return (
      <svg {...common}><rect width="10" height="21" fill="#009246"/><rect x="10" width="10" height="21" fill="#fff"/><rect x="20" width="10" height="21" fill="#CE2B37"/></svg>)
    case 'de': return (
      <svg {...common}><rect width="30" height="7" fill="#000"/><rect y="7" width="30" height="7" fill="#DD0000"/><rect y="14" width="30" height="7" fill="#FFCE00"/></svg>)
    case 'he': return (
      <svg {...common}>
        <rect width="30" height="21" fill="#fff"/>
        <rect y="2.4" width="30" height="2.6" fill="#0038B8"/><rect y="16" width="30" height="2.6" fill="#0038B8"/>
        <g fill="none" stroke="#0038B8" strokeWidth="0.9"><path d="M15 6.6l3.2 5.6h-6.4z"/><path d="M15 14.4l-3.2-5.6h6.4z"/></g>
      </svg>)
    case 'en': default: return (
      <svg {...common}>
        <rect width="30" height="21" fill="#012169"/>
        <path d="M0 0l30 21M30 0L0 21" stroke="#fff" strokeWidth="4"/>
        <path d="M0 0l30 21M30 0L0 21" stroke="#C8102E" strokeWidth="1.6"/>
        <path d="M15 0v21M0 10.5h30" stroke="#fff" strokeWidth="6"/>
        <path d="M15 0v21M0 10.5h30" stroke="#C8102E" strokeWidth="3.4"/>
      </svg>)
  }
}

/* Dropdown menu (header). `variant="list"` renders an inline list (drawer / settings). */
export default function LangToggle({ variant = 'menu', align = 'end' }) {
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGS.find(l => l.code === lang) || LANGS[0]

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (variant === 'list') {
    return (
      <div role="radiogroup" aria-label={t('language')} className="grid grid-cols-3 gap-1.5">
        {LANGS.map(l => (
          <button key={l.code} role="radio" aria-checked={lang === l.code} onClick={() => setLang(l.code)}
            className="flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-medium transition-colors"
            style={{
              background: lang === l.code ? 'var(--surface)' : 'transparent',
              border: `1px solid ${lang === l.code ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
              color: lang === l.code ? 'var(--text)' : 'var(--text-3)',
            }}>
            <Flag code={l.code} size={16} />
            {l.code.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        aria-label={`${t('language')}: ${current.label}`}
        className="btn btn-ghost btn-sm gap-2 px-2.5">
        <Flag code={current.code} size={18} />
        <span className="text-[13px] font-medium text-ink-2">{current.code.toUpperCase()}</span>
        <ChevronDown size={14} strokeWidth={2} className={`text-ink-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul role="listbox" aria-label={t('language')}
            initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-2 w-48 p-1.5 bg-surface rounded-2xl shadow-pop ${align === 'end' ? 'end-0' : 'start-0'}`}
            style={{ border: '1px solid var(--border)', transformOrigin: 'top' }}>
            {LANGS.map(l => (
              <li key={l.code}>
                <button role="option" aria-selected={lang === l.code}
                  onClick={() => { setLang(l.code); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-2.5 h-9 rounded-lg text-sm text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors">
                  <Flag code={l.code} size={18} />
                  <span className={l.code === 'he' ? 'hebrew-ui' : ''}>{l.label}</span>
                  {lang === l.code && <Check size={15} strokeWidth={2} className="ms-auto text-accent" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
