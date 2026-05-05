import { createContext, useContext, useState } from 'react'
import { translations } from '../data/translations'

const LangContext = createContext()

function detectLang() {
  const stored = localStorage.getItem('lang')
  if (stored && translations[stored]) return stored
  const browser = (navigator.language || navigator.userLanguage || 'es').toLowerCase()
  if (browser.startsWith('fr')) return 'fr'
  if (browser.startsWith('en')) return 'en'
  return 'es'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  const t = (key) =>
    translations[lang]?.[key] ?? translations.es[key] ?? key

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
