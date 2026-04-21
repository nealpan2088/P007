// 麒麟项目 - API路由常量管理系统
// 所有API路由通过常量管理，禁止硬编码

import { serverConfig } from './index.js';

// API基础路径
const API_PREFIX = serverConfig.apiPrefix;
const API_VERSION = serverConfig.apiVersion;
const BASE_PATH = `${API_PREFIX}/${API_VERSION}`;

// 公共API路由（无需认证）
export const PUBLIC_ROUTES = {
  // 健康检查
  HEALTH: `${API_PREFIX}/health`,
  
  // 认证
  AUTH: {
    REGISTER: `${BASE_PATH}/auth/register`,
    LOGIN: `${BASE_PATH}/auth/login`,
    LOGOUT: `${BASE_PATH}/auth/logout`,
    REFRESH_TOKEN: `${BASE_PATH}/auth/refresh-token`,
    FORGOT_PASSWORD: `${BASE_PATH}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_PATH}/auth/reset-password`,
    VERIFY_EMAIL: `${BASE_PATH}/auth/verify-email`,
  },
  
  // 租户
  TENANT: {
    CHECK_SUBDOMAIN: `${BASE_PATH}/tenants/check-subdomain`,
    PUBLIC_INFO: `${BASE_PATH}/tenants/:tenantId/public`,
  },
  
  // 公共信息
  PUBLIC: {
    VERSION: `${BASE_PATH}/public/version`,
    FEATURES: `${BASE_PATH}/public/features`,
    PRICING: `${BASE_PATH}/public/pricing`,
    HELLO: `${API_PREFIX}/hello`,  // API示例端点
  },
};

// 租户API路由（需要租户上下文）
export const TENANT_ROUTES = {
  // 租户管理
  TENANT: {
    INFO: `${BASE_PATH}/tenant`,
    UPDATE: `${BASE_PATH}/tenant`,
    BILLING: `${BASE_PATH}/tenant/billing`,
    SUBSCRIPTION: `${BASE_PATH}/tenant/subscription`,
    SETTINGS: `${BASE_PATH}/tenant/settings`,
  },
  
  // 店铺管理
  STORES: {
    LIST: `${BASE_PATH}/stores`,
    CREATE: `${BASE_PATH}/stores`,
    DETAIL: `${BASE_PATH}/stores/:storeId`,
    UPDATE: `${BASE_PATH}/stores/:storeId`,
    DELETE: `${BASE_PATH}/stores/:storeId`,
    STATS: `${BASE_PATH}/stores/:storeId/stats`,
    
    // 店铺配置
    SETTINGS: `${BASE_PATH}/stores/:storeId/settings`,
    
    // 店铺员工
    STAFF: {
      LIST: `${BASE_PATH}/stores/:storeId/staff`,
      ADD: `${BASE_PATH}/stores/:storeId/staff`,
      DETAIL: `${BASE_PATH}/stores/:storeId/staff/:userId`,
      UPDATE: `${BASE_PATH}/stores/:storeId/staff/:userId`,
      REMOVE: `${BASE_PATH}/stores/:storeId/staff/:userId`,
    },
  },
  
  // 餐桌管理
  TABLES: {
    LIST: `${BASE_PATH}/stores/:storeId/tables`,
    CREATE: `${BASE_PATH}/stores/:storeId/tables`,
    DETAIL: `${BASE_PATH}/stores/:storeId/tables/:tableId`,
    UPDATE: `${BASE_PATH}/stores/:storeId/tables/:tableId`,
    DELETE: `${BASE_PATH}/stores/:storeId/tables/:tableId`,
    QR_CODE: `${BASE_PATH}/stores/:storeId/tables/:tableId/qr-code`,
    STATUS: `${BASE_PATH}/stores/:storeId/tables/:tableId/status`,
  },
  
  // 菜单管理
  MENU: {
    // 分类
    CATEGORIES: {
      LIST: `${BASE_PATH}/stores/:storeId/menu/categories`,
      CREATE: `${BASE_PATH}/stores/:storeId/menu/categories`,
      DETAIL: `${BASE_PATH}/stores/:storeId/menu/categories/:categoryId`,
      UPDATE: `${BASE_PATH}/stores/:storeId/menu/categories/:categoryId`,
      DELETE: `${BASE_PATH}/stores/:storeId/menu/categories/:categoryId`,
      REORDER: `${BASE_PATH}/stores/:storeId/menu/categories/reorder`,
    },
    
    // 菜品
    ITEMS: {
      LIST: `${BASE_PATH}/stores/:storeId/menu/items`,
      CREATE: `${BASE_PATH}/stores/:storeId/menu/items`,
      DETAIL: `${BASE_PATH}/stores/:storeId/menu/items/:itemId`,
      UPDATE: `${BASE_PATH}/stores/:storeId/menu/items/:itemId`,
      DELETE: `${BASE_PATH}/stores/:storeId/menu/items/:itemId`,
      REORDER: `${BASE_PATH}/stores/:storeId/menu/items/reorder`,
      AVAILABILITY: `${BASE_PATH}/stores/:storeId/menu/items/:itemId/availability`,
      STOCK: `${BASE_PATH}/stores/:storeId/menu/items/:itemId/stock`,
    },
  },
  
  // 订单管理
  ORDERS: {
    LIST: `${BASE_PATH}/stores/:storeId/orders`,
    CREATE: `${BASE_PATH}/stores/:storeId/orders`,
    DETAIL: `${BASE_PATH}/stores/:storeId/orders/:orderId`,
    UPDATE: `${BASE_PATH}/stores/:storeId/orders/:orderId`,
    CANCEL: `${BASE_PATH}/stores/:storeId/orders/:orderId/cancel`,
    
    // 订单状态
    STATUS: {
      UPDATE: `${BASE_PATH}/stores/:storeId/orders/:orderId/status`,
      HISTORY: `${BASE_PATH}/stores/:storeId/orders/:orderId/status-history`,
    },
    
    // 支付
    PAYMENT: {
      CREATE: `${BASE_PATH}/stores/:storeId/orders/:orderId/payment`,
      STATUS: `${BASE_PATH}/stores/:storeId/orders/:orderId/payment/status`,
      REFUND: `${BASE_PATH}/stores/:storeId/orders/:orderId/payment/refund`,
    },
    
    // 打印
    PRINT: {
      RECEIPT: `${BASE_PATH}/stores/:storeId/orders/:orderId/print/receipt`,
      KITCHEN: `${BASE_PATH}/stores/:storeId/orders/:orderId/print/kitchen`,
      STATUS: `${BASE_PATH}/stores/:storeId/orders/:orderId/print/status`,
    },
  },
  
  // 打印机管理
  PRINTERS: {
    LIST: `${BASE_PATH}/stores/:storeId/printers`,
    CREATE: `${BASE_PATH}/stores/:storeId/printers`,
    DETAIL: `${BASE_PATH}/stores/:storeId/printers/:printerId`,
    UPDATE: `${BASE_PATH}/stores/:storeId/printers/:printerId`,
    DELETE: `${BASE_PATH}/stores/:storeId/printers/:printerId`,
    TEST: `${BASE_PATH}/stores/:storeId/printers/:printerId/test`,
    STATUS: `${BASE_PATH}/stores/:storeId/printers/:printerId/status`,
    
    // 打印任务
    JOBS: {
      LIST: `${BASE_PATH}/stores/:storeId/printers/:printerId/jobs`,
      DETAIL: `${BASE_PATH}/stores/:storeId/printers/:printerId/jobs/:jobId`,
      RETRY: `${BASE_PATH}/stores/:storeId/printers/:printerId/jobs/:jobId/retry`,
      CANCEL: `${BASE_PATH}/stores/:storeId/printers/:printerId/jobs/:jobId/cancel`,
    },
  },
  
  // 用户管理
  USERS: {
    PROFILE: `${BASE_PATH}/users/profile`,
    UPDATE_PROFILE: `${BASE_PATH}/users/profile`,
    CHANGE_PASSWORD: `${BASE_PATH}/users/change-password`,
    SESSIONS: `${BASE_PATH}/users/sessions`,
    SESSION_DETAIL: `${BASE_PATH}/users/sessions/:sessionId`,
    REVOKE_SESSION: `${BASE_PATH}/users/sessions/:sessionId/revoke`,
  },
  
  // 统计分析
  ANALYTICS: {
    // 销售统计
    SALES: {
      SUMMARY: `${BASE_PATH}/analytics/sales/summary`,
      DAILY: `${BASE_PATH}/analytics/sales/daily`,
      MONTHLY: `${BASE_PATH}/analytics/sales/monthly`,
      BY_CATEGORY: `${BASE_PATH}/analytics/sales/by-category`,
      BY_ITEM: `${BASE_PATH}/analytics/sales/by-item`,
      BY_HOUR: `${BASE_PATH}/analytics/sales/by-hour`,
    },
    
    // 订单统计
    ORDERS: {
      SUMMARY: `${BASE_PATH}/analytics/orders/summary`,
      STATUS: `${BASE_PATH}/analytics/orders/status`,
      AVERAGE_VALUE: `${BASE_PATH}/analytics/orders/average-value`,
      PEAK_HOURS: `${BASE_PATH}/analytics/orders/peak-hours`,
    },
    
    // 顾客统计
    CUSTOMERS: {
      SUMMARY: `${BASE_PATH}/analytics/customers/summary`,
      REPEAT_RATE: `${BASE_PATH}/analytics/customers/repeat-rate`,
      AVERAGE_SPEND: `${BASE_PATH}/analytics/customers/average-spend`,
    },
    
    // 库存统计
    INVENTORY: {
      SUMMARY: `${BASE_PATH}/analytics/inventory/summary`,
      LOW_STOCK: `${BASE_PATH}/analytics/inventory/low-stock`,
      MOVEMENT: `${BASE_PATH}/analytics/inventory/movement`,
    },
    
    // 导出
    EXPORT: {
      SALES: `${BASE_PATH}/analytics/export/sales`,
      ORDERS: `${BASE_PATH}/analytics/export/orders`,
      INVENTORY: `${BASE_PATH}/analytics/export/inventory`,
    },
  },
  
  // 系统设置
  SETTINGS: {
    // 通知设置
    NOTIFICATIONS: {
      GET: `${BASE_PATH}/settings/notifications`,
      UPDATE: `${BASE_PATH}/settings/notifications`,
    },
    
    // 打印设置
    PRINTING: {
      GET: `${BASE_PATH}/settings/printing`,
      UPDATE: `${BASE_PATH}/settings/printing`,
    },
    
    // 业务设置
    BUSINESS: {
      GET: `${BASE_PATH}/settings/business`,
      UPDATE: `${BASE_PATH}/settings/business`,
    },
    
    // 集成设置
    INTEGRATIONS: {
      GET: `${BASE_PATH}/settings/integrations`,
      UPDATE: `${BASE_PATH}/settings/integrations`,
    },
  },
};

// 扫码点餐API路由（顾客端）
export const CUSTOMER_ROUTES = {
  // 店铺信息
  STORE: {
    INFO: `${BASE_PATH}/customer/store/:storeId`,
    PUBLIC_INFO: `${BASE_PATH}/customer/store/:storeId/public`,
  },
  
  // 餐桌
  TABLE: {
    INFO: `${BASE_PATH}/customer/table/:tableId`,
    VALIDATE: `${BASE_PATH}/customer/table/:tableId/validate`,
  },
  
  // 菜单
  MENU: {
    CATEGORIES: `${BASE_PATH}/customer/store/:storeId/menu/categories`,
    ITEMS: `${BASE_PATH}/customer/store/:storeId/menu/items`,
    ITEM_DETAIL: `${BASE_PATH}/customer/store/:storeId/menu/items/:itemId`,
  },
  
  // 订单
  ORDER: {
    CREATE: `${BASE_PATH}/customer/order`,
    DETAIL: `${BASE_PATH}/customer/order/:orderId`,
    STATUS: `${BASE_PATH}/customer/order/:orderId/status`,
    RECEIPT: `${BASE_PATH}/customer/order/:orderId/receipt`,
  },
  
  // 支付
  PAYMENT: {
    METHODS: `${BASE_PATH}/customer/payment/methods`,
    CREATE: `${BASE_PATH}/customer/order/:orderId/payment`,
    STATUS: `${BASE_PATH}/customer/payment/:paymentId/status`,
  },
};

// 管理API路由（需要管理员权限）
export const ADMIN_ROUTES = {
  // 平台管理
  PLATFORM: {
    STATS: `${BASE_PATH}/admin/platform/stats`,
    TENANTS: `${BASE_PATH}/admin/platform/tenants`,
    TENANT_DETAIL: `${BASE_PATH}/admin/platform/tenants/:tenantId`,
    TENANT_UPDATE: `${BASE_PATH}/admin/platform/tenants/:tenantId`,
    
    // 系统监控
    MONITORING: {
      SYSTEM: `${BASE_PATH}/admin/platform/monitoring/system`,
      PERFORMANCE: `${BASE_PATH}/admin/platform/monitoring/performance`,
      ERRORS: `${BASE_PATH}/admin/platform/monitoring/errors`,
      LOGS: `${BASE_PATH}/admin/platform/monitoring/logs`,
    },
  },
  
  // 财务管理
  FINANCE: {
    REVENUE: `${BASE_PATH}/admin/finance/revenue`,
    TRANSACTIONS: `${BASE_PATH}/admin/finance/transactions`,
    INVOICES: `${BASE_PATH}/admin/finance/invoices`,
    PAYOUTS: `${BASE_PATH}/admin/finance/payouts`,
  },
  
  // 系统设置
  SYSTEM: {
    CONFIG: `${BASE_PATH}/admin/system/config`,
    MAINTENANCE: `${BASE_PATH}/admin/system/maintenance`,
    BACKUP: `${BASE_PATH}/admin/system/backup`,
    RESTORE: `${BASE_PATH}/admin/system/restore`,
  },
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