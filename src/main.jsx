import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/frank-ruhl-libre'
import '@fontsource-variable/heebo'
import './index.css'
import App from './App.jsx'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from './lib/supabase'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister())
  })
}

if (Capacitor.isNativePlatform()) {
  const dark = localStorage.getItem('theme') === 'dark'
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setBackgroundColor({ color: dark ? '#0A1322' : '#FAF8F4' })
  }

  // Push notifications
  PushNotifications.requestPermissions().then(result => {
    if (result.receive === 'granted') PushNotifications.register()
  })

  PushNotifications.addListener('registration', async ({ value: token }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ fcm_token: token }).eq('id', user.id)
    }
  })

  PushNotifications.addListener('registrationError', err => {
    console.error('Push registration error:', err)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
