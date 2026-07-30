import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Proxy API and Sanctum calls to the production backend,
      // so the browser sees them as same-origin (no CORS, no cross-site cookies).
      '/api': {
        target: 'https://api.vitaltrace.lat',
        changeOrigin: true,
        secure: true,
      },
      '/sanctum': {
        target: 'https://api.vitaltrace.lat',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})