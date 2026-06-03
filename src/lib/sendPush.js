import { supabase } from './supabase'

export async function sendPushToUser(userId, { title, body, data }) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('fcm_token')
    .eq('id', userId)
    .single()

  if (!profile?.fcm_token) return

  await fetch('/api/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: profile.fcm_token, title, body, data }),
  })
}
