// 租户管理路由

import tenantService from '../services/tenant.service.js';
import storeService from '../services/store.service.js';
import orderService from '../services/order.service.js';
import tableService from '../services/table.service.js';
import { authenticate, requireTenantAdmin } from '../middleware/index.js';
import { TENANT_ROUTES } from '../config/routes.js';
import systemMode from '../utils/system-mode.js';
import { publicDb } from '../db/index.js';

/**
 * 将租户标识符（slug 或 id）解析为数据库中的真实租户 ID
 * @param {string} identifier - 租户 slug 或 id
 * @returns {Promise<string|null>} 租户ID，不存在返回 null
 */
async function resolveTenantId(identifier) {
  const byId = await publicDb.tenant.findUnique({ where: { id: identifier }, select: { id: true } });
  if (byId) return byId.id;
  const bySlug = await publicDb.tenant.findFirst({ where: { subdomain: identifier }, select: { id: true } });
  return bySlug ? bySlug.id : null;
}

/**
 * 注册租户路由
 * @param {Object} fastify Fastify实例
 */
export async function registerTenantRoutes(fastify) {
  // 租户注册（公开）
  fastify.post(TENANT_ROUTES.TENANT.REGISTER, async (request, reply) => {
    try {
      const { tenant, owner } = request.body;
      
      // 验证必要字段
      if (!tenant || !tenant.name || !tenant.subdomain) {
        return reply.status(400).send({
          success: false,
          message: '租户名称和子域名是必需的',
        });
      }

      if (!owner || !owner.email || !owner.password) {
        return reply.status(400).send({
          success: false,
          message: '所有者邮箱和密码是必需的',
        });
      }

      // 创建租户
      const result = await tenantService.createTenant(tenant, owner);

      return {
        success: true,
        message: '租户注册成功',
        data: {
          tenant: {
            id: result.tenant.id,
            name: result.tenant.name,
            subdomain: result.tenant.subdomain,
            plan: result.tenant.plan,
            status: result.tenant.status,
            trialEndsAt: result.tenant.trialEndsAt,
          },
          owner: {
            id: result.user.id,
            email: result.user.email,
            username: result.user.username,
            fullName: result.user.fullName,
            emailVerified: result.user.emailVerified,
          },
          userTenant: result.userTenant,
        },
      };
    } catch (error) {
      request.log.error({ msg: '租户操作错误', error: error.message, stack: error.stack, userId: request.user?.id });
      return reply.status(400).send({
        success: false,
        message: error.message || '租户注册失败',
      });
    }
  });

  // 检查子域名可用性（公开）
  fastify.post(TENANT_ROUTES.TENANT.CHECK_SUBDOMAIN, async (request, reply) => {
    try {
      const { subdomain } = request.body;
      
      if (!subdomain) {
        return reply.status(400).send({
          success: false,
          message: '子域名是必需的',
        });
      }

      console.log('租户路由 - 调用 checkSubdomainAvailability');
      console.log('tenantService 对象:', tenantService);
      console.log('tenantService.checkSubdomainAvailability 类型:', typeof tenantService?.checkSubdomainAvailability);
      
      const result = await tenantService.checkSubdomainAvailability(subdomain);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      request.log.error({ msg: '租户操作错误', error: error.message, stack: error.stack, userId: request.user?.id });
      return reply.status(400).send({
        success: false,
        message: error.message || '检查子域名失败',
      });
    }
  });

  // 获取当前用户的租户列表（需要认证）
  fastify.get(TENANT_ROUTES.TENANT.LIST, 
    { 
      preHandler: [
        authenticate
      ]
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const tenants = await tenantService.getUserTenants(userId);

        return {
          success: true,
          data: tenants,
        };
      } catch (error) {
        request.log.error({ msg: '获取租户列表错误', error: error.message, stack: error.stack, userId: request.user?.id });
        return reply.status(500).send({
          success: false,
          message: '获取租户列表失败',
        });
      }
    }
  );

  // 获取租户详情（需要认证，且用户必须属于该租户）
  fastify.get(TENANT_ROUTES.TENANT.DETAIL, 
    { preHandler: [ authenticate ] },
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const userId = request.user.id;

        // 验证用户是否属于该租户
        const userTenant = await publicDb.userTenant.findFirst({
          where: {
            tenantId,
            userId,
            
          },
        });

        if (!userTenant) {
          return reply.status(403).send({
            success: false,
            message: '无权访问该租户',
          });
        }

        const tenant = await tenantService.getTenant(tenantId);
        const stats = await tenantService.getTenantStats(tenantId);

        return {
          success: true,
          data: {
            ...tenant,
            stats,
            userRole: userTenant.role,
          },
        };
      } catch (error) {
        request.log.error({ msg: '租户操作错误', error: error.message, stack: error.stack, userId: request.user?.id });
        return reply.status(500).send({
          success: false,
          message: error.message || '获取租户详情失败',
        });
      }
    }
  );

  // 更新租户信息（需要认证，且用户必须是OWNER或ADMIN）
  fastify.put(TENANT_ROUTES.TENANT.UPDATE, 
    { preHandler: [ authenticate ] },
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const userId = request.user.id;
        const updateData = request.body;

        // 验证用户权限
        const userTenant = await publicDb.userTenant.findFirst({
          where: {
            tenantId,
            userId,
            
            
          },
        });

        if (!userTenant) {
          return reply.status(403).send({
            success: false,
            message: '无权更新租户信息',
          });
        }

        const updatedTenant = await tenantService.updateTenant(tenantId, updateData);

        return {
          success: true,
          message: '租户信息更新成功',
          data: updatedTenant,
        };
      } catch (error) {
        request.log.error({ msg: '租户操作错误', error: error.message, stack: error.stack, userId: request.user?.id });
        return reply.status(400).send({
          success: false,
          message: error.message || '更新租户信息失败',
        });
      }
    }
  );

  // 获取租户统计信息（需要认证，且用户必须属于该租户）
  fastify.get(TENANT_ROUTES.TENANT.STATS, 
    { preHandler: [ authenticate ] },
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const userId = request.user.id;

        // 验证用户是否属于该租户
        const userTenant = await publicDb.userTenant.findFirst({
          where: {
            tenantId,
            userId,
            
          },
        });

        if (!userTenant) {
          return reply.status(403).send({
            success: false,
            message: '无权访问该租户统计信息',
          });
        }

        const stats = await tenantService.getTenantStats(tenantId);

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        request.log.error({ msg: '租户操作错误', error: error.message, stack: error.stack, userId: request.user?.id });
        return reply.status(500).send({
          success: false,
          message: '获取租户统计失败',
        });
      }
    }
  );

  // 添加用户到租户（需要认证，且用户必须是OWNER或ADMIN）
  fastify.post(TENANT_ROUTES.TENANT.ADD_USER, 
    { preHandler: [ authenticate ] },
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const userId = request.user.id;
        const { targetUserId, role = 'STAFF' } = request.body;

        // 验证用户权限
        const userTenant = await publicDb.userTenant.findFirst({
          where: {
            tenantId,
            userId,
            
            
          },
        });

        if (!userTenant) {
          return reply.status(403).send({
            success: false,
            message: '无权添加用户',
          });
        }

        const result = await tenantService.addUserToTenant(tenantId, targetUserId, role);

        return {
          success: true,
          message: '用户添加成功',
          data: result,
        };
      } catch (error) {
        request.log.error({ msg: '租户操作错误', error: error.message, stack: error.stack, userId: request.user?.id });
        return reply.status(400).send({
          success: false,
          message: error.message || '添加用户失败',
        });
      }
    }
  );

  // 从租户移除用户（需要认证，且用户必须是OWNER或ADMIN）
  fastify.delete(TENANT_ROUTES.TENANT.REMOVE_USER, 
    { preHandler: [ authenticate ] },
    async (request, reply) => {
      try {
        const { tenantId, userId: targetUserId } = request.params;
        const userId = request.user.id;

        // 不能移除自己（如果是OWNER）
        if (targetUserId === userId) {
          const userTenant = await publicDb.userTenant.findFirst({
            where: {
              tenantId,
              userId,
              
              role: 'OWNER',
            },
          });

          if (userTenant) {
            return reply.status(400).send({
              success: false,
              message: 'OWNER不能移除自己',
            });
          }
        }

        // 验证用户权限
        const userTenant = await publicDb.userTenant.findFirst({
          where: {
            tenantId,
            userId,
            
            
          },
        });

        if (!userTenant) {
          return reply.status(403).send({
            success: false,
            message: '无权移除用户',
          });
        }

        await tenantService.removeUserFromTenant(tenantId, targetUserId);

        return {
          success: true,
          message: '用户移除成功',
        };
      } catch (error) {
        request.log.error({ msg: '租户操作错误', error: error.message, stack: error.stack, userId: request.user?.id });
        return reply.status(400).send({
          success: false,
          message: error.message || '移除用户失败',
        });
      }
    }
  );

  // 删除租户（需管理员权限）
  fastify.delete(TENANT_ROUTES.TENANT.DELETE, 
    { preHandler: [ authenticate ] },
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const userId = request.user.id;

        // 验证管理员权限
        const userTenant = await publicDb.userTenant.findFirst({
          where: { tenantId, userId, role: 'ADMIN' },
        });
        if (!userTenant) {
          return reply.status(403).send({
            success: false,
            message: '仅管理员可删除租户',
          });
        }

        await tenantService.deleteTenant(tenantId);

        return {
          success: true,
          message: '租户已删除',
        };
      } catch (error) {
        request.log.error({ msg: '删除租户错误', error: error.message, stack: error.stack, userId: request.user?.id });
        return reply.status(400).send({
          success: false,
          message: error.message || '删除租户失败',
        });
      }
    }
  );

  // 更新用户在租户中的角色（需要认证，且用户必须是OWNER）
  fastify.put(TENANT_ROUTES.TENANT.UPDATE_USER_ROLE, 
    { preHandler: [ authenticate ] },
    async (request, reply) => {
      try {
        const { tenantId, userId: targetUserId } = request.params;
        const userId = request.user.id;
        const { role } = request.body;

        // 验证用户权限（必须是OWNER）
        const userTenant = await publicDb.userTenant.findFirst({
          where: {
            tenantId,
            userId,
            
            role: 'OWNER',
          },
        });

        if (!userTenant) {
          return reply.status(403).send({
            success: false,
            message: '只有OWNER可以更新用户角色',
          });
        }

        await tenantService.updateUserRole(tenantId, targetUserId, role);

        return {
          success: true,
          message: '用户角色更新成功',
        };
      } catch (error) {
        request.log.error({ msg: '租户操作错误', error: error.message, stack: error.stack, userId: request.user?.id });
        return reply.status(400).send({
          success: false,
          message: error.message || '更新用户角色失败',
        });
      }
    }
  );

  // ──────────────────────────────────────────────
  // Dashboard 数据接口
  // ──────────────────────────────────────────────

  // 获取租户下所有店铺列表（Dashboard 使用）
  fastify.get(TENANT_ROUTES.TENANT.DASHBOARD.STORES, {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const { tenantId } = request.params;
      const userId = request.user.id;

      const resolvedTenantId = await resolveTenantId(tenantId);
      if (!resolvedTenantId) {
        return reply.status(404).send({ success: false, message: '租户不存在' });
      }

      const result = await storeService.getStoresByTenant(resolvedTenantId, userId, request.query);

      return {
        success: true,
        data: result.data || result,
        pagination: result.pagination
      };
    } catch (error) {
      request.log.error({ msg: '获取租户店铺列表失败', error: error.message, stack: error.stack, userId: request.user?.id });
      return reply.status(error.code === 'FORBIDDEN' ? 403 : 500).send({
        success: false,
        message: error.message || '获取店铺列表失败',
      });
    }
  });

  // 更新店铺状态
  fastify.put(TENANT_ROUTES.STORES.UPDATE_STATUS, {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const { tenantSlug } = request.query;
      const userId = request.user.id;
      const { status } = request.body;

      if (!tenantSlug) {
        return reply.status(400).send({ success: false, message: '缺少参数 tenantSlug' });
      }

      const resolvedTenantId = await resolveTenantId(tenantSlug);
      if (!resolvedTenantId) {
        return reply.status(404).send({ success: false, message: '租户不存在' });
      }

      const result = await storeService.updateStore(storeId, { status }, userId);

      return { success: true, data: result };
    } catch (error) {
      request.log.error({ msg: '更新店铺状态失败', error: error.message });
      return reply.status(error.code === 'FORBIDDEN' ? 403 : 500).send({
        success: false,
        message: error.message || '更新店铺状态失败',
      });
    }
  });

  // 获取租户下所有订单（Dashboard 使用）
  fastify.get(TENANT_ROUTES.TENANT.DASHBOARD.ORDERS, {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const { tenantId } = request.params;
      const userId = request.user.id;

      const resolvedTenantId = await resolveTenantId(tenantId);
      if (!resolvedTenantId) {
        return reply.status(404).send({ success: false, message: '租户不存在' });
      }

      const result = await orderService.getOrdersByTenant(resolvedTenantId, userId, request.query);

      return result;
    } catch (error) {
      request.log.error({ msg: '获取租户订单列表失败', error: error.message, stack: error.stack, userId: request.user?.id });
      return reply.status(error.code === 'FORBIDDEN' ? 403 : 500).send({
        success: false,
        message: error.message || '获取订单列表失败',
      });
    }
  });

  // 获取租户订单统计
  fastify.get(TENANT_ROUTES.TENANT.DASHBOARD.ORDERS_STATS, {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const { tenantId } = request.params;
      const userId = request.user.id;

      const resolvedTenantId = await resolveTenantId(tenantId);
      if (!resolvedTenantId) {
        return reply.status(404).send({ success: false, message: '租户不存在' });
      }

      const result = await orderService.getOrderStatsByTenant(resolvedTenantId, userId);

      return result;
    } catch (error) {
      request.log.error({ msg: '获取租户订单统计失败', error: error.message, stack: error.stack, userId: request.user?.id });
      return reply.status(error.code === 'FORBIDDEN' ? 403 : 500).send({
        success: false,
        message: error.message || '获取订单统计失败',
      });
    }
  });

  // 租户健康检查
  fastify.get(TENANT_ROUTES.TENANT.HEALTH, async (request, reply) => {
    return {
      status: 'ok',
      service: 'qilin-tenant',
      timestamp: new Date().toISOString(),
      version: '0.2.3',
    };
  });

  // ========= 餐桌管理 =========
  // 获取店铺下的所有餐桌
  fastify.get(TENANT_ROUTES.TABLES.LIST, { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const tables = await tableService.getTables(storeId);
      return { success: true, data: tables };
    } catch (error) {
      request.log.error({ msg: '获取餐桌列表失败', error: error.message, storeId: request.params.storeId });
      return reply.status(500).send({ success: false, message: '获取餐桌列表失败' });
    }
  });

  // 创建餐桌
  fastify.post(TENANT_ROUTES.TABLES.CREATE, { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const table = await tableService.createTable(storeId, request.body);
      return reply.status(201).send({ success: true, data: table });
    } catch (error) {
      if (error.code === 'P2002') {
        return reply.status(409).send({ success: false, message: '该桌号已存在' });
      }
      request.log.error({ msg: '创建餐桌失败', error: error.message });
      return reply.status(500).send({ success: false, message: '创建餐桌失败' });
    }
  });

  // 批量创建餐桌
  fastify.post(TENANT_ROUTES.TABLES.BATCH_CREATE, { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const { tables } = request.body;
      if (!Array.isArray(tables) || tables.length === 0) {
        return reply.status(400).send({ success: false, message: '请提供餐桌列表' });
      }
      const result = await tableService.batchCreateTables(storeId, tables);
      return reply.status(201).send({ success: true, data: result, count: result.length });
    } catch (error) {
      if (error.code === 'P2002') {
        return reply.status(409).send({ success: false, message: '部分桌号已存在' });
      }
      request.log.error({ msg: '批量创建餐桌失败', error: error.message });
      return reply.status(500).send({ success: false, message: '批量创建餐桌失败' });
    }
  });

  // 更新餐桌
  fastify.put(TENANT_ROUTES.TABLES.UPDATE, { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { tableId } = request.params;
      const table = await tableService.updateTable(tableId, request.body);
      return { success: true, data: table };
    } catch (error) {
      request.log.error({ msg: '更新餐桌失败', error: error.message });
      return reply.status(500).send({ success: false, message: '更新餐桌失败' });
    }
  });

  // 批量更新餐桌状态
  fastify.post(TENANT_ROUTES.TABLES.BATCH_STATUS, { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const { tableIds, status } = request.body;
      if (!Array.isArray(tableIds) || tableIds.length === 0) {
        return reply.status(400).send({ success: false, message: '请选择要更新的餐桌' });
      }
      const result = await tableService.batchUpdateStatus(storeId, tableIds, status);
      return { success: true, data: result, count: result.count };
    } catch (error) {
      request.log.error({ msg: '批量更新餐桌状态失败', error: error.message });
      return reply.status(500).send({ success: false, message: '批量更新状态失败' });
    }
  });

  // 删除餐桌
  fastify.delete(TENANT_ROUTES.TABLES.DELETE, { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { tableId } = request.params;
      await tableService.deleteTable(tableId);
      return { success: true, message: '餐桌已删除' };
    } catch (error) {
      request.log.error({ msg: '删除餐桌失败', error: error.message });
      return reply.status(500).send({ success: false, message: '删除餐桌失败' });
    }
  });

  // 获取餐桌的二维码链接
  fastify.get(TENANT_ROUTES.TABLES.QR_CODE, { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { storeId, tableId } = request.params;
      const table = await tableService.getTableById(tableId);
      if (!table) {
        return reply.status(404).send({ success: false, message: '餐桌不存在' });
      }
      // 获取店铺 slug
      const store = await storeService.getStoreById(storeId);
      const qrUrl = tableService.getQrCodeUrl(store.slug, tableId, table.tableNumber);
      return { success: true, data: { qrCodeUrl: qrUrl } };
    } catch (error) {
      request.log.error({ msg: '获取餐桌二维码失败', error: error.message });
      return reply.status(500).send({ success: false, message: '获取二维码失败' });
    }
  });

  console.log('✅ 租户路由注册完成');
}