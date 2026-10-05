import { PARASHOT, ALL_PARASHOT, BOOK_COLORS } from '../data/parashot'
import { ALL_MOADIM } from '../data/moadim'

/** Resolve a stored parasha id *or* display name (legacy rows) to its record. */
export function resolveParasha(idOrName) {
  if (!idOrName) return null
  const lower = String(idOrName).toLowerCase().replace(/[\s-]/g, '')
  return PARASHOT.find(p =>
    p.id === idOrName ||
    p.name.toLowerCase() === String(idOrName).toLowerCase() ||
    p.id.replace(/-/g, '') === lower ||
    p.name.toLowerCase().replace(/[\s-]/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '') === lower.normalize('NFD').replace(/[̀-ͯ]/g, '')
  ) || ALL_PARASHOT.find(p => p.id === idOrName)
    || ALL_MOADIM.find(m => m.id === idOrName || m.name === idOrName)
    || null
}

export function displayParashaName(idOrName) {
  return resolveParasha(idOrName)?.name || idOrName || ''
}

export function studentParashot(student) {
  return [student?.parasha_id, ...(student?.extra_parasha_ids || [])].filter(Boolean)
}

export function bookColor(parasha) {
  return BOOK_COLORS[parasha?.book] || parasha?.color || '#2F5E93'
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

export function formatDuration(seconds) {
  if (!seconds || seconds < 60) return `${seconds || 0}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function capitalize(s = '') {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export function aliyahLabel(parasha, idx) {
  const a = parasha?.aliyot?.[idx]
  if (!a) return null
  return a.n === 8 ? 'Maftir' : `${a.n}ª Aliyá`
}

/** Localised "5 min ago" using Intl.RelativeTimeFormat. */
export function timeAgo(dateStr, locale) {
  const diff = (new Date(dateStr).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale || undefined, { numeric: 'auto', style: 'short' })
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), 'second')
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  return new Date(dateStr).toLocaleDateString(locale || undefined, { day: 'numeric', month: 'short' })
}

/** Bucket key for chronological grouping: today | yesterday | week | older */
export function dateBucket(dateStr) {
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((today - d) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return 'week'
  return 'older'
}
