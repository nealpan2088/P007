import { useState, useCallback } from 'react';
import { authApi, LoginCredentials, RegisterData } from '../api/simple-auth';
import { User } from '../types';

// 本地存储键名
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'qilin_access_token',
  REFRESH_TOKEN: 'qilin_refresh_token',
  USER: 'qilin_user',
  SESSION_ID: 'qilin_session_id',
};

export const useAuth = () => {
  // 状态管理
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 保存认证数据到本地存储
  const saveAuthData = useCallback((data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.sessionId);
    
    setUser(data.user);
    setAccessToken(data.accessToken);
    setError(null);
  }, []);

  // 清除认证数据
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    
    setUser(null);
    setAccessToken(null);
    setError(null);
  }, []);

  // 用户登录
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const credentials: LoginCredentials = { email, password };
      const response = await authApi.login(credentials);
      
      if (response.success && response.user && response.tokens && response.sessionId) {
        saveAuthData({
          user: response.user,
          accessToken: response.tokens.accessToken,
          refreshToken: response.tokens.refreshToken,
          sessionId: response.sessionId,
        });
        
        return true;
      } else {
        setError(response.message || '登录失败，请检查邮箱和密码');
        return false;
      }
    } catch (err: any) {
      console.error('登录错误:', err);
      
      // 根据错误类型设置友好的错误消息
      if (err.response?.status === 401) {
        setError('邮箱或密码错误');
      } else if (err.response?.status === 429) {
        setError('登录尝试次数过多，请稍后再试');
      } else if (err.message?.includes('Network Error')) {
        setError('网络连接失败，请检查网络设置');
      } else {
        setError(err.message || '登录失败，请稍后再试');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveAuthData]);

  // 用户注册
  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.register(userData);
      
      if (response.success) {
        // 注册成功，但不自动登录（需要邮箱验证）
        return true;
      } else {
        setError(response.message || '注册失败，请检查输入信息');
        return false;
      }
    } catch (err: any) {
      console.error('注册错误:', err);
      
      // 根据错误类型设置友好的错误消息
      if (err.response?.status === 409) {
        setError('该邮箱或用户名已被注册');
      } else if (err.response?.status === 400) {
        setError('输入信息不符合要求，请检查后重试');
      } else if (err.message?.includes('Network Error')) {
        setError('网络连接失败，请检查网络设置');
      } else {
        setError(err.message || '注册失败，请稍后再试');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 用户登出
  const logout = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
      if (sessionId && accessToken) {
        await authApi.logout(sessionId, accessToken);
      }
      
      clearAuthData();
      return true;
    } catch (err) {
      console.error('登出错误:', err);
      // 即使API调用失败，也清除本地数据
      clearAuthData();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, clearAuthData]);

  // 刷新Token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await authApi.refreshToken(refreshToken);
      
      if (response.success && response.tokens) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.tokens.accessToken);
        setAccessToken(response.tokens.accessToken);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('刷新Token错误:', err);
      return false;
    }
  }, []);

  // 获取当前用户信息
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    if (!accessToken) {
      return null;
    }
    
    try {
      const response = await authApi.getCurrentUser(accessToken);
      
      if (response.success && response.user) {
        const updatedUser = response.user;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        setUser(updatedUser);
        return updatedUser;
      }
      
      return null;
    } catch (err) {
      console.error('获取用户信息错误:', err);
      return null;
    }
  }, [accessToken]);

  // 检查用户是否已登录
  const isAuthenticated = useCallback((): boolean => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    
    if (!token || !storedUser) {
      console.log('isAuthenticated: Token或用户信息不存在');
      return false;
    }
    
    // 检查Token格式
    if (!token.includes('.')) {
      console.log('isAuthenticated: Token格式错误');
      return false;
    }
    
    // 检查Token是否过期
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('isAuthenticated: Token部分数量错误');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        console.log('isAuthenticated: Token已过期');
        // Token过期，尝试刷新
        refreshToken().catch(console.error);
        return false;
      }
      
      console.log('isAuthenticated: 用户已认证');
      return true;
    } catch (error) {
      console.error('Token解析错误:', error);
      return false;
    }
  }, [refreshToken]);

  // 获取认证头
  const getAuthHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // 验证邮箱
  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.verifyEmail(token);
      
      if (response.success) {
        // 如果用户已登录，更新用户状态
        if (user) {
          const updatedUser = { ...user, emailVerified: true };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        
        return true;
      } else {
        setError(response.message || '邮箱验证失败');
        return false;
      }
    } catch (err: any) {
      console.error('邮箱验证错误:', err);
      setError(err.message || '邮箱验证失败，请稍后再试');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 重置密码
  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.resetPassword(token, newPassword);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || '密码重置失败');
        return false;
      }
    } catch (err: any) {
      console.error('密码重置错误:', err);
      setError(err.message || '密码重置失败，请稍后再试');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 忘记密码（发送重置邮件）
  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || '发送重置邮件失败');
        return false;
      }
    } catch (err: any) {
      console.error('忘记密码错误:', err);
      setError(err.message || '发送重置邮件失败，请稍后再试');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // 状态
    user,
    accessToken,
    isLoading,
    error,
    
    // 认证状态
    isAuthenticated,
    
    // 操作方法
    login,
    register,
    logout,
    refreshToken,
    getCurrentUser,
    getAuthHeader,
    verifyEmail,
    resetPassword,
    forgotPassword,
    
    // 数据管理
    saveAuthData,
    clearAuthData,
    
    // 错误处理
    setError,
  };
};