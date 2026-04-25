import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { audioUrl, fileType } = await req.json()
    if (!audioUrl) return new Response(JSON.stringify({ error: 'audioUrl required' }), { status: 400, headers: corsHeaders })

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 500, headers: corsHeaders })

    // Descargar el audio desde Supabase Storage
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) return new Response(JSON.stringify({ error: 'Failed to download audio' }), { status: 500, headers: corsHeaders })
    const audioBlob = await audioRes.blob()

    const ext = (fileType || 'audio/webm').split('/')[1]?.split(';')[0] || 'webm'
    const form = new FormData()
    form.append('file', new File([audioBlob], `audio.${ext}`, { type: fileType || 'audio/webm' }))
    form.append('model', 'whisper-1')
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'word')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.text()
      return new Response(JSON.stringify({ error: err }), { status: 500, headers: corsHeaders })
    }

    const { words } = await whisperRes.json()
    return new Response(JSON.stringify({ words: words ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
