import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { audioUrl, fileType } = await req.json()
    console.log('[generate-sync] audioUrl:', audioUrl, 'fileType:', fileType)

    if (!audioUrl) return new Response(JSON.stringify({ error: 'audioUrl required' }), { status: 400, headers: corsHeaders })

    const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim()
    if (!apiKey) {
      console.error('[generate-sync] OPENAI_API_KEY not set')
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 500, headers: corsHeaders })
    }
    console.log('[generate-sync] API key present, length:', apiKey.length)

    const audioRes = await fetch(audioUrl)
    console.log('[generate-sync] audio download status:', audioRes.status)
    if (!audioRes.ok) return new Response(JSON.stringify({ error: 'Failed to download audio: ' + audioRes.status }), { status: 500, headers: corsHeaders })
    const audioBlob = await audioRes.blob()
    console.log('[generate-sync] audio blob size:', audioBlob.size)

    const ext = (fileType || 'audio/webm').split('/')[1]?.split(';')[0] || 'webm'
    const form = new FormData()
    form.append('file', new File([audioBlob], 'audio.' + ext, { type: fileType || 'audio/webm' }))
    form.append('model', 'whisper-1')
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'word')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey },
      body: form,
    })
    console.log('[generate-sync] whisper status:', whisperRes.status)

    if (!whisperRes.ok) {
      const err = await whisperRes.text()
      console.error('[generate-sync] whisper error:', err)
      return new Response(JSON.stringify({ error: err }), { status: 500, headers: corsHeaders })
    }

    const { words } = await whisperRes.json()
    console.log('[generate-sync] words count:', words?.length)
    return new Response(JSON.stringify({ words: words ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[generate-sync] exception:', String(err))
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
