// 管理API路由（需要认证）
// 店铺管理、租户管理等

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 管理API路由注册
 * @param {FastifyInstance} fastify - Fastify实例
 */
async function adminRoutes(fastify) {
  // 获取店铺列表（需要认证）
  fastify.get('/stores', {
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
      console.error('获取店铺列表失败:', error);
      return reply.code(500).send({
        success: false,
        error: '获取店铺列表失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  // 获取店铺统计信息
  fastify.get('/stores/stats', async (request, reply) => {
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
      console.error('获取店铺统计失败:', error);
      return reply.code(500).send({
        success: false,
        error: '获取店铺统计失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  // 健康检查
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      service: 'qilin-admin-api',
      timestamp: new Date().toISOString()
    };
  });
}

export default adminRoutes;
