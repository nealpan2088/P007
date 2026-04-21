// 麒麟项目 - 清洁版服务器入口
// 完全重新创建，避免所有旧代码污染

import Fastify from 'fastify'
import cors from '@fastify/cors'
import config from './config/index.js'

// 创建全新的Fastify实例
const fastify = Fastify({
  logger: {
    level: config.server.logLevel,
  },
  bodyLimit: config.security.bodyLimit,
})

// 注册 CORS
await fastify.register(cors, {
  origin: config.server.corsOrigin,
  credentials: config.server.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
})

// 添加安全头
fastify.addHook('onSend', async (request, reply, payload) => {
  reply.header('X-Frame-Options', config.security.securityHeaders.xFrameOptions)
  reply.header('X-Content-Type-Options', config.security.securityHeaders.xContentTypeOptions)
  reply.header('X-XSS-Protection', config.security.securityHeaders.xXSSProtection)
  reply.header('Referrer-Policy', config.security.securityHeaders.referrerPolicy)
})

// ==================== 导入配置和路由常量 ====================
import { PUBLIC_ROUTES } from './config/routes.js'

// ==================== 导入清洁版中间件 ====================
import { authenticate, requireTenantAccess } from './middleware/index.js'

// ==================== 导入清洁版路由模块 ====================

// 导入店铺路由
import storeRoutes from './routes/store.routes.js'

// ==================== 注册路由模块 ====================

// 健康检查 - 使用路由常量
fastify.get(PUBLIC_ROUTES.HEALTH, async () => {
  return {
    status: 'ok',
    service: 'qilin-backend',
    version: '0.2.3',
    timestamp: new Date().toISOString(),
    mode: 'clean-architecture'
  }
})

// 测试认证端点 - 临时路由，后续应移到auth模块
fastify.get(`${config.server.apiPrefix}/test/auth`, {
  preHandler: requireTenantAccess('header')
}, async (request, reply) => {
  return {
    success: true,
    message: '认证测试成功',
    user: request.user,
    timestamp: new Date().toISOString()
  }
})

// 注册店铺路由，使用配置的前缀和版本
fastify.register(storeRoutes, { 
  prefix: `${config.server.apiPrefix}/${config.server.apiVersion}` 
})

// 404处理
fastify.setNotFoundHandler(async (request, reply) => {
  reply.code(404).send({
    error: 'Not Found',
    message: `路由 ${request.method} ${request.url} 不存在`,
    timestamp: new Date().toISOString(),
    version: 'clean'
  })
})

// 错误处理
fastify.setErrorHandler(async (error, request, reply) => {
  console.error('清洁版服务器错误:', error)
  
  reply.code(500).send({
    success: false,
    message: '服务器内部错误',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  })
})

// 启动服务器
try {
  await fastify.listen({
    port: config.server.port,
    host: config.server.host
  })
  
  console.log('🚀 麒麟项目清洁版服务器启动成功!')
  console.log(`🌐 地址: http://${config.server.host}:${config.server.port}`)
  console.log(`🔧 健康检查: http://${config.server.host}:${config.server.port}/api/health`)
  console.log('💡 此版本完全绕过旧代码污染问题')
  
} catch (error) {
  console.error('❌ 清洁版服务器启动失败:', error)
  process.exit(1)
}