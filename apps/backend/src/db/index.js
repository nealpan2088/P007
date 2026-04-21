// 麒麟项目 - 数据库管理系统
// 多租户架构：公共Schema + 租户独立Schema

import { PrismaClient } from '@prisma/client'
import config from '../config/index.js'

// 创建Prisma客户端实例
const createPrismaClient = (schema = 'p007_public') => {
  const databaseUrl = new URL(config.database.url)
  
  // 设置搜索路径（Schema）
  const searchPath = schema === 'p007_public' 
    ? 'p007_public' 
    : `"${schema}", p007_public`
  
  // 构建带Schema的连接字符串
  const urlWithSchema = `${databaseUrl.origin}${databaseUrl.pathname}?schema=${searchPath}&connection_limit=${config.database.maxConnections}`
  
  return new PrismaClient({
    datasources: {
      db: {
        url: urlWithSchema,
      },
    },
    log: config.server.isDevelopment 
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
  })
}

// 公共数据库客户端（访问公共Schema）
export const publicDb = createPrismaClient('p007_public')

// 租户数据库客户端工厂
export const createTenantDb = (tenantId) => {
  const schemaName = `tenant_${tenantId}`
  return createPrismaClient(schemaName)
}

// 数据库工具函数
export const dbUtils = {
  // 检查租户Schema是否存在
  async tenantSchemaExists(tenantId) {
    try {
      const schemaName = `tenant_${tenantId}`
      const result = await publicDb.$queryRaw`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      `
      return result.length > 0
    } catch (error) {
      console.error('检查租户Schema失败:', error)
      return false
    }
  },
  
  // 创建租户Schema
  async createTenantSchema(tenantId) {
    try {
      const schemaName = `tenant_${tenantId}`
      
      // 调用数据库函数创建Schema
      await publicDb.$executeRaw`SELECT create_tenant_schema(${tenantId})`
      
      console.log(`✅ 租户Schema创建成功: ${schemaName}`)
      return true
    } catch (error) {
      console.error(`❌ 创建租户Schema失败 (${tenantId}):`, error)
      return false
    }
  },
  
  // 删除租户Schema
  async deleteTenantSchema(tenantId) {
    try {
      const schemaName = `tenant_${tenantId}`
      
      // 删除Schema（级联删除所有表）
      await publicDb.$executeRaw`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`
      
      console.log(`✅ 租户Schema删除成功: ${schemaName}`)
      return true
    } catch (error) {
      console.error(`❌ 删除租户Schema失败 (${tenantId}):`, error)
      return false
    }
  },
  
  // 执行数据库迁移
  async migrate() {
    try {
      console.log('🔄 执行数据库迁移...')
      
      // 这里可以添加自定义迁移逻辑
      // 目前依赖Prisma的自动迁移
      
      console.log('✅ 数据库迁移完成')
      return true
    } catch (error) {
      console.error('❌ 数据库迁移失败:', error)
      return false
    }
  },
  
  // 健康检查
  async healthCheck() {
    try {
      // 测试公共数据库连接
      await publicDb.$queryRaw`SELECT 1`
      
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  },
  
  // 获取数据库统计信息
  async getStats() {
    try {
      const [userCount, tenantCount, sessionCount] = await Promise.all([
        publicDb.user.count(),
        publicDb.tenant.count(),
        publicDb.session.count(),
      ])
      
      return {
        users: userCount,
        tenants: tenantCount,
        sessions: sessionCount,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('获取数据库统计失败:', error)
      return null
    }
  },
}

// 数据库中间件
export const dbMiddleware = {
  // 租户上下文中间件
  tenantContext: async (request, reply, done) => {
    try {
      // 从请求头或子域名获取租户ID
      const tenantId = request.headers['x-tenant-id'] 
        || request.headers['tenant-id']
        || request.tenantId
        || 'default-tenant'
      
      // 创建租户特定的数据库客户端
      request.tenantDb = createTenantDb(tenantId)
      request.tenantId = tenantId
      
      done()
    } catch (error) {
      console.error('租户上下文中间件错误:', error)
      reply.code(500).send({
        error: 'Database Error',
        message: '无法建立租户数据库连接',
      })
    }
  },
  
  // 公共数据库中间件
  publicContext: async (request, reply, done) => {
    try {
      request.publicDb = publicDb
      done()
    } catch (error) {
      console.error('公共数据库中间件错误:', error)
      reply.code(500).send({
        error: 'Database Error',
        message: '无法建立公共数据库连接',
      })
    }
  },
}

// 导出
export default {
  publicDb,
  createTenantDb,
  dbUtils,
  dbMiddleware,
  
  // 初始化函数
  async initialize() {
    try {
      console.log('🔄 初始化数据库系统...')
      
      // 测试数据库连接
      const health = await dbUtils.healthCheck()
      if (health.status !== 'healthy') {
        throw new Error(`数据库连接失败: ${health.error}`)
      }
      
      console.log('✅ 数据库连接成功')
      
      // 获取数据库统计
      const stats = await dbUtils.getStats()
      if (stats) {
        console.log('📊 数据库统计:')
        console.log(`   用户数: ${stats.users}`)
        console.log(`   租户数: ${stats.tenants}`)
        console.log(`   会话数: ${stats.sessions}`)
      }
      
      return {
        success: true,
        health,
        stats,
      }
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
}