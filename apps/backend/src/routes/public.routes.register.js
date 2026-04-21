// 公开API路由注册
// 扫码点餐相关API，无需认证

import publicRoutes from './public.routes.js';

/**
 * 注册公开API路由
 * @param {FastifyInstance} fastify - Fastify实例
 */
export function registerPublicRoutes(fastify) {
  // 注册公开API路由
  fastify.register(publicRoutes, { prefix: '/api/public' });
  
  console.log('✅ 公开API路由已注册');
}

export default registerPublicRoutes;