// 夜狼行动 - 功能开关配置
// 版本: 0.1.0
// 功能: 控制夜狼模块的启用状态和功能开关

const env = process.env;

/**
 * 夜狼功能开关配置
 */
const NightWolfFeatureFlags = {
  // 核心开关
  ENABLED: env.NIGHTWOLF_ENABLED === 'true',
  
  // 功能模块开关
  MODULES: {
    // 策略配置模块
    STRATEGY_CONFIG: env.NIGHTWOLF_MODULE_STRATEGY !== 'false',
    
    // 规则引擎模块
    RULE_ENGINE: env.NIGHTWOLF_MODULE_RULES !== 'false',
    
    // 可视化配置模块
    VISUAL_CONFIG: env.NIGHTWOLF_MODULE_VISUAL === 'true',
    
    // 模板市场模块
    TEMPLATE_MARKET: env.NIGHTWOLF_MODULE_MARKET === 'true',
  },
  
  // 运行模式
  MODES: {
    // 严格模式：订单必须关联策略
    STRICT: env.NIGHTWOLF_STRICT_MODE === 'true',
    
    // 测试模式：启用测试功能
    TEST: env.NIGHTWOLF_TEST_MODE === 'true',
    
    // 调试模式：详细日志
    DEBUG: env.NIGHTWOLF_DEBUG === 'true',
  },
  
  // 性能配置
  PERFORMANCE: {
    // 缓存启用
    CACHE_ENABLED: env.NIGHTWOLF_CACHE !== 'false',
    
    // 缓存TTL（秒）
    CACHE_TTL: parseInt(env.NIGHTWOLF_CACHE_TTL || '300', 10),
    
    // 数据库连接池大小
    DB_POOL_SIZE: parseInt(env.NIGHTWOLF_DB_POOL || '5', 10),
    
    // 查询超时（毫秒）
    QUERY_TIMEOUT: parseInt(env.NIGHTWOLF_QUERY_TIMEOUT || '5000', 10),
  },
  
  // 安全配置
  SECURITY: {
    // 配置验证
    VALIDATION_ENABLED: env.NIGHTWOLF_VALIDATE !== 'false',
    
    // 权限检查
    PERMISSION_CHECK: env.NIGHTWOLF_PERMISSION !== 'false',
    
    // 审计日志
    AUDIT_LOG: env.NIGHTWOLF_AUDIT === 'true',
  },
  
  // 监控配置
  MONITORING: {
    // 健康检查启用
    HEALTH_CHECK: env.NIGHTWOLF_HEALTH_CHECK !== 'false',
    
    // 指标收集
    METRICS: env.NIGHTWOLF_METRICS === 'true',
    
    // 告警启用
    ALERTS: env.NIGHTWOLF_ALERTS === 'true',
  },
};

/**
 * 检查夜狼模块是否可用
 * @returns {boolean} 是否可用
 */
function isNightWolfAvailable() {
  return NightWolfFeatureFlags.ENABLED;
}

/**
 * 检查特定功能是否可用
 * @param {string} moduleName 模块名称
 * @returns {boolean} 是否可用
 */
function isModuleAvailable(moduleName) {
  if (!isNightWolfAvailable()) {
    return false;
  }
  
  const module = NightWolfFeatureFlags.MODULES[moduleName];
  return module !== undefined ? module : false;
}

/**
 * 获取运行模式
 * @returns {Object} 运行模式配置
 */
function getRunMode() {
  return NightWolfFeatureFlags.MODES;
}

/**
 * 获取性能配置
 * @returns {Object} 性能配置
 */
function getPerformanceConfig() {
  return NightWolfFeatureFlags.PERFORMANCE;
}

/**
 * 获取安全配置
 * @returns {Object} 安全配置
 */
function getSecurityConfig() {
  return NightWolfFeatureFlags.SECURITY;
}

/**
 * 获取监控配置
 * @returns {Object} 监控配置
 */
function getMonitoringConfig() {
  return NightWolfFeatureFlags.MONITORING;
}

/**
 * 验证配置有效性
 * @returns {Array} 无效配置列表
 */
function validateConfig() {
  const invalidConfigs = [];
  
  // 检查必要的环境变量
  const requiredEnvVars = ['NIGHTWOLF_ENABLED'];
  
  for (const envVar of requiredEnvVars) {
    if (!env[envVar]) {
      invalidConfigs.push(`缺少环境变量: ${envVar}`);
    }
  }
  
  // 检查性能配置有效性
  if (NightWolfFeatureFlags.PERFORMANCE.DB_POOL_SIZE < 1) {
    invalidConfigs.push('数据库连接池大小必须大于0');
  }
  
  if (NightWolfFeatureFlags.PERFORMANCE.QUERY_TIMEOUT < 100) {
    invalidConfigs.push('查询超时时间必须大于100毫秒');
  }
  
  return invalidConfigs;
}

/**
 * 获取配置摘要
 * @returns {Object} 配置摘要
 */
function getConfigSummary() {
  return {
    enabled: NightWolfFeatureFlags.ENABLED,
    modules: Object.keys(NightWolfFeatureFlags.MODULES)
      .filter(key => NightWolfFeatureFlags.MODULES[key])
      .map(key => key.toLowerCase().replace(/_/g, ' ')),
    modes: Object.keys(NightWolfFeatureFlags.MODES)
      .filter(key => NightWolfFeatureFlags.MODES[key])
      .map(key => key.toLowerCase()),
    performance: {
      cacheEnabled: NightWolfFeatureFlags.PERFORMANCE.CACHE_ENABLED,
      dbPoolSize: NightWolfFeatureFlags.PERFORMANCE.DB_POOL_SIZE,
    },
    security: {
      validationEnabled: NightWolfFeatureFlags.SECURITY.VALIDATION_ENABLED,
      permissionCheck: NightWolfFeatureFlags.SECURITY.PERMISSION_CHECK,
    },
  };
}

module.exports = {
  NightWolfFeatureFlags,
  isNightWolfAvailable,
  isModuleAvailable,
  getRunMode,
  getPerformanceConfig,
  getSecurityConfig,
  getMonitoringConfig,
  validateConfig,
  getConfigSummary,
};