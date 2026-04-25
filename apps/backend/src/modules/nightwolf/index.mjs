// 夜狼 - 业务流程引擎模块入口
// 版本: 0.2.0
// ESM 入口，兼容 Fastify ESM 环境

import configRoutes from './routes/config.routes.mjs';
import { triggerFlow } from './engine/executor.cjs';

let initialized = false;

/**
 * 注册夜狼路由到 Fastify 实例
 */
export async function registerNightwolf(fastify) {
  if (initialized) return { initialized: true, message: 'already_initialized' };

  try {
    // 注册配置管理路由 + 健康检查
    await configRoutes(fastify);
    console.log('🌙 夜狼路由已注册');

    // 暴露触发接口（供其他模块调用）
    fastify.decorate('nightwolf', { triggerFlow });

    initialized = true;
    console.log('🌙 夜狼业务流程引擎就绪');
    return { initialized: true };

  } catch (err) {
    console.error('🌙 夜狼模块注册失败:', err.message);
    return { initialized: false, error: err.message };
  }
}
