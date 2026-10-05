import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'

/* ── Page header ───────────────────────────────────────────────────────── */
export function PageHeader({ hebrew, eyebrow, title, subtitle, actions, aside, className = '' }) {
  return (
    <header className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8 ${className}`}>
      <div className="min-w-0">
        {(hebrew || eyebrow) && (
          <p className="eyebrow flex items-center gap-2 mb-3">
            {hebrew && <span className="hebrew-ui normal-case tracking-normal text-[13px] text-ink-3">{hebrew}</span>}
            {hebrew && eyebrow && <span aria-hidden="true" className="text-ink-4">·</span>}
            {eyebrow && <span>{eyebrow}</span>}
          </p>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {(actions || aside) && (
        <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
          {aside}
          {actions}
        </div>
      )}
    </header>
  )
}

/* ── Avatar ────────────────────────────────────────────────────────────── */
const AVATAR_TONES = ['#2F5E93', '#B07D22', '#2F7F78', '#A85A43', '#5E6399', '#6C7A3A']

export function toneFor(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '·'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name = '', size = 36, single = false, className = '' }) {
  const tone = toneFor(name)
  return (
    <span aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 select-none ${className}`}
      style={{
        width: size, height: size,
        fontSize: Math.max(11, Math.round(size * 0.38)),
        color: tone,
        background: `${tone}17`,
        boxShadow: `inset 0 0 0 1px ${tone}22`,
      }}>
      {single ? (name?.[0]?.toUpperCase() || '·') : initials(name)}
    </span>
  )
}

/* ── Spinner / loading ─────────────────────────────────────────────────── */
export function Spinner({ size = 20, className = '' }) {
  return (
    <span role="status" aria-label="Loading"
      className={`inline-block rounded-full animate-spin ${className}`}
      style={{
        width: size, height: size,
        border: '2px solid rgba(var(--accent-rgb), 0.15)',
        borderTopColor: 'rgb(var(--accent-rgb))',
      }} />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size={24} />
    </div>
  )
}

/* ── Empty state ───────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-14 ${className}`}>
      {Icon && (
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-surface-2 text-ink-3"
          style={{ border: '1px solid var(--border-subtle)' }}>
          <Icon size={20} strokeWidth={1.6} />
        </span>
      )}
      {title && <p className="text-[15px] font-medium text-ink">{title}</p>}
      {description && <p className="text-sm text-ink-3 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ── Search input ──────────────────────────────────────────────────────── */
export function SearchInput({ value, onChange, placeholder, className = '', autoFocus = false, ...rest }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <Search size={17} strokeWidth={1.8}
        className="absolute top-1/2 -translate-y-1/2 start-3.5 text-ink-4 pointer-events-none" />
      <input type="search" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        className="input ps-10" {...rest} />
    </label>
  )
}

/* ── Modal / sheet ─────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', labelledBy }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  // Runs only when the dialog opens/closes — never on re-render, so typing keeps focus
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.() }
    document.addEventListener('keydown', onKey)
    const prev = document.activeElement
    requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel || panel.contains(document.activeElement)) return
      const el = panel.querySelector('[autofocus], input:not([type=hidden]), select, textarea, button:not([data-close])')
      el?.focus({ preventScroll: true })
    })
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [open])

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="absolute inset-0" style={{ background: 'var(--overlay)', backdropFilter: 'blur(3px)' }}
            onClick={onClose} aria-hidden="true" />
          <motion.div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy || 'modal-title'}
            className={`relative w-full ${widths[size]} max-h-[92svh] flex flex-col bg-surface rounded-t-3xl sm:rounded-3xl shadow-modal`}
            style={{ border: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            initial={{ opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                <div className="min-w-0">
                  {title && <h2 id={labelledBy || 'modal-title'} className="font-serif text-[22px] font-semibold text-ink tracking-[-0.01em]">{title}</h2>}
                  {subtitle && <p className="text-sm text-ink-3 mt-1">{subtitle}</p>}
                </div>
                {onClose && (
                  <button data-close onClick={onClose} aria-label="Close"
                    className="btn btn-ghost btn-sm btn-icon -me-2 -mt-1 flex-shrink-0">
                    <X size={18} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            )}
            <div className="px-6 pb-6 overflow-y-auto">{children}</div>
            {footer && (
              <div className="px-6 py-4 flex items-center justify-end gap-2.5 flex-shrink-0"
                style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* ── Stat (KPI) ────────────────────────────────────────────────────────── */
export function IconTile({ icon: Icon, tone = 'accent', size = 44 }) {
  const tones = {
    accent: { bg: 'rgba(var(--accent-rgb), 0.07)', fg: 'rgb(var(--accent-rgb))' },
    gold:   { bg: 'rgba(var(--gold-rgb), 0.12)',   fg: 'var(--text-gold)' },
    success:{ bg: 'rgba(var(--success-rgb), 0.1)', fg: 'rgb(var(--success-rgb))' },
    danger: { bg: 'rgba(var(--danger-rgb), 0.08)', fg: 'rgb(var(--danger-rgb))' },
    neutral:{ bg: 'var(--surface-2)',              fg: 'var(--text-2)' },
  }
  const t = tones[tone] || tones.accent
  return (
    <span className="inline-flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: size, height: size, background: t.bg, color: t.fg }}>
      <Icon size={Math.round(size * 0.45)} strokeWidth={1.7} />
    </span>
  )
}

/* ── Section card header ───────────────────────────────────────────────── */
export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-[13px] text-ink-3 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── Progress bar ──────────────────────────────────────────────────────── */
export function Progress({ value = 0, tone, className = '', label }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={`progress ${className}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${v}%`, background: tone }} />
    </div>
  )
}
