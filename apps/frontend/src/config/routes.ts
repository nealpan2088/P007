// 麒麟项目前端 - 路由配置系统
// 所有前端路由通过常量管理，禁止硬编码

import { buildApiUrl as buildApiUrlFromRoutes } from './api-routes';

// 基础路由路径
const BASE_PATH = '/';

// 公共路由（无需认证）
export const PUBLIC_ROUTES = {
  HOME: BASE_PATH,

  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password/:token',
    VERIFY_EMAIL: '/auth/verify-email/:token',
  },

  // 公共信息页
  PUBLIC: {
    ABOUT: '/about',
    PRICING: '/pricing',
    FEATURES: '/features',
    CONTACT: '/contact',
    TERMS: '/terms',
    PRIVACY: '/privacy',
    FAQ: '/faq',
    LINK_VALIDATION: '/link-validation',
    TEST_CONSOLE: '/test-console',
    TEST_TENANTS: '/test-tenants',
  },
};

// 租户管理路由（需要租户上下文 /t/:tenantSlug/）
export const TENANT_ROUTES = {
  // ====== 旧名称兼容别名（指向 TENANT_CTX） ======
  DASHBOARD: '/t/:tenantSlug/dashboard',
  STORES: {
    LIST: '/t/:tenantSlug/stores',
    CREATE: '/t/:tenantSlug/stores/create',
    DETAIL: '/t/:tenantSlug/stores/:storeId',
    EDIT: '/t/:tenantSlug/stores/:storeId/edit',
  },
  STORE_MENU: {
    ITEMS: '/t/:tenantSlug/s/:storeSlug/menu',
  },
  STORE_PRINTERS: {
    LIST: '/t/:tenantSlug/s/:storeSlug/printers',
  },
  TENANTS: {
    LIST: '/admin/tenants',
    CREATE: '/admin/tenants/create',
    DETAIL: '/admin/tenants/:tenantId',
    EDIT: '/admin/tenants/:tenantId/edit',
  },

  // ====== 租户上下文路由 ======
  TENANT_CTX: {
    DASHBOARD: '/t/:tenantSlug/dashboard',
    STORES: {
      LIST: '/t/:tenantSlug/stores',
      CREATE: '/t/:tenantSlug/stores/create',
      DETAIL: '/t/:tenantSlug/stores/:storeId',
      EDIT: '/t/:tenantSlug/stores/:storeId/edit',
    },
    STORE_MENU: {
      ITEMS: '/t/:tenantSlug/s/:storeSlug/menu',
    },
    STORE_PRINTERS: {
      LIST: '/t/:tenantSlug/s/:storeSlug/printers',
    },
  },
};

// 管理员路由（平台级管理 /admin/）
export const ADMIN_ROUTES = {
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

  // 店铺管理（管理后台）
  STORES: {
    LIST: '/admin/stores',
  },

  // 打印机管理（管理后台）
  PRINTERS: {
    LIST: '/admin/printers',
  },

  // 菜单模板管理（管理后台）
  MENU_TEMPLATES: {
    LIST: '/admin/menu-templates',
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
  buildApiUrl(path: string): string {
    return buildApiUrlFromRoutes(path);
  },
  buildFrontendUrl(template: string, params: Record<string, string> = {}): string {
    let url = template;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    }
    return url;
  },
  matchesPattern(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) return false;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) { if (!pathParts[i]) return false; }
      else if (patternParts[i] !== pathParts[i]) return false;
    }
    return true;
  },
  extractParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) return params;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      }
    }
    return params;
  },
  getAllRoutes() {
    return { public: PUBLIC_ROUTES, admin: ADMIN_ROUTES, tenant: TENANT_ROUTES };
  },
  flattenRoutes(routes: any, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {};
    for (const [key, value] of Object.entries(routes)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') flattened[newKey] = value;
      else if (typeof value === 'object' && value !== null) Object.assign(flattened, this.flattenRoutes(value, newKey));
    }
    return flattened;
  },
};

export default {
  public: PUBLIC_ROUTES,
  admin: ADMIN_ROUTES,
  tenant: TENANT_ROUTES,
  utils: RouteUtils,
  getAllRoutes() { return RouteUtils.getAllRoutes(); },
  getRouteInfo(path: string) { return null; },
};
