// 店铺路由注册
// 店铺管理相关的API路由

import storeRoutes from './store.routes.js';

/**
 * 注册店铺路由
 * @param {FastifyInstance} fastify - Fastify实例
 */
export async function registerStoreRoutes(fastify) {
  // 注册店铺路由，前缀为 /api/v1
  fastify.register(storeRoutes, { prefix: '/api/v1' });
  
  console.log('✅ 店铺路由已注册');
}

export default registerStoreRoutes;