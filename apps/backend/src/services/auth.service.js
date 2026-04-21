// 麒麟项目 - 认证服务
// 用户注册、登录、JWT管理

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import config from '../config/index.js'
import { publicDb } from '../db/index.js'

// 密码工具
export const passwordUtils = {
  // 生成密码哈希
  async hashPassword(password) {
    const saltRounds = config.auth.bcryptRounds
    const salt = await bcrypt.genSalt(saltRounds)
    const hash = await bcrypt.hash(password, salt)
    return { hash, salt }
  },
  
  // 验证密码
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash)
  },
  
  // 验证密码强度
  validatePasswordStrength(password) {
    const errors = []
    
    // 最小长度
    if (password.length < config.auth.passwordMinLength) {
      errors.push(`密码必须至少 ${config.auth.passwordMinLength} 个字符`)
    }
    
    // 大写字母
    if (config.auth.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母')
    }
    
    // 小写字母
    if (config.auth.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母')
    }
    
    // 数字
    if (config.auth.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('密码必须包含数字')
    }
    
    // 特殊字符
    if (config.auth.passwordRequireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('密码必须包含特殊字符')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  },
  
  // 生成随机密码
  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    // 确保包含各种字符类型
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
    
    // 填充剩余字符
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // 打乱顺序
    return password.split('').sort(() => Math.random() - 0.5).join('')
  },
}

// Token工具
export const tokenUtils = {
  // 生成JWT Token
  generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: config.auth.jwtExpiresIn,
    }
    
    return jwt.sign(
      payload,
      config.auth.jwtSecret,
      { ...defaultOptions, ...options }
    )
  },
  
  // 验证JWT Token
  verifyToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtSecret)
    } catch (error) {
      throw new Error(`Token验证失败: ${error.message}`)
    }
  },
  
  // 解码Token（不验证）
  decodeToken(token) {
    return jwt.decode(token)
  },
  
  // 生成刷新Token
  generateRefreshToken() {
    return randomBytes(40).toString('hex')
  },
  
  // 生成验证Token（用于邮箱验证、密码重置等）
  generateVerificationToken() {
    return randomBytes(32).toString('hex')
  },
  
  // 计算Token过期时间
  calculateExpiresAt(expiresIn = config.auth.jwtExpiresIn) {
    const now = new Date()
    
    if (typeof expiresIn === 'string') {
      const unit = expiresIn.slice(-1)
      const value = parseInt(expiresIn.slice(0, -1), 10)
      
      switch (unit) {
        case 's': // 秒
          return new Date(now.getTime() + value * 1000)
        case 'm': // 分钟
          return new Date(now.getTime() + value * 60 * 1000)
        case 'h': // 小时
          return new Date(now.getTime() + value * 60 * 60 * 1000)
        case 'd': // 天
          return new Date(now.getTime() + value * 24 * 60 * 60 * 1000)
        default:
          return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 默认7天
      }
    }
    
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 默认7天
  },
}

// 用户服务
export const userService = {
  // 用户注册
  async register(userData) {
    try {
      const { email, password, username, fullName, phone } = userData
      
      // 验证邮箱是否已存在
      const existingUser = await publicDb.user.findUnique({
        where: { email },
      })
      
      if (existingUser) {
        throw new Error('邮箱已被注册')
      }
      
      // 验证用户名是否已存在（如果提供了用户名）
      if (username) {
        const existingUsername = await publicDb.user.findFirst({
          where: { username },
        })
        
        if (existingUsername) {
          throw new Error('用户名已被使用')
        }
      }
      
      // 验证密码强度
      const passwordValidation = passwordUtils.validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        throw new Error(`密码强度不足: ${passwordValidation.errors.join(', ')}`)
      }
      
      // 生成密码哈希
      const { hash: passwordHash, salt: passwordSalt } = await passwordUtils.hashPassword(password)
      
      // 生成邮箱验证Token
      const verificationToken = tokenUtils.generateVerificationToken()
      const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      
      // 创建用户
      const user = await publicDb.user.create({
        data: {
          email,
          username,
          fullName,
          phone,
          passwordHash,
          passwordSalt,
          verificationToken,
          verificationTokenExpiresAt,
          status: 'ACTIVE',
        },
      })
      
      // 移除敏感信息
      const { passwordHash: _, passwordSalt: __, verificationToken: ___, ...safeUser } = user
      
      return {
        success: true,
        user: safeUser,
        message: '用户注册成功，请验证邮箱',
      }
    } catch (error) {
      console.error('用户注册失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 用户登录
  async login(credentials, requestInfo = {}) {
    try {
      const { email, password } = credentials
      const { userAgent, ipAddress, deviceType, deviceId } = requestInfo
      
      // 查找用户
      const user = await publicDb.user.findUnique({
        where: { email },
        include: {
          tenants: {
            include: {
              tenant: true,
            },
          },
        },
      })
      
      if (!user) {
        throw new Error('用户不存在')
      }
      
      // 检查用户状态
      if (user.status === 'SUSPENDED') {
        throw new Error('账号已被暂停，请联系管理员')
      }
      
      if (user.status === 'DELETED') {
        throw new Error('账号不存在')
      }
      
      // 检查账号是否被锁定
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('账号已被锁定，请稍后再试')
      }
      
      // 验证密码
      const passwordValid = await passwordUtils.verifyPassword(password, user.passwordHash)
      
      if (!passwordValid) {
        // 记录失败尝试
        await publicDb.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: user.failedLoginAttempts + 1,
            ...(user.failedLoginAttempts + 1 >= 5 && {
              lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 锁定30分钟
            }),
          },
        })
        
        throw new Error('密码错误')
      }
      
      // 重置失败尝试计数
      await publicDb.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      })
      
      // 生成Token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: 'USER', // 默认角色，实际应从用户-租户关系中获取
      }
      
      const accessToken = tokenUtils.generateToken(tokenPayload)
      const refreshToken = tokenUtils.generateRefreshToken()
      const expiresAt = tokenUtils.calculateExpiresAt()
      const refreshTokenExpiresAt = tokenUtils.calculateExpiresAt(config.auth.jwtRefreshExpiresIn)
      
      // 创建会话
      const session = await publicDb.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          userAgent,
          ipAddress,
          deviceType,
          deviceId,
          expiresAt,
          refreshTokenExpiresAt,
        },
      })
      
      // 移除敏感信息
      const { passwordHash, passwordSalt, verificationToken, resetPasswordToken, ...safeUser } = user
      
      // 准备响应数据
      const userData = {
        id: safeUser.id,
        email: safeUser.email,
        username: safeUser.username,
        fullName: safeUser.fullName,
        phone: safeUser.phone,
        avatar: safeUser.avatar,
        emailVerified: safeUser.emailVerified,
        status: safeUser.status,
        tenants: safeUser.tenants.map(ut => ({
          id: ut.tenant.id,
          name: ut.tenant.name,
          subdomain: ut.tenant.subdomain,
          displayName: ut.tenant.displayName,
          role: ut.role,
          status: ut.status,
        })),
      }
      
      return {
        success: true,
        user: userData,
        tokens: {
          accessToken,
          refreshToken,
          expiresAt,
          refreshTokenExpiresAt,
        },
        sessionId: session.id,
      }
    } catch (error) {
      console.error('用户登录失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 刷新Token
  async refreshToken(refreshToken, requestInfo = {}) {
    try {
      // 查找有效的会话
      const session = await publicDb.session.findFirst({
        where: {
          refreshToken,
          revoked: false,
          refreshTokenExpiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      })
      
      if (!session) {
        throw new Error('刷新Token无效或已过期')
      }
      
      // 生成新的Token
      const tokenPayload = {
        userId: session.userId,
        email: session.user.email,
        role: 'USER', // 实际应从用户-租户关系中获取
      }
      
      const newAccessToken = tokenUtils.generateToken(tokenPayload)
      const newRefreshToken = tokenUtils.generateRefreshToken()
      const expiresAt = tokenUtils.calculateExpiresAt()
      const refreshTokenExpiresAt = tokenUtils.calculateExpiresAt(config.auth.jwtRefreshExpiresIn)
      
      // 更新会话
      await publicDb.session.update({
        where: { id: session.id },
        data: {
          token: newAccessToken,
          refreshToken: newRefreshToken,
          expiresAt,
          refreshTokenExpiresAt,
          updatedAt: new Date(),
        },
      })
      
      return {
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresAt,
          refreshTokenExpiresAt,
        },
        sessionId: session.id,
      }
    } catch (error) {
      console.error('刷新Token失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 注销
  async logout(sessionId, userId) {
    try {
      await publicDb.session.update({
        where: {
          id: sessionId,
          userId,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: '用户主动注销',
        },
      })
      
      return {
        success: true,
        message: '注销成功',
      }
    } catch (error) {
      console.error('注销失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 验证邮箱
  async verifyEmail(token) {
    try {
      const user = await publicDb.user.findFirst({
        where: {
          verificationToken: token,
          verificationTokenExpiresAt: {
            gt: new Date(),
          },
        },
      })
      
      if (!user) {
        throw new Error('验证链接无效或已过期')
      }
      
      await publicDb.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiresAt: null,
        },
      })
      
      return {
        success: true,
        message: '邮箱验证成功',
      }
    } catch (error) {
      console.error('邮箱验证失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 发送密码重置邮件
  async requestPasswordReset(email) {
    try {
      const user = await publicDb.user.findUnique({
        where: { email },
      })
      
      if (!user) {
        // 出于安全考虑，不透露用户是否存在
        return {
          success: true,
          message: '如果邮箱存在，重置链接已发送',
        }
      }
      
      // 生成重置Token
      const resetToken = tokenUtils.generateVerificationToken()
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1小时后过期
      
      await publicDb.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordTokenExpiresAt: resetTokenExpiresAt,
        },
      })
      
      // 这里应该发送邮件，暂时只返回Token
      return {
        success: true,
        message: '重置链接已发送',
        resetToken, // 开发环境返回Token，生产环境不返回
      }
    } catch (error) {
      console.error('请求密码重置失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 重置密码
  async resetPassword(token, newPassword) {
    try {
      const user = await publicDb.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordTokenExpiresAt: {
            gt: new Date(),
          },
        },
      })
      
      if (!user) {
        throw new Error('重置链接无效或已过期')
      }
      
      // 验证密码强度
      const passwordValidation = passwordUtils.validatePasswordStrength(newPassword)
      if (!passwordValidation.valid) {
        throw new Error(`密码强度不足: ${passwordValidation.errors.join(', ')}`)
      }
      
      // 生成新密码哈希
      const { hash: passwordHash, salt: passwordSalt } = await passwordUtils.hashPassword(newPassword)
      
      await publicDb.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordSalt,
          resetPasswordToken: null,
          resetPasswordTokenExpiresAt: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })
      
      // 撤销所有活跃会话
      await publicDb.session.updateMany({
        where: {
          userId: user.id,
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: '密码重置',
        },
      })
      
      return {
        success: true,
        message: '密码重置成功',
      }
    } catch (error) {
      console.error('重置密码失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 获取用户信息
  async getUserProfile(userId) {
    try {
      const user = await publicDb.user.findUnique({
        where: { id: userId },
        include: {
          tenants: {
            include: {
              tenant: true,
            },
          },
        },
      })
      
      if (!user) {
        throw new Error('用户不存在')
      }
      
      // 移除敏感信息
      const { passwordHash, passwordSalt, verificationToken, resetPasswordToken, ...safeUser } = user
      
      return {
        success: true,
        user: safeUser,
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 更新用户信息
  async updateUserProfile(userId, updates) {
    try {
      // 不允许更新的字段
      const { password, email, ...safeUpdates } = updates
      
      const user = await publicDb.user.update({
        where: { id: userId },
        data: safeUpdates,
      })
      
      // 移除敏感信息
      const { passwordHash, passwordSalt, verificationToken, resetPasswordToken, ...safeUser } = user
      
      return {
        success: true,
        user: safeUser,
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 更改密码
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await publicDb.user.findUnique({
        where: { id: userId },
      })
      
      if (!user) {
        throw new Error('用户不存在')
      }
      
      // 验证当前密码
      const currentPasswordValid = await passwordUtils.verifyPassword(currentPassword, user.passwordHash)
      if (!currentPasswordValid) {
        throw new Error('当前密码错误')
      }
      
      // 验证新密码强度
      const passwordValidation = passwordUtils.validatePasswordStrength(newPassword)
      if (!passwordValidation.valid) {
        throw new Error(`密码强度不足: ${passwordValidation.errors.join(', ')}`)
      }
      
      // 生成新密码哈希
      const { hash: passwordHash, salt: passwordSalt } = await passwordUtils.hashPassword(newPassword)
      
      await publicDb.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordSalt,
        },
      })
      
      // 撤销所有活跃会话（可选，增强安全性）
      await publicDb.session.updateMany({
        where: {
          userId: user.id,
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: '密码更改',
        },
      })
      
      return {
        success: true,
        message: '密码更改成功',
      }
    } catch (error) {
      console.error('更改密码失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 获取用户会话
  async getUserSessions(userId) {
    try {
      const sessions = await publicDb.session.findMany({
        where: {
          userId,
          revoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      
      return {
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          deviceType: session.deviceType,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })),
      }
    } catch (error) {
      console.error('获取用户会话失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 撤销会话
  async revokeSession(userId, sessionId) {
    try {
      await publicDb.session.update({
        where: {
          id: sessionId,
          userId,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: '用户主动撤销',
        },
      })
      
      return {
        success: true,
        message: '会话已撤销',
      }
    } catch (error) {
      console.error('撤销会话失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
  
  // 验证Token并获取用户
  async validateTokenAndGetUser(token) {
    try {
      // 验证Token
      const decoded = tokenUtils.verifyToken(token)
      
      // 查找有效的会话
      const session = await publicDb.session.findFirst({
        where: {
          token,
          revoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      })
      
      if (!session) {
        throw new Error('会话无效或已过期')
      }
      
      // 检查用户状态
      if (session.user.status !== 'ACTIVE') {
        throw new Error('用户账号不可用')
      }
      
      return {
        success: true,
        user: session.user,
        session,
        decoded,
      }
    } catch (error) {
      console.error('验证Token失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
}

// 认证中间件
export const authMiddleware = {
  // 验证Token中间件
  verifyToken: async (request, reply) => {
    try {
      // 从请求头获取Token
      const authHeader = request.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('缺少认证Token')
      }
      
      const token = authHeader.substring(7)
      
      // 验证Token并获取用户
      const result = await userService.validateTokenAndGetUser(token)
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // 将用户信息添加到请求对象
      request.user = result.user
      request.session = result.session
      request.token = token
      
      // 更新会话最后活动时间（可选）
      await publicDb.session.update({
        where: { id: result.session.id },
        data: {
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: error.message,
        code: 'INVALID_TOKEN',
      })
    }
  },
  
  // 验证邮箱中间件
  requireEmailVerified: async (request, reply) => {
    try {
      if (!request.user) {
        throw new Error('用户未认证')
      }
      
      if (!request.user.emailVerified) {
        throw new Error('请先验证邮箱')
      }
    } catch (error) {
      reply.code(403).send({
        error: 'Forbidden',
        message: error.message,
        code: 'EMAIL_NOT_VERIFIED',
      })
    }
  },
  
  // 验证角色中间件
  requireRole: (requiredRole) => {
    return async (request, reply) => {
      try {
        if (!request.user) {
          throw new Error('用户未认证')
        }
        
        // 这里需要从用户-租户关系中获取实际角色
        // 暂时使用默认角色
        const userRole = 'USER' // 实际应从数据库查询
        
        // 简单的角色检查逻辑
        const roleHierarchy = {
          'SUPER_ADMIN': 5,
          'ADMIN': 4,
          'MANAGER': 3,
          'STAFF': 2,
          'USER': 1,
          'VIEWER': 0,
        }
        
        const userLevel = roleHierarchy[userRole] || 0
        const requiredLevel = roleHierarchy[requiredRole] || 0
        
        if (userLevel < requiredLevel) {
          throw new Error('权限不足')
        }
      } catch (error) {
        reply.code(403).send({
          error: 'Forbidden',
          message: error.message,
          code: 'INSUFFICIENT_PERMISSIONS',
        })
      }
    }
  },
}

// 导出所有服务
export default {
  passwordUtils,
  tokenUtils,
  userService,
  authMiddleware,
  
  // 初始化函数
  async initialize() {
    try {
      console.log('🔄 初始化认证服务...')
      
      // 检查必要的配置
      if (!config.auth.jwtSecret || config.auth.jwtSecret.length < 32) {
        throw new Error('JWT密钥配置无效，必须至少32个字符')
      }
      
      console.log('✅ 认证服务初始化完成')
      return {
        success: true,
        message: '认证服务就绪',
      }
    } catch (error) {
      console.error('❌ 认证服务初始化失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
}
