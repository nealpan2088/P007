import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PUBLIC_ROUTES } from '../config/routes';
import { User } from '../api/simple-auth';

// 认证上下文类型
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  getCurrentUser: () => Promise<User | null>;
  getAuthHeader: () => Record<string, string>;
  verifyEmail: (token: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  saveAuthData: (data: any) => void;
  clearAuthData: () => void;
  setError: (error: string | null) => void;
  navigateToLogin: () => void;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 提供者组件属性
interface AuthProviderProps {
  children: ReactNode;
}

// 认证提供者组件
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const auth = useAuth();

  // 包装logout函数，添加导航功能
  const logoutWithNavigation = useCallback(async (): Promise<boolean> => {
    const result = await auth.logout();
    if (result) {
      navigate(PUBLIC_ROUTES.AUTH.LOGIN);
    }
    return result;
  }, [auth, navigate]);

  // 导航到登录页面的函数
  const navigateToLogin = useCallback(() => {
    navigate(PUBLIC_ROUTES.AUTH.LOGIN);
  }, [navigate]);

  const contextValue: AuthContextType = {
    ...auth,
    logout: logoutWithNavigation,
    navigateToLogin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook使用认证上下文
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext必须在AuthProvider内部使用');
  }
  return context;
};

// 导出默认
export default AuthContext;