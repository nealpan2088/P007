// 管理API路由注册
// 店铺管理、租户管理等需要认证的API

import adminRoutes from './admin.routes.js';

/**
 * 注册管理API路由
 * @param {FastifyInstance} fastify - Fastify实例
 *
 * 注意：
 * - index.js 外层已注册 prefix: '/api/admin'
 * - 路由常量 ADMIN_ROUTES.STORES.* 定义为相对路径
 * - 内层不要再加 prefix
 */
export function registerAdminRoutes(fastify) {
  // 注册管理API路由，内层不再加前缀（外层 index.js 已加 /api/admin）
  fastify.register(adminRoutes);
  
  console.log('✅ 管理API路由已注册');
}

export default registerAdminRoutes;
