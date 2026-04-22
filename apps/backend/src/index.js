// 麒麟项目 - 清洁版服务器入口
// 完全重新创建，避免所有旧代码污染

// ==================== 强制环境变量加载 ====================
// 确保.env文件在任何其他导入之前加载
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入常量（避免硬编码）
import { TENANT_ROLES } from './constants/auth.constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 强制加载.env文件（覆盖任何现有配置）
const envPath = path.join(__dirname, '../.env');
console.log(`🔧 加载环境变量文件: ${envPath}`);
dotenv.config({ path: envPath, override: true });

// 验证关键环境变量
const requiredVars = ['DATABASE_URL', 'NODE_ENV', 'PORT', 'JWT_SECRET'];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ 关键环境变量缺失: ${varName}`);
  } else {
    console.log(`✅ ${varName}: ${varName === 'JWT_SECRET' ? '***隐藏***' : process.env[varName]}`);
  }
}
// ==================== 环境变量加载完成 ====================

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
import routes from './config/routes.js'
const PUBLIC_ROUTES = routes.public;

// ==================== 导入清洁版中间件 ====================
import { authenticate, requireTenantAccess } from './middleware/index.js'

// ==================== 导入清洁版路由模块 ====================

// 导入公共路由
import { registerPublicRoutes } from './routes/public.routes.register.js'

// 导入店铺路由
import storeRoutes from './routes/store.routes.js'

// 导入租户路由
import { registerTenantRoutes } from './routes/tenant.routes.js'

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

// 注册公共路由（扫码点餐API）
registerPublicRoutes(fastify)

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

// 注册店铺路由（路由常量已包含完整路径，无需额外前缀）
fastify.register(storeRoutes)

// 注册租户路由
registerTenantRoutes(fastify)

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
// 临时测试端点 - 用于前端/tenants页面测试
fastify.get(`${config.server.apiPrefix}/test/tenants`, async (request, reply) => {
  console.log('临时测试租户端点被调用');
  
  // 返回模拟数据（实际项目中应从数据库获取）
  return {
    success: true,
    message: '临时测试端点 - 租户列表',
    data: [
      {
        id: 'test-tenant-1',
        name: '测试租户一',
        subdomain: 'test-tenant-1',
        plan: 'free',
        status: 'ACTIVE',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {},
        createdAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        role: TENANT_ROLES.OWNER
      },
      {
        id: 'test-tenant-2',
        name: '测试租户二',
        subdomain: 'test-tenant-2',
        plan: 'pro',
        status: 'ACTIVE',
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {},
        createdAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        role: TENANT_ROLES.ADMIN
      },
      {
        id: 'test-tenant-3',
        name: '测试租户三',
        subdomain: 'test-tenant-3',
        plan: 'enterprise',
        status: 'PENDING',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {},
        createdAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        role: 'STAFF'
      }
    ]
  };
});
