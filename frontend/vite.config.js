import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Membuka akses jaringan luar kontainer
    proxy: {
      '/api/survey': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://43.134.166.153:8081',
        changeOrigin: true,
      },
      '/screenshots': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})