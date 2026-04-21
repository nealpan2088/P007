// 路由常量定义
export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  SETTINGS: {
    PROFILE: '/settings/profile',
    SECURITY: '/settings/security',
  },
  // 添加你的业务路由
  ORDERS: '/orders',
  PRODUCTS: '/products',
} as const;
