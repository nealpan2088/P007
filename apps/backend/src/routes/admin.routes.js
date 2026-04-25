// 管理API路由（需要认证）
// 店铺管理、租户管理等

import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/index.js';
import { ADMIN_ROUTES } from '../config/routes.js';

const prisma = new PrismaClient();

/**
 * 管理API路由注册
 * @param {FastifyInstance} fastify - Fastify实例
 */
async function adminRoutes(fastify) {
  // 添加认证中间件到所有管理API
  fastify.addHook('preHandler', authenticate);
  
  // 响应完成后记录处理时间
  fastify.addHook('onResponse', (request, reply, done) => {
    if (request.requestTimer?.startTime) {
      const elapsed = Date.now() - request.requestTimer.startTime;
      const statusCode = reply.statusCode;
      
      // 根据处理时间记录不同级别的日志
      if (elapsed > 1000) {
        request.log.warn({
          msg: '请求处理时间过长',
          method: request.method,
          url: request.url,
          elapsedMs: elapsed,
          statusCode
        });
      } else if (elapsed > 500) {
        request.log.info({
          msg: '请求处理时间中等',
          method: request.method,
          url: request.url,
          elapsedMs: elapsed,
          statusCode
        });
      }
    }
    done();
  });
  
  // 记录请求开始日志
  fastify.addHook('onRequest', (request, reply, done) => {
    request.requestTimer = { startTime: Date.now() };
    request.log.info({
      msg: '请求开始',
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      contentType: request.headers['content-type']
    });
    done();
  });
  
  // 获取店铺列表（需要认证）
  fastify.get(ADMIN_ROUTES.STORES.LIST, {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          pageSize: { type: 'integer', default: 10 },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { page = 1, pageSize = 10, status } = request.query;
      const skip = (page - 1) * pageSize;
      
      // 构建查询条件
      const where = {};
      if (status) {
        where.status = status;
      }
      
      // 获取店铺列表
      const stores = await prisma.store.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: {
              name: true,
              subdomain: true
            }
          }
        }
      });
      
      // 获取总数
      const total = await prisma.store.count({ where });
      
      return {
        success: true,
        data: {
          stores: stores.map(store => ({
            id: store.id,
            name: store.name,
            slug: store.slug,
            description: store.description,
            status: store.status,
            type: store.type,
            address: store.address,
            contactPhone: store.contactPhone,
            contactEmail: store.contactEmail,
            tenant: store.tenant,
            createdAt: store.createdAt,
            updatedAt: store.updatedAt
          })),
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      };
    } catch (error) {
      request.log.error({
        msg: '获取店铺列表失败',
        error: error.message,
        stack: error.stack,
        query: request.query
      });
      
      return reply.code(500).send({
        success: false,
        error: '获取店铺列表失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  // 获取店铺统计信息
  fastify.get(ADMIN_ROUTES.STORES.STATS, async (request, reply) => {
    try {
      // 获取各种状态的店铺数量
      const stats = await prisma.store.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });
      
      // 转换为更友好的格式
      const statusStats = {};
      stats.forEach(stat => {
        statusStats[stat.status] = stat._count.id;
      });
      
      // 获取总店铺数
      const total = await prisma.store.count();
      
      return {
        success: true,
        data: {
          total,
          active: statusStats.ACTIVE || 0,
          inactive: statusStats.INACTIVE || 0,
          maintenance: statusStats.MAINTENANCE || 0,
          deleted: statusStats.DELETED || 0
        }
      };
    } catch (error) {
      request.log.error({ msg: '获取店铺统计失败', error: error.message, stack: error.stack });
      return reply.code(500).send({
        success: false,
        error: '获取店铺统计失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
}

export default adminRoutes;
