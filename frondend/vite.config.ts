import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Vite 开发配置。 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
})
