// 麒麟项目 - 统一中间件入口
// 提供符合Fastify v4+规范的中间件集合，使用统一常量

import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { publicDb } from '../db/index.js';
import { 
  AUTH_HEADERS, 
  USER_ROLES, 
  TENANT_ROLES, 
  PERMISSION_LEVELS, 
  AUTH_ERROR_CODES 
} from '../constants/auth.constants.js';

// ==================== 核心认证中间件 ====================

/**
 * JWT认证中间件 (Fastify v4+兼容版)
 * 验证JWT Token并提取用户信息
 * @param {Object} request Fastify请求对象
 * @param {Object} reply Fastify响应对象
 */
export async function authenticate(request, reply) {
  try {
    // 从请求头获取Token
    const authHeader = request.headers[AUTH_HEADERS.AUTHORIZATION];
    
    if (!authHeader || !authHeader.startsWith(AUTH_HEADERS.BEARER_PREFIX)) {
      reply.code(401).send({
        success: false,
        message: '未提供认证Token',
        code: AUTH_ERROR_CODES.UNAUTHORIZED
      });
      return;
    }

    const token = authHeader.substring(AUTH_HEADERS.BEARER_PREFIX.length); // 移除'Bearer '前缀

    // 验证Token
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    // 检查Token是否过期
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      reply.code(401).send({
        success: false,
        message: 'Token已过期',
        code: AUTH_ERROR_CODES.TOKEN_EXPIRED
      });
      return;
    }

    // 将用户信息添加到请求对象
    request.user = {
      id: decoded.userId,
      userId: decoded.userId, // 兼容两种命名
      email: decoded.email,
      role: decoded.role,
    };
    
    // 记录认证成功日志
    request.log.info({
      msg: '用户认证成功',
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });
  } catch (error) {
    // 记录认证错误日志
    request.log.error({
      msg: '认证错误',
      error: error.message,
      errorName: error.name,
      stack: error.stack
    });

    if (error.name === 'JsonWebTokenError') {
      reply.code(401).send({
        success: false,
        message: '无效的Token',
        code: AUTH_ERROR_CODES.INVALID_TOKEN
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      reply.code(401).send({
        success: false,
        message: 'Token已过期',
        code: AUTH_ERROR_CODES.TOKEN_EXPIRED
      });
      return;
    }

    reply.code(500).send({
      success: false,
      message: '认证过程发生错误',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * 简化版认证中间件 - 只验证Token，不检查租户
 * 用于不需要租户信息的API
 */
export async function authenticateOnly(request, reply) {
  await authenticate(request, reply);
}

// ==================== 权限检查中间件 ====================

/**
 * 角色检查中间件
 * 检查用户是否拥有指定角色
 * @param {Array} allowedRoles 允许的角色数组
 */
export function authorize(allowedRoles = []) {
  return async function (request, reply) {
    try {
      // 先进行认证
      await authenticate(request, reply);
      
      // 如果认证失败，authenticate已经发送了响应
      if (reply.sent) {
        return;
      }

      // 检查用户角色
      if (!request.user) {
        reply.code(401).send({
          success: false,
          message: '用户未认证',
          code: AUTH_ERROR_CODES.UNAUTHORIZED
        });
        return;
      }

      // 如果指定了角色，检查用户角色
      if (allowedRoles.length > 0 && !allowedRoles.includes(request.user.role)) {
        request.log.warn({
          msg: '权限不足',
          userId: request.user.id,
          userRole: request.user.role,
          requiredRoles: allowedRoles
        });
        
        reply.code(403).send({
          success: false,
          message: '权限不足',
          code: 'FORBIDDEN'
        });
        return;
      }
      
      // 记录授权成功日志
      request.log.debug({
        msg: '用户授权成功',
        userId: request.user.id,
        role: request.user.role,
        requiredRoles: allowedRoles
      });
    } catch (error) {
      request.log.error({
        msg: '授权检查错误',
        error: error.message,
        stack: error.stack
      });
      
      reply.code(500).send({
        success: false,
        message: '授权检查失败',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
}

// ==================== 租户相关中间件 ====================

/**
 * 租户访问中间件
 * 检查用户是否属于指定的租户
 * @param {string} tenantIdSource 租户ID来源 ('header', 'param', 'both')
 * @param {string} paramName 参数名（当source为'param'时使用）
 */
export function requireTenantAccess(tenantIdSource = 'header', paramName = 'tenantId') {
  return async function (request, reply) {
    try {
      // 先进行认证
      await authenticate(request, reply);
      
      // 如果认证失败，authenticate已经发送了响应
      if (reply.sent) {
        return;
      }

      let tenantId;
      
      // 根据来源获取租户ID
      switch (tenantIdSource) {
        case 'header':
          tenantId = request.headers[AUTH_HEADERS.TENANT_ID];
          break;
        case 'param':
          tenantId = request.params[paramName];
          break;
        case 'both':
          tenantId = request.headers[AUTH_HEADERS.TENANT_ID] || request.params[paramName];
          break;
        case 'user':
          // 从JWT中的tenantId获取
          tenantId = request.user?.tenantId;
          break;
        case 'body':
          tenantId = request.body?.tenantSlug || request.body?.tenantId || request.body?.subdomain;
          break;
        case 'query':
          tenantId = request.query?.tenantSlug || request.query?.tenantId || request.query?.subdomain;
          break;
        case 'auto':
          // 先查 query，再查 body，最后查 header
          tenantId = request.query?.tenantSlug || request.query?.tenantId || request.query?.subdomain
                  || request.body?.tenantSlug || request.body?.tenantId || request.body?.subdomain
                  || request.headers[AUTH_HEADERS.TENANT_ID]
                  || request.params?.tenantId;
          break;
        default:
          tenantId = request.headers[AUTH_HEADERS.TENANT_ID];
      }

      // 如果没有找到租户ID，尝试从用户关联的第一个活跃租户获取
      if (!tenantId && request.user?.id) {
        try {
          const firstTenant = await publicDb.userTenant.findFirst({
            where: {
              userId: request.user.id,
              status: 'ACTIVE',
            },
            include: {
              tenant: true,
            },
          });
          if (firstTenant) {
            tenantId = firstTenant.tenantId;
            request.log.info({
              msg: '自动从用户关联租户获取tenantId',
              userId: request.user.id,
              tenantId,
            });
          }
        } catch (dbError) {
          request.log.warn({
            msg: '自动获取租户ID失败',
            error: dbError.message,
          });
        }
      }
      
      if (!tenantId) {
        reply.code(400).send({
          success: false,
          message: '租户ID是必需的',
          code: 'MISSING_TENANT_ID'
        });
        return;
      }

      // 如果 tenantId 是 slug（非 UUID 格式），解析为真实 tenantId
      const isUUID = /^[a-z0-9]{24,26}$/.test(tenantId);
      if (!isUUID) {
        try {
          const tenant = await publicDb.tenant.findFirst({ where: { subdomain: tenantId }, select: { id: true } });
          if (tenant) {
            tenantId = tenant.id;
          } else {
            reply.code(404).send({
              success: false,
              message: '租户不存在',
              code: 'TENANT_NOT_FOUND'
            });
            return;
          }
        } catch (dbError) {
          request.log.error({ msg: '解析租户slug失败', error: dbError.message });
          reply.code(500).send({
            success: false,
            message: '租户访问检查失败',
            code: 'TENANT_CHECK_ERROR'
          });
          return;
        }
      }

      // 检查用户是否属于该租户
      const userTenant = await publicDb.userTenant.findFirst({
        where: {
          tenantId,
          userId: request.user.id,
          status: 'ACTIVE',
        },
      });

      if (!userTenant) {
        request.log.warn({
          msg: '租户访问被拒绝',
          userId: request.user.id,
          tenantId,
          attemptedAt: new Date().toISOString()
        });
        
        reply.code(403).send({
          success: false,
          message: '无权访问该租户',
          code: 'TENANT_ACCESS_DENIED'
        });
        return;
      }

      // 将租户信息和用户角色添加到请求对象
      request.tenant = {
        id: tenantId,
        userRole: userTenant.role,
      };
      
      // 添加租户ID到user对象，方便其他中间件使用
      request.user.tenantId = tenantId;
      request.user.tenantRole = userTenant.role;
      
      // 记录租户访问成功日志
      request.log.info({
        msg: '租户访问成功',
        userId: request.user.id,
        tenantId,
        tenantRole: userTenant.role
      });
    } catch (error) {
      request.log.error({
        msg: '租户访问检查错误',
        error: error.message,
        stack: error.stack
      });
      
      reply.code(500).send({
        success: false,
        message: '租户访问检查失败',
        code: 'TENANT_CHECK_ERROR'
      });
    }
  };
}

/**
 * 租户管理员中间件
 * 要求用户必须是租户的OWNER或ADMIN
 */
export function requireTenantAdmin() {
  return async function (request, reply) {
    try {
      // 先进行租户访问检查
      const requireAccess = requireTenantAccess('header');
      await requireAccess(request, reply);
      
      // 如果租户访问检查失败，已经发送了响应
      if (reply.sent) {
        return;
      }

      // 检查用户角色
      if (!request.tenant || !PERMISSION_LEVELS.TENANT_ADMIN.includes(request.tenant.userRole)) {
        request.log.warn({
          msg: '租户管理员权限不足',
          userId: request.user.id,
          tenantId: request.tenant?.id,
          userRole: request.tenant?.userRole,
          requiredRoles: PERMISSION_LEVELS.TENANT_ADMIN
        });
        
        reply.code(403).send({
          success: false,
          message: '需要管理员权限',
          code: AUTH_ERROR_CODES.FORBIDDEN
        });
        return;
      }
      
      // 记录管理员访问成功日志
      request.log.debug({
        msg: '租户管理员访问成功',
        userId: request.user.id,
        tenantId: request.tenant.id,
        role: request.tenant.userRole
      });
    } catch (error) {
      request.log.error({
        msg: '租户管理员检查错误',
        error: error.message,
        stack: error.stack
      });
      
      reply.code(500).send({
        success: false,
        message: '权限检查失败',
        code: 'ADMIN_CHECK_ERROR'
      });
    }
  };
}

// ==================== 请求验证中间件 ====================

/**
 * 请求验证中间件
 * 验证请求体和参数
 * @param {Object} schema 验证模式
 */
export function validateRequest(schema) {
  return async function (request, reply) {
    try {
      // 验证请求体
      if (schema.body) {
        const { error } = schema.body.validate(request.body);
        if (error) {
          request.log.warn({
            msg: '请求体验证失败',
            errors: error.details.map(detail => detail.message),
            requestBody: request.body
          });
          
          reply.code(400).send({
            success: false,
            message: '请求体验证失败',
            errors: error.details.map(detail => detail.message),
            code: 'VALIDATION_ERROR'
          });
          return;
        }
      }

      // 验证查询参数
      if (schema.query) {
        const { error } = schema.query.validate(request.query);
        if (error) {
          request.log.warn({
            msg: '查询参数验证失败',
            errors: error.details.map(detail => detail.message),
            queryParams: request.query
          });
          
          reply.code(400).send({
            success: false,
            message: '查询参数验证失败',
            errors: error.details.map(detail => detail.message),
            code: 'QUERY_VALIDATION_ERROR'
          });
          return;
        }
      }

      // 验证路径参数
      if (schema.params) {
        const { error } = schema.params.validate(request.params);
        if (error) {
          request.log.warn({
            msg: '路径参数验证失败',
            errors: error.details.map(detail => detail.message),
            pathParams: request.params
          });
          
          reply.code(400).send({
            success: false,
            message: '路径参数验证失败',
            errors: error.details.map(detail => detail.message),
            code: 'PARAMS_VALIDATION_ERROR'
          });
          return;
        }
      }
      
      // 记录验证成功日志
      request.log.debug({
        msg: '请求验证成功',
        validationSchema: Object.keys(schema)
      });
    } catch (error) {
      request.log.error({
        msg: '请求验证错误',
        error: error.message,
        stack: error.stack
      });
      
      reply.code(500).send({
        success: false,
        message: '请求验证失败',
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

// ==================== 性能监控中间件 ====================

/**
 * 请求计时中间件
 * 记录请求处理时间
 */
export function requestTimer() {
  return async function (request, reply) {
    const startTime = Date.now();
    
    // 添加计时器到请求对象
    request.requestTimer = {
      startTime,
      getElapsed: () => Date.now() - startTime
    };
    
    // 记录请求结束时的耗时
    // 注意：不能在 preHandler 中用 reply.addHook，某些 Fastify 版本不支持
    // 改用 request 对象存储，在 requestLogger 中统一输出
  };
}

/**
 * 请求日志中间件
 * 记录详细的请求信息
 */
export function requestLogger() {
  return async function (request, reply) {
    // 记录请求开始
    request.log.info({
      msg: '请求开始',
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      contentType: request.headers['content-type']
    });
    
    // 响应完成后记录结果
    // 注意：preHandler 阶段不能使用 reply.addHook，使用 Fastify 实例的 onResponse hook
    // 替代方案：在 admin.routes.js 中改用 fastify.addHook('onResponse', ...)
  };
}

// ==================== 错误处理中间件 ====================

/**
 * 全局错误处理中间件
 */
export function errorHandler(error, request, reply) {
  // 记录错误详情
  request.log.error({
    msg: '请求处理错误',
    error: error.message,
    errorName: error.name,
    stack: error.stack,
    method: request.method,
    url: request.url,
    userId: request.user?.id,
    tenantId: request.user?.tenantId
  });

  // 自定义错误
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      code: error.code || 'CUSTOM_ERROR'
    });
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return reply.code(401).send({
      success: false,
      message: '无效的Token',
      code: AUTH_ERROR_CODES.INVALID_TOKEN
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.code(401).send({
      success: false,
      message: 'Token已过期',
      code: AUTH_ERROR_CODES.TOKEN_EXPIRED
    });
  }

  // 数据库错误
  if (error.code?.startsWith('P')) {
    request.log.error({
      msg: '数据库错误',
      errorCode: error.code,
      errorMeta: error.meta,
      stack: error.stack
    });
    
    return reply.code(500).send({
      success: false,
      message: '数据库操作失败',
      code: 'DATABASE_ERROR'
    });
  }

  // 默认错误
  return reply.code(500).send({
    success: false,
    message: config.server.isProduction ? '服务器内部错误' : error.message,
    code: 'INTERNAL_ERROR',
    ...(config.server.isDevelopment && { 
      stack: error.stack,
      details: error.toString() 
    })
  });
}

// ==================== 店铺访问中间件 ====================

/**
 * 店铺访问中间件
 * 检查用户是否有权访问指定店铺
 * @param {string} storeIdSource storeId 来源：'param'（URL路径参数）、'query'（查询参数）
 * @param {string} paramName 参数名（默认 'storeId'）
 */
export function requireStoreAccess(storeIdSource = 'param', paramName = 'storeId') {
  return async function (request, reply) {
    try {
      // 先进行认证
      await authenticate(request, reply);
      
      // 如果认证失败，authenticate已经发送了响应
      if (reply.sent) {
        return;
      }

      let storeId;
      
      switch (storeIdSource) {
        case 'param':
          storeId = request.params[paramName];
          break;
        case 'query':
          storeId = request.query[paramName];
          break;
        case 'both':
          storeId = request.params[paramName] || request.query[paramName];
          break;
        default:
          storeId = request.params[paramName] || request.query[paramName];
      }
      
      if (!storeId) {
        reply.code(400).send({
          success: false,
          message: '店铺ID是必需的',
          code: 'MISSING_STORE_ID'
        });
        return;
      }

      // 检查店铺是否存在，并获取所属租户
      const store = await request.db.publicDb.store.findUnique({
        where: { id: String(storeId) },
        select: { id: true, tenantId: true, name: true }
      });

      if (!store) {
        reply.code(404).send({
          success: false,
          message: '店铺不存在',
          code: 'STORE_NOT_FOUND'
        });
        return;
      }

      // 检查用户是否属于该店铺的租户
      const userTenant = await request.db.publicDb.userTenant.findFirst({
        where: {
          tenantId: store.tenantId,
          userId: request.user.id,
          status: 'ACTIVE'
        }
      });

      if (!userTenant) {
        request.log.warn({
          msg: '店铺访问被拒绝',
          userId: request.user.id,
          storeId: store.id,
          storeName: store.name,
          tenantId: store.tenantId,
          attemptedAt: new Date().toISOString()
        });
        
        reply.code(403).send({
          success: false,
          message: '无权访问该店铺',
          code: 'STORE_ACCESS_DENIED'
        });
        return;
      }

      // 将店铺信息添加到请求对象
      request.store = {
        id: store.id,
        name: store.name,
        tenantId: store.tenantId
      };

      request.log.debug({
        msg: '店铺访问成功',
        userId: request.user.id,
        storeId: store.id,
        tenantId: store.tenantId
      });
    } catch (error) {
      request.log.error({
        msg: '店铺访问检查错误',
        error: error.message,
        stack: error.stack
      });
      
      reply.code(500).send({
        success: false,
        message: '店铺访问检查失败',
        code: 'STORE_CHECK_ERROR'
      });
    }
  };
}

// ==================== 请求频率限制中间件 ====================

/**
 * 内存请求计数器（IP → 请求记录）
 * 使用 Map 实现，重启进程即重置
 * @type {Map<string, {count: number, resetTime: number}>}
 */
const rateLimitStore = new Map()

/**
 * 定期清理过期记录（每5分钟）
 * 防止内存无限增长
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
  // 如果 store 太大（超过10000条），强制清空最旧的一半
  if (rateLimitStore.size > 10000) {
    const entries = [...rateLimitStore.entries()]
      .sort((a, b) => a[1].resetTime - b[1].resetTime)
    const toDelete = entries.slice(0, entries.length / 2)
    for (const [key] of toDelete) {
      rateLimitStore.delete(key)
    }
  }
}, 300000).unref()

/**
 * 请求频率限制中间件
 * 对指定路由组进行 IP 级别的访问频率限制
 * 
 * @param {Object} options 配置选项
 * @param {number} options.windowMs 时间窗口（毫秒），默认 60000（1分钟）
 * @param {number} options.max 窗口内最大请求数，默认 100
 * @param {string} options.message 超限提示信息
 * @returns {Function} Fastify preHandler 中间件
 */
export function rateLimit({
  windowMs = 60000,
  max = 100,
  message = '请求过于频繁，请稍后再试',
  scope = 'global'  // 作用域名称，不同限流器使用不同 scope 可独立计数
} = {}) {
  return async function (request, reply) {
    const ip = request.ip
    const key = `${scope}:${ip}`  // 带作用域的 key，每个限流器独立计数
    const now = Date.now()
    const record = rateLimitStore.get(key)
    
    // 无记录或已过期 → 新窗口
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
      return
    }
    
    // 超过限制 → 429
    if (record.count >= max) {
      request.log.warn({
        msg: '请求频率超限',
        ip,
        count: record.count,
        max,
        windowMs,
        url: request.url
      })
      
      reply.code(429).send({
        code: 429,
        error: message,
        traceId: `rate-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString()
      })
      return
    }
    
    // 未超限 → 递增
    record.count++
  }
}

// ==================== 导出所有中间件 ====================

export default {
  // 认证相关
  authenticate,
  authenticateOnly,
  authorize,
  
  // 租户相关
  requireTenantAccess,
  requireTenantAdmin,
  
  // 店铺相关
  requireStoreAccess,
  
  // 限流
  rateLimit,
  
  // 验证相关
  validateRequest,
  
  // 性能监控
  requestTimer,
  requestLogger,
  
  // 错误处理
  errorHandler,
  
  // 快捷组合
  authWithTenant: requireTenantAccess('header'),
  authWithTenantAdmin: requireTenantAdmin(),
  
  // 预定义角色检查
  requireAdmin: authorize(PERMISSION_LEVELS.TENANT_ADMIN),
  requireOwner: authorize([TENANT_ROLES.OWNER]),
};