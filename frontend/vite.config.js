import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Proxy interne Docker : "localhost" dans le conteneur frontend ne pointe PAS
// vers le conteneur backend. On utilise VITE_BACKEND_INTERNAL_URL si définie
// (docker-compose -> "http://backend:8000"), sinon localhost pour un dev
// classique hors Docker.
const backendInternalUrl = process.env.VITE_BACKEND_INTERNAL_URL || 'http://localhost:8000'

// Hosts supplémentaires autorisés à accéder au dev server Vite (ex: un domaine
// ngrok). Vide en local -> pas de restriction ajoutée. Sur la VM, on met la
// valeur dans le .env (jamais commitée), donc ce fichier reste identique
// partout, même si le domaine ngrok change.
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
