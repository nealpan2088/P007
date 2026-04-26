// 管理API路由注册
// 店铺管理、租户管理等需要认证的API

import adminRoutes from './admin.routes.js';
import menuTemplateRoutes from './menu-template.routes.js';
import PrinterService from '../services/printer/printer.service.js';
import { authenticate, requireStoreAccess } from '../middleware/index.js';
import { ADMIN_ROUTES } from '../config/routes.js';

const STORES = ADMIN_ROUTES.STORES;
const DASHBOARD = ADMIN_ROUTES.DASHBOARD;
const PRINTERS = ADMIN_ROUTES.PRINTERS;
const USERS = ADMIN_ROUTES.USERS;

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
  // ====== Dashboard 概览统计（需认证）======

  // 管理后台首页统计：租户总数、店铺统计、用户总数
  fastify.get(DASHBOARD.STATS, {
    preHandler: [authenticate]
  }, async (request, reply) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const [totalTenants, totalStores, activeStores, totalUsers, recentStores] = await Promise.all([
        prisma.tenant.count({ where: { deletedAt: null } }),
        prisma.store.count({ where: { deletedAt: null } }),
        prisma.store.count({ where: { status: 'ACTIVE', deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.store.findMany({
          select: { id: true, name: true, slug: true, status: true, createdAt: true,
            tenant: { select: { id: true, name: true, subdomain: true } }
          },
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      return {
        success: true,
        data: {
          tenants: { total: totalTenants },
          stores: { total: totalStores, active: activeStores },
          users: { total: totalUsers },
          recentStores,
        }
      };
    } catch (error) {
      request.log.error({ msg: '获取概览统计失败', error: error.message });
      return reply.code(500).send({ success: false, error: '获取概览统计失败' });
    } finally {
      await prisma.$disconnect();
    }
  });

  // ====== 公开接口（无需认证）======

  // 获取店铺列表（供选择使用）
  fastify.get(STORES.SELECT, async (request, reply) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const { search, limit = '20' } = request.query;
      const where = { deletedAt: null };
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
        take: Math.min(parseInt(limit) || 20, 100),
      });
      return { success: true, data: stores };
    } finally {
      await prisma.$disconnect();
    }
  });

  // 获取店铺列表（管理后台用，含租户信息，支持分页与搜索）
  fastify.get(STORES.LIST_WITH_TENANT, async (request, reply) => {
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

  // 更新店铺（装修设置：主题色、Logo等）
  fastify.put(STORES.UPDATE, async (request, reply) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const { storeId } = request.params;
      const { themeColor, logoUrl, themeTemplate, name, description, address, contactPhone, status } = request.body;
      const updateData = {};
      if (themeColor !== undefined) updateData.themeColor = themeColor;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (themeTemplate !== undefined) updateData.themeTemplate = themeTemplate;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (address !== undefined) updateData.address = address;
      if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
      if (status !== undefined) updateData.status = status;

      const store = await prisma.store.update({
        where: { id: storeId },
        data: updateData,
      });
      return { success: true, data: store };
    } catch (error) {
      return reply.code(500).send({ success: false, error: '更新店铺失败: ' + error.message });
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
    fastify.get(PRINTERS.BRANDS, async (request, reply) => {
      try {
        const brands = await printerService.getBrands();
        return { success: true, data: brands };
      } catch (error) {
        return reply.code(500).send({ success: false, error: '获取品牌列表失败' });
      }
    });

    // 获取店铺打印机列表
    fastify.get(PRINTERS.LIST, async (request, reply) => {
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
    fastify.post(PRINTERS.CREATE, async (request, reply) => {
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
    fastify.put(PRINTERS.UPDATE, async (request, reply) => {
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
    fastify.delete(PRINTERS.DELETE, async (request, reply) => {
      try {
        await printerService.deletePrinter(request.params.id, request.user.id);
        return { success: true, message: '打印机已删除' };
      } catch (error) {
        return reply.code(500).send({ success: false, error: '删除打印机失败' });
      }
    });

    // 测试打印机
    fastify.post(PRINTERS.TEST, async (request, reply) => {
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
    fastify.post(PRINTERS.CLEAR_QUEUE, async (request, reply) => {
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
    fastify.get(PRINTERS.INFO, async (request, reply) => {
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

  // ====== 用户管理（超管/租管后台）======
  fastify.register(async function userManagementRoutes(fastify) {
    fastify.addHook('preHandler', authenticate);

    // 用户列表
    fastify.get(USERS.LIST, async (request, reply) => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        try {
          const { page = '1', limit = '20', search = '' } = request.query;
          const pageNum = Math.max(1, parseInt(page, 10) || 1);
          const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
          const skip = (pageNum - 1) * limitNum;

          const where = {};
          if (search.trim()) {
            const q = search.trim();
            where.OR = [
              { email: { contains: q, mode: 'insensitive' } },
              { username: { contains: q, mode: 'insensitive' } },
              { fullName: { contains: q, mode: 'insensitive' } },
            ];
          }

          const [users, total] = await Promise.all([
            prisma.user.findMany({
              select: {
                id: true, email: true, username: true, fullName: true,
                role: true, status: true, lastLoginAt: true, createdAt: true,
                storeAssignments: {
                  select: { id: true, storeId: true, role: true, status: true,
                    store: { select: { id: true, name: true, slug: true } }
                  }
                }
              },
              where,
              orderBy: { createdAt: 'desc' },
              skip,
              take: limitNum,
            }),
            prisma.user.count({ where }),
          ]);

          return { success: true, data: users, total, page: pageNum, limit: limitNum };
        } finally {
          await prisma.$disconnect();
        }
      } catch (error) {
        return reply.code(500).send({ success: false, error: '获取用户列表失败: ' + error.message });
      }
    });

    // 设为店长
    fastify.post(USERS.SET_STORE_ADMIN, async (request, reply) => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        try {
          const { userId } = request.params;
          const { storeId } = request.body || {};
          if (!storeId) {
            return reply.code(400).send({ success: false, error: '请选择店铺' });
          }

          // 检查是否已有相同关联
          const existing = await prisma.userStore.findFirst({
            where: { userId, storeId },
          });
          if (existing) {
            // 如果存在但状态不是 ACTIVE，更新为 ACTIVE
            if (existing.status !== 'ACTIVE') {
              await prisma.userStore.update({
                where: { id: existing.id },
                data: { status: 'ACTIVE' },
              });
              return { success: true, message: '店长授权已恢复' };
            }
            return { success: true, message: '该用户已是此店长' };
          }

          await prisma.userStore.create({
            data: { userId, storeId, role: 'STORE_ADMIN', status: 'ACTIVE' },
          });
          return { success: true, message: '店长授权成功' };
        } finally {
          await prisma.$disconnect();
        }
      } catch (error) {
        return reply.code(500).send({ success: false, error: '授权失败: ' + error.message });
      }
    });

    // 移除店长
    fastify.post(USERS.REMOVE_STORE_ADMIN, async (request, reply) => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        try {
          const { userId } = request.params;
          const { storeId } = request.body || {};
          if (!storeId) {
            return reply.code(400).send({ success: false, error: '请指定店铺' });
          }

          await prisma.userStore.updateMany({
            where: { userId, storeId, role: 'STORE_ADMIN' },
            data: { status: 'INACTIVE' },
          });
          return { success: true, message: '店长授权已移除' };
        } finally {
          await prisma.$disconnect();
        }
      } catch (error) {
        return reply.code(500).send({ success: false, error: '移除授权失败: ' + error.message });
      }
    });
  });

  console.log('✅ 管理API路由已注册');
}

export default registerAdminRoutes;
