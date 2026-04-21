// 动态配置系统 - 在运行时获取环境变量

// 配置获取函数（动态获取环境变量）
export const getServerConfig = () => ({
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
});

export const getDatabaseConfig = () => ({
  url: process.env.DATABASE_URL,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  
  // 多租户配置
  publicSchema: process.env.DB_PUBLIC_SCHEMA || 'public',
  tenantSchemaPrefix: process.env.DB_TENANT_SCHEMA_PREFIX || 'tenant_',
  
  // 连接池
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    acquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '30000', 10),
    idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),
  },
});

export const getAuthConfig = () => ({
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
});

export const getSecurityConfig = () => ({
  // 请求限制
  bodyLimit: parseInt(process.env.BODY_LIMIT || '1048576', 10), // 1MB
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15分钟
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  
  // 安全头
  helmetEnabled: process.env.HELMET_ENABLED !== 'false',
  hstsEnabled: process.env.HSTS_ENABLED === 'true',
  xssProtection: process.env.XSS_PROTECTION !== 'false',
  noSniff: process.env.NO_SNIFF !== 'false',
  
  // CSRF
  csrfEnabled: process.env.CSRF_ENABLED === 'true',
  csrfCookieName: process.env.CSRF_COOKIE_NAME || '_csrf',
  csrfHeaderName: process.env.CSRF_HEADER_NAME || 'X-CSRF-Token',
});

// 系统模式配置
export const getSystemConfig = () => {
  const mode = process.env.SYSTEM_MODE || 'multi';
  
  return {
    // 系统模式：single (单店版) | multi (多店版/SaaS)
    mode: mode,
    isSingleStore: mode === 'single',
    isMultiTenant: mode === 'multi',
    
    // 单店版配置
    singleStore: {
      storeId: process.env.DEFAULT_STORE_ID || 'store_001',
      storeName: process.env.DEFAULT_STORE_NAME || '默认店铺',
      subdomain: process.env.DEFAULT_STORE_SUBDOMAIN || 'default',
    },
    
    // 功能开关（根据模式自动调整）
    features: {
      // 多租户功能
      multiTenant: mode === 'multi',
      tenantRegistration: mode === 'multi',
      tenantBilling: mode === 'multi',
      tenantIsolation: mode === 'multi',
      
      // 单店版功能
      singleStoreMode: mode === 'single',
      simplifiedPricing: mode === 'single',
      directStoreAccess: mode === 'single',
      
      // 通用功能（两种模式都支持）
      userAuthentication: true,
      menuManagement: true,
      orderProcessing: true,
      printing: true,
      analytics: true,
      reporting: true,
    },
  };
};

// 验证函数
export const validateConfig = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'API_PREFIX'
  ];
  
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
  
  // 验证系统模式
  const systemMode = process.env.SYSTEM_MODE || 'multi';
  if (!['single', 'multi'].includes(systemMode)) {
    throw new Error(`系统模式无效: ${systemMode}，必须是 'single' 或 'multi'`);
  }
  
  // 如果是单店模式，验证必要配置
  if (systemMode === 'single') {
    if (!process.env.DEFAULT_STORE_ID) {
      throw new Error('单店模式需要设置 DEFAULT_STORE_ID 环境变量');
    }
  }
  
  return true;
};

// 导出默认配置对象
const config = {
  get server() { return getServerConfig(); },
  get database() { return getDatabaseConfig(); },
  get auth() { return getAuthConfig(); },
  get security() { return getSecurityConfig(); },
  get system() { return getSystemConfig(); },
  validate: validateConfig,
};

export default config;