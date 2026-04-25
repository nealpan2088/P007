import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 端口规范:
//   前端开发服务器: 5177
//   后端 API 服务器: 33038
//   Vite 代理: /api → http://localhost:33038

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,          // 一致性: pm2.config.js / .env 均使用 5177
    host: true,
    allowedHosts: ['saas.openyun.xin', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:33038',  // 一致性: 后端统一端口
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 5177           // 构建预览与开发端口一致
  }
})
