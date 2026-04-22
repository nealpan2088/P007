// 租户管理路由

import tenantService from '../services/tenant.service.js';
import { authenticate, requestTimer, requestLogger, requireTenantAdmin } from '../middleware/index.js';
import { TENANT_ROUTES } from '../config/routes.js';
import systemMode from '../utils/system-mode.js';
import { publicDb } from '../db/index.js';

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
        requestTimer(),
        requestLogger(),
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
    { preHandler: [ requestTimer(), requestLogger(), authenticate ] },
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
    { preHandler: [ requestTimer(), requestLogger(), authenticate ] },
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
    { preHandler: [ requestTimer(), requestLogger(), authenticate ] },
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
    { preHandler: [ requestTimer(), requestLogger(), authenticate ] },
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
    { preHandler: [ requestTimer(), requestLogger(), authenticate ] },
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

  // 更新用户在租户中的角色（需要认证，且用户必须是OWNER）
  fastify.put(TENANT_ROUTES.TENANT.UPDATE_USER_ROLE, 
    { preHandler: [ requestTimer(), requestLogger(), authenticate ] },
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

  // 租户健康检查
  fastify.get(TENANT_ROUTES.TENANT.HEALTH, async (request, reply) => {
    return {
      status: 'ok',
      service: 'qilin-tenant',
      timestamp: new Date().toISOString(),
      version: '0.2.3',
    };
  });

  console.log('✅ 租户路由注册完成');
}