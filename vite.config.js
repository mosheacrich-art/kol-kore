import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isMobile = process.env.BUILD_TARGET === 'mobile'

console.log('[BUILD] VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'UNDEFINED')
console.log('[BUILD] VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'UNDEFINED')

export default defineConfig({
  base: isMobile ? './' : '/',
  build: {
    outDir: 'dist',
    rollupOptions: isMobile ? {} : {
      external: ['@capacitor/app'],
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  plugins: [react()],
})
