// 管理API路由注册
// 店铺管理、租户管理等需要认证的API

import adminRoutes from './admin.routes.js';
import menuTemplateRoutes from './menu-template.routes.js';
import PrinterService from '../services/printer/printer.service.js';
import { authenticate, requireStoreAccess } from '../middleware/index.js';

const printerService = new PrinterService();

// 打印机管理允许的角色

/**
 * 注册管理API路由
 * @param {FastifyInstance} fastify - Fastify实例
 *
 * 注意：
 * - index.js 外层已注册 prefix: '/api/admin'
 * - 内层不要再加 prefix
 */
export function registerAdminRoutes(fastify) {
  // ====== 公开接口（无需认证）======

  // 获取店铺列表（供选择使用）
  fastify.get('/stores/select', async (request, reply) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const { search, limit = 20 } = request.query as { search?: string; limit?: string };
      const where: any = { deletedAt: null };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }
      const stores = await prisma.store.findMany({
        select: { id: true, name: true, slug: true },
        where,
        orderBy: { name: 'asc' },
        take: Math.min(parseInt(limit as string) || 20, 100),
      });
      return { success: true, data: stores };
    } finally {
      await prisma.$disconnect();
    }
  });

  // 获取店铺列表（管理后台用，含租户信息，支持分页与搜索）
  fastify.get('/stores/list', async (request, reply) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const { page = '1', limit = '20', search = '' } = request.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where = { deletedAt: null };
      if (search.trim()) {
        const q = search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { tenant: { name: { contains: q, mode: 'insensitive' } } },
          { tenant: { subdomain: { contains: q, mode: 'insensitive' } } },
        ];
      }

      const [stores, total] = await Promise.all([
        prisma.store.findMany({
          select: {
            id: true, name: true, slug: true, status: true, createdAt: true,
            tenant: { select: { id: true, name: true, subdomain: true } }
          },
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.store.count({ where }),
      ]);

      return { success: true, data: stores, total, page: pageNum, limit: limitNum };
    } finally {
      await prisma.$disconnect();
    }
  });

  // ====== 素材库API ======
  fastify.register(menuTemplateRoutes);

  // ====== 打印机API（需要SUPER_ADMIN或TENANT_ADMIN角色）======
  // 注册打印机路由
  fastify.register(async function printerRoutes(fastify) {
    // 所有打印机路由都需要认证
    fastify.addHook('preHandler', authenticate);

    // 获取打印机品牌列表
    fastify.get('/printers/brands', async (request, reply) => {
      try {
        const brands = await printerService.getBrands();
        return { success: true, data: brands };
      } catch (error) {
        return reply.code(500).send({ success: false, error: '获取品牌列表失败' });
      }
    });

    // 获取店铺打印机列表
    fastify.get('/printers', async (request, reply) => {
      try {
        const { storeId } = request.query;
        if (!storeId) {
          return reply.code(400).send({ success: false, error: '缺少 storeId' });
        }
        const printers = await printerService.getStorePrinters(storeId, request.user.id);
        return { success: true, data: printers };
      } catch (error) {
        return reply.code(500).send({ success: false, error: '获取打印机列表失败' });
      }
    });

    // 添加打印机
    fastify.post('/printers', async (request, reply) => {
      try {
        const printer = await printerService.addPrinter(request.body, request.user.id);
        return reply.code(201).send({ success: true, data: printer });
      } catch (error) {
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || '添加打印机失败',
        });
      }
    });

    // 更新打印机
    fastify.put('/printers/:id', async (request, reply) => {
      try {
        const printer = await printerService.updatePrinter(request.params.id, request.body, request.user.id);
        return { success: true, data: printer };
      } catch (error) {
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || '更新打印机失败',
        });
      }
    });

    // 删除打印机
    fastify.delete('/printers/:id', async (request, reply) => {
      try {
        await printerService.deletePrinter(request.params.id, request.user.id);
        return { success: true, message: '打印机已删除' };
      } catch (error) {
        return reply.code(500).send({ success: false, error: '删除打印机失败' });
      }
    });

    // 测试打印机
    fastify.post('/printers/:id/test', async (request, reply) => {
      try {
        const result = await printerService.testPrinter(request.params.id, request.user.id);
        return { success: true, data: result };
      } catch (error) {
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || '测试打印机失败',
        });
      }
    });

    // 清空打印机待打印队列
    fastify.post('/printers/:id/clear-queue', async (request, reply) => {
      try {
        const result = await printerService.clearPrintQueue(request.params.id, request.user.id);
        return { success: true, data: result };
      } catch (error) {
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || '清空队列失败',
        });
      }
    });

    // 获取打印机信息（含在线状态）
    fastify.get('/printers/:id/info', async (request, reply) => {
      try {
        const result = await printerService.getPrinterInfo(request.params.id, request.user.id);
        return { success: true, data: result };
      } catch (error) {
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || '获取打印机信息失败',
        });
      }
    });
  });

  // ====== 需认证接口（内部其他管理路由）======
  fastify.register(adminRoutes);

  console.log('✅ 管理API路由已注册');
}

export default registerAdminRoutes;
