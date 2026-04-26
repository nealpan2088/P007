// 麒麟项目前端 - API路由配置系统
// 所有API路由通过常量管理，与后端路由配置保持一致
//
// 路由前缀规范：
//   api-client.ts 的 apiGet/apiPost 等函数自动给路径加 /api 前缀
//   所以本文件中的路由常量以对应后端 prefix 开头（如 /tenant/list），不带 /api
//   完整 URL 由 api-client.ts 统一构建：/api + /tenant/list → /api/tenant/list
//
// 后端实际路由前缀：
//   /api/public   - 公开API（扫码点餐等，无需认证）
//   /api/tenant   - 租户API（需要认证）
//   /api/store    - 店铺API（需要认证）
//   /api/admin    - 管理API（需要认证）

// ============================================
// 公共API路由（无需认证）
// ============================================
export const PUBLIC_API_ROUTES = {
  // 健康检查
  HEALTH: '/public/health',

  // 扫码点餐 - 店铺信息（新规范：基于租户+店铺slug）
  SCAN: {
    // 店铺直接访问（简化版）
    STORE: {
      INFO: '/public/stores/:storeId',
      MENU: '/public/stores/:storeId/menu',
      TABLE: '/public/stores/:storeId/tables/:tableId',
    },
    // 订单
    ORDER: {
      CREATE: '/public/orders',
      STATUS: '/public/orders/:orderId/status',
    },
  },

  // 公共信息
  PUBLIC: {
    VERSION: '/public/version',
    FEATURES: '/public/features',
    PRICING: '/public/pricing',
  },
};

// ============================================
// 租户API路由（需要认证，前缀 /api/tenant）
// ============================================
export const TENANT_API_ROUTES = {
  // 租户管理
  TENANT: {
    LIST: '/tenant/list',
    DETAIL: '/tenant/:tenantId',
    UPDATE: '/tenant/:tenantId',
    DELETE: '/tenant/:tenantId',
    HEALTH: '/tenant/health',
    // 租户注册与检查
    CHECK_SLUG: '/tenant/check-slug',
    CHECK_SUBDOMAIN: '/tenant/check-subdomain',
    REGISTER: '/tenant/register',
  },

  // 店铺管理
  STORE: {
    LIST: '/store/stores',
    DETAIL: '/store/stores/:storeId',
    CREATE: '/store/stores',
    UPDATE: '/store/stores/:storeId',
    DELETE: '/store/stores/:storeId',
    CHECK_SLUG: '/store/stores/check-slug',
  },

  // 菜单管理
  MENU: {
    // 分类
    CATEGORIES: '/store/stores/:storeId/menu/categories',
    CATEGORY_DETAIL: '/store/stores/:storeId/menu/categories/:categoryId',
    CATEGORY_REORDER: '/store/stores/:storeId/menu/categories/reorder',
    // 菜品
    ITEMS: '/store/stores/:storeId/menu/items',
    BATCH_CREATE: '/admin/menu-templates/batch-create',
    ITEM_DETAIL: '/store/stores/:storeId/menu/items/:itemId',
    ITEM_AVAILABILITY: '/store/stores/:storeId/menu/items/:itemId/availability',
  },

  // 上传
  UPLOAD: {
    MENU_IMAGE: '/upload/menu-image',
  },

  // Dashboard 数据查询
  DASHBOARD: {
    STORES: '/tenant/:tenantSlug/stores',
    ORDERS: '/tenant/:tenantSlug/orders',
    ORDERS_STATS: '/tenant/:tenantSlug/orders/stats',
  },

  // 餐桌管理
  TABLES: {
    LIST: '/tenant/stores/:storeId/tables',
    CREATE: '/tenant/stores/:storeId/tables',
    BATCH_CREATE: '/tenant/stores/:storeId/tables/batch',
    DETAIL: '/tenant/stores/:storeId/tables/:tableId',
    UPDATE: '/tenant/stores/:storeId/tables/:tableId',
    DELETE: '/tenant/stores/:storeId/tables/:tableId',
    QR_CODE: '/tenant/stores/:storeId/tables/:tableId/qr-code',
    STATUS: '/tenant/stores/:storeId/tables/:tableId/status',
    BATCH_STATUS: '/tenant/stores/:storeId/tables/batch-status',
  },
};

// ============================================
// 夜狼业务流程配置 API（需要认证）
// ============================================
export const NIGHTWOLF_API_ROUTES = {
  CONFIGS: '/nightwolf/configs',
  CONFIG_BY_TYPE: '/nightwolf/configs/:storeType',
  STORE_CONFIG: '/nightwolf/store/:storeId/config',
  STORE_OVERRIDE: '/nightwolf/store/:storeId/override',
  HEALTH: '/nightwolf/health',
  TRIGGER: '/nightwolf/store/:storeId/trigger',
};

// ============================================
// 工具函数
// ============================================

// 替换路径参数
export const buildApiUrl = (template: string, params: Record<string, string | number> = {}): string => {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, encodeURIComponent(String(value)));
  }
  return url;
};

// 获取完整的API URL（仅做参数替换，不做URL拼接）
// 前缀 /api 由 api-client.ts 统一添加
export const getApiUrl = (route: string, params: Record<string, string | number> = {}): string => {
  return buildApiUrl(route, params);
};

// 便捷构建函数
export const apiBuilders = {
  // 店铺信息（新规范：基于租户）
  tenantStoreInfo(tenantSlug: string, storeSlug: string): string {
    return buildApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.INFO, { tenantSlug, storeSlug });
  },
  tenantStoreMenu(tenantSlug: string, storeSlug: string): string {
    return buildApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.MENU, { tenantSlug, storeSlug });
  },
  tenantTableInfo(tenantSlug: string, storeSlug: string, tableId: string): string {
    return buildApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.TABLE, { tenantSlug, storeSlug, tableId });
  },

  // 店铺信息（简化版）
  storeInfo(storeId: string): string {
    return buildApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.INFO, { storeId });
  },
  storeMenu(storeId: string): string {
    return buildApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.MENU, { storeId });
  },
  tableInfo(storeId: string, tableId: string): string {
    return buildApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.TABLE, { storeId, tableId });
  },

  // 订单
  orderStatus(orderId: string): string {
    return buildApiUrl(PUBLIC_API_ROUTES.SCAN.ORDER.STATUS, { orderId });
  },
};

// 兼容旧版API_ENDPOINTS导出（供 scan-routes.ts 等旧文件使用）
// 所有路径通过常量引用，不再硬编码 /api 前缀
export const API_ENDPOINTS = {
  PUBLIC: {
    HEALTH: getApiUrl(PUBLIC_API_ROUTES.HEALTH),
    TENANT_STORE_INFO: getApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.INFO),
    TENANT_STORE_MENU: getApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.MENU),
    TENANT_TABLE_INFO: getApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.TABLE),
    STORE_INFO: getApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.INFO),
    STORE_MENU: getApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.MENU),
    TABLE_INFO: getApiUrl(PUBLIC_API_ROUTES.SCAN.STORE.TABLE),
    CREATE_ORDER: getApiUrl(PUBLIC_API_ROUTES.SCAN.ORDER.CREATE),
    ORDER_STATUS: getApiUrl(PUBLIC_API_ROUTES.SCAN.ORDER.STATUS),
  },
  TENANT: {
    CHECK_SLUG: getApiUrl(TENANT_API_ROUTES.TENANT.CHECK_SLUG),
    CHECK_SUBDOMAIN: getApiUrl(TENANT_API_ROUTES.TENANT.CHECK_SUBDOMAIN),
    REGISTER: getApiUrl(TENANT_API_ROUTES.TENANT.REGISTER),
    LIST: getApiUrl(TENANT_API_ROUTES.TENANT.LIST),
    DETAIL: getApiUrl(TENANT_API_ROUTES.TENANT.DETAIL),
    UPDATE: getApiUrl(TENANT_API_ROUTES.TENANT.UPDATE),
    DELETE: getApiUrl(TENANT_API_ROUTES.TENANT.DELETE),
    STORES: {
      LIST: getApiUrl(TENANT_API_ROUTES.STORE.LIST),
      CREATE: getApiUrl(TENANT_API_ROUTES.STORE.CREATE),
      DETAIL: getApiUrl(TENANT_API_ROUTES.STORE.DETAIL),
      CHECK_SLUG: getApiUrl(TENANT_API_ROUTES.STORE.CHECK_SLUG),
      UPDATE: getApiUrl(TENANT_API_ROUTES.STORE.UPDATE),
    },
  },
  // 餐桌管理
  TABLES: {
    LIST: getApiUrl(TENANT_API_ROUTES.TABLES.LIST),
    CREATE: getApiUrl(TENANT_API_ROUTES.TABLES.CREATE),
    BATCH_CREATE: getApiUrl(TENANT_API_ROUTES.TABLES.BATCH_CREATE),
    DETAIL: getApiUrl(TENANT_API_ROUTES.TABLES.DETAIL),
    UPDATE: getApiUrl(TENANT_API_ROUTES.TABLES.UPDATE),
    DELETE: getApiUrl(TENANT_API_ROUTES.TABLES.DELETE),
    QR_CODE: getApiUrl(TENANT_API_ROUTES.TABLES.QR_CODE),
    BATCH_STATUS: getApiUrl(TENANT_API_ROUTES.TABLES.BATCH_STATUS),
  },
  // 菜单管理（新规范）
  MENU: {
    CATEGORIES: getApiUrl(TENANT_API_ROUTES.MENU.CATEGORIES),
    CATEGORY_DETAIL: getApiUrl(TENANT_API_ROUTES.MENU.CATEGORY_DETAIL),
    CATEGORY_REORDER: getApiUrl(TENANT_API_ROUTES.MENU.CATEGORY_REORDER),
    ITEMS: getApiUrl(TENANT_API_ROUTES.MENU.ITEMS),
    ITEM_DETAIL: getApiUrl(TENANT_API_ROUTES.MENU.ITEM_DETAIL),
    ITEM_AVAILABILITY: getApiUrl(TENANT_API_ROUTES.MENU.ITEM_AVAILABILITY),
  },
  // 打印机管理（管理后台）
  PRINTER: {
    BRANDS: getApiUrl('/admin/printers/brands'),
    LIST: getApiUrl('/admin/printers'),
    CREATE: getApiUrl('/admin/printers'),
    UPDATE: getApiUrl('/admin/printers/:id'),
    DELETE: getApiUrl('/admin/printers/:id'),
    TEST: getApiUrl('/admin/printers/:id/test'),
  },
  // 店铺选择（管理后台）
  STORES_SELECT: getApiUrl('/admin/stores/select'),
  STORES_LIST: getApiUrl('/admin/stores/list'),
  UPLOAD: {
    MENU_IMAGE: getApiUrl(TENANT_API_ROUTES.UPLOAD.MENU_IMAGE),
    FOOD_IMAGE: getApiUrl('/upload/food-image'),
  },

  // 默认占位图
  DEFAULT_FOOD_IMAGE: getApiUrl('/default-food-image'),

  // 菜品素材库
  MENU_TEMPLATES: {
    CATEGORIES: getApiUrl('/admin/menu-templates/categories'),
    ITEMS: getApiUrl('/admin/menu-templates/items'),
    BATCH_CREATE: getApiUrl('/admin/menu-templates/batch-create'),
    ITEM: getApiUrl('/admin/menu-templates/items/:id'),
    IMPORT: getApiUrl('/admin/menu-templates/import'),
  },

  // 用户管理
  USERS: {
    LIST: getApiUrl('/admin/users'),
    CREATE: getApiUrl('/admin/users/create'),
    SET_STORE_ADMIN: (userId: string) => getApiUrl(`/admin/users/${userId}/set-store-admin`),
    REMOVE_STORE_ADMIN: (userId: string) => getApiUrl(`/admin/users/${userId}/remove-store-admin`),
  },

  utils: {
    buildUrl: buildApiUrl,
    buildTenantStoreInfoUrl: apiBuilders.tenantStoreInfo,
    buildTenantStoreMenuUrl: apiBuilders.tenantStoreMenu,
  },
};

// 默认导出
export default {
  public: PUBLIC_API_ROUTES,
  tenant: TENANT_API_ROUTES,
  legacy: API_ENDPOINTS,
  buildUrl: buildApiUrl,
  getUrl: getApiUrl,
  builders: apiBuilders,
};