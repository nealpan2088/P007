/**
 * 店长端共享配置和工具函数
 * 
 * 统一管理 API 基路径、Token Key、HTTP 请求工具
 * 所有店长端页面从这里引用，避免重复定义和硬编码
 */

export const STORE_ADMIN_CONFIG = {
  /** API 基路径 */
  API_BASE: '/api/store-admin',
  /** LocalStorage 中存储店长端 Token 的 Key */
  TOKEN_KEY: 'qilin_store_admin_token',
  /** LocalStorage 中存储店长端用户信息的 Key */
  USER_KEY: 'qilin_store_admin_user',
};

/**
 * 获取店长端 Token
 */
export function getStoreAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORE_ADMIN_CONFIG.TOKEN_KEY);
}

/**
 * 获取店长端用户信息
 */
export function getStoreAdminUser(): any | null {
  try {
    const raw = localStorage.getItem(STORE_ADMIN_CONFIG.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 清除店长端认证信息
 */
export function clearStoreAdminAuth() {
  localStorage.removeItem(STORE_ADMIN_CONFIG.TOKEN_KEY);
  localStorage.removeItem(STORE_ADMIN_CONFIG.USER_KEY);
}

/**
 * 店长端专用 fetch 封装
 * 自动带 Authorization Header
 * 注意：禁止使用 api-client.ts，因为 api-client 读的是通用登录的 qilin_access_token
 */
export async function storeAdminFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getStoreAdminToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) throw { status: res.status, message: await res.text() };
  return res.json();
}

/**
 * 构建店长端 API URL（自动拼接 API_BASE）
 */
export function storeAdminUrl(storeId: string, resource: string): string {
  return `${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}${resource}`;
}

/**
 * 订单状态中文映射
 */
export const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待确认', color: 'orange' },
  CONFIRMED: { label: '已确认', color: 'blue' },
  PREPARING: { label: '制作中', color: 'processing' },
  READY: { label: '已出餐', color: 'cyan' },
  COMPLETED: { label: '已完成', color: 'green' },
  CANCELLED: { label: '已取消', color: 'default' },
};
