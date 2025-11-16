import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Proxy only in development mode
      ...(isDev && {
        proxy: {
          '/api': {
            target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
            changeOrigin: true,
          }
        }
      })
    }
  }
})

