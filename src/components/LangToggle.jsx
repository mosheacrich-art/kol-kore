import { useLang } from '../context/LangContext'

const FLAGS = { es: '🇪🇸', en: '🇬🇧', fr: '🇫🇷' }
const LANGS = ['es', 'en', 'fr']

export default function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center gap-1 w-full px-3 py-2 rounded-xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      {LANGS.map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="flex-1 flex items-center justify-center rounded-lg py-1 text-xs font-medium transition-all"
          style={{
            background: lang === l ? 'var(--bg-deep)' : 'transparent',
            border: lang === l ? '1px solid var(--border)' : '1px solid transparent',
            opacity: lang === l ? 1 : 0.5,
          }}>
          <span style={{ fontSize: '16px' }}>{FLAGS[l]}</span>
        </button>
      ))}
    </div>
  )
}
