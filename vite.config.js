import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const isMobile = process.env.BUILD_TARGET === 'mobile'

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
    plugins: [react()],
  }
})
