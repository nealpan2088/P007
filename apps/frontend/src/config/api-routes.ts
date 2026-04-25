// 麒麟项目前端 - API路由配置系统
// 所有API路由通过常量管理，与后端路由配置保持一致
//
// 后端实际路由前缀：
//   /api          - 健康检查
//   /api/public   - 公开API（扫码点餐等，无需认证）
//   /api/tenant   - 租户API（需要认证）
//   /api/store    - 店铺API（需要认证）
//   /api/admin    - 管理API（需要认证）

import config from './dynamic-config';

const API_BASE_URL = config.api.baseUrl;

// ============================================
// 公共API路由（无需认证）
// ============================================
export const PUBLIC_API_ROUTES = {
  // 健康检查
  HEALTH: '/api/public/health',

  // 扫码点餐 - 店铺信息（新规范：基于租户+店铺slug）
  SCAN: {
    // 店铺直接访问（简化版）
    STORE: {
      INFO: '/api/public/stores/:storeId',
      MENU: '/api/public/stores/:storeId/menu',
      TABLE: '/api/public/stores/:storeId/tables/:tableId',
    },
    // 订单
    ORDER: {
      CREATE: '/api/public/orders',
      STATUS: '/api/public/orders/:orderId/status',
    },
  },

  // 公共信息
  PUBLIC: {
    VERSION: '/api/public/version',
    FEATURES: '/api/public/features',
    PRICING: '/api/public/pricing',
  },
};

// ============================================
// 租户API路由（需要认证，前缀 /api/tenant）
// ============================================
export const TENANT_API_ROUTES = {
  // 租户管理
  TENANT: {
    LIST: '/api/tenant/list',
    DETAIL: '/api/tenant/:tenantId',
    UPDATE: '/api/tenant/:tenantId',
    HEALTH: '/api/tenant/health',
    // 租户注册与检查
    CHECK_SLUG: '/api/tenant/check-slug',
    CHECK_SUBDOMAIN: '/api/tenant/check-subdomain',
    REGISTER: '/api/tenant/register',
  },

  // 店铺管理
  STORE: {
    LIST: '/api/store/stores',
    DETAIL: '/api/store/stores/:storeId',
    CREATE: '/api/store/stores',
    UPDATE: '/api/store/stores/:storeId',
    DELETE: '/api/store/stores/:storeId',
    CHECK_SLUG: '/api/store/stores/check-slug',
  },

  // 菜单管理
  MENU: {
    // 分类
    CATEGORIES: '/api/store/stores/:storeId/menu/categories',
    CATEGORY_DETAIL: '/api/store/stores/:storeId/menu/categories/:categoryId',
    CATEGORY_REORDER: '/api/store/stores/:storeId/menu/categories/reorder',
    // 菜品
    ITEMS: '/api/store/stores/:storeId/menu/items',
    BATCH_CREATE: '/api/admin/menu-templates/batch-create',
    ITEM_DETAIL: '/api/store/stores/:storeId/menu/items/:itemId',
    ITEM_AVAILABILITY: '/api/store/stores/:storeId/menu/items/:itemId/availability',
  },

  // 上传
  UPLOAD: {
    MENU_IMAGE: '/api/upload/menu-image',
  },

  // Dashboard 数据查询
  DASHBOARD: {
    STORES: '/api/tenant/:tenantSlug/stores',
    ORDERS: '/api/tenant/:tenantSlug/orders',
    ORDERS_STATS: '/api/tenant/:tenantSlug/orders/stats',
  },
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

// 获取完整的API URL
export const getApiUrl = (route: string, params: Record<string, string | number> = {}): string => {
  const url = buildApiUrl(route, params);
  if (!url.startsWith('http') && !url.startsWith('/api')) {
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
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
export const API_ENDPOINTS = {
  PUBLIC: {
    HEALTH: getApiUrl('/api/public/health'),
    // TENANT_INFO: 已删除（后端不存在）
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
    STORES: {
      LIST: getApiUrl(TENANT_API_ROUTES.STORE.LIST),
      CREATE: getApiUrl(TENANT_API_ROUTES.STORE.CREATE),
      DETAIL: getApiUrl(TENANT_API_ROUTES.STORE.DETAIL),
      CHECK_SLUG: getApiUrl(TENANT_API_ROUTES.STORE.CHECK_SLUG),
      UPDATE: getApiUrl(TENANT_API_ROUTES.STORE.UPDATE),
    },
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
    BRANDS: getApiUrl('/api/admin/printers/brands'),
    LIST: getApiUrl('/api/admin/printers'),
    CREATE: getApiUrl('/api/admin/printers'),
    UPDATE: getApiUrl('/api/admin/printers/:id'),
    DELETE: getApiUrl('/api/admin/printers/:id'),
    TEST: getApiUrl('/api/admin/printers/:id/test'),
  },
  // 店铺选择（管理后台）
  STORES_SELECT: getApiUrl('/api/admin/stores/select'),
  STORES_LIST: getApiUrl('/api/admin/stores/list'),
  UPLOAD: {
    MENU_IMAGE: getApiUrl(TENANT_API_ROUTES.UPLOAD.MENU_IMAGE),
    FOOD_IMAGE: getApiUrl('/api/upload/food-image'),
  },

  // 默认占位图
  DEFAULT_FOOD_IMAGE: getApiUrl('/api/default-food-image'),

  // 菜品素材库
  MENU_TEMPLATES: {
    CATEGORIES: getApiUrl('/api/admin/menu-templates/categories'),
    ITEMS: getApiUrl('/api/admin/menu-templates/items'),
    BATCH_CREATE: getApiUrl('/api/admin/menu-templates/batch-create'),
    ITEM: getApiUrl('/api/admin/menu-templates/items/:id'),
    IMPORT: getApiUrl('/api/admin/menu-templates/import'),
  },

  // 用户管理
  USERS: {
    LIST: getApiUrl('/api/admin/users'),
    CREATE: getApiUrl('/api/admin/users/create'),
    SET_STORE_ADMIN: (userId: string) => getApiUrl(`/api/admin/users/${userId}/set-store-admin`),
    REMOVE_STORE_ADMIN: (userId: string) => getApiUrl(`/api/admin/users/${userId}/remove-store-admin`),
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

// ==================== 开发环境路径规范校验 ====================
/**
 * 检查 API 路径是否与 api-client.ts 的 API_BASE 重复前缀
 * 
 * 规范要求：
 * - api-client.ts 有 API_BASE = '/api'，会自动给路径加 /api 前缀
 * - 所以 API 路由常量不应该以 /api 开头，否则前端请求路径会变成 /api/api/xxx
 * - 例外：已确认 getApiUrl() 处理的路径可以保留 /api 前缀（函数内会去重）
 * 
 * 未来所有 API 常量应：CHECK_SLUG: '/store/stores/check-slug'
 * 而不是：            CHECK_SLUG: '/api/store/stores/check-slug'
 */
const API_PATH_CHECK_ENABLED = typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  process.env.NODE_ENV !== 'production';

if (API_PATH_CHECK_ENABLED) {
  setTimeout(() => {
    const checked = new Set<string>();
    
    function scan(obj: Record<string, any>, path: string = '') {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && value.startsWith('/api/') && !checked.has(value)) {
          checked.add(value);
          // 检查是不是从 getApiUrl 来的（已去重）
          // 简单判断：如果是纯字符串定义（非函数返回值），可能有重复 /api 风险
          // 在控制台打印警告
          console.warn(
            `⚠️ [API路径规范] ${fullPath} = "${value}"\n` +
            `   api-client.ts 的 API_BASE 是 '/api'，此路径以 /api 开头\n` +
            `   建议改为 "${value.replace('/api', '')}"（去掉 /api 前缀）\n` +
            `   后续统一由 apiRequest() 自动补上`
          );
        } else if (typeof value === 'object' && value !== null) {
          scan(value, fullPath);
        }
      }
    }
    
    console.group('🔎 API路径规范检查');
    scan(PUBLIC_API_ROUTES, 'PUBLIC_API_ROUTES');
    scan(TENANT_API_ROUTES, 'TENANT_API_ROUTES');
    scan(API_ENDPOINTS, 'API_ENDPOINTS');
    console.groupEnd();
  }, 2000);
}