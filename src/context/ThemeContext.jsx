import { createContext, useContext, useState, useEffect } from 'react'

const ThemeCtx = createContext({ isDark: false, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Apply on first render
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, []) // eslint-disable-line

  return (
    <ThemeCtx.Provider value={{ isDark, toggle: () => setIsDark(d => !d) }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeCtx)
}
