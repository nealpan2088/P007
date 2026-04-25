// 错误服务 - 统一错误创建和格式化

// 开发模式标志（由 index.js 的 startServer 传入）
let isDevelopment = true // 默认开发模式

/**
 * 设置开发模式
 * @param {boolean} dev
 */
export function setDevMode(dev) {
  isDevelopment = dev
}

/**
 * 创建标准化错误对象
 * @param {string} code - 错误代码
 * @param {string} message - 错误消息
 * @param {Object} [options] - 附加选项
 * @param {string} [options.details] - 错误详情
 * @param {string} [options.field] - 出参字段名（用于校验错误定位）
 * @param {string} [options.expected] - 期望值描述
 * @param {string} [options.received] - 实际值
 * @param {string} [options.hint] - 解决提示
 * @param {Error} [options.original] - 原始错误对象
 * @returns {Object} 标准化错误对象
 */
export function createError(code, message, options = null) {
  const isObject = options && typeof options === 'object' && !(options instanceof Error)
  const details = isObject ? options.details : options
  const field = isObject ? options.field : undefined
  const expected = isObject ? options.expected : undefined
  const received = isObject ? options.received : undefined
  const hint = isObject ? options.hint : undefined
  const original = isObject ? options.original : undefined

  const error = new Error(message)
  error.code = code
  error.details = details
  error.field = field
  error.expected = expected
  error.received = received
  error.hint = hint
  error.original = original

  // 设置HTTP状态码
  const statusMap = {
    'VALIDATION_ERROR': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'CONFLICT': 409,
    'INTERNAL_ERROR': 500,
    'SERVICE_UNAVAILABLE': 503
  }

  error.statusCode = statusMap[code] || 500
  error.name = code

  return error
}

/**
 * 将错误格式化为统一响应
 * @param {Error} error
 * @returns {Object} 统一格式的响应体
 */
export function formatErrorResponse(error) {
  const body = {
    code: error.statusCode || 500,
    error: error.message,
    traceId: `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString()
  }

  // 开发模式下的增强调试信息
  if (isDevelopment) {
    if (error.field) body.field = error.field
    if (error.expected) body.expected = error.expected
    if (error.received) body.received = error.received
    if (error.hint) body.hint = error.hint
    if (error.original) body.originalError = error.original.message
    // 永远附加错误类型
    body.errorType = error.name || error.code
  }

  return body
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
 * @param {Object} [context] - 操作上下文信息
 * @returns {Object} 用户友好的错误
 */
export function handleDatabaseError(error, context = {}) {
  console.error('数据库错误:', error.message, error.code);

  // Prisma错误代码映射
  const prismaErrorMap = {
    'P2002': { userMessage: '数据重复，违反了唯一性约束', hint: '检查是否有同名记录已存在' },
    'P2003': { userMessage: '关联数据不存在或已删除', hint: '检查引用的外键 ID 是否正确' },
    'P2025': { userMessage: '记录不存在', hint: '检查查询条件或 ID 是否正确' },
    'P2016': { userMessage: '查询解释错误', hint: '检查查询语法是否符合 Prisma 规范' },
    'P2011': { userMessage: '空值约束违反', hint: '检查必填字段是否已传值' },
    'P2012': { userMessage: '缺失必需值', hint: '检查 Prisma schema 中 required 的字段是否都有值' }
  };

  const prismaCode = error.code;
  const info = prismaErrorMap[prismaCode] || { userMessage: '数据库操作失败', hint: '查看服务器日志获取详情' };

  const meta = {
    prismaCode,
    ...(error.meta?.target ? { conflictFields: error.meta.target } : {}),
    ...context
  };

  return createError('INTERNAL_ERROR', info.userMessage, {
    details: meta,
    hint: info.hint,
    original: error
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