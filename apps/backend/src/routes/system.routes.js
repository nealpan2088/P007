// 麒麟项目 - 系统模式API路由（简化版）
// 系统始终为多租户模式，移除模式切换功能

import storeService from '../services/store.service.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { SYSTEM_ROUTES } from '../config/routes.js';

/**
 * 注册系统路由（简化版）
 * @param {Object} fastify Fastify实例
 */
export async function registerSystemRoutes(fastify) {
  // 获取系统信息（公开）
  fastify.get(SYSTEM_ROUTES.SYSTEM.INFO, async (request, reply) => {
    try {
      const systemInfo = storeService.getSystemInfo();
      
      reply.send({
        success: true,
        data: {
          ...systemInfo,
          mode: 'multi',
          description: '多租户SaaS扫码点餐系统'
        },
        message: '系统信息获取成功',
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        message: `获取系统信息失败: ${error.message}`,
      });
    }
  });

  // 系统健康检查（公开）
  fastify.get(SYSTEM_ROUTES.SYSTEM.HEALTH, async (request, reply) => {
    try {
      const systemInfo = storeService.getSystemInfo();
      
      reply.send({
        status: 'ok',
        service: 'qilin-system',
        version: process.env.npm_package_version || '0.2.4',
        mode: 'multi',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        systemInfo: {
          ...systemInfo,
          mode: 'multi'
        }
      });
    } catch (error) {
      reply.status(500).send({
        status: 'error',
        service: 'qilin-system',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 系统模式信息（管理员，只读）
  fastify.get(SYSTEM_ROUTES.SYSTEM.MODE, {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    try {
      reply.send({
        success: true,
        message: '系统模式信息',
        data: {
          mode: 'multi',
          description: '系统始终为多租户SaaS模式',
          features: {
            multiTenant: true,
            scanningOrdering: true,
            cloudPrinting: true,
            analytics: true,
            mobileReady: true
          },
          note: '模式切换功能已移除，系统专注于多租户架构'
        },
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        message: error.message,
      });
    }
  });

  // 系统配置（管理员，只读）
  fastify.get(SYSTEM_ROUTES.SYSTEM.CONFIG, {
    preHandler: [authenticate, requireAdmin],
  }, async (request, reply) => {
    try {
      reply.send({
        success: true,
        message: '系统配置信息',
        data: {
          environment: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 33038,
          database: {
            provider: 'postgresql',
            multiTenant: true
          },
          features: {
            authentication: true,
            multiTenant: true,
            cloudPrinting: true,
            realtimeUpdates: true
          }
        },
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        message: error.message,
      });
    }
  });
}