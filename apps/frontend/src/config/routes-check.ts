// 麒麟项目前端 - 路由检查配置（用于Node.js环境）
// 避免使用import.meta.env，只检查路由结构

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

// 工具函数
export const RouteUtils = {
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
  utils: RouteUtils,
  
  // 获取所有路由（简化版，只用于检查）
  getAllRoutes() {
    return {
      public: PUBLIC_ROUTES,
    };
  },
};