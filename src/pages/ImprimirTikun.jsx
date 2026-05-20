import { useRef, useState } from 'react'
import { PARASHOT } from '../data/parashot'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'

const BASE = import.meta.env.BASE_URL

export default function ImprimirTikun() {
  const iframeRef = useRef(null)
  const [selected, setSelected] = useState('')
  const { t } = useLang()
  const { isDark } = useTheme()

  const jumpTo = (heb) => {
    setSelected(heb)
    iframeRef.current?.contentWindow?.postMessage({ scrollToParasha: heb }, '*')
  }

  const printTikun = () => {
    const parashaHash = selected ? `#parasha=${encodeURIComponent(selected)}` : ''
    const url = `${BASE}imprimir-tikun/index.html?autoprint=1${parashaHash}`
    window.open(url, '_blank')
  }

  const iframeSrc = `${BASE}imprimir-tikun/index.html?embed=1&theme=${isDark ? 'dark' : 'light'}`

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-deep)' }}>

        <div className="flex items-center gap-2 flex-shrink-0">
          <TikunIcon />
          <div>
            <span className="hebrew text-base font-bold" style={{ color: 'var(--text-gold)', letterSpacing: '0.03em' }}>
              תִּקּוּן קוֹרִים
            </span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>245 עמ׳ · 42 שורות</span>
          </div>
        </div>

        <div className="h-4 w-px mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />

        {/* Parasha jump selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-3)' }}>{t('go_to') || 'Ir a:'}</span>
          <select
            value={selected}
            onChange={e => jumpTo(e.target.value)}
            className="text-sm rounded-lg px-2 py-1.5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: '"KeterYG", "SBL Hebrew", serif',
              maxWidth: '200px',
            }}>
            <option value="">{t('select_parasha_opt') || '— פרשה —'}</option>
            {PARASHOT.map(p => (
              <option key={p.id} value={p.heb}>
                {p.heb}  ·  {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs hidden md:inline" style={{ color: 'var(--text-muted)' }}>
            {t('print_hint') || 'Ctrl+P para imprimir'}
          </span>
          <button
            onClick={printTikun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="2" y="4" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 4V2h5v2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M4 8h5M4 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            {t('print_pdf') || 'Imprimir PDF'}
          </button>
        </div>
      </div>

      {/* Tikkun iframe — embed mode: scrollable, no toolbar */}
      <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          key={isDark ? 'dark' : 'light'}
          title="Tikún Korim"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          loading="lazy"
        />
      </div>
    </div>
  )
}

function TikunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="2" width="14" height="16" rx="1.5" stroke="var(--text-gold)" strokeWidth="1.3"/>
      <line x1="10" y1="2" x2="10" y2="18" stroke="var(--text-gold)" strokeWidth="1" strokeDasharray="2 1"/>
      <path d="M5 6h4M5 9h4M5 12h3" stroke="var(--text-gold)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M11 6h4M11 9h4M11 12h3" stroke="var(--text-gold)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
