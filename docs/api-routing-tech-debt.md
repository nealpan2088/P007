# 麒麟项目 - API与路由规范化技术负债清单

## 🔴 P0 - 严重问题（立即修复）

### 1. store.routes.register.js 嵌套前缀错误
- **问题**: register.js 内部写死了 `prefix: '/api/v1'`，但 index.js 外层也是 `/api/store`
- **结果**: 最终路径变成 `/api/store/api/v1/stores`，而非正确的 `/api/store/stores`
- **文件**: `apps/backend/src/routes/store.routes.register.js`
- **修复**: 移除 register.js 内层前缀，或统一使用路由常量
- **影响**: 店铺管理API全部404

### 2. admin.routes 硬编码路径且前缀不统一
- **问题**: 
  - `admin.routes.js` 中 `/stores`、`/stores/stats`、`/health` 全部硬编码
  - `admin.routes.register.js` 使用 `/api/v1/admin`（旧版前缀）
- **文件**: `apps/backend/src/routes/admin.routes.js`、`admin.routes.register.js`
- **修复**: 使用 ADMIN_ROUTES 常量，前缀改 `/api/admin`

## 🟡 P1 - 中等问题（本周内修复）

### 3. index.js 中 `/api/health` 硬编码
- **问题**: `fastify.get('/api/health', ...)` 未使用路由常量
- **文件**: `apps/backend/src/index.js:90`
- **修复**: 引用 `PUBLIC_ROUTES.HEALTH`

### 4. backend routes.js 存在 `BASE_PATH` 定义但未使用
- **问题**: `const BASE_PATH = `${API_PREFIX}/${API_VERSION}`` 定义了但没有任何路由常量引用它
- **文件**: `apps/backend/src/config/routes.js:9`
- **修复**: 删除无用代码，或改为引用以确保不会意外启用

### 5. 前端 routes.ts 存在冗余 `RouteUtils`
- **问题**: `routes.ts` 和 `api-routes.ts` 都有 `buildApiUrl` 工具函数，功能重复
- **文件**: `apps/frontend/src/config/routes.ts`、`api-routes.ts`
- **修复**: 统一使用 `api-routes.ts` 的版本

## 🟢 P2 - 低优先级（视情况修复）

### 6. nightwolf 模块使用硬编码 `/api/nightwolf/v1/`
- **问题**: 所有路径硬编码，未通过路由常量管理
- **文件**: `apps/backend/src/modules/nightwolf/config/constants.js`
- **影响**: 仅旧项目使用，当前未启用，不影响新规范

### 7. 前端旧规范页面仍存在但已标记弃用
- **文件**: `CreateTenant.tsx`、`StoreManagement.tsx`、`store-management/utils/api.utils.ts`、`menu-management/utils/api.ts`
- **状态**: 已标记 `@deprecated`，等待新页面上线后删除

### 8. 后端 CUSTOMER_ROUTES、ADMIN_ROUTES 常量定义但未使用
- **文件**: `apps/backend/src/config/routes.js`
- **问题**: 定义了但没有任何路由文件引用
