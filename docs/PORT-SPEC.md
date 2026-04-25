# 麒麟项目 - 端口规范

## 端口分配

| 服务 | 端口 | 环境变量 | 说明 |
|------|------|----------|------|
| 前端开发服务器 (Vite) | **5177** | `VITE_PORT` | `vite.config.ts`, `.env`, `pm2.config.js` |
| 前端构建预览 (Vite preview) | **5177** | — | `vite.config.ts preview.port` |
| 后端 API 服务器 | **33038** | `PORT` | `backend/.env`, `pm2.config.js` |
| Vite Proxy | 33038 | — | `vite.config.ts server.proxy` → `/api` → `localhost:33038` |
| CORS 白名单 | 33038 | `CORS_ORIGIN` | 后端 config/index.js: `['http://localhost:5177']` |

## 核心原则

1. **唯一权威源** — `vite.config.ts:port` 和 `backend/.env:PORT` 是唯一真值，其余文件指向它们
2. **不允许硬编码 port 数值** — 所有文件通过环境变量或配置引用
3. **所有端口已统一** — 无 33037 / 5171 等旧端口残留

## 检查清单

```bash
# 验证前后端均在线
curl -s -o /dev/null -w "%{http_code}" http://localhost:5177/         # → 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:33038/api/health # → 200
```
