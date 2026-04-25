# 麒麟项目 - 认证系统三入口设计

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    qilin.com (前端)                          │
│                                                             │
│  /login ─────────────────── 超级管理员登录页                  │
│  /t/:tenantSlug ─────────── 租户管理后台                     │
│  /scan/:tableId ─────────── 顾客扫码点餐                     │
└─────────────────────────────────────────────────────────────┘
```

## 三个入口

### 1. 超级管理员入口 `/login`
- **URL**: `https://qilin.com/login`
- **对象**: 平台运营团队（你）
- **功能**: 管理所有租户、系统配置、监控
- **跳转**: 登录成功后跳转到 `/admin/...`
- **API**: `POST /api/v1/auth/login`（含角色区分）

### 2. 租户管理后台 `/t/:tenantSlug`
- **URL**: `https://qilin.com/t/xxx-canting`
- **对象**: 商家老板、餐厅工作人员
- **功能**: 管理店铺、菜单、订单、打印机
- **跳转**: 登录成功后跳转到 `/t/:tenantSlug/dashboard`
- **API**: `POST /api/v1/auth/tenant-login`
- **特点**: 使用子域名形式自动识别租户

### 3. 扫码点餐 `/scan/:tableId`
- **URL**: `https://qilin.com/scan/A01`
- **对象**: 顾客（吃饭的人）
- **功能**: 扫码查看菜单、点餐、下单
- **不需要登录**

## 路由配置

```typescript
// routes.ts 新增/修改
PUBLIC_ROUTES = {
  HOME: '/',
  // 认证
  AUTH: {
    LOGIN: '/login',           // 超级管理员登录
    REGISTER: '/register',     // 超级管理员注册
    FORGOT_PASSWORD: '/forgot-password',
  },
  // 租户后台
  TENANT: {
    LOGIN: '/t/:tenantSlug/login',       // 租户管理员登录
    DASHBOARD: '/t/:tenantSlug/dashboard',
    STORES: '/t/:tenantSlug/stores',
    MENU: '/t/:tenantSlug/menu',
    ORDERS: '/t/:tenantSlug/orders',
    PRINTERS: '/t/:tenantSlug/printers',
    SETTINGS: '/t/:tenantSlug/settings',
  },
  // 扫码点餐
  SCAN: {
    ORDER: '/scan/:tableId',
    TABLE: '/scan/:tableId/menu',
    CART: '/scan/:tableId/cart',
    ORDER_STATUS: '/scan/:orderId/status',
  },
}
```

## 当前状态

超级管理员和租户管理员目前混在同一个 `/auth/login`，需要分拆。

### TODO
1. [ ] 创建超级管理员登录页面 `/login`（简化当前 LoginPage）
2. [ ] 创建租户管理后台登录页面 `/t/:tenantSlug/login`
3. [ ] 后端添加租户专用登录接口 `POST /api/v1/auth/tenant-login`
4. [ ] 租户后台布局（基于子域名识别租户上下文）
5. [ ] 前端路由配置切换
