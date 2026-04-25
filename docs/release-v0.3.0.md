# 麒麟云点餐SaaS - 版本 v0.3.0

## 版本: v0.3.0 🚀 生产部署版
**日期**: 2026-04-24

### 变更日志

#### ✨ 生产部署
- **HTTPS + Nginx 反代**: 配置 `saas.openyun.xin` SSL 证书，Nginx 反向代理后端 API
- **前端 production build**: 静态文件输出到 `dist/`，Nginx 直出，不再依赖 dev server
- **PM2 开机自启**: `pm2 save` + `pm2 startup` systemd 服务
- **Nginx 配置**: 双域名 `openyun.xin`（个人技术站）+ `saas.openyun.xin`（麒麟项目）

#### ♻️ 路由规范化
- **TenantDashboard**: URL 参数 `tenantId` → `tenantSlug`，与路由定义 `/t/:tenantSlug` 对齐
- **路由常量统一**: 所有页面导航改用 `routes.ts` 中的 `TENANT_ROUTES`/`ADMIN_ROUTES`
- **API 路径常量化**: `api-routes.ts` 集中管理，新增 `buildApiUrl()` 工具函数
- **后端启动检查**: `route-consistency-check.js` 启动时扫描硬编码路由

#### 🛡️ 安全加固
- **CORS 收紧**: 移除 `localhost:33038` 硬编码，API 全走 Nginx 代理
- **环境变量管理**: `.env` 系统规范化，`VITE_API_BASE_URL` 改为空值（同域请求）

#### 📦 新功能
- **打印机管理**: 完整 CRUD + 测试接口（`menu.routes.js`, `printer/` 目录）
- **管理员店铺列表**: `AdminStoresPage.tsx` 全局店铺管理表格
- **菜单模板管理**: `MenuTemplateManager.tsx` 店铺级菜单编辑
- **Prisma 迁移**: 打印机模型数据库迁移

#### 📝 文档
- `docs/auth-system-design.md` - 认证系统设计文档
- `docs/cloud-printer-system.md` - 云打印系统设计文档

### 架构状态

```
openyun.xin:443         → 个人技术分享网站 (Nginx 静态文件)
saas.openyun.xin:443    → 麒麟云点餐SaaS  (Nginx 静态文件 + API 代理)
  ├── /api/             → 后端 API (localhost:33038)
  └── /*                → 前端 SPA 静态文件 (dist/)

PM2: qilin-backend (端口 33038)
Nginx: enabled + systemd 开机自启
SSL: Let's Encrypt (openyun.xin / saas.openyun.xin)
```

### 访问地址
- **管理后台**: `https://saas.openyun.xin/admin`
- **扫码点餐**: `https://saas.openyun.xin/t/qilin-test/s/qilin-test-restaurant/scan/A01`
- **个人技术站**: `https://openyun.xin`
