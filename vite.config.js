import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isMobile = process.env.BUILD_TARGET === 'mobile'

export default defineConfig({
  base: isMobile ? './' : '/kol-kore/',
  build: {
    outDir: isMobile ? 'dist' : 'docs',
  },
  plugins: [react()],
})
