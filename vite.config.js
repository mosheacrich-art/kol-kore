import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const isMobile = process.env.BUILD_TARGET === 'mobile'

// Dev only: serve the public read-only proxies (/api/sefaria, /api/hebcal)
// so Torah text and the Hebrew calendar load under `vite dev`.
function devApiProxy() {
  return {
    name: 'dev-api-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        let upstream = null
        if (url.pathname === '/api/sefaria') {
          const ref = url.searchParams.get('ref')
          const index = url.searchParams.get('index')
          upstream = index
            ? `https://www.sefaria.org/api/v2/index/${encodeURIComponent(index)}`
            : ref ? `https://www.sefaria.org/api/texts/${ref.replace(/ /g, '_')}?commentary=0&context=0&pad=0&wrapLinks=0&transLangPref=en` : null
        } else if (url.pathname === '/api/hebcal') {
          const endpoint = url.searchParams.get('endpoint')
          url.searchParams.delete('endpoint')
          if (['converter', 'shabbat'].includes(endpoint)) upstream = `https://www.hebcal.com/${endpoint}?${url.searchParams}`
        }
        if (!upstream) return next()
        try {
          const r = await fetch(upstream)
          res.statusCode = r.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await r.text())
        } catch (e) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY

  return {
    base: isMobile ? './' : '/',
    build: {
      outDir: 'dist',
      rollupOptions: isMobile ? {} : {
        external: ['@capacitor/app'],
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
    plugins: [react(), devApiProxy()],
  }
})
