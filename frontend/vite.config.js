import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
const backendInternalUrl = process.env.VITE_BACKEND_INTERNAL_URL || 'http://localhost:8000'

const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map(h => h.trim())
    .filter(Boolean)

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  server: {
    host: true, // nécessaire pour être accessible depuis l'extérieur du conteneur
    ...(extraAllowedHosts.length > 0 ? { allowedHosts: extraAllowedHosts } : {}),
    proxy: {
      '/api': {
        target: backendInternalUrl,
        changeOrigin: true,
      },
      '/media': {
        target: backendInternalUrl,
        changeOrigin: true,
      },
    },
  },
})

