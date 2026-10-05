import { createContext, useContext, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

const ThemeCtx = createContext({ isDark: false, toggle: () => {} })

function syncNativeChrome(isDark) {
  if (!Capacitor.isNativePlatform()) return
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {})
    if (Capacitor.getPlatform() === 'android') {
      StatusBar.setBackgroundColor({ color: isDark ? '#0A1322' : '#FAF8F4' }).catch(() => {})
    }
  }).catch(() => {})
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light') } catch { /* storage unavailable */ }
    syncNativeChrome(isDark)
  }, [isDark])

  return (
    <ThemeCtx.Provider value={{ isDark, toggle: () => setIsDark(d => !d) }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeCtx)
}
