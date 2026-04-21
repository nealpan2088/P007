/// <reference types="vite/client" />

// Vite环境变量类型定义
interface ImportMetaEnv {
  // 应用信息
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_DESCRIPTION: string;
  
  // API配置
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_VERSION: string;
  
  // 功能开关
  readonly VITE_FEATURE_AUTH: string;
  readonly VITE_FEATURE_MULTI_TENANT: string;
  readonly VITE_FEATURE_PRINTING: string;
  readonly VITE_FEATURE_ANALYTICS: string;
  readonly VITE_FEATURE_PAYMENT: string;
  
  // 第三方服务
  readonly VITE_GOOGLE_ANALYTICS_ID: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  
  // 业务配置
  readonly VITE_DEFAULT_LANGUAGE: string;
  readonly VITE_DEFAULT_CURRENCY: string;
  readonly VITE_DEFAULT_TIMEZONE: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_SUPPORT_PHONE: string;
  
  // 开发配置
  readonly VITE_DEV_PROXY_TARGET: string;
  readonly VITE_DEV_OPEN_BROWSER: string;
  
  // Vite内置变量
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}