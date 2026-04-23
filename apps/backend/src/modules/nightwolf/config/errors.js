// 夜狼行动 - 错误定义
// 版本: 0.1.0
// 功能: 定义夜狼模块的错误类型和错误处理

const { getErrorCode } = require('./constants');

/**
 * 夜狼基础错误类
 */
class NightWolfError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'NightWolfError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // 保持错误堆栈
    Error.captureStackTrace(this, NightWolfError);
  }
  
  /**
   * 转换为JSON格式
   * @returns {Object} JSON格式的错误信息
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
        module: 'nightwolf',
      },
    };
  }
  
  /**
   * 转换为API响应格式
   * @returns {Object} API响应格式
   */
  toApiResponse() {
    return {
      success: false,
      error: this.toJSON().error,
      data: null,
    };
  }
}

/**
 * 配置错误
 */
class ConfigError extends NightWolfError {
  constructor(message, details = null) {
    super(getErrorCode('CONFIG_INVALID'), message, details);
    this.name = 'ConfigError';
  }
}

/**
 * 策略错误
 */
class StrategyError extends NightWolfError {
  constructor(codeKey, message, details = null) {
    super(getErrorCode(codeKey), message, details);
    this.name = 'StrategyError';
  }
}

/**
 * 模板错误
 */
class TemplateError extends NightWolfError {
  constructor(codeKey, message, details = null) {
    super(getErrorCode(codeKey), message, details);
    this.name = 'TemplateError';
  }
}

/**
 * 系统错误
 */
class SystemError extends NightWolfError {
  constructor(codeKey, message, details = null) {
    super(getErrorCode(codeKey), message, details);
    this.name = 'SystemError';
  }
}

/**
 * 模块禁用错误
 */
class ModuleDisabledError extends SystemError {
  constructor() {
    super('MODULE_DISABLED', '夜狼模块未启用', {
      suggestion: '请检查NIGHTWOLF_ENABLED环境变量',
      documentation: '/docs/nightwolf/setup',
    });
    this.name = 'ModuleDisabledError';
  }
}

/**
 * 权限错误
 */
class PermissionError extends SystemError {
  constructor(requiredRole, userRole) {
    super('PERMISSION_DENIED', '权限不足', {
      requiredRole,
      userRole,
      suggestion: '请联系管理员获取相应权限',
    });
    this.name = 'PermissionError';
  }
}

/**
 * 数据库错误
 */
class DatabaseError extends SystemError {
  constructor(operation, originalError) {
    super('DATABASE_ERROR', `数据库操作失败: ${operation}`, {
      operation,
      originalError: originalError?.message,
      suggestion: '请检查数据库连接和权限',
    });
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * 验证错误
 */
class ValidationError extends ConfigError {
  constructor(field, value, rule) {
    super(`字段验证失败: ${field}`, {
      field,
      value,
      rule,
      suggestion: `请提供有效的${field}值`,
    });
    this.name = 'ValidationError';
  }
}

/**
 * 错误工厂函数
 */
const ErrorFactory = {
  /**
   * 创建配置错误
   */
  config: {
    invalid: (message, details) => new ConfigError(message, details),
    notFound: (configId) => new ConfigError(
      `配置未找到: ${configId}`,
      { configId, suggestion: '请检查配置ID是否正确' }
    ),
    validationFailed: (errors) => new ConfigError(
      '配置验证失败',
      { errors, suggestion: '请根据错误信息修正配置' }
    ),
  },
  
  /**
   * 创建策略错误
   */
  strategy: {
    notFound: (strategyId) => new StrategyError(
      'STRATEGY_NOT_FOUND',
      `策略未找到: ${strategyId}`,
      { strategyId, suggestion: '请检查策略ID或店铺ID' }
    ),
    invalid: (reason) => new StrategyError(
      'STRATEGY_INVALID',
      `策略配置无效: ${reason}`,
      { reason, suggestion: '请检查策略配置格式' }
    ),
    applicationFailed: (orderId, reason) => new StrategyError(
      'STRATEGY_APPLICATION_FAILED',
      `策略应用失败: 订单${orderId}`,
      { orderId, reason, suggestion: '请检查订单状态和策略配置' }
    ),
  },
  
  /**
   * 创建模板错误
   */
  template: {
    notFound: (templateId) => new TemplateError(
      'TEMPLATE_NOT_FOUND',
      `模板未找到: ${templateId}`,
      { templateId, suggestion: '请检查模板ID或类型' }
    ),
    invalid: (reason) => new TemplateError(
      'TEMPLATE_INVALID',
      `模板配置无效: ${reason}`,
      { reason, suggestion: '请检查模板配置格式' }
    ),
  },
  
  /**
   * 创建系统错误
   */
  system: {
    moduleDisabled: () => new ModuleDisabledError(),
    permissionDenied: (requiredRole, userRole) => new PermissionError(requiredRole, userRole),
    databaseError: (operation, error) => new DatabaseError(operation, error),
  },
  
  /**
   * 创建验证错误
   */
  validation: {
    field: (field, value, rule) => new ValidationError(field, value, rule),
  },
};

/**
 * 错误处理中间件
 */
function errorHandler(error, req, reply) {
  // 记录错误日志
  const logger = req.log || console;
  logger.error('夜狼模块错误:', {
    error: error.message,
    code: error.code,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });
  
  // 如果是夜狼错误，使用自定义格式
  if (error instanceof NightWolfError) {
    return reply.status(getStatusCode(error)).send(error.toApiResponse());
  }
  
  // 其他错误，使用默认处理
  const nightWolfError = new SystemError(
    'DATABASE_ERROR',
    '内部服务器错误',
    { originalError: error.message }
  );
  
  return reply.status(500).send(nightWolfError.toApiResponse());
}

/**
 * 根据错误代码获取HTTP状态码
 */
function getStatusCode(error) {
  if (!error.code) return 500;
  
  const codePrefix = error.code.split('_')[1];
  
  switch (codePrefix) {
    case '001':
    case '002':
    case '003':
    case '101':
    case '102':
    case '103':
    case '201':
    case '202':
      return 400; // Bad Request
    
    case '903':
      return 403; // Forbidden
    
    case '901':
      return 503; // Service Unavailable
    
    case '902':
      return 500; // Internal Server Error
    
    default:
      return 500;
  }
}

/**
 * 安全执行函数，捕获错误并转换为夜狼错误
 */
async function safeExecute(operation, fn) {
  try {
    return await fn();
  } catch (error) {
    // 如果已经是夜狼错误，直接抛出
    if (error instanceof NightWolfError) {
      throw error;
    }
    
    // 其他错误转换为数据库错误
    throw ErrorFactory.system.databaseError(operation, error);
  }
}

module.exports = {
  NightWolfError,
  ConfigError,
  StrategyError,
  TemplateError,
  SystemError,
  ModuleDisabledError,
  PermissionError,
  DatabaseError,
  ValidationError,
  ErrorFactory,
  errorHandler,
  getStatusCode,
  safeExecute,
};