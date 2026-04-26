// 麒麟项目 - API路由常量管理系统
// 所有API路由通过常量管理，禁止硬编码

import config from './index.js';

// API基础路径（实际用于拼接的常量：PUBLIC_ROUTES.HEALTH = `${API_PREFIX}/health`）
const API_PREFIX = config.server.apiPrefix;

// 公共API路由（无需认证）
export const PUBLIC_ROUTES = {
  // 健康检查
  HEALTH: `${API_PREFIX}/health`,
  
  // 认证
  AUTH: {
    REGISTER: `/auth/register`,
    LOGIN: `/auth/login`,
    LOGOUT: `/auth/logout`,
    REFRESH_TOKEN: `/auth/refresh-token`,
    FORGOT_PASSWORD: `/auth/forgot-password`,
    RESET_PASSWORD: `/auth/reset-password`,
    VERIFY_EMAIL: `/auth/verify-email`,
  },

  // 认证路由（相对路径，供 /api/v1/auth 前缀使用）
  AUTH_RELATIVE: {
    REGISTER: '/register',
    ADMIN_LOGIN: '/admin/login',
    TENANT_LOGIN: '/tenant/login',
    LOGIN: '/login',
    REFRESH_TOKEN: '/refresh-token',
    VERIFY_EMAIL: '/verify-email/:token',
    FORGOT_PASSWORD: '/request-password-reset',
    RESET_PASSWORD: '/reset-password',
    LOGOUT: '/logout',
    PROFILE: '/profile',
    CHANGE_PASSWORD: '/change-password',
    SESSIONS: '/sessions',
    REVOKE_SESSION: '/revoke-session',
    HEALTH: '/health',
  },
  
  // 租户
  TENANT: {
    CHECK_SUBDOMAIN: `/tenant/check-subdomain`,
    PUBLIC_INFO: `/tenant/:tenantId/public`,
  },
  
  // 公共信息
  PUBLIC: {
    VERSION: `/version`,
    FEATURES: `/features`,
    PRICING: `/pricing`,
    HELLO: `/hello`,  // API示例端点
    ROUTES: `/config/routes`,  // 路由配置查看（调试用）
  },
  
  // 扫码点餐公共API（无需认证）
  SCAN: {
    // 健康检查（直接根路径）
    HEALTH: '/health',
    
    // 店铺信息
    STORE: {
      INFO: '/stores/:storeId',
      MENU: '/stores/:storeId/menu',
      TABLE_INFO: '/stores/:storeId/tables/:tableId',
    },
    
    // 订单
    ORDER: {
      CREATE: '/orders',
      STATUS: '/orders/:orderId/status',
    },
    
    // 测试
    TEST: {
      ORDER: '/test/order',
    },
  },
};

// 租户API路由（需要租户上下文）
export const TENANT_ROUTES = {
  // 租户管理
  TENANT: {
    // 租户注册和检查（公开）
    REGISTER: `/register`,
    CHECK_SUBDOMAIN: `/check-subdomain`,
    
    // 租户信息管理（需要认证）
    INFO: `/`,
    LIST: `/list`,
    DETAIL: `/:tenantId`,
    UPDATE: `/:tenantId`,
    DELETE: `/:tenantId`,
    STATS: `/:tenantId/stats`,
    HEALTH: `/health`,
    
    // 租户用户管理
    ADD_USER: `/:tenantId/users`,
    REMOVE_USER: `/:tenantId/users/:userId`,
    UPDATE_USER_ROLE: `/:tenantId/users/:userId/role`,
    
    // 租户业务功能
    BILLING: `/billing`,
    SUBSCRIPTION: `/subscription`,
    SETTINGS: `/settings`,
    
    // Dashboard 数据接口
    DASHBOARD: {
      STORES: `/:tenantId/stores`,
      ORDERS: `/:tenantId/orders`,
      ORDERS_STATS: `/:tenantId/orders/stats`,
    },
  },
  
  // 店铺管理
  STORES: {
    LIST: `/stores`,
    CREATE: `/stores`,
    DETAIL: `/stores/:storeId`,
    UPDATE: `/stores/:storeId`,
    DELETE: `/stores/:storeId`,
    UPDATE_STATUS: `/stores/:storeId/status`,
    HEALTH: `/stores/health`,
    STATS: `/stores/:storeId/stats`,
    CHECK_SLUG: `/stores/check-slug`,
    
    // 店铺配置
    SETTINGS: `/stores/:storeId/settings`,
    
    // 店铺员工
    STAFF: {
      LIST: `/stores/:storeId/staff`,
      ADD: `/stores/:storeId/staff`,
      DETAIL: `/stores/:storeId/staff/:userId`,
      UPDATE: `/stores/:storeId/staff/:userId`,
      REMOVE: `/stores/:storeId/staff/:userId`,
    },
  },
  
  // 餐桌管理
  TABLES: {
    LIST: `/stores/:storeId/tables`,
    CREATE: `/stores/:storeId/tables`,
    BATCH_CREATE: `/stores/:storeId/tables/batch`,
    DETAIL: `/stores/:storeId/tables/:tableId`,
    UPDATE: `/stores/:storeId/tables/:tableId`,
    DELETE: `/stores/:storeId/tables/:tableId`,
    QR_CODE: `/stores/:storeId/tables/:tableId/qr-code`,
    STATUS: `/stores/:storeId/tables/:tableId/status`,
    BATCH_STATUS: `/stores/:storeId/tables/batch-status`,
  },
  
  // 菜单管理
  MENU: {
    // 分类
    CATEGORIES: {
      LIST: `/stores/:storeId/menu/categories`,
      CREATE: `/stores/:storeId/menu/categories`,
      DETAIL: `/stores/:storeId/menu/categories/:categoryId`,
      UPDATE: `/stores/:storeId/menu/categories/:categoryId`,
      DELETE: `/stores/:storeId/menu/categories/:categoryId`,
      REORDER: `/stores/:storeId/menu/categories/reorder`,
    },
    
    // 菜品
    ITEMS: {
      LIST: `/stores/:storeId/menu/items`,
      CREATE: `/stores/:storeId/menu/items`,
      DETAIL: `/stores/:storeId/menu/items/:itemId`,
      UPDATE: `/stores/:storeId/menu/items/:itemId`,
      DELETE: `/stores/:storeId/menu/items/:itemId`,
      REORDER: `/stores/:storeId/menu/items/reorder`,
      AVAILABILITY: `/stores/:storeId/menu/items/:itemId/availability`,
      STOCK: `/stores/:storeId/menu/items/:itemId/stock`,
    },
  },
  
  // 订单管理
  ORDERS: {
    LIST: `/stores/:storeId/orders`,
    CREATE: `/stores/:storeId/orders`,
    DETAIL: `/stores/:storeId/orders/:orderId`,
    UPDATE: `/stores/:storeId/orders/:orderId`,
    CANCEL: `/stores/:storeId/orders/:orderId/cancel`,
    
    // 订单状态
    STATUS: {
      UPDATE: `/stores/:storeId/orders/:orderId/status`,
      HISTORY: `/stores/:storeId/orders/:orderId/status-history`,
    },
    
    // 支付
    PAYMENT: {
      CREATE: `/stores/:storeId/orders/:orderId/payment`,
      STATUS: `/stores/:storeId/orders/:orderId/payment/status`,
      REFUND: `/stores/:storeId/orders/:orderId/payment/refund`,
    },
    
    // 打印
    PRINT: {
      RECEIPT: `/stores/:storeId/orders/:orderId/print/receipt`,
      KITCHEN: `/stores/:storeId/orders/:orderId/print/kitchen`,
      STATUS: `/stores/:storeId/orders/:orderId/print/status`,
    },
  },
  
  // 打印机管理
  PRINTERS: {
    LIST: `/stores/:storeId/printers`,
    CREATE: `/stores/:storeId/printers`,
    DETAIL: `/stores/:storeId/printers/:printerId`,
    UPDATE: `/stores/:storeId/printers/:printerId`,
    DELETE: `/stores/:storeId/printers/:printerId`,
    TEST: `/stores/:storeId/printers/:printerId/test`,
    STATUS: `/stores/:storeId/printers/:printerId/status`,
    
    // 打印任务
    JOBS: {
      LIST: `/stores/:storeId/printers/:printerId/jobs`,
      DETAIL: `/stores/:storeId/printers/:printerId/jobs/:jobId`,
      RETRY: `/stores/:storeId/printers/:printerId/jobs/:jobId/retry`,
      CANCEL: `/stores/:storeId/printers/:printerId/jobs/:jobId/cancel`,
    },
  },
  
  // 用户管理
  USERS: {
    PROFILE: `/users/profile`,
    UPDATE_PROFILE: `/users/profile`,
    CHANGE_PASSWORD: `/users/change-password`,
    SESSIONS: `/users/sessions`,
    SESSION_DETAIL: `/users/sessions/:sessionId`,
    REVOKE_SESSION: `/users/sessions/:sessionId/revoke`,
  },
  
  // 统计分析
  ANALYTICS: {
    // 销售统计
    SALES: {
      SUMMARY: `/analytics/sales/summary`,
      DAILY: `/analytics/sales/daily`,
      MONTHLY: `/analytics/sales/monthly`,
      BY_CATEGORY: `/analytics/sales/by-category`,
      BY_ITEM: `/analytics/sales/by-item`,
      BY_HOUR: `/analytics/sales/by-hour`,
    },
    
    // 订单统计
    ORDERS: {
      SUMMARY: `/analytics/orders/summary`,
      STATUS: `/analytics/orders/status`,
      AVERAGE_VALUE: `/analytics/orders/average-value`,
      PEAK_HOURS: `/analytics/orders/peak-hours`,
    },
    
    // 顾客统计
    CUSTOMERS: {
      SUMMARY: `/analytics/customers/summary`,
      REPEAT_RATE: `/analytics/customers/repeat-rate`,
      AVERAGE_SPEND: `/analytics/customers/average-spend`,
    },
    
    // 库存统计
    INVENTORY: {
      SUMMARY: `/analytics/inventory/summary`,
      LOW_STOCK: `/analytics/inventory/low-stock`,
      MOVEMENT: `/analytics/inventory/movement`,
    },
    
    // 导出
    EXPORT: {
      SALES: `/analytics/export/sales`,
      ORDERS: `/analytics/export/orders`,
      INVENTORY: `/analytics/export/inventory`,
    },
  },
  
  // 系统设置
  SETTINGS: {
    // 通知设置
    NOTIFICATIONS: {
      GET: `/settings/notifications`,
      UPDATE: `/settings/notifications`,
    },
    
    // 打印设置
    PRINTING: {
      GET: `/settings/printing`,
      UPDATE: `/settings/printing`,
    },
    
    // 业务设置
    BUSINESS: {
      GET: `/settings/business`,
      UPDATE: `/settings/business`,
    },
    
    // 集成设置
    INTEGRATIONS: {
      GET: `/settings/integrations`,
      UPDATE: `/settings/integrations`,
    },
  },
};

// 扫码点餐API路由（顾客端）
export const CUSTOMER_ROUTES = {
  // 店铺信息
  STORE: {
    INFO: `/customer/store/:storeId`,
    PUBLIC_INFO: `/customer/store/:storeId/public`,
  },
  
  // 餐桌
  TABLE: {
    INFO: `/customer/table/:tableId`,
    VALIDATE: `/customer/table/:tableId/validate`,
  },
  
  // 菜单
  MENU: {
    CATEGORIES: `/customer/store/:storeId/menu/categories`,
    ITEMS: `/customer/store/:storeId/menu/items`,
    ITEM_DETAIL: `/customer/store/:storeId/menu/items/:itemId`,
  },
  
  // 订单
  ORDER: {
    CREATE: `/customer/order`,
    DETAIL: `/customer/order/:orderId`,
    STATUS: `/customer/order/:orderId/status`,
    RECEIPT: `/customer/order/:orderId/receipt`,
  },
  
  // 支付
  PAYMENT: {
    METHODS: `/customer/payment/methods`,
    CREATE: `/customer/order/:orderId/payment`,
    STATUS: `/customer/payment/:paymentId/status`,
  },
};

// 管理API路由（需要管理员权限）
export const ADMIN_ROUTES = {
  // 管理后台 Dashboard 概览统计
  DASHBOARD: {
    STATS: '/dashboard/stats',
  },

  // 店铺管理（路径相对 /api/admin 前缀）
  STORES: {
    SELECT: '/stores/select',
    LIST: '/stores',
    LIST_WITH_TENANT: '/stores/list',
    STATS: '/stores/stats',
    UPDATE: '/stores/:storeId',
    HEALTH: '/health',
  },

  // 打印机管理（超管后台，路径相对 /api/admin 前缀）
  PRINTERS: {
    BRANDS: '/printers/brands',
    LIST: '/printers',
    CREATE: '/printers',
    UPDATE: '/printers/:id',
    DELETE: '/printers/:id',
    TEST: '/printers/:id/test',
    CLEAR_QUEUE: '/printers/:id/clear-queue',
    INFO: '/printers/:id/info',
  },

  // 素材库（平台级菜品模板）
  MENU_TEMPLATES: {
    CATEGORIES: '/menu-templates/categories',
    ITEMS: '/menu-templates/items',
    BATCH_CREATE: '/menu-templates/batch-create',
    ITEM: '/menu-templates/items/:id',
    IMPORT: '/menu-templates/import',
  },

  // 用户管理（超管后台）
  USERS: {
    LIST: '/users',
    CREATE: '/users/create',
    // 设为店长
    SET_STORE_ADMIN: '/users/:userId/set-store-admin',
    REMOVE_STORE_ADMIN: '/users/:userId/remove-store-admin',
    // 获取用户的店长关联
    STORE_ASSIGNMENTS: '/users/:userId/store-assignments',
  },

  // 夜狼业务流程配置
  NIGHTWOLF: {
    CONFIGS: '/nightwolf/configs',
    CONFIG_BY_TYPE: '/nightwolf/configs/:storeType',
    STORE_CONFIG: '/nightwolf/store/:storeId/config',
    STORE_OVERRIDE: '/nightwolf/store/:storeId/override',
    HEALTH: '/nightwolf/health',
    TRIGGER: '/nightwolf/store/:storeId/trigger',
  },
};

// ====== 店长端路由（STORE_ADMIN 专用，相对 /api/store-admin 前缀）======
export const STORE_ADMIN_ROUTES = {
  // 认证
  AUTH: {
    LOGIN: '/login',
    PROFILE: '/profile',
  },
  // 我的店铺
  MY_STORES: '/my-stores',
  // 菜单管理
  MENU: {
    CATEGORIES: `/stores/:storeId/menu/categories`,
    CATEGORY_DETAIL: `/stores/:storeId/menu/categories/:categoryId`,
    ITEMS: `/stores/:storeId/menu/items`,
    ITEM_DETAIL: `/stores/:storeId/menu/items/:itemId`,
    ITEM_AVAILABILITY: `/stores/:storeId/menu/items/:itemId/availability`,
  },
  // 打印机管理
  PRINTERS: {
    LIST: `/stores/:storeId/printers`,
    DETAIL: `/stores/:storeId/printers/:printerId`,
    TEST: `/stores/:storeId/printers/:printerId/test`,
  },
  // 订单管理
  ORDERS: {
    LIST: `/stores/:storeId/orders`,
    DETAIL: `/stores/:storeId/orders/:orderId`,
    UPDATE_STATUS: `/stores/:storeId/orders/:orderId/status`,
  },
};

// 上传与文件服务（全局，无前缀）
export const UPLOAD_ROUTES = {
  FOOD_IMAGE: '/api/upload/food-image',
  STORE_LOGO: '/api/upload/store-logo',
  STORE_HEADER: '/api/upload/store-header',
  DEFAULT_FOOD_IMAGE: '/api/default-food-image',
  STATIC: '/uploads/*',
};

// 工具函数
export const RouteUtils = {
  // 构建完整URL
  buildUrl(baseUrl, route, params = {}) {
    let url = `${baseUrl}${route}`;
    
    // 替换路径参数
    Object.keys(params).forEach(key => {
      const paramKey = `:${key}`;
      if (url.includes(paramKey)) {
        url = url.replace(paramKey, encodeURIComponent(params[key]));
      }
    });
    
    return url;
  },
  
  // 构建租户路由
  buildTenantRoute(route, params = {}) {
    return this.buildUrl('', route, params);
  },
  
  // 构建顾客路由
  buildCustomerRoute(route, params = {}) {
    return this.buildUrl('', route, params);
  },
  
  // 构建管理路由
  buildAdminRoute(route, params = {}) {
    return this.buildUrl('', route, params);
  },
  
  // 提取路径参数
  extractParams(routePattern, actualPath) {
    const params = {};
    const patternParts = routePattern.split('/');
    const pathParts = actualPath.split('/');
    
    patternParts.forEach((part, index) => {
      if (part.startsWith(':') && pathParts[index]) {
        const paramName = part.slice(1);
        params[paramName] = decodeURIComponent(pathParts[index]);
      }
    });
    
    return params;
  },
  
  // 验证路由模式匹配
  matchesPattern(routePattern, actualPath) {
    const patternParts = routePattern.split('/');
    const pathParts = actualPath.split('/');
    
    if (patternParts.length !== pathParts.length) {
      return false;
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) {
        // 参数部分，只要存在就匹配
        if (!pathPart) return false;
        continue;
      }
      
      if (patternPart !== pathPart) {
        return false;
      }
    }
    
    return true;
  },
};

// 导出所有路由
export default {
  public: PUBLIC_ROUTES,
  tenant: TENANT_ROUTES,
  customer: CUSTOMER_ROUTES,
  admin: ADMIN_ROUTES,
  storeAdmin: STORE_ADMIN_ROUTES,
  upload: UPLOAD_ROUTES,
  utils: RouteUtils,
  
  // 获取所有路由（用于文档生成）
  getAllRoutes() {
    return {
      public: PUBLIC_ROUTES,
      tenant: TENANT_ROUTES,
      customer: CUSTOMER_ROUTES,
      admin: ADMIN_ROUTES,
    };
  },
  
  // 根据路径获取路由信息
  getRouteInfo(path) {
    const allRoutes = this.getAllRoutes();
    
    for (const [category, routes] of Object.entries(allRoutes)) {
      for (const [routeName, routePath] of Object.entries(this.flattenRoutes(routes))) {
        if (RouteUtils.matchesPattern(routePath, path)) {
          return {
            category,
            name: routeName,
            path: routePath,
            params: RouteUtils.extractParams(routePath, path),
          };
        }
      }
    }
    
    return null;
  },
  
  // 扁平化嵌套的路由对象
  flattenRoutes(routes, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(routes)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        flattened[newKey] = value;
      } else if (typeof value === 'object') {
        Object.assign(flattened, this.flattenRoutes(value, newKey));
      }
    }
    
    return flattened;
  },
};