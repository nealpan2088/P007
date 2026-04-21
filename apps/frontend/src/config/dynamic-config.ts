// 麒麟项目前端 - 动态配置管理系统
// 所有配置通过环境变量管理，禁止硬编码

// 从环境变量加载配置
const env = import.meta.env;

// 配置获取函数
export const getAppConfig = () => ({
  // 应用信息
  name: env.VITE_APP_NAME || '麒麟云点餐SaaS',
  version: env.VITE_APP_VERSION || '0.1.0',
  description: env.VITE_APP_DESCRIPTION || '多店铺扫码点餐云打印SaaS平台',
  
  // 元数据
  metadata: {
    language: env.VITE_DEFAULT_LANGUAGE || 'zh-CN',
    currency: env.VITE_DEFAULT_CURRENCY || 'CNY',
    timezone: env.VITE_DEFAULT_TIMEZONE || 'Asia/Shanghai',
    support: {
      email: env.VITE_SUPPORT_EMAIL || 'support@qilin-dining.com',
      phone: env.VITE_SUPPORT_PHONE || '',
    },
  },
});

export const getApiConfig = () => ({
  // API配置
  baseUrl: env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:33037' : ''),
  timeout: parseInt(env.VITE_API_TIMEOUT || '30000', 10),
  version: env.VITE_API_VERSION || 'v1',
  
  // 端点
  endpoints: {
    auth: {
      register: '/api/v1/auth/register',
      login: '/api/v1/auth/login',
      logout: '/api/v1/auth/logout',
      refreshToken: '/api/v1/auth/refresh-token',
      profile: '/api/v1/auth/profile',
    },
    public: {
      health: '/api/health',
      version: '/api/v1/public/version',
      features: '/api/v1/public/features',
    },
    tenant: {
      checkSubdomain: '/api/v1/tenants/check-subdomain',
      publicInfo: '/api/v1/tenants/:tenantId/public',
    },
  },
});

export const getFeatureConfig = () => ({
  // 功能开关
  auth: env.VITE_FEATURE_AUTH !== 'false',
  multiTenant: env.VITE_FEATURE_MULTI_TENANT !== 'false',
  printing: env.VITE_FEATURE_PRINTING !== 'false',
  analytics: env.VITE_FEATURE_ANALYTICS !== 'false',
  payment: env.VITE_FEATURE_PAYMENT !== 'false',
  
  // 第三方服务
  googleAnalytics: {
    enabled: !!env.VITE_GOOGLE_ANALYTICS_ID,
    id: env.VITE_GOOGLE_ANALYTICS_ID || '',
  },
  sentry: {
    enabled: !!env.VITE_SENTRY_DSN,
    dsn: env.VITE_SENTRY_DSN || '',
  },
  stripe: {
    enabled: !!env.VITE_STRIPE_PUBLIC_KEY,
    publicKey: env.VITE_STRIPE_PUBLIC_KEY || '',
  },
});

export const getDevConfig = () => ({
  // 开发配置
  proxyTarget: env.VITE_DEV_PROXY_TARGET || 'http://localhost:33037',
  openBrowser: env.VITE_DEV_OPEN_BROWSER !== 'false',
  
  // 环境信息
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
});

// 验证函数
export const validateConfig = (): boolean => {
  const requiredEnvVars = [
    'VITE_APP_NAME',
    'VITE_API_BASE_URL',
  ];
  
  const missingVars: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`❌ 必需的环境变量缺失: ${missingVars.join(', ')}`);
    return false;
  }
  
  // 验证API基础URL
  const apiBaseUrl = env.VITE_API_BASE_URL;
  if (apiBaseUrl && !apiBaseUrl.startsWith('http')) {
    console.error(`❌ API基础URL格式无效: ${apiBaseUrl}`);
    return false;
  }
  
  return true;
};

// 导出默认配置对象
const config = {
  get app() { return getAppConfig(); },
  get api() { return getApiConfig(); },
  get features() { return getFeatureConfig(); },
  get dev() { return getDevConfig(); },
  validate: validateConfig,
};

export default config;