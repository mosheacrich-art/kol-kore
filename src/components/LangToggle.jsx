import { useLang } from '../context/LangContext'

const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
]

export default function LangToggle({ compact = false }) {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center gap-1"
      style={compact ? {} : {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '4px',
        width: '100%',
      }}>
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.label}
          className="flex items-center justify-center gap-1 rounded-lg transition-all"
          style={{
            flex: compact ? 'none' : 1,
            padding: compact ? '4px 6px' : '5px 0',
            background: lang === l.code
              ? 'var(--bg-deep)'
              : 'transparent',
            border: lang === l.code
              ? '1px solid var(--border)'
              : '1px solid transparent',
            opacity: lang === l.code ? 1 : 0.45,
            transform: lang === l.code ? 'scale(1.1)' : 'scale(1)',
          }}>
          <span style={{ fontSize: compact ? '18px' : '20px', lineHeight: 1 }}>{l.flag}</span>
        </button>
      ))}
    </div>
  )
}
