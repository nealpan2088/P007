// 夜狼行动 - 常量定义
// 版本: 0.1.0
// 功能: 定义夜狼模块的常量

/**
 * 夜狼模块常量
 */
const NightWolfConstants = {
  // 模块信息
  MODULE: {
    NAME: 'nightwolf',
    VERSION: '0.1.0',
    DISPLAY_NAME: '夜狼策略配置系统',
    DESCRIPTION: '灵活可配置的订单状态和支付策略引擎',
  },
  
  // API路径
  API: {
    // 基础路径
    BASE_PATH: '/api/nightwolf/v1',
    
    // 子路径
    PATHS: {
      STRATEGIES: '/strategies',
      TEMPLATES: '/templates',
      CONFIGS: '/configs',
      HEALTH: '/health',
      METRICS: '/metrics',
    },
    
    // 完整路径
    FULL_PATHS: {
      STRATEGIES: '/api/nightwolf/v1/strategies',
      TEMPLATES: '/api/nightwolf/v1/templates',
      CONFIGS: '/api/nightwolf/v1/configs',
      HEALTH: '/api/nightwolf/v1/health',
      METRICS: '/api/nightwolf/v1/metrics',
    },
  },
  
  // 数据库表名
  DATABASE: {
    // 表名前缀
    TABLE_PREFIX: 'nightwolf_',
    
    // 表名
    TABLES: {
      STRATEGY: 'nightwolf_strategy',
      TEMPLATE: 'nightwolf_template',
      CONFIG: 'nightwolf_config',
      ORDER_STRATEGY: 'nightwolf_order_strategy',
    },
    
    // 字段名
    FIELDS: {
      // 公共字段
      COMMON: {
        ID: 'id',
        CREATED_AT: 'createdAt',
        UPDATED_AT: 'updatedAt',
        IS_ACTIVE: 'isActive',
        VERSION: 'version',
      },
      
      // 策略表字段
      STRATEGY: {
        STORE_ID: 'storeId',
        STATUS_CONFIG: 'statusConfig',
        PAYMENT_CONFIG: 'paymentConfig',
        RULES_CONFIG: 'rulesConfig',
      },
    },
  },
  
  // 策略类型
  STRATEGY_TYPES: {
    STATUS_FLOW: 'status_flow',
    PAYMENT_TIMING: 'payment_timing',
    PAYMENT_METHOD: 'payment_method',
    ANTI_ESCAPE: 'anti_escape',
    MEMBER_BENEFITS: 'member_benefits',
  },
  
  // 模板类型
  TEMPLATE_TYPES: {
    FAST_FOOD: 'fast_food',
    CASUAL_DINING: 'casual_dining',
    HOT_POT: 'hot_pot',
    CAFE: 'cafe',
    BAR: 'bar',
    CUSTOM: 'custom',
  },
  
  // 默认配置
  DEFAULTS: {
    // 默认策略配置
    STRATEGY: {
      STATUS_FLOW: {
        nodes: [
          { id: 'pending', name: '待确认', color: '#ff9800' },
          { id: 'confirmed', name: '已确认', color: '#2196f3' },
          { id: 'completed', name: '已完成', color: '#4caf50' },
          { id: 'cancelled', name: '已取消', color: '#f44336' },
        ],
        transitions: [
          { from: 'pending', to: 'confirmed' },
          { from: 'confirmed', to: 'completed' },
          { from: '*', to: 'cancelled' },
        ],
      },
      PAYMENT_TIMING: {
        default: 'post_dining',
        allowCustomerChoice: false,
        rules: [],
      },
    },
    
    // 默认模板
    TEMPLATES: {
      FAST_FOOD: {
        name: '快餐店模板',
        type: 'fast_food',
        description: '适用于快餐店，简单快速的状态流程',
        strategy: {
          statusFlow: {
            nodes: [
              { id: 'pending', name: '待确认', color: '#ff9800' },
              { id: 'confirmed', name: '制作中', color: '#2196f3' },
              { id: 'ready', name: '已就绪', color: '#4caf50' },
              { id: 'completed', name: '已完成', color: '#9e9e9e' },
            ],
          },
          paymentTiming: {
            default: 'pre_order',
            allowCustomerChoice: false,
          },
        },
      },
      CASUAL_DINING: {
        name: '正餐餐厅模板',
        type: 'casual_dining',
        description: '适用于正餐餐厅，完整的服务流程',
        strategy: {
          statusFlow: {
            nodes: [
              { id: 'pending', name: '待确认', color: '#ff9800' },
              { id: 'confirmed', name: '已确认', color: '#2196f3' },
              { id: 'preparing', name: '制作中', color: '#673ab7' },
              { id: 'ready', name: '已就绪', color: '#4caf50' },
              { id: 'served', name: '已上菜', color: '#009688' },
              { id: 'completed', name: '已完成', color: '#9e9e9e' },
            ],
          },
          paymentTiming: {
            default: 'post_dining',
            allowCustomerChoice: true,
          },
        },
      },
    },
  },
  
  // 错误代码
  ERROR_CODES: {
    // 配置错误
    CONFIG_INVALID: 'NIGHTWOLF_001',
    CONFIG_NOT_FOUND: 'NIGHTWOLF_002',
    CONFIG_VALIDATION_FAILED: 'NIGHTWOLF_003',
    
    // 策略错误
    STRATEGY_NOT_FOUND: 'NIGHTWOLF_101',
    STRATEGY_INVALID: 'NIGHTWOLF_102',
    STRATEGY_APPLICATION_FAILED: 'NIGHTWOLF_103',
    
    // 模板错误
    TEMPLATE_NOT_FOUND: 'NIGHTWOLF_201',
    TEMPLATE_INVALID: 'NIGHTWOLF_202',
    
    // 系统错误
    MODULE_DISABLED: 'NIGHTWOLF_901',
    DATABASE_ERROR: 'NIGHTWOLF_902',
    PERMISSION_DENIED: 'NIGHTWOLF_903',
  },
  
  // 日志级别
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  },
  
  // 缓存键前缀
  CACHE_KEYS: {
    STRATEGY: 'nightwolf:strategy:',
    TEMPLATE: 'nightwolf:template:',
    CONFIG: 'nightwolf:config:',
  },
  
  // 时间常量（毫秒）
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
  },
};

/**
 * 获取API完整路径
 * @param {string} pathKey 路径键名
 * @returns {string} 完整路径
 */
function getApiPath(pathKey) {
  return NightWolfConstants.API.FULL_PATHS[pathKey] || NightWolfConstants.API.BASE_PATH;
}

/**
 * 获取数据库表名
 * @param {string} tableKey 表键名
 * @returns {string} 表名
 */
function getTableName(tableKey) {
  return NightWolfConstants.DATABASE.TABLES[tableKey] || 
         `${NightWolfConstants.DATABASE.TABLE_PREFIX}${tableKey}`;
}

/**
 * 获取错误代码
 * @param {string} errorKey 错误键名
 * @returns {string} 错误代码
 */
function getErrorCode(errorKey) {
  return NightWolfConstants.ERROR_CODES[errorKey] || 'NIGHTWOLF_999';
}

/**
 * 获取默认模板
 * @param {string} templateType 模板类型
 * @returns {Object|null} 模板配置
 */
function getDefaultTemplate(templateType) {
  return NightWolfConstants.DEFAULTS.TEMPLATES[templateType] || null;
}

module.exports = {
  NightWolfConstants,
  getApiPath,
  getTableName,
  getErrorCode,
  getDefaultTemplate,
};