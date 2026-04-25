// 店铺路由注册
// 店铺管理相关的API路由

import storeRoutes from './store.routes.js';
import menuRoutes from './menu.routes.js';

/**
 * 注册店铺路由
 * @param {FastifyInstance} fastify - Fastify实例
 *
 * 注意：
 * - index.js 外层已注册 prefix: '/api/store'
 * - 路由常量 STORES.* 定义为相对路径（如 /stores, /stores/:storeId）
 * - 最终路径：/api/store/stores, /api/store/stores/:storeId
 * - 内层不要再加 prefix，否则会导致嵌套路径 bug
 */
export async function registerStoreRoutes(fastify) {
  // 注册店铺路由，内层不再加前缀（外层 index.js 已加 /api/store）
  fastify.register(storeRoutes);
  // 注册菜单管理路由
  fastify.register(menuRoutes);
  
  console.log('✅ 店铺路由已注册');
}

export default registerStoreRoutes;