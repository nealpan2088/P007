// 麒麟项目 - 认证API路由
// 用户注册、登录、验证、密码管理等

import authService from '../services/auth.service.js'
import routes from '../config/routes.js'

// 认证路由处理器
export const authHandlers = {
  // 用户注册
  register: async (request, reply) => {
    try {
      const { email, password, username, fullName, phone } = request.body
      
      // 验证请求数据
      if (!email || !password) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: '邮箱和密码是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 调用注册服务
      const result = await authService.userService.register({
        email,
        password,
        username,
        fullName,
        phone,
      })
      
      if (!result.success) {
        return reply.code(400).send({
          error: 'Registration Failed',
          message: result.error,
          code: 'REGISTRATION_FAILED',
        })
      }
      
      return reply.code(201).send({
        success: true,
        message: result.message,
        user: result.user,
      })
    } catch (error) {
      console.error('注册处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '注册过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 用户登录
  login: async (request, reply) => {
    try {
      const { email, password } = request.body
      
      // 验证请求数据
      if (!email || !password) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: '邮箱和密码是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 获取请求信息
      const requestInfo = {
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        deviceType: request.headers['device-type'] || 'web',
        deviceId: request.headers['device-id'],
      }
      
      // 调用登录服务
      const result = await authService.userService.login(
        { email, password },
        requestInfo
      )
      
      if (!result.success) {
        return reply.code(401).send({
          error: 'Authentication Failed',
          message: result.error,
          code: 'AUTHENTICATION_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        user: result.user,
        tokens: result.tokens,
        sessionId: result.sessionId,
      })
    } catch (error) {
      console.error('登录处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '登录过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 刷新Token
  refreshToken: async (request, reply) => {
    try {
      const { refreshToken } = request.body
      
      if (!refreshToken) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: '刷新Token是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 获取请求信息
      const requestInfo = {
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        deviceType: request.headers['device-type'] || 'web',
        deviceId: request.headers['device-id'],
      }
      
      // 调用刷新Token服务
      const result = await authService.userService.refreshToken(refreshToken, requestInfo)
      
      if (!result.success) {
        return reply.code(401).send({
          error: 'Token Refresh Failed',
          message: result.error,
          code: 'TOKEN_REFRESH_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        tokens: result.tokens,
        sessionId: result.sessionId,
      })
    } catch (error) {
      console.error('刷新Token处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '刷新Token过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 用户注销
  logout: async (request, reply) => {
    try {
      const { sessionId } = request.body
      const userId = request.user?.id
      
      if (!sessionId || !userId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: '会话ID和用户ID是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 调用注销服务
      const result = await authService.userService.logout(sessionId, userId)
      
      if (!result.success) {
        return reply.code(400).send({
          error: 'Logout Failed',
          message: result.error,
          code: 'LOGOUT_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        message: result.message,
      })
    } catch (error) {
      console.error('注销处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '注销过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 验证邮箱
  verifyEmail: async (request, reply) => {
    try {
      const { token } = request.params
      
      if (!token) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: '验证Token是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 调用邮箱验证服务
      const result = await authService.userService.verifyEmail(token)
      
      if (!result.success) {
        return reply.code(400).send({
          error: 'Email Verification Failed',
          message: result.error,
          code: 'EMAIL_VERIFICATION_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        message: result.message,
      })
    } catch (error) {
      console.error('邮箱验证处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '邮箱验证过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 请求密码重置
  requestPasswordReset: async (request, reply) => {
    try {
      const { email } = request.body
      
      if (!email) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: '邮箱是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 调用密码重置请求服务
      const result = await authService.userService.requestPasswordReset(email)
      
      return reply.send({
        success: true,
        message: result.message,
        ...(process.env.NODE_ENV === 'development' && { resetToken: result.resetToken }),
      })
    } catch (error) {
      console.error('密码重置请求处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '密码重置请求过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 重置密码
  resetPassword: async (request, reply) => {
    try {
      const { token, newPassword } = request.body
      
      if (!token || !newPassword) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Token和新密码是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 调用密码重置服务
      const result = await authService.userService.resetPassword(token, newPassword)
      
      if (!result.success) {
        return reply.code(400).send({
          error: 'Password Reset Failed',
          message: result.error,
          code: 'PASSWORD_RESET_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        message: result.message,
      })
    } catch (error) {
      console.error('密码重置处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '密码重置过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 获取用户信息
  getProfile: async (request, reply) => {
    try {
      const userId = request.user?.id
      
      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: '用户未认证',
          code: 'UNAUTHORIZED',
        })
      }
      
      // 调用获取用户信息服务
      const result = await authService.userService.getUserProfile(userId)
      
      if (!result.success) {
        return reply.code(404).send({
          error: 'User Not Found',
          message: result.error,
          code: 'USER_NOT_FOUND',
        })
      }
      
      return reply.send({
        success: true,
        user: result.user,
      })
    } catch (error) {
      console.error('获取用户信息处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '获取用户信息过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 更新用户信息
  updateProfile: async (request, reply) => {
    try {
      const userId = request.user?.id
      const updates = request.body
      
      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: '用户未认证',
          code: 'UNAUTHORIZED',
        })
      }
      
      // 调用更新用户信息服务
      const result = await authService.userService.updateUserProfile(userId, updates)
      
      if (!result.success) {
        return reply.code(400).send({
          error: 'Profile Update Failed',
          message: result.error,
          code: 'PROFILE_UPDATE_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        user: result.user,
      })
    } catch (error) {
      console.error('更新用户信息处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '更新用户信息过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 更改密码
  changePassword: async (request, reply) => {
    try {
      const userId = request.user?.id
      const { currentPassword, newPassword } = request.body
      
      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: '用户未认证',
          code: 'UNAUTHORIZED',
        })
      }
      
      if (!currentPassword || !newPassword) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: '当前密码和新密码是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 调用更改密码服务
      const result = await authService.userService.changePassword(
        userId,
        currentPassword,
        newPassword
      )
      
      if (!result.success) {
        return reply.code(400).send({
          error: 'Password Change Failed',
          message: result.error,
          code: 'PASSWORD_CHANGE_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        message: result.message,
      })
    } catch (error) {
      console.error('更改密码处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '更改密码过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 获取用户会话
  getSessions: async (request, reply) => {
    try {
      const userId = request.user?.id
      
      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: '用户未认证',
          code: 'UNAUTHORIZED',
        })
      }
      
      // 调用获取用户会话服务
      const result = await authService.userService.getUserSessions(userId)
      
      if (!result.success) {
        return reply.code(400).send({
          error: 'Get Sessions Failed',
          message: result.error,
          code: 'GET_SESSIONS_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        sessions: result.sessions,
      })
    } catch (error) {
      console.error('获取用户会话处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '获取用户会话过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 撤销会话
  revokeSession: async (request, reply) => {
    try {
      const userId = request.user?.id
      const { sessionId } = request.body
      
      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: '用户未认证',
          code: 'UNAUTHORIZED',
        })
      }
      
      if (!sessionId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: '会话ID是必填项',
          code: 'VALIDATION_ERROR',
        })
      }
      
      // 调用撤销会话服务
      const result = await authService.userService.revokeSession(userId, sessionId)
      
      if (!result.success) {
        return reply.code(400).send({
          error: 'Revoke Session Failed',
          message: result.error,
          code: 'REVOKE_SESSION_FAILED',
        })
      }
      
      return reply.send({
        success: true,
        message: result.message,
      })
    } catch (error) {
      console.error('撤销会话处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '撤销会话过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
  
  // 健康检查
  healthCheck: async (request, reply) => {
    try {
      return reply.send({
        status: 'ok',
        service: 'qilin-auth',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      })
    } catch (error) {
      console.error('健康检查处理错误:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: '健康检查过程中发生错误',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}

// 注册认证路由
export const registerAuthRoutes = (fastify) => {
  const routes = {
    AUTH: {
      REGISTER: '/api/v1/auth/register',
      LOGIN: '/api/v1/auth/login',
      LOGOUT: '/api/v1/auth/logout',
      REFRESH_TOKEN: '/api/v1/auth/refresh-token',
      VERIFY_EMAIL: '/api/v1/auth/verify-email/:token',
      REQUEST_PASSWORD_RESET: '/api/v1/auth/request-password-reset',
      RESET_PASSWORD: '/api/v1/auth/reset-password',
      PROFILE: '/api/v1/auth/profile',
      CHANGE_PASSWORD: '/api/v1/auth/change-password',
      SESSIONS: '/api/v1/auth/sessions',
      REVOKE_SESSION: '/api/v1/auth/revoke-session',
      HEALTH: '/api/v1/auth/health',
    }
  };
  
  // 公共路由（无需认证）
  fastify.post(routes.AUTH.REGISTER, authHandlers.register)
  fastify.post(routes.AUTH.LOGIN, authHandlers.login)
  fastify.post(routes.AUTH.REFRESH_TOKEN, authHandlers.refreshToken)
  fastify.get(routes.AUTH.VERIFY_EMAIL, authHandlers.verifyEmail)
  fastify.post(routes.AUTH.REQUEST_PASSWORD_RESET, authHandlers.requestPasswordReset)
  fastify.post(routes.AUTH.RESET_PASSWORD, authHandlers.resetPassword)
  fastify.get(routes.AUTH.HEALTH, authHandlers.healthCheck)
  
  // 受保护路由（需要认证）
  fastify.post(
    routes.AUTH.LOGOUT,
    { preHandler: authService.authMiddleware.verifyToken },
    authHandlers.logout
  )
  
  fastify.get(
    routes.AUTH.PROFILE,
    { preHandler: authService.authMiddleware.verifyToken },
    authHandlers.getProfile
  )
  
  fastify.put(
    routes.AUTH.PROFILE,
    { preHandler: authService.authMiddleware.verifyToken },
    authHandlers.updateProfile
  )
  
  fastify.post(
    routes.AUTH.CHANGE_PASSWORD,
    { preHandler: authService.authMiddleware.verifyToken },
    authHandlers.changePassword
  )
  
  fastify.get(
    routes.AUTH.SESSIONS,
    { preHandler: authService.authMiddleware.verifyToken },
    authHandlers.getSessions
  )
  
  fastify.post(
    routes.AUTH.REVOKE_SESSION,
    { preHandler: authService.authMiddleware.verifyToken },
    authHandlers.revokeSession
  )
  
  console.log('✅ 认证路由注册完成')
}

export default {
  authHandlers,
  registerAuthRoutes,
}