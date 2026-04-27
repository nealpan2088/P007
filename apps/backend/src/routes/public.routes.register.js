// 公开API路由注册
// 扫码点餐相关API，无需认证

import publicRoutes from './public.routes.js';
import chatPublicRoutes from './chat.public.routes.js';

/**
 * 注册公开API路由
 * @param {FastifyInstance} fastify - Fastify实例
 */
export function registerPublicRoutes(fastify) {
  // 注册公开API路由 - 注意：index.js已经加了前缀，这里不要重复加
  fastify.register(publicRoutes);
  // 注册在线客服聊天公开路由
  fastify.register(chatPublicRoutes);
  
  console.log('✅ 公开API路由已注册');
  
  // 调试：打印注册的路由
  fastify.ready(() => {
    console.log('📋 注册的公开API路由:');
    fastify.printRoutes().split('\n').forEach(line => {
      if (line.includes('/api/public')) {
        console.log('  ' + line.trim());
      }
    });
  });
}

export default registerPublicRoutes;