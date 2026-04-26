import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 端口规范:
//   前端开发服务器: 5177
//   后端 API 服务器（生产）: 33038
//   后端 API 服务器（开发）: 33039
//   Vite 代理: /api → http://localhost:33039

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,          // 一致性: pm2.config.js / .env 均使用 5177
    host: true,
    allowedHosts: ['saas.openyun.xin', 'localhost', '127.0.0.1', '172.26.30.77', '47.110.156.11'],
    proxy: {
      '/api': {
        target: 'http://localhost:33038',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5177           // 构建预览与开发端口一致
  }
})
