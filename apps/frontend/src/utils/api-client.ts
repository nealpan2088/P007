/**
 * API客户端工具
 * 统一管理API请求，自动携带认证Token
 * 所有页面都应该通过此工具调用后端API
 */

// 与 hooks/useAuth.ts 保持一致
const TOKEN_KEY = 'qilin_access_token';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string>;
}

/**
 * 统一API请求
 * 自动携带 Authorization header（除非 skipAuth = true）
 */
async function apiRequest<T = any>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, params, ...restOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let url: string;

  // 如果路径是完整URL或已经以 /api 开头，直接使用
  if (path.startsWith('http') || path.startsWith('/api')) {
    url = path;
  } else {
    url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // 拼接查询参数
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: { ...headers, ...(customHeaders as Record<string, string>) },
  });

  if (!response.ok) {
    // 如果是401且非故意不传token，清除登录状态
    if (response.status === 401 && !skipAuth) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('qilin_user');
      localStorage.removeItem('qilin_refresh_token');
      // 跳转到登录页（如果不在登录页）
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }
    throw new ApiError(response.status, await response.text());
  }

  return response.json();
}

/** GET 请求 */
export function apiGet<T = any>(path: string, options?: ApiClientOptions) {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

/** POST 请求 */
export function apiPost<T = any>(path: string, body?: any, options?: ApiClientOptions) {
  return apiRequest<T>(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** PUT 请求 */
export function apiPut<T = any>(path: string, body?: any, options?: ApiClientOptions) {
  return apiRequest<T>(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** DELETE 请求 */
export function apiDelete<T = any>(path: string, options?: ApiClientOptions) {
  return apiRequest<T>(path, { ...options, method: 'DELETE', body: JSON.stringify({}) });
}

/** 公开请求（不携带token） */
export function apiPublic<T = any>(path: string, options?: ApiClientOptions) {
  return apiRequest<T>(path, { ...options, skipAuth: true });
}

/** API错误类 */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  public: apiPublic,
  request: apiRequest,
};
