// 统一的fetch工具函数
import { ApiResponse } from "../types";

/**
 * 统一的fetch请求函数
 */
export async function apiFetch<T = any>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const apiResponse: ApiResponse<T> = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'API请求失败');
    }

    return apiResponse.data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

/**
 * 检查子域名是否可用
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  try {
    const response = await apiFetch<{ available: boolean }>(
      `/api/v1/tenant/check-subdomain?subdomain=${subdomain}`
    );
    return response.available;
  } catch (error) {
    console.error('检查子域名失败:', error);
    return false;
  }
}
