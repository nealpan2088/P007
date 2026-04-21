// 麒麟项目前端 - API路由配置系统
// 所有API路由通过常量管理，与后端路由配置保持一致

import config from './dynamic-config';

// API基础路径
const API_BASE_URL = config.api.baseUrl;
const API_VERSION = config.api.version;
const BASE_PATH = `${API_BASE_URL}/api/${API_VERSION}`;

// 公共API路由（无需认证）
export const PUBLIC_API_ROUTES = {
  // 健康检查
  HEALTH: `${API_BASE_URL}/api/health`,
  
  // 认证
  AUTH: {
    REGISTER: `${BASE_PATH}/auth/register`,
    LOGIN: `${BASE_PATH}/auth/login`,
    LOGOUT: `${BASE_PATH}/auth/logout`,
    REFRESH_TOKEN: `${BASE_PATH}/auth/refresh-token`,
    FORGOT_PASSWORD: `${BASE_PATH}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_PATH}/auth/reset-password`,
    VERIFY_EMAIL: `${BASE_PATH}/auth/verify-email`,
    PROFILE: `${BASE_PATH}/auth/profile`,
  },
  
  // 租户
  TENANT: {
    CHECK_SUBDOMAIN: `${BASE_PATH}/tenant/check-subdomain`,
    PUBLIC_INFO: `${BASE_PATH}/tenant/:tenantId/public`,
  },
  
  // 公共信息
  PUBLIC: {
    VERSION: `${BASE_PATH}/public/version`,
    FEATURES: `${BASE_PATH}/public/features`,
    PRICING: `${BASE_PATH}/public/pricing`,
  },
};

// 租户API路由（需要认证）
export const TENANT_API_ROUTES = {
  // 租户管理
  TENANT: {
    // 租户注册和检查
    REGISTER: `${BASE_PATH}/tenant/register`,
    CHECK_SUBDOMAIN: `${BASE_PATH}/tenant/check-subdomain`,
    
    // 租户信息管理
    LIST: `${BASE_PATH}/tenant/list`,
    DETAIL: `${BASE_PATH}/tenant/:tenantId`,
    UPDATE: `${BASE_PATH}/tenant/:tenantId`,
    DELETE: `${BASE_PATH}/tenant/:tenantId`,
    STATS: `${BASE_PATH}/tenant/:tenantId/stats`,
    
    // 租户用户管理
    ADD_USER: `${BASE_PATH}/tenant/:tenantId/users`,
    REMOVE_USER: `${BASE_PATH}/tenant/:tenantId/users/:userId`,
    LIST_USERS: `${BASE_PATH}/tenant/:tenantId/users`,
    UPDATE_USER_ROLE: `${BASE_PATH}/tenant/:tenantId/users/:userId/role`,
    
    // 租户设置
    SETTINGS: `${BASE_PATH}/tenant/:tenantId/settings`,
    UPDATE_SETTINGS: `${BASE_PATH}/tenant/:tenantId/settings`,
    
    // 租户健康检查
    HEALTH: `${BASE_PATH}/tenant/:tenantId/health`,
  },
  
  // 店铺管理
  STORE: {
    LIST: `${BASE_PATH}/tenant/:tenantId/stores`,
    CREATE: `${BASE_PATH}/tenant/:tenantId/stores`,
    DETAIL: `${BASE_PATH}/tenant/:tenantId/stores/:storeId`,
    UPDATE: `${BASE_PATH}/tenant/:tenantId/stores/:storeId`,
    DELETE: `${BASE_PATH}/tenant/:tenantId/stores/:storeId`,
    
    // 店铺设置
    SETTINGS: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/settings`,
    UPDATE_SETTINGS: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/settings`,
    
    // 店铺菜单
    MENU: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/menu`,
    MENU_CATEGORIES: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/menu/categories`,
    MENU_ITEMS: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/menu/items`,
    
    // 店铺订单
    ORDERS: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/orders`,
    ORDER_DETAIL: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/orders/:orderId`,
    UPDATE_ORDER_STATUS: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/orders/:orderId/status`,
    
    // 店铺打印
    PRINTERS: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/printers`,
    TEST_PRINT: `${BASE_PATH}/tenant/:tenantId/stores/:storeId/printers/:printerId/test`,
  },
  
  // 订单管理
  ORDER: {
    LIST: `${BASE_PATH}/tenant/:tenantId/orders`,
    DETAIL: `${BASE_PATH}/tenant/:tenantId/orders/:orderId`,
    CREATE: `${BASE_PATH}/tenant/:tenantId/orders`,
    UPDATE_STATUS: `${BASE_PATH}/tenant/:tenantId/orders/:orderId/status`,
    CANCEL: `${BASE_PATH}/tenant/:tenantId/orders/:orderId/cancel`,
    
    // 订单统计
    STATS: `${BASE_PATH}/tenant/:tenantId/orders/stats`,
    DAILY_STATS: `${BASE_PATH}/tenant/:tenantId/orders/stats/daily`,
    HOURLY_STATS: `${BASE_PATH}/tenant/:tenantId/orders/stats/hourly`,
  },
  
  // 菜单管理
  MENU: {
    LIST: `${BASE_PATH}/tenant/:tenantId/menu`,
    CATEGORIES: `${BASE_PATH}/tenant/:tenantId/menu/categories`,
    ITEMS: `${BASE_PATH}/tenant/:tenantId/menu/items`,
    
    // 分类管理
    CATEGORY_DETAIL: `${BASE_PATH}/tenant/:tenantId/menu/categories/:categoryId`,
    CREATE_CATEGORY: `${BASE_PATH}/tenant/:tenantId/menu/categories`,
    UPDATE_CATEGORY: `${BASE_PATH}/tenant/:tenantId/menu/categories/:categoryId`,
    DELETE_CATEGORY: `${BASE_PATH}/tenant/:tenantId/menu/categories/:categoryId`,
    
    // 菜品管理
    ITEM_DETAIL: `${BASE_PATH}/tenant/:tenantId/menu/items/:itemId`,
    CREATE_ITEM: `${BASE_PATH}/tenant/:tenantId/menu/items`,
    UPDATE_ITEM: `${BASE_PATH}/tenant/:tenantId/menu/items/:itemId`,
    DELETE_ITEM: `${BASE_PATH}/tenant/:tenantId/menu/items/:itemId`,
    UPDATE_ITEM_STATUS: `${BASE_PATH}/tenant/:tenantId/menu/items/:itemId/status`,
  },
  
  // 打印管理
  PRINT: {
    PRINTERS: `${BASE_PATH}/tenant/:tenantId/printers`,
    PRINTER_DETAIL: `${BASE_PATH}/tenant/:tenantId/printers/:printerId`,
    CREATE_PRINTER: `${BASE_PATH}/tenant/:tenantId/printers`,
    UPDATE_PRINTER: `${BASE_PATH}/tenant/:tenantId/printers/:printerId`,
    DELETE_PRINTER: `${BASE_PATH}/tenant/:tenantId/printers/:printerId`,
    TEST_PRINT: `${BASE_PATH}/tenant/:tenantId/printers/:printerId/test`,
    
    // 打印任务
    PRINT_TASKS: `${BASE_PATH}/tenant/:tenantId/print-tasks`,
    PRINT_TASK_DETAIL: `${BASE_PATH}/tenant/:tenantId/print-tasks/:taskId`,
    RETRY_PRINT: `${BASE_PATH}/tenant/:tenantId/print-tasks/:taskId/retry`,
  },
};

// 工具函数：替换路径参数
export const buildApiUrl = (template: string, params: Record<string, string | number> = {}): string => {
  let url = template;
  
  // 替换路径参数
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  
  return url;
};

// 工具函数：获取完整的API URL
export const getApiUrl = (route: string, params: Record<string, string | number> = {}): string => {
  const url = buildApiUrl(route, params);
  
  // 确保URL是完整的（如果不是以http开头，则添加API基础URL）
  if (!url.startsWith('http') && !url.startsWith('/api')) {
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  
  return url;
};

// 默认导出
export default {
  public: PUBLIC_API_ROUTES,
  tenant: TENANT_API_ROUTES,
  buildUrl: buildApiUrl,
  getUrl: getApiUrl,
};