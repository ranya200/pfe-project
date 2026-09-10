import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'


const backendInternalUrl = process.env.VITE_BACKEND_INTERNAL_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  server: {
    host: true, 
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