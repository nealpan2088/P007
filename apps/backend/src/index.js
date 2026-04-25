// 麒麟项目 - 集成夜狼模块的服务器入口
// 版本: 0.2.5 + nightwolf-0.1.0

// ==================== 强制环境变量加载 ====================
// 确保.env文件在任何其他导入之前加载
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
console.log(`🌙 夜狼模块: 已内置（配置路由 + 执行引擎）`);
// ==================== 环境变量加载完成 ====================

import Fastify from 'fastify'
import cors from '@fastify/cors'
import config from './config/index.js'
import { setDevMode, formatErrorResponse } from './services/error.service.js'

// 创建全新的Fastify实例
const fastify = Fastify({
  logger: {
    level: config.server.logLevel,
  },
  bodyLimit: config.security.bodyLimit,
  // 性能优化
  requestTimeout: 30000,         // 30秒超时
  keepAliveTimeout: 5000,       // 5秒空闲keep-alive
  connectionTimeout: 30000,     // 30秒连接超时
  trustProxy: true,             // 信任Nginx反向代理
  // 请求体解析优化
  maxParamLength: 500,          // URL参数最大长度
})

// 注册 CORS
await fastify.register(cors, {
  origin: config.server.corsOrigin,
  credentials: config.server.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
})

// ==================== 夜狼业务流程引擎 ====================

async function initializeNightWolf() {
  try {
    // 动态导入（ESM 环境不支持 require）
    const { registerNightwolf } = await import('./modules/nightwolf/index.mjs');
    const result = await registerNightwolf(fastify);
    if (result.initialized) {
      console.log('🌙 夜狼业务流程引擎已启动');
    } else {
      console.warn('⚠️ 夜狼引擎启动失败，不影响核心功能:', result.error);
    }
  } catch (err) {
    console.warn('⚠️ 夜狼模块加载异常，不影响核心功能:', err.message);
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
  
  coreHealth.nightwolf = {
    enabled: true,
    version: '0.2.0'
  };
  
  return coreHealth;
})

// 公共API路由 - 使用.register.js文件
import routes, { PUBLIC_ROUTES, UPLOAD_ROUTES } from './config/routes.js'
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
import { authenticate } from './middleware/index.js'
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

// 系统API路由 — TODO [2026-04-24]: 等 system.routes.js 创建后启用
// import systemRoutes from './routes/system.routes.js'
// fastify.register(systemRoutes, { prefix: '/api/system' })

// 认证API路由
import { registerAuthRoutes } from './routes/auth.routes.js'
fastify.register(registerAuthRoutes, { prefix: '/api/v1/auth' })

// 店长端API路由（独立于管理后台）
import storeAdminRoutes from './routes/store-admin.routes.js'
fastify.register(storeAdminRoutes, { prefix: '/api/store-admin' })

// ==================== 图片上传 ====================
import multipart from '@fastify/multipart';
import crypto from 'crypto';

fastify.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
});

// 创建上传目录
const UPLOAD_BASE = path.join(__dirname, '../../uploads');
const FOOD_DIR = path.join(UPLOAD_BASE, 'food');
const LOGO_DIR = path.join(UPLOAD_BASE, 'logos');
for (const dir of [UPLOAD_BASE, FOOD_DIR, LOGO_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 支持的文件格式
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// 菜品图片上传接口
fastify.post(UPLOAD_ROUTES.FOOD_IMAGE, async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ success: false, error: '请选择要上传的图片' });
    }

    // 校验 MIME 类型
    if (!ALLOWED_TYPES.includes(data.mimetype)) {
      return reply.code(400).send({
        success: false,
        error: `不支持的图片格式: ${data.mimetype}。支持: JPG, PNG, GIF, WebP`,
      });
    }

    // 读取文件流
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 校验文件大小
    if (buffer.length > 2 * 1024 * 1024) {
      return reply.code(400).send({
        success: false,
        error: '图片大小不能超过 2MB',
      });
    }

    // 生成唯一文件名
    const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 8);
    const ext = path.extname(data.filename).toLowerCase() || '.jpg';
    const safeName = `${Date.now()}_${hash}${ext}`;
    const filePath = path.join(FOOD_DIR, safeName);

    // 写入文件
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/food/${safeName}`;
    return { success: true, data: { url, filename: safeName, size: buffer.length } };
  } catch (error) {
    request.log.error({ msg: '图片上传失败', error: error.message });
    return reply.code(500).send({ success: false, error: '图片上传失败: ' + error.message });
  }
});

// 店铺 Logo 上传接口（需认证）
fastify.post(UPLOAD_ROUTES.STORE_LOGO, { preHandler: [authenticate] }, async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ success: false, error: '请选择要上传的图片' });
    }

    // 校验 MIME 类型
    if (!ALLOWED_TYPES.includes(data.mimetype)) {
      return reply.code(400).send({
        success: false,
        error: `不支持的图片格式: ${data.mimetype}。支持: JPG, PNG, GIF, WebP`,
      });
    }

    // 读取文件流
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 校验文件大小（Logo 限制 1MB）
    if (buffer.length > 1 * 1024 * 1024) {
      return reply.code(400).send({
        success: false,
        error: 'Logo 图片大小不能超过 1MB',
      });
    }

    // 生成唯一文件名
    const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 8);
    const ext = path.extname(data.filename).toLowerCase() || '.png';
    const safeName = `logo_${Date.now()}_${hash}${ext}`;
    const filePath = path.join(LOGO_DIR, safeName);

    // 写入文件
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/logos/${safeName}`;
    return { success: true, data: { url, filename: safeName, size: buffer.length } };
  } catch (error) {
    request.log.error({ msg: 'Logo 上传失败', error: error.message });
    return reply.code(500).send({ success: false, error: 'Logo 上传失败: ' + error.message });
  }
});

// 静态文件服务
fastify.get(UPLOAD_ROUTES.STATIC, async (request, reply) => {
  const filePath = path.join(UPLOAD_BASE, request.url.replace('/uploads', ''));
  try {
    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({ success: false, error: '文件不存在' });
    }
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp',
    };
    reply.header('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    reply.header('Cache-Control', 'public, max-age=604800'); // 缓存7天
    return reply.send(content);
  } catch {
    return reply.code(404).send({ success: false, error: '文件不存在' });
  }
});

// 默认菜品占位图（内嵌 base64 SVG）
const DEFAULT_FOOD_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect fill="#f3f4f6" width="400" height="400"/>
  <g transform="translate(140, 140)">
    <circle cx="60" cy="60" r="60" fill="#d1d5db"/>
    <path d="M60 80C30 80 0 95 0 140h120c0-45-30-60-60-60z" fill="#9ca3af"/>
    <line x1="20" y1="100" x2="100" y2="100" stroke="#9ca3af" stroke-width="2" stroke-dasharray="4"/>
    <line x1="25" y1="110" x2="95" y2="110" stroke="#9ca3af" stroke-width="2" stroke-dasharray="4"/>
    <line x1="30" y1="120" x2="90" y2="120" stroke="#9ca3af" stroke-width="2" stroke-dasharray="4"/>
  </g>
  <text x="200" y="310" text-anchor="middle" fill="#9ca3af" font-size="14" font-family="sans-serif">暂无图片</text>
</svg>`);

// 获取默认占位图
fastify.get(UPLOAD_ROUTES.DEFAULT_FOOD_IMAGE, async () => {
  return {
    success: true,
    data: { url: DEFAULT_FOOD_PLACEHOLDER }
  };
});

// ==================== 配置端点 ====================
// 提供路由配置供前端消费，确保前后端路由一致

fastify.get('/api/config/routes', async (request, reply) => {
  // routes 已在文件开头导入 (routes 作为 default export)
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
// 全局统一错误处理
// 开发模式输出调试信息，生产模式隐藏细节

fastify.setErrorHandler((error, request, reply) => {
  // 记录错误日志（生产环境也会记录完整 stack 到日志，但不返回给客户端）
  request.log.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    code: error.code,
    module: error.module || 'core',
    userId: request.user?.id
  })

  // 夜狼模块错误处理（保留原有逻辑）
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

  // 统一格式响应（使用 formatErrorResponse 自动区分开发/生产模式）
  const body = formatErrorResponse(error)
  return reply.status(body.code).send(body)
})

// ==================== 启动服务器 ====================
async function startServer() {
  try {
    // 0. 设置错误服务开发模式（生产模式隐藏调试信息）
    setDevMode(config.server.isDevelopment)

    // 1. 初始化夜狼业务流程引擎
    await initializeNightWolf().catch(error => {
      console.error('夜狼引擎初始化异常（非致命）:', error);
    });

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

    // 3.5 前后端 API 路径一致性检查
    try {
      const { checkApiRouteSync } = await import('./utils/api-route-sync-check.mjs')
      checkApiRouteSync(fastify)
    } catch (e) {
      // 前端 api-routes.ts 可能不存在（纯后端部署场景），静默跳过
      if (!e.message?.includes('ENOENT') && !e.message?.includes('ERR_MODULE_NOT_FOUND')) {
        console.warn('  ⚠️  API 路径同步检查异常:', e.message)
      }
    }

    // 4. 启动服务器
    await fastify.listen({ 
      port: process.env.PORT || 33038,
      host: '0.0.0.0'
    })
    
    console.log(`🚀 服务器运行在 http://localhost:${process.env.PORT || 33038}`)
    console.log(`📊 健康检查: http://localhost:${process.env.PORT || 33038}/api/health`)
    
    console.log('🌙 夜狼引擎已就绪');
    
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
        
        // 夜狼引擎无需额外清理（日志）
        console.log('🌙 夜狼引擎关闭');
        
        // 关闭服务器
        await fastify.close()
        console.log('👋 服务器已关闭')
        process.exit(0)
      })
    })
    
  } catch (err) {
    console.error('❌ 服务器启动失败:', err)
    
    // 清理夜狼模块（安全引用，如果夜狼引擎已注册则尝试清理）
    try {
      // 检查夜狼路由是否已注册
      if (fastify.hasRoute?.({ method: 'GET', url: '/api/nightwolf/health' })) {
        const { registerNightwolf } = await import('./modules/nightwolf/index.mjs');
        if (typeof registerNightwolf.cleanup === 'function') {
          await registerNightwolf.cleanup();
        }
      }
    } catch (cleanupError) {
      // 清理失败不阻塞退出
    }

    process.exit(1)
  }
}

// 启动服务器
startServer()

// 导出用于测试
export { fastify }