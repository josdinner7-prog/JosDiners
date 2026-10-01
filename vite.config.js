import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    allowedHosts: [
      'app.josdiner.dpdns.org',
      '.josdiner.dpdns.org',
      '.dpdns.org',
      '.trycloudflare.com',
      '.loca.lt',
      '.ngrok-free.app',
      'gather-voices-vsnet-push.trycloudflare.com'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})