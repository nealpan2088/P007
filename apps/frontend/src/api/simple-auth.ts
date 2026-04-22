// 简化版认证API客户端
// 使用环境变量配置，禁止硬编码

// 从环境变量获取API基础URL
const getApiBaseUrl = () => {
  // 优先使用Vite环境变量
  const env = import.meta.env;
  const baseUrl = env.VITE_API_BASE_URL || '';
  
  // 确保URL以斜杠结尾
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

// API版本
const API_VERSION = 'v1';
const API_BASE_URL = `${getApiBaseUrl()}/api/${API_VERSION}`;

// 统一的请求函数
const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  try {
    const fetchResponse = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`,
      );
    }
    
    return await fetchResponse.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    
    throw error;
  }
};

// 带认证的请求函数
const authRequest = async <T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> => {
  return request<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
};

// 用户数据类型 - 使用统一的类型定义
import { User as ApiUser } from '../types';

export interface User extends ApiUser {
  // 保持向后兼容性
  emailVerified?: boolean;
  tenants?: any[];
}

// 登录凭据
export interface LoginCredentials {
  email: string;
  password: string;
}

// 注册数据
export interface RegisterData {
  email: string;
  username: string;
  fullName?: string;
  phone?: string;
  password: string;
}

// 认证响应
export interface AuthResponse {
  success: boolean;
  user?: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    refreshTokenExpiresAt: string;
  };
  sessionId?: string;
  message?: string;
}

// 认证API接口
export const authApi = {
  // 用户登录
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  // 用户注册
  async register(userData: RegisterData): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  // 用户登出
  async logout(sessionId: string, accessToken: string): Promise<{ success: boolean; message?: string }> {
    return authRequest<{ success: boolean; message?: string }>(
      '/auth/logout',
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      },
    );
  },
  
  // 刷新Token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  
  // 获取当前用户信息
  async getCurrentUser(accessToken: string): Promise<{ success: boolean; user?: User; message?: string }> {
    return authRequest<{ success: boolean; user?: User; message?: string }>(
      '/auth/me',
      accessToken,
      {
        method: 'GET',
      },
    );
  },
  
  // 验证邮箱
  async verifyEmail(token: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
  
  // 重置密码
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
  
  // 忘记密码（发送重置邮件）
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  // 健康检查
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string; version: string }> {
    return request<{ status: string; service: string; timestamp: string; version: string }>('/auth/health', {
      method: 'GET',
    });
  },
};

export default authApi;