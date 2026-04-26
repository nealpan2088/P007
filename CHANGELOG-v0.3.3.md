# v0.3.3 — 店铺管理功能增强 + 扫码体验优化

**日期**: 2026-04-26
**分支**: `feature/store-admin`

## 新增功能

### 1. 餐桌管理（店铺级）
- 后端：`table.service.js` + `tenant.routes.js` 完整 CRUD
  - `GET/POST /stores/:storeId/tables` — 列表/创建
  - `POST /stores/:storeId/tables/batch` — 批量创建
  - `PUT /stores/:storeId/tables/:tableId` — 更新
  - `PATCH /stores/:storeId/tables/batch-status` — 批量状态切换
  - `DELETE /stores/:storeId/tables/:tableId` — 删除
  - `GET /stores/:storeId/tables/:tableId/qr-code` — 扫码链接
- 前端：`TableManagementPage.tsx` 完整界面
  - 店铺选择下拉框（自动加载）
  - 卡片式餐桌列表（名称/容量/状态）
  - 批量激活/停用/删除
  - 批量创建（前缀+起始号+数量）
  - 一键复制扫码链接
- 入口：店铺管理列表每行 🪑 按钮

### 2. 店头背景图个性化
- Store 表新增 `headerImageUrl` 字段
- 后端上传接口 `POST /api/upload/store-header`
  - sharp 自动压缩（最长边 1200px, quality 80）
  - 统一转 JPEG
- ScanHeader 支持背景图渲染（有图时覆盖渐变）
- 装修弹窗新增背景图上传/预览/清除

### 3. 图片上传压缩优化
- Logo 上传：sharp 压缩（200px 以内, quality 80）
- Header 上传：sharp 压缩 + 转 JPEG
- 使用 `sharp` 库（v0.34.5）

### 4. 租户删除（软删除）
- 后端路由 `DELETE /api/tenant/:tenantId`
- 前端删除按钮调用真实 API（原为 alert 占位）
- 权限控制：仅 ADMIN 可操作

## 问题修复

### 路由与架构
- **白屏修复**：移除 `CustomRouter.tsx` 中的 `v7_relativeSplatPath`/`v7_startTransition` 配置
- **`NIGHTWOLF_ROUTES` 未定义**：删除 routes.js 中错误引用，后端正常启动
- **路由一致性检查**：新增 `scripts/check-route-consistency.sh` 纳入 `npm run check:standards`

### API 与数据
- **`/admin/tenants` 404**：`getApiUrl` + `VITE_API_BASE_URL` 双重前缀修复，`VITE_API_BASE_URL` 置空
- **`stores/select` 缺 `status` 字段**：后端 select 补全
- **`TENANT_API_ROUTES.TABLES` 缺 `/tenant` 前缀**：补全所有 9 个端点
- **前端 `MenuTemplateManager.tsx` 使用 `fetch()`**：改为 `apiGet()`

### 打印
- **打印订单号 UUID 问题**：`order.id` → `order.orderNumber`
- **小票排版优化**：菜品名 + 点线 + 金额同行，省纸整齐

### UI/UX
- **ItemDetailModal 图片裁剪**：`object-contain` → `object-cover`，高度 208px → 256px
- **AdminDashboard 清理**：删除调试代码（console.log / debug `<p>`）
- **SystemSettingsPage**：独立组件，与 AdminDashboard 分离
- **`TenantDashboard.tsx` NaN 错误**：加法用 `|| 0` 兜底
- **扫码页白边修复**：body `margin:0`，容器 `flex flex-col overflow-hidden`

### 硬编码清理
- 修复 `fastify.get('/api/config/routes')` → 引用常量
- 修复 `url: '/api/nightwolf/health'` → 引用常量
- 所有 API 请求统一经过 `api-client.ts`（`apiGet`/`apiPost`/`apiDelete`）

## 技术改进
- `sharp` 图像处理库引入
- `UPLOAD_ROUTES.STORE_HEADER` 路由常量
- 后端 `TENANT_ROUTES.TABLES.*` 完整路由定义
- `scripts/check-hardcoded-simple.sh` 优化（排除 Fastify prefix / rate limiter）
