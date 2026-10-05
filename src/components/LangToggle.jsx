import { useState, useRef, useEffect } from 'react'
import { useLang } from '../context/LangContext'

const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'he', flag: '🇮🇱', label: 'עברית' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
]

export default function LangToggle({ compact = false }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGS.find(l => l.code === lang) || LANGS[0]

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative" style={compact ? {} : { width: 'auto' }}>
      <button onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors"
        style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, color: '#1b2f6b' }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>{current.flag}</span>
        <span>{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" className="absolute z-[300] mt-1 py-1 min-w-[10rem]"
          style={{ insetInlineEnd: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 4, boxShadow: '0 8px 24px rgba(17,24,39,0.12)' }}>
          {LANGS.map(l => (
            <li key={l.code}>
              <button role="option" aria-selected={lang === l.code}
                onClick={() => { setLang(l.code); setOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-[#f6f7f9]"
                style={{ color: lang === l.code ? '#1b2f6b' : '#374151', fontWeight: lang === l.code ? 600 : 400 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {lang === l.code && <span style={{ color: '#c8941f' }}>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
