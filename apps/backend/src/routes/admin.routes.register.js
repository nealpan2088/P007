// 管理API路由注册
// 店铺管理、租户管理等需要认证的API

import adminRoutes from './admin.routes.js';

/**
 * 注册管理API路由
 * @param {FastifyInstance} fastify - Fastify实例
 */
export function registerAdminRoutes(fastify) {
  // 注册管理API路由，前缀为 /api/v1/admin
  fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
  
  console.log('✅ 管理API路由已注册');
}

export default registerAdminRoutes;
