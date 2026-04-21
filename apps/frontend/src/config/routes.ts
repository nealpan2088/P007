// 麒麟项目前端 - 路由配置系统
// 所有前端路由通过常量管理，禁止硬编码

import config from './dynamic-config';

// 基础路由路径
const BASE_PATH = '/';

// 公共路由（无需认证）
export const PUBLIC_ROUTES = {
  // 首页
  HOME: BASE_PATH,
  
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password/:token',
    VERIFY_EMAIL: '/auth/verify-email/:token',
  },
  
  // 租户相关
  TENANT: {
    PUBLIC: '/t/:tenantSubdomain',
    PUBLIC_HOME: '/t/:tenantSubdomain/home',
    PUBLIC_MENU: '/t/:tenantSubdomain/menu',
    PUBLIC_ORDER: '/t/:tenantSubdomain/order/:tableId',
    PUBLIC_ORDER_STATUS: '/t/:tenantSubdomain/order-status/:orderId',
  },
  
  // 公开信息
  PUBLIC: {
    ABOUT: '/about',
    PRICING: '/pricing',
    FEATURES: '/features',
    CONTACT: '/contact',
    TERMS: '/terms',
    PRIVACY: '/privacy',
    FAQ: '/faq',
  },
};

// 租户管理路由（需要租户上下文）
export const TENANT_ROUTES = {
  // 租户仪表板
  DASHBOARD: '/dashboard',
  
  // 店铺管理
  STORES: {
    LIST: '/dashboard/stores',
    CREATE: '/dashboard/stores/create',
    DETAIL: '/dashboard/stores/:storeId',
    EDIT: '/dashboard/stores/:storeId/edit',
    SETTINGS: '/dashboard/stores/:storeId/settings',
  },
  
  // 菜单管理
  MENU: {
    CATEGORIES: '/dashboard/menu/categories',
    CATEGORY_CREATE: '/dashboard/menu/categories/create',
    CATEGORY_EDIT: '/dashboard/menu/categories/:categoryId/edit',
    ITEMS: '/dashboard/menu/items',
    ITEM_CREATE: '/dashboard/menu/items/create',
    ITEM_EDIT: '/dashboard/menu/items/:itemId/edit',
  },
  
  // 订单管理
  ORDERS: {
    LIST: '/dashboard/orders',
    DETAIL: '/dashboard/orders/:orderId',
    KITCHEN: '/dashboard/orders/kitchen',
    HISTORY: '/dashboard/orders/history',
  },
  
  // 餐桌管理
  TABLES: {
    LIST: '/dashboard/tables',
    CREATE: '/dashboard/tables/create',
    EDIT: '/dashboard/tables/:tableId/edit',
    LAYOUT: '/dashboard/tables/layout',
  },
  
  // 打印机管理
  PRINTERS: {
    LIST: '/dashboard/printers',
    CREATE: '/dashboard/printers/create',
    EDIT: '/dashboard/printers/:printerId/edit',
    TEST: '/dashboard/printers/:printerId/test',
  },
  
  // 报表和分析
  ANALYTICS: {
    OVERVIEW: '/dashboard/analytics',
    SALES: '/dashboard/analytics/sales',
    ORDERS: '/dashboard/analytics/orders',
    CUSTOMERS: '/dashboard/analytics/customers',
    REPORTS: '/dashboard/analytics/reports',
  },
  
  // 设置
  SETTINGS: {
    PROFILE: '/dashboard/settings/profile',
    ACCOUNT: '/dashboard/settings/account',
    BILLING: '/dashboard/settings/billing',
    TEAM: '/dashboard/settings/team',
    NOTIFICATIONS: '/dashboard/settings/notifications',
    INTEGRATIONS: '/dashboard/settings/integrations',
    SECURITY: '/dashboard/settings/security',
  },
};

// 顾客路由（扫码点餐）
export const CUSTOMER_ROUTES = {
  // 扫码点餐
  SCAN: '/scan/:tableId',
  MENU: '/menu/:storeId',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDER_STATUS: '/order/:orderId',
  ORDER_HISTORY: '/orders',
  
  // 顾客账户
  PROFILE: '/profile',
  FAVORITES: '/favorites',
  ADDRESSES: '/addresses',
  PAYMENT_METHODS: '/payment-methods',
};

// 管理员路由（平台级管理）
export const ADMIN_ROUTES = {
  // 平台管理
  ADMIN: '/admin',
  
  // 租户管理
  TENANTS: {
    LIST: '/admin/tenants',
    CREATE: '/admin/tenants/create',
    DETAIL: '/admin/tenants/:tenantId',
    EDIT: '/admin/tenants/:tenantId/edit',
    BILLING: '/admin/tenants/:tenantId/billing',
    SUPPORT: '/admin/tenants/:tenantId/support',
  },
  
  // 用户管理
  USERS: {
    LIST: '/admin/users',
    CREATE: '/admin/users/create',
    DETAIL: '/admin/users/:userId',
    EDIT: '/admin/users/:userId/edit',
    ROLES: '/admin/users/roles',
  },
  
  // 系统管理
  SYSTEM: {
    SETTINGS: '/admin/system/settings',
    LOGS: '/admin/system/logs',
    MONITORING: '/admin/system/monitoring',
    BACKUPS: '/admin/system/backups',
    UPDATES: '/admin/system/updates',
  },
  
  // 财务管理
  FINANCE: {
    OVERVIEW: '/admin/finance',
    TRANSACTIONS: '/admin/finance/transactions',
    INVOICES: '/admin/finance/invoices',
    REFUNDS: '/admin/finance/refunds',
    REPORTS: '/admin/finance/reports',
  },
  
  // 内容管理
  CONTENT: {
    PAGES: '/admin/content/pages',
    BLOG: '/admin/content/blog',
    FAQ: '/admin/content/faq',
    DOCS: '/admin/content/docs',
  },
};

// 工具函数
export const RouteUtils = {
  // 构建完整URL（包含API基础URL）
  buildApiUrl(path: string): string {
    const apiConfig = config.api;
    return `${apiConfig.baseUrl}${path}`;
  },
  
  // 构建前端路由URL（支持参数替换）
  buildFrontendUrl(template: string, params: Record<string, string> = {}): string {
    let url = template;
    
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    }
    
    return url;
  },
  
  // 检查路由是否匹配模式
  matchesPattern(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) {
      return false;
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) {
        // 参数部分，匹配任何非空值
        if (!pathPart) {
          return false;
        }
      } else if (patternPart !== pathPart) {
        return false;
      }
    }
    
    return true;
  },
  
  // 从路径中提取参数
  extractParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) {
      return params;
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = decodeURIComponent(pathParts[i]);
      }
    }
    
    return params;
  },
  
  // 获取当前路由信息
  getRouteInfo(path: string) {
    const allRoutes = this.getAllRoutes();
    
    for (const [category, routes] of Object.entries(allRoutes)) {
      for (const [routeName, routePath] of Object.entries(this.flattenRoutes(routes))) {
        if (this.matchesPattern(routePath, path)) {
          return {
            category,
            name: routeName,
            path: routePath,
            params: this.extractParams(routePath, path),
          };
        }
      }
    }
    
    return null;
  },
  
  // 获取所有路由
  getAllRoutes() {
    return {
      public: PUBLIC_ROUTES,
      tenant: TENANT_ROUTES,
      customer: CUSTOMER_ROUTES,
      admin: ADMIN_ROUTES,
    };
  },
  
  // 扁平化嵌套的路由对象
  flattenRoutes(routes: any, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(routes)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        flattened[newKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, this.flattenRoutes(value, newKey));
      }
    }
    
    return flattened;
  },
};

// 默认导出
export default {
  public: PUBLIC_ROUTES,
  tenant: TENANT_ROUTES,
  customer: CUSTOMER_ROUTES,
  admin: ADMIN_ROUTES,
  utils: RouteUtils,
  
  // 获取所有路由（用于文档生成）
  getAllRoutes() {
    return RouteUtils.getAllRoutes();
  },
  
  // 根据路径获取路由信息
  getRouteInfo(path: string) {
    return RouteUtils.getRouteInfo(path);
  },
  
  // 扁平化嵌套的路由对象
  flattenRoutes(routes: any, prefix = '') {
    return RouteUtils.flattenRoutes(routes, prefix);
  },
};