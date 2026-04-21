// 认证中间件

import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * JWT认证中间件
 * @param {Object} request Fastify请求对象
 * @param {Object} reply Fastify响应对象
 * @param {Function} done 完成回调
 */
export async function authenticate(request, reply, done) {
  try {
    // 从请求头获取Token
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        message: '未提供认证Token',
      });
    }

    const token = authHeader.substring(7); // 移除'Bearer '前缀

    // 验证Token
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    // 检查Token是否过期
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return reply.status(401).send({
        success: false,
        message: 'Token已过期',
      });
    }

    // 将用户信息添加到请求对象
    request.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // 可选：检查用户状态（如果需要）
    // const user = await request.db.publicDb.user.findUnique({
    //   where: { id: decoded.userId },
    // });
    
    // if (!user || user.status !== 'ACTIVE') {
    //   return reply.status(401).send({
    //     success: false,
    //     message: '用户账户不可用',
    //   });
    // }

    done();
  } catch (error) {
    console.error('认证错误:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return reply.status(401).send({
        success: false,
        message: '无效的Token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return reply.status(401).send({
        success: false,
        message: 'Token已过期',
      });
    }

    return reply.status(500).send({
      success: false,
      message: '认证失败',
    });
  }
}

/**
 * 角色检查中间件
 * @param {Array} allowedRoles 允许的角色数组
 */
export function authorize(allowedRoles = []) {
  return async function (request, reply, done) {
    try {
      // 先进行认证
      await authenticate(request, reply, () => {});

      // 检查用户角色
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          message: '用户未认证',
        });
      }

      // 如果指定了角色，检查用户角色
      if (allowedRoles.length > 0 && !allowedRoles.includes(request.user.role)) {
        return reply.status(403).send({
          success: false,
          message: '权限不足',
        });
      }

      done();
    } catch (error) {
      console.error('授权错误:', error);
      return reply.status(500).send({
        success: false,
        message: '授权检查失败',
      });
    }
  };
}

/**
 * 邮箱验证中间件
 * 要求用户邮箱必须已验证
 */
export async function requireEmailVerification(request, reply, done) {
  try {
    // 先进行认证
    await authenticate(request, reply, () => {});

    // 检查邮箱验证状态
    const user = await request.db.publicDb.user.findUnique({
      where: { id: request.user.id },
      select: { emailVerified: true },
    });

    if (!user || !user.emailVerified) {
      return reply.status(403).send({
        success: false,
        message: '请先验证您的邮箱',
      });
    }

    done();
  } catch (error) {
    console.error('邮箱验证检查错误:', error);
    return reply.status(500).send({
      success: false,
      message: '邮箱验证检查失败',
    });
  }
}

/**
 * 租户访问中间件
 * 检查用户是否属于指定的租户
 * @param {string} tenantIdParam 租户ID参数名
 */
export function requireTenantAccess(tenantIdParam = 'tenantId') {
  return async function (request, reply, done) {
    try {
      // 先进行认证
      await authenticate(request, reply, () => {});

      const tenantId = request.params[tenantIdParam];
      
      if (!tenantId) {
        return reply.status(400).send({
          success: false,
          message: '租户ID是必需的',
        });
      }

      // 检查用户是否属于该租户
      const userTenant = await request.db.publicDb.userTenant.findFirst({
        where: {
          tenantId,
          userId: request.user.id,
          status: 'ACTIVE',
        },
      });

      if (!userTenant) {
        return reply.status(403).send({
          success: false,
          message: '无权访问该租户',
        });
      }

      // 将租户信息和用户角色添加到请求对象
      request.tenant = {
        id: tenantId,
        userRole: userTenant.role,
      };

      done();
    } catch (error) {
      console.error('租户访问检查错误:', error);
      return reply.status(500).send({
        success: false,
        message: '租户访问检查失败',
      });
    }
  };
}

/**
 * 租户管理员中间件
 * 要求用户必须是租户的OWNER或ADMIN
 * @param {string} tenantIdParam 租户ID参数名
 */
export function requireTenantAdmin(tenantIdParam = 'tenantId') {
  return async function (request, reply, done) {
    try {
      // 先进行租户访问检查
      const requireAccess = requireTenantAccess(tenantIdParam);
      await requireAccess(request, reply, () => {});

      // 检查用户角色
      if (!request.tenant || !['OWNER', 'ADMIN'].includes(request.tenant.userRole)) {
        return reply.status(403).send({
          success: false,
          message: '需要管理员权限',
        });
      }

      done();
    } catch (error) {
      console.error('租户管理员检查错误:', error);
      return reply.status(500).send({
        success: false,
        message: '权限检查失败',
      });
    }
  };
}

/**
 * 租户所有者中间件
 * 要求用户必须是租户的OWNER
 * @param {string} tenantIdParam 租户ID参数名
 */
export function requireTenantOwner(tenantIdParam = 'tenantId') {
  return async function (request, reply, done) {
    try {
      // 先进行租户访问检查
      const requireAccess = requireTenantAccess(tenantIdParam);
      await requireAccess(request, reply, () => {});

      // 检查用户角色
      if (!request.tenant || request.tenant.userRole !== 'OWNER') {
        return reply.status(403).send({
          success: false,
          message: '需要所有者权限',
        });
      }

      done();
    } catch (error) {
      console.error('租户所有者检查错误:', error);
      return reply.status(500).send({
        success: false,
        message: '权限检查失败',
      });
    }
  };
}

/**
 * 速率限制中间件
 * 防止暴力破解和滥用
 * @param {Object} options 配置选项
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15分钟
    max = 100, // 每个窗口最大请求数
    keyGenerator = (request) => request.ip, // 默认使用IP地址
    skipFailedRequests = false,
  } = options;

  const requests = new Map();

  return async function (request, reply, done) {
    const key = keyGenerator(request);
    const now = Date.now();
    const windowStart = now - windowMs;

    // 清理过期记录
    for (const [k, entry] of requests.entries()) {
      if (entry.timestamp < windowStart) {
        requests.delete(k);
      }
    }

    // 获取或创建用户记录
    let entry = requests.get(key);
    if (!entry) {
      entry = {
        count: 0,
        timestamp: now,
      };
      requests.set(key, entry);
    }

    // 检查是否在新窗口
    if (entry.timestamp < windowStart) {
      entry.count = 0;
      entry.timestamp = now;
    }

    // 增加计数
    entry.count++;

    // 设置响应头
    reply.header('X-RateLimit-Limit', max);
    reply.header('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    reply.header('X-RateLimit-Reset', Math.ceil((entry.timestamp + windowMs) / 1000));

    // 检查是否超过限制
    if (entry.count > max) {
      return reply.status(429).send({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((entry.timestamp + windowMs - now) / 1000),
      });
    }

    done();
  };
}

/**
 * 请求验证中间件
 * 验证请求体和参数
 * @param {Object} schema 验证模式
 */
export function validate(schema) {
  return async function (request, reply, done) {
    try {
      // 验证请求体
      if (schema.body) {
        const { error } = schema.body.validate(request.body);
        if (error) {
          return reply.status(400).send({
            success: false,
            message: '请求体验证失败',
            errors: error.details.map(detail => detail.message),
          });
        }
      }

      // 验证查询参数
      if (schema.query) {
        const { error } = schema.query.validate(request.query);
        if (error) {
          return reply.status(400).send({
            success: false,
            message: '查询参数验证失败',
            errors: error.details.map(detail => detail.message),
          });
        }
      }

      // 验证路径参数
      if (schema.params) {
        const { error } = schema.params.validate(request.params);
        if (error) {
          return reply.status(400).send({
            success: false,
            message: '路径参数验证失败',
            errors: error.details.map(detail => detail.message),
          });
        }
      }

      done();
    } catch (error) {
      console.error('请求验证错误:', error);
      return reply.status(500).send({
        success: false,
        message: '请求验证失败',
      });
    }
  };
}

/**
 * 错误处理中间件
 */
export function errorHandler(error, request, reply) {
  console.error('请求错误:', error);

  // 自定义错误
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
    });
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({
      success: false,
      message: '无效的Token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      success: false,
      message: 'Token已过期',
    });
  }

  // 数据库错误
  if (error.code?.startsWith('P')) {
    console.error('数据库错误:', error);
    return reply.status(500).send({
      success: false,
      message: '数据库操作失败',
    });
  }

  // 默认错误
  return reply.status(500).send({
    success: false,
    message: '服务器内部错误',
    ...(config.server.isDevelopment && { stack: error.stack }),
  });
}

// 导出所有中间件
export default {
  authenticate,
  authorize,
  requireEmailVerification,
  requireTenantAccess,
  requireTenantAdmin,
  requireTenantOwner,
  rateLimit,
  validate,
  errorHandler,
};