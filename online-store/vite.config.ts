import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/paymentlink': {
        target: 'https://api-pay-sandbox.n1co.shop',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
