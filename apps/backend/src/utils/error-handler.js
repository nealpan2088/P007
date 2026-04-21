// 麒麟项目 - 错误处理工具
// 提供统一的错误创建和处理功能

/**
 * 创建标准错误对象
 * @param {string} code 错误代码
 * @param {string} message 错误消息
 * @param {number} statusCode HTTP状态码
 * @param {Object} details 错误详情
 * @returns {Error} 错误对象
 */
export function createError(code, message, statusCode = 400, details = null) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  error.isOperational = true; // 标记为操作错误（非程序错误）
  
  // 捕获堆栈跟踪
  Error.captureStackTrace(error, createError);
  
  return error;
}

/**
 * 错误代码映射
 */
export const ErrorCodes = {
  // 认证错误 (401)
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 授权错误 (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 资源错误 (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  STORE_NOT_FOUND: 'STORE_NOT_FOUND',
  
  // 验证错误 (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // 冲突错误 (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  
  // 业务逻辑错误 (422)
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  INVALID_OPERATION: 'INVALID_OPERATION',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  
  // 系统错误 (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // 限流错误 (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 维护错误 (503)
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
};

/**
 * HTTP状态码映射
 */
export const HttpStatus = {
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,
  EARLY_HINTS: 103,
  
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  MULTI_STATUS: 207,
  ALREADY_REPORTED: 208,
  IM_USED: 226,
  
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  USE_PROXY: 305,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  IM_A_TEAPOT: 418,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511,
};

/**
 * 错误处理器中间件
 * @param {Error} error 错误对象
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {Function} next 下一个中间件
 */
export function errorHandler(error, req, res, next) {
  // 记录错误
  logError(error, req);
  
  // 设置默认值
  const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  const code = error.code || ErrorCodes.INTERNAL_ERROR;
  const message = error.message || 'Internal Server Error';
  const details = error.details;
  
  // 生产环境隐藏敏感信息
  const isProduction = process.env.NODE_ENV === 'production';
  const response = {
    success: false,
    error: {
      code,
      message: isProduction && statusCode >= 500 ? 'Internal Server Error' : message,
      ...(details && !isProduction && { details }),
      ...(!isProduction && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };
  
  // 移除生产环境的堆栈信息
  if (isProduction) {
    delete response.error.stack;
  }
  
  // 发送响应
  res.status(statusCode).json(response);
}

/**
 * 记录错误日志
 * @param {Error} error 错误对象
 * @param {Object} req 请求对象
 */
function logError(error, req) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: error.statusCode >= 500 ? 'ERROR' : 'WARN',
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    tenantId: req.tenant?.id,
    stack: error.stack,
    details: error.details,
  };
  
  // 记录到控制台
  console.error(JSON.stringify(logEntry, null, 2));
  
  // 这里可以添加其他日志输出，如文件、日志服务等
}

/**
 * 异步错误包装器
 * 用于包装异步路由处理函数，自动捕获错误
 * @param {Function} fn 异步函数
 * @returns {Function} 包装后的函数
 */
export function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 验证错误处理器
 * 专门处理验证错误
 * @param {Error} error 验证错误
 * @returns {Object} 格式化后的错误
 */
export function handleValidationError(error) {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      type: err.kind,
    }));
    
    return createError(
      ErrorCodes.VALIDATION_ERROR,
      '数据验证失败',
      HttpStatus.UNPROCESSABLE_ENTITY,
      { errors }
    );
  }
  
  return error;
}

/**
 * 数据库错误处理器
 * 专门处理数据库错误
 * @param {Error} error 数据库错误
 * @returns {Object} 格式化后的错误
 */
export function handleDatabaseError(error) {
  // Prisma错误处理
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        // 唯一约束违反
        return createError(
          ErrorCodes.DUPLICATE_ENTRY,
          '记录已存在',
          HttpStatus.CONFLICT,
          { field: error.meta?.target?.[0] }
        );
        
      case 'P2003':
        // 外键约束违反
        return createError(
          ErrorCodes.VALIDATION_ERROR,
          '关联记录不存在',
          HttpStatus.BAD_REQUEST,
          { field: error.meta?.field_name }
        );
        
      case 'P2025':
        // 记录不存在
        return createError(
          ErrorCodes.NOT_FOUND,
          '记录不存在',
          HttpStatus.NOT_FOUND
        );
        
      default:
        return createError(
          ErrorCodes.DATABASE_ERROR,
          '数据库操作失败',
          HttpStatus.INTERNAL_SERVER_ERROR,
          { code: error.code }
        );
    }
  }
  
  return error;
}

/**
 * 创建成功响应
 * @param {Object} data 响应数据
 * @param {string} message 成功消息
 * @param {number} statusCode HTTP状态码
 * @returns {Object} 成功响应对象
 */
export function createSuccessResponse(data = null, message = '操作成功', statusCode = HttpStatus.OK) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建分页响应
 * @param {Array} data 数据数组
 * @param {number} page 当前页码
 * @param {number} limit 每页数量
 * @param {number} total 总记录数
 * @param {string} message 成功消息
 * @returns {Object} 分页响应对象
 */
export function createPaginatedResponse(data, page, limit, total, message = '查询成功') {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
}