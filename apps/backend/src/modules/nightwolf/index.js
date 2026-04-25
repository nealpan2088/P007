// 夜狼行动 - 模块初始化器
// 版本: 0.1.0
// 功能: 夜狼模块的初始化和生命周期管理

import { isNightWolfAvailable, validateConfig } from './config/feature-flags.js';
import { NightWolfConstants } from './config/constants.js';
import { ErrorFactory } from './config/errors.js';

// 模块状态
let moduleState = {
  initialized: false,
  healthy: false,
  startTime: null,
  features: {},
  stats: {
    requests: 0,
    errors: 0,
    strategyApplications: 0,
  },
};

// 模块组件
let components = {
  config: null,
  engine: null,
  api: null,
  db: null,
  cache: null,
  monitor: null,
};

/**
 * 初始化夜狼模块
 * @param {Object} fastify Fastify实例
 * @param {Object} options 配置选项
 * @returns {Promise<Object>} 初始化结果
 */
async function initialize(fastify, options = {}) {
  const startTime = Date.now();
  
  try {
    // 1. 检查模块是否可用
    if (!isNightWolfAvailable()) {
      console.log('ℹ️  夜狼模块未启用，跳过初始化');
      return {
        success: false,
        reason: 'module_disabled',
        message: '夜狼模块未启用',
      };
    }
    
    console.log('🚀 开始初始化夜狼模块...');
    
    // 2. 验证配置
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      throw ErrorFactory.config.invalid('配置验证失败', configErrors);
    }
    
    // 3. 加载配置
    components.config = require('./config/feature-flags');
    console.log('✅ 配置加载完成');
    
    // 4. 初始化数据库连接
    components.db = await initializeDatabase();
    console.log('✅ 数据库连接初始化完成');
    
    // 5. 初始化缓存
    components.cache = await initializeCache();
    console.log('✅ 缓存初始化完成');
    
    // 6. 初始化规则引擎
    components.engine = await initializeEngine();
    console.log('✅ 规则引擎初始化完成');
    
    // 7. 注册API路由
    components.api = await registerApiRoutes(fastify);
    console.log('✅ API路由注册完成');
    
    // 8. 初始化监控
    components.monitor = await initializeMonitoring();
    console.log('✅ 监控初始化完成');
    
    // 9. 更新模块状态
    moduleState = {
      initialized: true,
      healthy: true,
      startTime: new Date().toISOString(),
      features: components.config.getConfigSummary(),
      stats: moduleState.stats,
    };
    
    const initTime = Date.now() - startTime;
    console.log(`🎉 夜狼模块初始化完成，耗时: ${initTime}ms`);
    console.log('📊 模块状态:', JSON.stringify(moduleState, null, 2));
    
    return {
      success: true,
      module: NightWolfConstants.MODULE,
      state: moduleState,
      initTime,
    };
    
  } catch (error) {
    console.error('❌ 夜狼模块初始化失败:', error);
    
    // 清理已初始化的组件
    await cleanup();
    
    moduleState = {
      initialized: false,
      healthy: false,
      startTime: null,
      features: {},
      stats: moduleState.stats,
      lastError: error.message,
    };
    
    return {
      success: false,
      error: error.message,
      state: moduleState,
    };
  }
}

/**
 * 初始化数据库连接
 */
async function initializeDatabase() {
  const { isModuleAvailable, getPerformanceConfig } = require('./config/feature-flags');
  
  if (!isModuleAvailable('RULE_ENGINE')) {
    console.log('ℹ️  规则引擎模块未启用，跳过数据库初始化');
    return null;
  }
  
  try {
    // 这里会创建独立的Prisma Client
    // 为了隔离性，使用独立的数据库连接池
    const db = {
      client: null,
      connected: false,
      poolSize: getPerformanceConfig().DB_POOL_SIZE,
    };
    
    // 模拟数据库连接
    await new Promise(resolve => setTimeout(resolve, 100));
    db.connected = true;
    
    console.log(`✅ 数据库连接池初始化完成，大小: ${db.poolSize}`);
    return db;
    
  } catch (error) {
    console.error('❌ 数据库连接初始化失败:', error);
    throw ErrorFactory.system.databaseError('initialize', error);
  }
}

/**
 * 初始化缓存
 */
async function initializeCache() {
  const { getPerformanceConfig } = require('./config/feature-flags');
  const { CACHE_ENABLED, CACHE_TTL } = getPerformanceConfig();
  
  if (!CACHE_ENABLED) {
    console.log('ℹ️  缓存未启用，跳过缓存初始化');
    return null;
  }
  
  try {
    const cache = {
      enabled: true,
      ttl: CACHE_TTL,
      store: new Map(), // 简单内存缓存，生产环境用Redis
      hits: 0,
      misses: 0,
    };
    
    console.log(`✅ 缓存初始化完成，TTL: ${CACHE_TTL}秒`);
    return cache;
    
  } catch (error) {
    console.error('❌ 缓存初始化失败:', error);
    // 缓存失败不影响核心功能，继续初始化
    return null;
  }
}

/**
 * 初始化规则引擎
 */
async function initializeEngine() {
  const { isModuleAvailable } = require('./config/feature-flags');
  
  if (!isModuleAvailable('RULE_ENGINE')) {
    console.log('ℹ️  规则引擎模块未启用，跳过引擎初始化');
    return null;
  }
  
  try {
    // 规则引擎实现
    const engine = {
      version: '0.1.0',
      rules: new Map(),
      evaluators: new Map(),
      initialized: false,
    };
    
    // 加载默认规则
    await loadDefaultRules(engine);
    
    engine.initialized = true;
    console.log('✅ 规则引擎初始化完成');
    return engine;
    
  } catch (error) {
    console.error('❌ 规则引擎初始化失败:', error);
    // 引擎失败可以降级到默认流程
    return null;
  }
}

/**
 * 加载默认规则
 */
async function loadDefaultRules(engine) {
  const { NightWolfConstants } = require('./config/constants');
  
  // 加载默认策略模板
  const defaultTemplates = NightWolfConstants.DEFAULTS.TEMPLATES;
  
  for (const [type, template] of Object.entries(defaultTemplates)) {
    engine.rules.set(type, template.strategy);
    console.log(`📦 加载默认模板: ${template.name}`);
  }
  
  // 注册规则评估器
  engine.evaluators.set('status_flow', require('./engine/evaluators/status-flow'));
  engine.evaluators.set('payment_timing', require('./engine/evaluators/payment-timing'));
}

/**
 * 注册API路由
 */
async function registerApiRoutes(fastify) {
  const { isModuleAvailable } = require('./config/feature-flags');
  const { getApiPath } = require('./config/constants');
  
  if (!isModuleAvailable('STRATEGY_CONFIG')) {
    console.log('ℹ️  策略配置模块未启用，跳过API路由注册');
    return null;
  }
  
  try {
    // 注册健康检查路由
    fastify.get(getApiPath('HEALTH'), async (request, reply) => {
      moduleState.stats.requests++;
      return {
        module: NightWolfConstants.MODULE,
        state: moduleState,
        timestamp: new Date().toISOString(),
      };
    });
    
    // 注册策略API
    const strategyRoutes = require('./api/strategies');
    fastify.register(strategyRoutes, { prefix: NightWolfConstants.API.PATHS.STRATEGIES });
    
    // 注册模板API
    const templateRoutes = require('./api/templates');
    fastify.register(templateRoutes, { prefix: NightWolfConstants.API.PATHS.TEMPLATES });
    
    console.log('✅ API路由注册完成');
    return {
      registered: true,
      routes: ['/health', '/strategies', '/templates'],
    };
    
  } catch (error) {
    console.error('❌ API路由注册失败:', error);
    // API注册失败不影响核心功能
    return null;
  }
}

/**
 * 初始化监控
 */
async function initializeMonitoring() {
  const { getMonitoringConfig } = require('./config/feature-flags');
  const { HEALTH_CHECK, METRICS, ALERTS } = getMonitoringConfig();
  
  const monitor = {
    healthCheck: HEALTH_CHECK,
    metrics: METRICS,
    alerts: ALERTS,
    checks: [],
    metricsStore: new Map(),
  };
  
  if (HEALTH_CHECK) {
    // 添加健康检查
    monitor.checks.push({
      name: 'module_health',
      check: () => moduleState.healthy,
      interval: 30000, // 30秒
    });
    
    console.log('✅ 健康检查初始化完成');
  }
  
  return monitor;
}

/**
 * 获取模块状态
 */
function getState() {
  return {
    ...moduleState,
    uptime: moduleState.startTime ? Date.now() - new Date(moduleState.startTime).getTime() : 0,
  };
}

/**
 * 健康检查
 */
async function healthCheck() {
  if (!moduleState.initialized) {
    return {
      healthy: false,
      reason: 'module_not_initialized',
    };
  }
  
  const checks = [];
  
  // 检查数据库连接
  if (components.db) {
    checks.push({
      name: 'database',
      healthy: components.db.connected,
      details: components.db,
    });
  }
  
  // 检查缓存
  if (components.cache) {
    checks.push({
      name: 'cache',
      healthy: true,
      details: {
        enabled: components.cache.enabled,
        hits: components.cache.hits,
        misses: components.cache.misses,
      },
    });
  }
  
  // 检查规则引擎
  if (components.engine) {
    checks.push({
      name: 'engine',
      healthy: components.engine.initialized,
      details: {
        version: components.engine.version,
        ruleCount: components.engine.rules.size,
      },
    });
  }
  
  const allHealthy = checks.every(check => check.healthy);
  
  return {
    healthy: allHealthy,
    checks,
    stats: moduleState.stats,
  };
}

/**
 * 清理资源
 */
async function cleanup() {
  console.log('🧹 清理夜狼模块资源...');
  
  // 关闭数据库连接
  if (components.db && components.db.client) {
    try {
      await components.db.client.$disconnect();
      console.log('✅ 数据库连接已关闭');
    } catch (error) {
      console.error('❌ 关闭数据库连接失败:', error);
    }
  }
  
  // 清理缓存
  if (components.cache && components.cache.store) {
    components.cache.store.clear();
    console.log('✅ 缓存已清理');
  }
  
  // 重置状态
  components = {
    config: null,
    engine: null,
    api: null,
    db: null,
    cache: null,
    monitor: null,
  };
  
  moduleState = {
    initialized: false,
    healthy: false,
    startTime: null,
    features: {},
    stats: moduleState.stats,
  };
  
  console.log('✅ 夜狼模块资源清理完成');
}

/**
 * 应用策略到订单
 */
async function applyStrategy(order, strategyId) {
  if (!moduleState.initialized || !moduleState.healthy) {
    console.warn('⚠️  夜狼模块未就绪，使用默认流程');
    return order; // 降级到默认流程
  }
  
  try {
    moduleState.stats.strategyApplications++;
    
    // 这里会调用规则引擎应用策略
    // 暂时返回原订单，后续实现
    
    return order;
    
  } catch (error) {
    moduleState.stats.errors++;
    console.error('❌ 策略应用失败，使用默认流程:', error);
    return order; // 降级到默认流程
  }
}

module.exports = {
  initialize,
  getState,
  healthCheck,
  cleanup,
  applyStrategy,
  
  // 导出组件供测试使用
  _components: components,
  _state: moduleState,
};