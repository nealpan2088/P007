// 麒麟项目 - 统一配置管理系统
// 所有配置通过环境变量管理，禁止硬编码

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 必需的环境变量列表
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'API_PREFIX'
];

// 配置验证函数
export const validate = () => {
  const missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`❌ 必需的环境变量缺失: ${missingVars.join(', ')}`);
  }
  
  // 验证JWT密钥长度
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT密钥必须至少32个字符');
  }
  
  // 验证端口号
  const port = parseInt(process.env.PORT || '33037', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`端口号无效: ${process.env.PORT}`);
  }
  
  return true;
};

// 服务器配置
export const serverConfig = {
  // 环境
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  
  // 服务器
  port: parseInt(process.env.PORT || '33037', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // API
  apiPrefix: process.env.API_PREFIX || '/api',
  apiVersion: process.env.API_VERSION || 'v1',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:5177'],
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
  
  // 日志
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'json',
};

// 数据库配置
export const databaseConfig = {
  url: process.env.DATABASE_URL,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  
  // 多租户配置
  publicSchema: process.env.DB_PUBLIC_SCHEMA || 'p007_public',
  tenantSchemaPrefix: process.env.DB_TENANT_SCHEMA_PREFIX || 'tenant_',
  
  // 连接池
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    acquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '30000', 10),
    idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),
  },
};

// 认证配置
export const authConfig = {
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // 密码
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
  passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
  passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
  passwordRequireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS === 'true',
  
  // 会话
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'qilin_session',
  sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
  sessionCookieHttpOnly: process.env.SESSION_COOKIE_HTTP_ONLY === 'true',
  sessionCookieSameSite: process.env.SESSION_COOKIE_SAME_SITE || 'strict',
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24小时
};

// 租户配置
export const tenantConfig = {
  // 子域名
  subdomainRegex: process.env.SUBDOMAIN_REGEX || '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$',
  reservedSubdomains: (process.env.RESERVED_SUBDOMAINS || 'www,app,api,admin,test,demo').split(','),
  
  // 计划
  plans: {
    free: {
      maxStores: parseInt(process.env.PLAN_FREE_MAX_STORES || '1', 10),
      maxUsers: parseInt(process.env.PLAN_FREE_MAX_USERS || '3', 10),
      maxPrinters: parseInt(process.env.PLAN_FREE_MAX_PRINTERS || '1', 10),
      features: (process.env.PLAN_FREE_FEATURES || 'basic_ordering,basic_reporting').split(','),
    },
    basic: {
      maxStores: parseInt(process.env.PLAN_BASIC_MAX_STORES || '3', 10),
      maxUsers: parseInt(process.env.PLAN_BASIC_MAX_USERS || '10', 10),
      maxPrinters: parseInt(process.env.PLAN_BASIC_MAX_PRINTERS || '3', 10),
      features: (process.env.PLAN_BASIC_FEATURES || 'basic_ordering,advanced_reporting,api_access').split(','),
    },
    premium: {
      maxStores: parseInt(process.env.PLAN_PREMIUM_MAX_STORES || '10', 10),
      maxUsers: parseInt(process.env.PLAN_PREMIUM_MAX_USERS || '50', 10),
      maxPrinters: parseInt(process.env.PLAN_PREMIUM_MAX_PRINTERS || '10', 10),
      features: (process.env.PLAN_PREMIUM_FEATURES || 'all_features,custom_integrations,priority_support').split(','),
    },
  },
  
  // 试用期
  trialDays: parseInt(process.env.TRIAL_DAYS || '14', 10),
  
  // 计费周期
  billingCycles: {
    monthly: process.env.BILLING_CYCLE_MONTHLY_PRICE || '299',
    yearly: process.env.BILLING_CYCLE_YEARLY_PRICE || '2999',
  },
};

// 业务配置
export const businessConfig = {
  // 店铺
  defaultStoreSettings: {
    taxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.06'),
    serviceCharge: parseFloat(process.env.DEFAULT_SERVICE_CHARGE || '0.10'),
    currency: process.env.DEFAULT_CURRENCY || 'CNY',
    language: process.env.DEFAULT_LANGUAGE || 'zh-CN',
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Shanghai',
  },
  
  // 订单
  orderNumberPrefix: process.env.ORDER_NUMBER_PREFIX || 'ORD',
  orderNumberLength: parseInt(process.env.ORDER_NUMBER_LENGTH || '8', 10),
  orderAutoCancelMinutes: parseInt(process.env.ORDER_AUTO_CANCEL_MINUTES || '30', 10),
  
  // 打印
  printRetryAttempts: parseInt(process.env.PRINT_RETRY_ATTEMPTS || '3', 10),
  printRetryDelay: parseInt(process.env.PRINT_RETRY_DELAY || '5000', 10),
  printTimeout: parseInt(process.env.PRINT_TIMEOUT || '30000', 10),
  
  // 云打印配置
  shangpeng: {
    appId: process.env.SHANGPENG_APP_ID,
    appSecret: process.env.SHANGPENG_APP_SECRET,
    baseUrl: process.env.SHANGPENG_BASE_URL || 'https://open.spyun.net/v1/',
    timeout: parseInt(process.env.SHANGPENG_TIMEOUT || '10000', 10),
  },
};

// 安全配置
export const securityConfig = {
  // 速率限制
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true',
  },
  
  // 请求大小限制 (Fastify需要整数，单位字节)
  bodyLimit: parseInt(process.env.BODY_LIMIT || '1048576', 10), // 默认1MB
  
  // 安全头
  securityHeaders: {
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10),
    xFrameOptions: process.env.X_FRAME_OPTIONS || 'DENY',
    xContentTypeOptions: process.env.X_CONTENT_TYPE_OPTIONS || 'nosniff',
    xXSSProtection: process.env.X_XSS_PROTECTION || '1; mode=block',
    referrerPolicy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
    contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY || "default-src 'self'",
  },
  
  // 审计日志
  auditLogEnabled: process.env.AUDIT_LOG_ENABLED === 'true',
  auditLogLevel: process.env.AUDIT_LOG_LEVEL || 'info',
};

// 监控配置
export const monitoringConfig = {
  // 健康检查
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
  
  // 指标
  metricsEnabled: process.env.METRICS_ENABLED === 'true',
  metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  
  // 告警
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
  alertThresholds: {
    cpu: parseFloat(process.env.ALERT_CPU_THRESHOLD || '80'),
    memory: parseFloat(process.env.ALERT_MEMORY_THRESHOLD || '80'),
    responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '1000', 10),
    errorRate: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD || '5'),
  },
};

// 导出所有配置
export default {
  server: serverConfig,
  database: databaseConfig,
  auth: authConfig,
  tenant: tenantConfig,
  business: businessConfig,
  security: securityConfig,
  monitoring: monitoringConfig,
  
  // 工具函数
  getFullConfig() {
    return {
      server: serverConfig,
      database: databaseConfig,
      auth: authConfig,
      tenant: tenantConfig,
      business: businessConfig,
      security: securityConfig,
      monitoring: monitoringConfig,
    };
  },
  
  // 验证配置
  validate() {
    const errors = [];
    
    // 验证端口
    if (serverConfig.port < 1024 || serverConfig.port > 65535) {
      errors.push(`端口必须在1024-65535之间: ${serverConfig.port}`);
    }
    
    // 验证JWT密钥
    if (authConfig.jwtSecret.length < 32) {
      errors.push('JWT密钥必须至少32个字符');
    }
    
    // 验证数据库URL
    if (!databaseConfig.url.includes('postgresql://')) {
      errors.push('数据库URL必须是PostgreSQL连接字符串');
    }
    
    if (errors.length > 0) {
      throw new Error(`配置验证失败:\n${errors.join('\n')}`);
    }
    
    return true;
  },
};