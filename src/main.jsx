import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
  StatusBar.setStyle({ style: Style.Dark })
  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setBackgroundColor({ color: '#07060f' })
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
