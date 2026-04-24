// 麒麟项目 - 集成夜狼模块的服务器入口
// 版本: 0.2.5 + nightwolf-0.1.0

// ==================== 强制环境变量加载 ====================
// 确保.env文件在任何其他导入之前加载
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// 夜狼模块环境变量
console.log(`🌙 夜狼模块状态: ${process.env.NIGHTWOLF_ENABLED === 'true' ? '已启用' : '未启用'}`);
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
})

// ==================== 夜狼模块初始化 ====================
let nightWolfModule = null;
let nightWolfInitialized = false;

async function initializeNightWolfModule() {
  try {
    console.log('🌙 开始初始化夜狼模块...');
    
    // 导入ES模块版本的夜狼模块
    const nightWolf = await import('./modules/nightwolf/index-simple.mjs');
    console.log('✅ 夜狼模块加载成功 (ES模块)');
    
    // 初始化夜狼模块
    const initResult = await nightWolf.initialize(fastify, {
      logLevel: process.env.NIGHTWOLF_LOG_LEVEL || 'info',
    });
    
    if (initResult.success) {
      nightWolfModule = nightWolf;
      nightWolfInitialized = true;
      console.log('🎉 夜狼模块初始化成功:', initResult.module?.name || 'nightwolf');
      console.log('📊 夜狼模块版本:', initResult.module?.version || '0.1.0-simple');
    } else {
      console.warn('⚠️  夜狼模块初始化失败，但不影响核心功能:', initResult.reason || initResult.error);
      console.log('ℹ️  核心功能将继续正常运行');
    }
    
  } catch (error) {
    console.error('❌ 夜狼模块加载失败，但不影响核心功能:', error.message);
    console.log('ℹ️  核心功能将继续正常运行');
  }
}

// ==================== 核心路由注册 ====================
// 注意：核心路由注册不受夜狼模块影响

// 健康检查路由（核心）
fastify.get(PUBLIC_ROUTES.HEALTH, async () => {
  const coreHealth = {
    status: 'ok',
    service: 'qilin-optimized',
    version: '0.2.5',
    database: 'connected',
    timestamp: new Date().toISOString(),
  };
  
  // 添加夜狼模块状态
  if (nightWolfInitialized && nightWolfModule) {
    try {
      const nightWolfHealth = await nightWolfModule.healthCheck();
      coreHealth.nightwolf = {
        enabled: true,
        healthy: nightWolfHealth.healthy,
        version: '0.1.0',
      };
    } catch (error) {
      coreHealth.nightwolf = {
        enabled: true,
        healthy: false,
        error: error.message,
      };
    }
  } else {
    coreHealth.nightwolf = {
      enabled: process.env.NIGHTWOLF_ENABLED === 'true',
      initialized: nightWolfInitialized,
      message: nightWolfInitialized ? '模块已初始化' : '模块未初始化',
    };
  }
  
  return coreHealth;
})

// 公共API路由 - 使用.register.js文件
import { PUBLIC_ROUTES } from './config/routes.js'
import { registerPublicRoutes } from './routes/public.routes.register.js'
fastify.register(registerPublicRoutes, { prefix: '/api/public' })

// 租户API路由
import { registerTenantRoutes } from './routes/tenant.routes.js'
fastify.register(registerTenantRoutes, { prefix: '/api/tenant' })

// 店铺API路由 - 使用.register.js文件
import { registerStoreRoutes } from './routes/store.routes.register.js'
fastify.register(registerStoreRoutes, { prefix: '/api/store' })

// 管理API路由 - 使用.register.js文件
import { registerAdminRoutes } from './routes/admin.routes.register.js'
fastify.register(registerAdminRoutes, { prefix: '/api/admin' })

// 无独立 import，rateLimitStore 直接在此定义
const rateLimitStore = new Map()

// 定期清理过期记录（每5分钟）
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore) {
    if (now > record.resetTime) rateLimitStore.delete(key)
  }
  if (rateLimitStore.size > 10000) {
    const entries = [...rateLimitStore.entries()]
      .sort((a, b) => a[1].resetTime - b[1].resetTime)
    for (const [key] of entries.slice(0, entries.length / 2)) {
      rateLimitStore.delete(key)
    }
  }
}, 300000).unref()

// ==================== 管理端 API 限流 ====================

/**
 * 通用的限流检查函数
 * @param {string} key 限流 key (scope:ip)
 * @param {number} max 窗口内最大请求数
 * @param {Object} reply Fastify reply
 * @returns {boolean} true=超限被拒绝, false=通过
 */
function rateLimitCheck(key, max, reply) {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 })
    return false // 通过
  }
  if (record.count >= max) {
    reply.code(429).send({
      code: 429,
      error: '请求过于频繁，请稍后再试',
      timestamp: new Date().toISOString()
    })
    return true // 拒绝
  }
  record.count++
  return false
}

fastify.addHook('onRequest', async (request, reply) => {
  const url = request.url
  const ip = request.ip

  if (url.startsWith('/api/store/')) {
    if (rateLimitCheck(`store:${ip}`, 100, reply)) return
  }
  if (url.startsWith('/api/admin/')) {
    if (rateLimitCheck(`super-admin:${ip}`, 50, reply)) return
  }
})

// 系统API路由（暂时注释，有导入问题）
// import systemRoutes from './routes/system.routes.js'
// fastify.register(systemRoutes, { prefix: '/api/system' })

// 认证API路由
import { registerAuthRoutes } from './routes/auth.routes.js'
fastify.register(registerAuthRoutes, { prefix: '/api/v1/auth' })

// ==================== 配置端点 ====================
// 提供路由配置供前端消费，确保前后端路由一致
import routes from './config/routes.js'

fastify.get('/api/config/routes', async (request, reply) => {
  return {
    success: true,
    data: {
      public: routes.public,
      tenant: routes.tenant,
      customer: routes.customer,
      admin: routes.admin,
    }
  };
});

// ==================== 安全响应头 ====================
// 零风险安全头：防止点击劫持、MIME嗅探
fastify.addHook('onSend', (request, reply, payload, done) => {
  reply.header('X-Frame-Options', 'DENY')
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-XSS-Protection', '0')  // 已退役，无害遗留
  done()
})

// ==================== 错误处理 ====================
// 全局错误处理（包含夜狼模块错误）

fastify.setErrorHandler((error, request, reply) => {
  // 记录错误
  request.log.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    module: error.module || 'core',
  })
  
  // 夜狼模块错误处理
  if (error.module === 'nightwolf' || error.code?.startsWith('NIGHTWOLF')) {
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'NIGHTWOLF_999',
        message: error.message,
        module: 'nightwolf',
        timestamp: new Date().toISOString(),
      },
      data: null,
    })
  }
  
  // 核心错误处理
  const statusCode = error.statusCode || 500
  const response = {
    success: false,
    error: {
      message: error.message,
      ...(config.server.env === 'development' && { stack: error.stack }),
    },
    data: null,
  }
  
  return reply.status(statusCode).send(response)
})

// ==================== 启动服务器 ====================
async function startServer() {
  try {
    // 1. 初始化夜狼模块（异步，不阻塞）
    if (process.env.NIGHTWOLF_ENABLED === 'true') {
      initializeNightWolfModule().catch(error => {
        console.error('夜狼模块初始化异常（非致命）:', error);
      });
    }

    // 2. 等待所有路由注册完成
    await fastify.ready()

    // 3. 路由规范检查（所有路由注册完成后执行）
    const { checkRouteConsistency } = await import('./utils/route-consistency-check.js')
    const { passed, violations } = checkRouteConsistency(fastify)
    if (!passed) {
      console.warn('\n⚠️ ⚠️ ⚠️  路由规范告警 ⚠️ ⚠️ ⚠️')
      console.warn('以下路由路径未在 config/routes.js 中定义，请尽快规范化：')
      for (const v of violations) {
        console.warn(`  ${v.method} ${v.path}`)
      }
      console.warn('⚠️ ⚠️ ⚠️  建议在 config/routes.js 中添加对应常量 ⚠️ ⚠️ ⚠️\n')
    }

    // 4. 启动服务器
    await fastify.listen({ 
      port: process.env.PORT || 33038,
      host: '0.0.0.0'
    })
    
    console.log(`🚀 服务器运行在 http://localhost:${process.env.PORT || 33038}`)
    console.log(`📊 健康检查: http://localhost:${process.env.PORT || 33038}/api/health`)
    
    if (process.env.NIGHTWOLF_ENABLED === 'true') {
      console.log(`🌙 夜狼模块API: http://localhost:${process.env.PORT || 33038}/api/nightwolf/v1/health`)
    }
    
    // 3. 初始化打印机默认品牌数据
    try {
      const { default: PrinterService } = await import('./services/printer/printer.service.js');
      const printerService = new PrinterService();
      await printerService.initDefaultBrands();
    } catch (error) {
      // 非致命，打印失败不影响启动
      console.warn('⚠️ 打印机品牌初始化（非致命）:', error.message);
    }

    // 4. 优雅关闭处理
    const signals = ['SIGINT', 'SIGTERM']
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n${signal} 收到，开始优雅关闭...`)
        
        // 关闭夜狼模块
        if (nightWolfModule && nightWolfInitialized) {
          try {
            await nightWolfModule.cleanup();
            console.log('✅ 夜狼模块资源已清理');
          } catch (error) {
            console.error('❌ 夜狼模块清理失败:', error);
          }
        }
        
        // 关闭服务器
        await fastify.close()
        console.log('👋 服务器已关闭')
        process.exit(0)
      })
    })
    
  } catch (err) {
    console.error('❌ 服务器启动失败:', err)
    
    // 清理夜狼模块
    if (nightWolfModule && nightWolfInitialized) {
      try {
        await nightWolfModule.cleanup();
      } catch (error) {
        console.error('夜狼模块清理失败:', error);
      }
    }
    
    process.exit(1)
  }
}

// 启动服务器
startServer()

// 导出用于测试
export { fastify }