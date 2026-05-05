import { useRef, useState } from 'react'
import { PARASHOT } from '../data/parashot'
import { useLang } from '../context/LangContext'

const BASE = import.meta.env.BASE_URL

export default function ImprimirTikun() {
  const iframeRef = useRef(null)
  const [selected, setSelected] = useState('')
  const { t } = useLang()

  const jumpTo = (heb) => {
    setSelected(heb)
    iframeRef.current?.contentWindow?.postMessage({ scrollToParasha: heb }, '*')
  }

  const printTikun = () => {
    iframeRef.current?.contentWindow?.print()
  }

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--overlay)' }}>

        <span className="hebrew text-lg font-bold" style={{ color: 'var(--text-gold)' }}>תִּקּוּן קוֹרִים</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>245 עמודים · 42 שורות</span>

        <div className="h-4 w-px mx-1" style={{ background: 'var(--border)' }} />

        {/* Parasha jump selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t('go_to')}</span>
          <select
            value={selected}
            onChange={e => jumpTo(e.target.value)}
            className="text-sm rounded-lg px-2 py-1.5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: '"Taamey Frank CLM", "SBL Hebrew", serif',
              maxWidth: '220px',
            }}>
            <option value="">{t('select_parasha_opt')}</option>
            {PARASHOT.map(p => (
              <option key={p.id} value={p.heb}>
                {p.heb}  ·  {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('print_hint')}</span>
          <button
            onClick={printTikun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="2" y="4" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 4V2h5v2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M4 8h5M4 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            {t('print_pdf')}
          </button>
        </div>
      </div>

      {/* Full-page iframe */}
      <div className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          src={`${BASE}imprimir-tikun/index.html`}
          title="Tikún Korim"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          loading="lazy"
        />
      </div>
    </div>
  )
}
