// 麒麟项目 - 后端服务器入口
// 使用统一配置管理系统，禁止硬编码

import Fastify from 'fastify'
import cors from '@fastify/cors'

// 导入统一配置
import config from './config/index.js'
import routesModule from './config/routes.js'
import { registerAuthRoutes } from './routes/auth.routes.js'

// 使用默认导出
const routes = routesModule.default || routesModule

// 验证配置
try {
  config.validate()
  console.log('✅ 配置验证通过')
} catch (error) {
  console.error('❌ 配置验证失败:', error.message)
  process.exit(1)
}

// 创建Fastify实例
const fastify = Fastify({
  logger: {
    level: config.server.logLevel,
    // 简化日志配置，避免pino-pretty问题
  },
  bodyLimit: config.security.bodyLimit,
  disableRequestLogging: false,
})

// 注册 CORS
await fastify.register(cors, {
  origin: config.server.corsOrigin,
  credentials: config.server.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24小时
})

// 添加安全头中间件
fastify.addHook('onSend', async (request, reply, payload) => {
  reply.header('X-Frame-Options', config.security.securityHeaders.xFrameOptions)
  reply.header('X-Content-Type-Options', config.security.securityHeaders.xContentTypeOptions)
  reply.header('X-XSS-Protection', config.security.securityHeaders.xXSSProtection)
  reply.header('Referrer-Policy', config.security.securityHeaders.referrerPolicy)
  
  if (config.server.isProduction) {
    reply.header('Strict-Transport-Security', `max-age=${config.security.securityHeaders.hstsMaxAge}`)
    reply.header('Content-Security-Policy', config.security.securityHeaders.contentSecurityPolicy)
  }
  
  return payload
})

// 健康检查端点 - 使用路由常量
fastify.get(routes.public.HEALTH, async () => {
  return {
    status: 'ok',
    service: 'qilin-backend',
    version: '0.2.3',
    environment: config.server.env,
    timestamp: new Date().toISOString(),
    config: {
      apiPrefix: config.server.apiPrefix,
      apiVersion: config.server.apiVersion,
      features: {
        multiTenant: true,
        printing: true,
        analytics: true,
      }
    }
  }
})

// 注册认证路由
registerAuthRoutes(fastify)

// 注册公开API路由（扫码点餐）
import { registerPublicRoutes } from './routes/public.routes.register.js'
registerPublicRoutes(fastify)

// 注册租户路由
import { registerTenantRoutes } from './routes/tenant.routes.js'
registerTenantRoutes(fastify)

// 注册系统模式路由
import { registerSystemRoutes } from './routes/system.routes.js'
registerSystemRoutes(fastify)

// 注册管理API路由
import { registerAdminRoutes } from './routes/admin.routes.register.js'
registerAdminRoutes(fastify)

// API示例端点 - 使用路由常量
fastify.get(routes.public.PUBLIC.HELLO, async () => {
  return {
    message: '欢迎使用麒麟云点餐SaaS API!',
    service: 'qilin-backend',
    version: '0.2.3',
    timestamp: new Date().toISOString(),
    documentation: {
      health: routes.public.HEALTH,
      auth: {
        register: routes.public.AUTH.REGISTER,
        login: routes.public.AUTH.LOGIN,
      },
      config: {
        apiPrefix: config.server.apiPrefix,
        apiVersion: config.server.apiVersion,
      }
    }
  }
})

// 版本信息端点
fastify.get(routes.public.PUBLIC.VERSION, async () => {
  return {
    name: '麒麟云点餐SaaS',
    version: '0.2.3',
    apiVersion: config.server.apiVersion,
    environment: config.server.env,
    buildDate: new Date().toISOString(),
    features: config.tenant.plans,
    support: {
      email: 'support@qilin-dining.com',
      documentation: 'https://docs.qilin-dining.com',
    }
  }
})

// 功能列表端点
fastify.get(routes.public.PUBLIC.FEATURES, async () => {
  return {
    features: {
      multiTenant: {
        enabled: true,
        description: '多租户架构，支持多个餐厅独立运营',
        plans: Object.keys(config.tenant.plans),
      },
      scanningOrdering: {
        enabled: true,
        description: '扫码点餐，顾客自助下单',
      },
      cloudPrinting: {
        enabled: true,
        description: '云打印集成，支持多种打印机品牌',
        supportedBrands: ['商鹏云', '本地网络', 'USB'],
      },
      analytics: {
        enabled: true,
        description: '数据分析，销售统计和顾客分析',
      },
      mobileReady: {
        enabled: true,
        description: '移动端优化，支持PWA',
      },
    },
    pricing: config.tenant.billingCycles,
    trialDays: config.tenant.trialDays,
  }
})

// 404处理
fastify.setNotFoundHandler(async (request, reply) => {
  reply.code(404).send({
    error: 'Not Found',
    message: `路由 ${request.method} ${request.url} 不存在`,
    timestamp: new Date().toISOString(),
    documentation: routes.public.PUBLIC.VERSION,
  })
})

// 错误处理
fastify.setErrorHandler(async (error, request, reply) => {
  const statusCode = error.statusCode || 500
  
  // 记录错误
  request.log.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    params: request.params,
    query: request.query,
  })
  
  reply.code(statusCode).send({
    error: error.name || 'Internal Server Error',
    message: config.server.isProduction && statusCode === 500 
      ? '服务器内部错误' 
      : error.message,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: request.id,
    ...(config.server.isDevelopment && { stack: error.stack }),
  })
})

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ 
      port: config.server.port, 
      host: config.server.host 
    })
    
    console.log('🚀' + '='.repeat(60))
    console.log('🚀 麒麟云点餐SaaS 后端服务器启动成功!')
    console.log('🚀' + '='.repeat(60))
    console.log(`📊 环境: ${config.server.env}`)
    console.log(`🌐 地址: http://${config.server.host}:${config.server.port}`)
    console.log(`🔧 健康检查: http://${config.server.host}:${config.server.port}${routes.public.HEALTH}`)
    console.log(`📚 API文档: http://${config.server.host}:${config.server.port}${routes.public.PUBLIC.VERSION}`)
    console.log(`🎯 功能列表: http://${config.server.host}:${config.server.port}${routes.public.PUBLIC.FEATURES}`)
    console.log('📋' + '='.repeat(60))
    console.log('📋 配置摘要:')
    console.log(`   - API前缀: ${config.server.apiPrefix}`)
    console.log(`   - API版本: ${config.server.apiVersion}`)
    console.log(`   - CORS来源: ${config.server.corsOrigin.join(', ')}`)
    console.log(`   - 数据库: ${config.database.url ? '已配置' : '未配置'}`)
    console.log(`   - JWT认证: ${config.auth.jwtSecret ? '已启用' : '未启用'}`)
    console.log('📋' + '='.repeat(60))
    console.log('💡 提示: 所有API路由通过统一配置管理，禁止硬编码!')
    console.log('🚀' + '='.repeat(60))
    
  } catch (err) {
    fastify.log.error(err)
    console.error('❌ 服务器启动失败:', err.message)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🔄 正在关闭服务器...')
  await fastify.close()
  console.log('✅ 服务器已关闭')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🔄 收到终止信号，正在关闭服务器...')
  await fastify.close()
  console.log('✅ 服务器已关闭')
  process.exit(0)
})

// 启动服务器
start()
