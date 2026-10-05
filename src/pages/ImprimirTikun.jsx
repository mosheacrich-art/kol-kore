import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AArrowDown, AArrowUp, ChevronLeft, ChevronRight, Maximize2, Minimize2, Printer, ScrollText, SlidersHorizontal,
} from 'lucide-react'
import { PARASHOT } from '../data/parashot'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { useShell } from '../components/shell/AppShell'

const BASE = import.meta.env.BASE_URL
const strip = (s) => String(s || '').replace(/[֑-ׇ]/g, '').trim()

const FONTS = [
  { id: 'stam',  label: 'סת״ם' },
  { id: 'keter', label: 'כתר' },
  { id: 'frank', label: 'פרנק' },
]

function readPref(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v) } catch { return fallback }
}
function writePref(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ }
}

/**
 * Tikkun Korim. The reading surface is the static renderer in
 * /public/imprimir-tikun (data/tikkun-pages.json → amudim of 42 lines).
 * This wrapper only sends presentation commands (parasha, font, zoom,
 * column layout, print); it never touches the text.
 */
export default function ImprimirTikun() {
  const iframeRef = useRef(null)
  const { t } = useLang()
  const { isDark } = useTheme()
  const { focusMode, setFocusMode } = useShell()
  const [selected, setSelected] = useState('')
  const [seferFont, setSeferFont] = useState(() => { try { return localStorage.getItem('seferFont') || 'stam' } catch { return 'stam' } })
  const [zoom, setZoom] = useState(() => readPref('tikkunZoom', 1))
  const [layout, setLayout] = useState(() => readPref('tikkunLayout', 'both'))
  const [settingsOpen, setSettingsOpen] = useState(false)

  const post = useCallback((msg) => iframeRef.current?.contentWindow?.postMessage(msg, '*'), [])
  const effectiveZoom = focusMode ? Math.min(1.8, zoom + 0.15) : zoom

  useEffect(() => { post({ setZoom: effectiveZoom }); writePref('tikkunZoom', zoom) }, [effectiveZoom, zoom, post])
  useEffect(() => { post({ setLayout: layout }); writePref('tikkunLayout', layout) }, [layout, post])
  useEffect(() => { post({ setFont: seferFont }) }, [seferFont, post])

  // Keep the selector in sync with what the renderer is showing
  useEffect(() => {
    const onMsg = (e) => {
      const st = e.data?.tikkunState
      if (!st) return
      const p = PARASHOT.find(x => strip(x.heb) === strip(st.parasha))
      if (p) setSelected(p.heb)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  const onIframeLoad = () => {
    post({ setLayout: layout })
    post({ setFont: seferFont })
    post({ setZoom: effectiveZoom })
    if (selected) post({ scrollToParasha: selected })
  }

  const jumpTo = (heb) => {
    setSelected(heb)
    post({ scrollToParasha: heb })
  }
  const idx = PARASHOT.findIndex(p => p.heb === selected)
  const go = (delta) => {
    const next = PARASHOT[Math.max(0, Math.min(PARASHOT.length - 1, (idx < 0 ? 0 : idx) + delta))]
    if (next) jumpTo(next.heb)
  }

  const printTikun = () => iframeRef.current?.contentWindow?.print()
  const iframeSrc = `${BASE}imprimir-tikun/index.html?embed=1&theme=${isDark ? 'dark' : 'light'}`

  const layoutOptions = [
    { id: 'both', label: t('ui_tikkun_both') },
    { id: 'sefer', label: 'סֵפֶר תּוֹרָה', heb: true },
    { id: 'tikkun', label: 'תִּקּוּן', heb: true },
  ]

  const controls = (stacked = false) => (
    <div className={stacked ? 'flex flex-col gap-4' : 'flex items-center gap-2'}>
      <div className={stacked ? '' : 'hidden xl:block'}>
        {stacked && <p className="eyebrow mb-2">{t('ui_columns')}</p>}
        <div className="segmented" role="group" aria-label={t('ui_columns')}>
          {layoutOptions.map(o => (
            <button key={o.id} aria-pressed={layout === o.id} onClick={() => setLayout(o.id)}
              className={o.heb ? 'hebrew-ui text-[14px]' : ''}>{o.label}</button>
          ))}
        </div>
      </div>
      <div className={stacked ? '' : 'hidden lg:block'}>
        {stacked && <p className="eyebrow mb-2">{t('ui_sefer_font')}</p>}
        <div className="segmented" role="group" aria-label={t('ui_sefer_font')}>
          {FONTS.map(f => (
            <button key={f.id} aria-pressed={seferFont === f.id} onClick={() => setSeferFont(f.id)}
              className="hebrew-ui text-[14px]" style={{ fontFamily: '"Keter YG", serif' }}>{f.label}</button>
          ))}
        </div>
      </div>
      <div className={stacked ? '' : 'flex items-center'}>
        {stacked && <p className="eyebrow mb-2">{t('ui_text_size')}</p>}
        <div className="segmented" role="group" aria-label={t('ui_text_size')}>
          <button onClick={() => setZoom(z => Math.max(0.6, +(z - 0.1).toFixed(2)))} aria-label={t('ui_smaller')} title={t('ui_smaller')}>
            <AArrowDown size={16} />
          </button>
          <button onClick={() => setZoom(1)} className="tabular-nums min-w-[52px]" title="100%">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.min(1.8, +(z + 0.1).toFixed(2)))} aria-label={t('ui_larger')} title={t('ui_larger')}>
            <AArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Toolbar — quiet, so the Torah stays the hero */}
      <div className="relative flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-[60px] bg-surface z-10"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="hidden md:flex items-center gap-3 flex-shrink-0 pe-1">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--gold-rgb),0.12)', color: 'var(--text-gold)' }}>
            <ScrollText size={18} strokeWidth={1.7} />
          </span>
          <div className="leading-tight">
            <p className="font-serif text-[16px] font-semibold text-ink">{t('nav_tikun_teacher') || 'Tikún Korim'}</p>
            <p className="hebrew-ui text-[13px] text-ink-3">תִּקּוּן קוֹרְאִים</p>
          </div>
          <span className="w-px h-7 ms-2" style={{ background: 'var(--border)' }} />
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <button onClick={() => go(-1)} disabled={idx <= 0} className="btn btn-ghost btn-sm btn-icon" aria-label={t('ui_prev_parasha')} title={t('ui_prev_parasha')}>
            <ChevronRight size={18} className="ltr:rotate-180" />
          </button>
          <label className="min-w-0">
            <span className="sr-only">{t('select_parasha_opt') || 'Parashá'}</span>
            <select value={selected} onChange={e => jumpTo(e.target.value)}
              className="input h-9 w-[150px] sm:w-[220px] text-[15px]"
              style={{ fontFamily: '"Frank Ruhl Libre Variable", "Keter YG", serif' }}>
              <option value="">{t('select_parasha_opt') || '— פרשה —'}</option>
              {PARASHOT.map(p => <option key={p.id} value={p.heb}>{p.name} · {p.heb}</option>)}
            </select>
          </label>
          <button onClick={() => go(1)} disabled={idx >= PARASHOT.length - 1} className="btn btn-ghost btn-sm btn-icon" aria-label={t('ui_next_parasha')} title={t('ui_next_parasha')}>
            <ChevronLeft size={18} className="ltr:rotate-180" />
          </button>
        </div>

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          {controls(false)}
          <div className="relative xl:hidden">
            <button onClick={() => setSettingsOpen(o => !o)} className="btn btn-ghost btn-icon" aria-expanded={settingsOpen} aria-label={t('ui_reading_settings')} title={t('ui_reading_settings')}>
              <SlidersHorizontal size={18} />
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSettingsOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                    className="absolute end-0 top-12 z-40 p-4 bg-surface rounded-2xl shadow-pop w-[280px]" style={{ border: '1px solid var(--border)' }}>
                    {controls(true)}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <span className="w-px h-6 hidden sm:block" style={{ background: 'var(--border)' }} />
          <button onClick={() => setFocusMode(f => !f)} className="btn btn-ghost btn-icon" aria-pressed={focusMode}
            aria-label={focusMode ? t('ui_exit_focus') : t('ui_focus_mode')} title={focusMode ? t('ui_exit_focus') : t('ui_focus_mode')}>
            {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={printTikun} className="btn btn-secondary btn-sm h-9" title={t('print_hint') || 'Ctrl+P'}>
            <Printer size={16} /><span className="hidden sm:inline">{t('print_pdf') || 'Imprimir PDF'}</span>
          </button>
        </div>
      </div>

      {/* Reading surface */}
      <div className="flex-1 min-h-0 relative" style={{ overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          key={isDark ? 'dark' : 'light'}
          onLoad={onIframeLoad}
          title="Tikkun Korim"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    </div>
  )
}
