import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5171,
    host: true, // 允许外部访问
    allowedHosts: ['saas.openyun.xin', 'localhost'],
    proxy: {
      // 统一代理所有API请求
      '/api': {
        target: 'http://localhost:33038',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
