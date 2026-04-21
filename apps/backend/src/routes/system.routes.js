// 麒麟项目 - 系统模式API路由
// 提供系统模式相关的API端点

import storeService from '../services/store.service.js';

/**
 * 系统模式API处理器
 */
const systemHandlers = {
  /**
   * 获取系统信息
   */
  async getSystemInfo(request, reply) {
    try {
      const systemInfo = storeService.getSystemInfo();
      
      reply.send({
        success: true,
        data: systemInfo,
        message: '系统信息获取成功',
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        message: `获取系统信息失败: ${error.message}`,
      });
    }
  },
  
  /**
   * 获取店铺列表
   */
  async getStores(request, reply) {
    try {
      // 从请求中获取租户ID（多租户模式）
      const tenantId = request.headers['x-tenant-id'] || request.query.tenantId;
      
      const stores = await storeService.getStores(tenantId);
      
      reply.send({
        success: true,
        data: stores,
        message: '店铺列表获取成功',
        count: stores.length,
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        message: `获取店铺列表失败: ${error.message}`,
      });
    }
  },
  
  /**
   * 获取店铺详情
   */
  async getStoreDetail(request, reply) {
    try {
      const { storeId } = request.params;
      const tenantId = request.headers['x-tenant-id'] || request.query.tenantId;
      
      const store = await storeService.getStoreById(storeId, tenantId);
      
      reply.send({
        success: true,
        data: store,
        message: '店铺详情获取成功',
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        message: `获取店铺详情失败: ${error.message}`,
      });
    }
  },
  
  /**
   * 创建店铺（仅多租户模式）
   */
  async createStore(request, reply) {
    try {
      const storeData = request.body;
      const tenantId = request.headers['x-tenant-id'] || request.query.tenantId;
      
      const store = await storeService.createStore(storeData, tenantId);
      
      reply.status(201).send({
        success: true,
        data: store,
        message: '店铺创建成功',
      });
    } catch (error) {
      const statusCode = error.message.includes('不支持') ? 403 : 400;
      reply.status(statusCode).send({
        success: false,
        message: `创建店铺失败: ${error.message}`,
      });
    }
  },
  
  /**
   * 更新店铺
   */
  async updateStore(request, reply) {
    try {
      const { storeId } = request.params;
      const updateData = request.body;
      const tenantId = request.headers['x-tenant-id'] || request.query.tenantId;
      
      const store = await storeService.updateStore(storeId, updateData, tenantId);
      
      reply.send({
        success: true,
        data: store,
        message: '店铺更新成功',
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        message: `更新店铺失败: ${error.message}`,
      });
    }
  },
  
  /**
   * 切换系统模式（开发环境专用）
   */
  async switchMode(request, reply) {
    try {
      // 仅允许在开发环境切换模式
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('仅允许在开发环境切换系统模式');
      }
      
      const { mode, storeId, storeName, subdomain } = request.body;
      
      if (!['single', 'multi'].includes(mode)) {
        throw new Error('系统模式必须是 single 或 multi');
      }
      
      // 更新环境变量（仅当前进程有效）
      process.env.SYSTEM_MODE = mode;
      
      if (mode === 'single') {
        if (storeId) process.env.DEFAULT_STORE_ID = storeId;
        if (storeName) process.env.DEFAULT_STORE_NAME = storeName;
        if (subdomain) process.env.DEFAULT_STORE_SUBDOMAIN = subdomain;
      }
      
      // 重新加载配置
      // 注意：在实际应用中，可能需要重启服务或重新初始化模块
      
      reply.send({
        success: true,
        message: `系统模式已切换为 ${mode === 'single' ? '单店版' : '多店版/SaaS'}`,
        data: {
          mode,
          storeId: mode === 'single' ? process.env.DEFAULT_STORE_ID : undefined,
          storeName: mode === 'single' ? process.env.DEFAULT_STORE_NAME : undefined,
          subdomain: mode === 'single' ? process.env.DEFAULT_STORE_SUBDOMAIN : undefined,
        },
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        message: `切换系统模式失败: ${error.message}`,
      });
    }
  },
  
  /**
   * 健康检查（包含模式信息）
   */
  async healthCheck(request, reply) {
    const systemInfo = storeService.getSystemInfo();
    
    reply.send({
      status: 'ok',
      service: 'qilin-system',
      timestamp: new Date().toISOString(),
      system: {
        mode: systemInfo.mode,
        description: systemInfo.description,
        uptime: process.uptime(),
      },
      features: systemInfo.features,
    });
  },
};

/**
 * 注册系统路由
 */
export const registerSystemRoutes = (fastify) => {
  // 系统信息
  fastify.get('/api/v1/system/info', systemHandlers.getSystemInfo);
  
  // 店铺管理
  fastify.get('/api/v1/system/stores', systemHandlers.getStores);
  fastify.get('/api/v1/system/stores/:storeId', systemHandlers.getStoreDetail);
  fastify.post('/api/v1/system/stores', systemHandlers.createStore);
  fastify.put('/api/v1/system/stores/:storeId', systemHandlers.updateStore);
  
  // 系统管理（开发环境专用）
  fastify.post('/api/v1/system/switch-mode', systemHandlers.switchMode);
  
  // 健康检查
  fastify.get('/api/v1/system/health', systemHandlers.healthCheck);
  
  console.log('✅ 系统模式路由注册完成');
};