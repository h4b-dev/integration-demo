import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/paymentlink-sandbox': {
        target: 'https://api-pay-sandbox.n1co.shop',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/paymentlink-sandbox/, '/api/paymentlink'),
      },
      '/api/paymentlink-live': {
        target: 'https://api-pay.n1co.shop',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/paymentlink-live/, '/api/paymentlink'),
      },
    },
  },
})
