import { createContext, useContext, useEffect } from 'react'

// Light-only: the editorial identity (navy ink on white) has no dark variant.
const ThemeCtx = createContext({ isDark: false, toggle: () => {} })

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    try { localStorage.removeItem('theme') } catch { /* ignore */ }
  }, [])
  return <ThemeCtx.Provider value={{ isDark: false, toggle: () => {} }}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  return useContext(ThemeCtx)
}
