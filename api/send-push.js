import { GoogleAuth } from 'google-auth-library'

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { token, title, body, data } = req.body
  if (!token || !title) return res.status(400).json({ error: 'token and title required' })

  try {
    const accessToken = await getAccessToken()
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body: body || '' },
            data: data || {},
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        }),
      }
    )
    const result = await response.json()
    if (!response.ok) return res.status(500).json({ error: result })
    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
