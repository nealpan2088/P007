// 错误服务 - 统一错误创建和格式化

/**
 * 创建标准化错误对象
 * @param {string} code - 错误代码
 * @param {string} message - 错误消息
 * @param {string} [details] - 错误详情
 * @returns {Object} 标准化错误对象
 */
export function createError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  
  // 设置HTTP状态码
  const statusMap = {
    'VALIDATION_ERROR': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'CONFLICT': 409,
    'INTERNAL_ERROR': 500,
    'SERVICE_UNAVAILABLE': 503
  };
  
  error.statusCode = statusMap[code] || 500;
  
  error.statusCode = statusMap[code] || 500;
  error.name = code;
  
  return error;
}

/**
 * 验证错误格式化
 * @param {Array} errors - 验证错误数组
 * @returns {Object} 格式化后的错误
 */
export function formatValidationErrors(errors) {
  return createError('VALIDATION_ERROR', '数据验证失败', errors);
}

/**
 * 数据库错误处理
 * @param {Error} error - 数据库错误
 * @returns {Object} 用户友好的错误
 */
export function handleDatabaseError(error) {
  console.error('数据库错误:', error);
  
  // Prisma错误代码映射
  const prismaErrorMap = {
    'P2002': '唯一性约束冲突',
    'P2003': '外键约束失败',
    'P2025': '记录不存在',
    'P2016': '查询解释错误',
    'P2011': '空值约束违反',
    'P2012': '缺失必需值'
  };
  
  const prismaCode = error.code || error.meta?.code;
  const userMessage = prismaErrorMap[prismaCode] || '数据库操作失败';
  
  return createError('INTERNAL_ERROR', userMessage, {
    originalError: error.message,
    prismaCode
  });
}

/**
 * 认证错误
 * @param {string} [message] - 错误消息
 * @returns {Object} 认证错误
 */
export function authError(message = '认证失败') {
  return createError('UNAUTHORIZED', message);
}

/**
 * 权限错误
 * @param {string} [message] - 错误消息
 * @returns {Object} 权限错误
 */
export function permissionError(message = '权限不足') {
  return createError('FORBIDDEN', message);
}

/**
 * 未找到错误
 * @param {string} resource - 资源名称
 * @returns {Object} 未找到错误
 */
export function notFoundError(resource) {
  return createError('NOT_FOUND', `${resource}不存在`);
}

/**
 * 冲突错误
 * @param {string} resource - 资源名称
 * @returns {Object} 冲突错误
 */
export function conflictError(resource) {
  return createError('CONFLICT', `${resource}已存在`);
}

export default {
  createError,
  formatValidationErrors,
  handleDatabaseError,
  authError,
  permissionError,
  notFoundError,
  conflictError
};