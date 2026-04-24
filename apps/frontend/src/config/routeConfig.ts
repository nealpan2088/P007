// 麒麟项目前端 - 路由配置源
// 从后端 /api/config/routes 获取路由定义，确保前后端一致
// 这是唯一的路由源头，所有API路径必须从这里获取

import config from './dynamic-config';

const API_BASE_URL = config.api.baseUrl;

// 运行时缓存
let cachedRoutes: RouteData | null = null;
let fetchPromise: Promise<RouteData> | null = null;

interface RouteData {
  public: Record<string, any>;
  tenant: Record<string, any>;
  customer: Record<string, any>;
  admin: Record<string, any>;
}

// 后端API路径前缀映射表
// 后端使用相对路径（如 /stores/check-slug），注册时加 prefix（如 /api/store）
// 此处添加前缀，使前端能正确请求到后端
const API_ROUTE_PREFIXES: [string, string][] = [
  ['/stores', '/api/store'],
  ['/store', '/api/store'],
  ['/tenant', '/api/tenant'],
  ['/public', '/api/public'],
  ['/admin', '/api/admin'],
  ['/upload', '/api/upload'],
  ['/auth/', '/api/v1/auth'],
  ['/register', '/api/v1/auth'],
];

// 确保API路径有完整的baseUrl和API前缀
function resolveUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) {
    return path;
  }
  // 已经以 /api 开头，直接返回
  if (path.startsWith('/api')) {
    return `${API_BASE_URL}${path}`;
  }
  // 匹配后端相对路径，补上对应的 API 前缀
  for (const [prefix, apiPrefix] of API_ROUTE_PREFIXES) {
    if (path.startsWith(prefix)) {
      return `${API_BASE_URL}${apiPrefix}${path}`;
    }
  }
  // 其他相对路径 → 前端路由，不需要baseUrl
  return path;
}

// 递归给所有路径加上 baseUrl
function resolveAllUrls(obj: any): any {
  if (typeof obj === 'string') {
    return resolveUrl(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(resolveAllUrls);
  }
  if (obj && typeof obj === 'object') {
    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // 跳过函数
      if (typeof value === 'function') continue;
      resolved[key] = resolveAllUrls(value);
    }
    return resolved;
  }
  return obj;
}

/**
 * 从后端获取路由配置
 */
export async function fetchRouteConfig(): Promise<RouteData> {
  // 如果已经有缓存，直接返回
  if (cachedRoutes) return cachedRoutes;

  // 如果正在请求中，复用Promise避免重复请求
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/config/routes`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data) throw new Error('Invalid route config response');

      // 缓存并解析URL
      cachedRoutes = {
        public: resolveAllUrls(json.data.public),
        tenant: resolveAllUrls(json.data.tenant),
        customer: resolveAllUrls(json.data.customer),
        admin: resolveAllUrls(json.data.admin),
      };

      console.log('[RouteConfig] 路由配置已从后端加载');
      return cachedRoutes;
    } catch (err) {
      console.warn('[RouteConfig] 从后端加载路由失败，使用默认配置:', err);
      // 降级：返回空路由，让各个页面自己处理url不存在的情况
      cachedRoutes = { public: {}, tenant: {}, customer: {}, admin: {} };
      return cachedRoutes;
    }
  })();

  return fetchPromise;
}

/**
 * 获取已缓存的路由（同步版本，用于react组件初始化）
 * 需要在应用启动时先调用 await fetchRouteConfig()
 */
export function getRoutes(): RouteData {
  if (!cachedRoutes) {
    console.warn('[RouteConfig] 路由尚未加载，请确保应用启动时调用了 fetchRouteConfig()');
    return { public: {}, tenant: {}, customer: {}, admin: {} };
  }
  return cachedRoutes;
}

// ============================================
// 向前兼容的导出（保持旧代码不报错）
// ============================================

// 兼容旧的 buildApiUrl
export const buildApiUrl = (template: string, params: Record<string, string | number> = {}): string => {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, encodeURIComponent(String(value)));
  }
  return url;
};

// 兼容旧的 getApiUrl
export const getApiUrl = (route: string, params: Record<string, string | number> = {}): string => {
  const url = buildApiUrl(route, params);
  if (!url.startsWith('http') && !url.startsWith('/api')) {
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
};

// 默认导出（兼容旧引用）
export default {
  fetchRouteConfig,
  getRoutes,
  buildApiUrl,
  getApiUrl,
};
