// U+0591–U+05AF: taamim (cantillation marks)
// U+05B0–U+05C7: nikkud + vowel points + related marks
// U+05BE: maqqef (hyphen connector) — → space to avoid merging words when removed

const TAAMIM_RE = /[֑-֯]/g
const ALL_DIACRITICS_RE = /[֑-ׇ]/g

export function withTaamim(text) {
  return text
}

export function withNikkud(text) {
  if (!text) return ''
  return text
    .replace(/־/g, ' ')
    .replace(TAAMIM_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function plain(text) {
  if (!text) return ''
  return text
    .replace(/־/g, ' ')
    .replace(ALL_DIACRITICS_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function processVerse(verse, mode) {
  if (!verse) return ''
  switch (mode) {
    case 'taamim': return withTaamim(verse)
    case 'nikkud': return withNikkud(verse)
    case 'plain':  return plain(verse)
    default:       return verse
  }
}

export function flattenVerses(heArray) {
  if (!Array.isArray(heArray)) return []
  if (heArray.length === 0) return []
  if (typeof heArray[0] === 'string') return heArray
  return heArray.flat(Infinity).filter(v => typeof v === 'string' && v.trim())
}

const _decodeEl = typeof document !== 'undefined' ? document.createElement('textarea') : null
function decodeEntities(str) {
  if (!_decodeEl) return str
  _decodeEl.innerHTML = str
  return _decodeEl.value
}

export function splitWords(text) {
  if (!text) return []
  return text.split(/\s+/).filter(w => w.length > 0)
}

export function stripHtml(str) {
  if (!str) return ''
  return str
    .replace(/<[^>]+>/g, ' ')          // HTML tags → space
    .replace(/[{(\[][פספס][)}\]]/g, '') // Sefaria paragraph markers {פ} [ס] etc.
    .replace(/\s*\|\s*/g, ' ')          // Sefaria | separator
    .replace(/&[a-zA-Z]+;|&#\d+;/g, s => { _decodeEl && (_decodeEl.innerHTML = s); return _decodeEl ? _decodeEl.value : s })
    .replace(/[\s ]+/g, ' ')
    .trim()
}
