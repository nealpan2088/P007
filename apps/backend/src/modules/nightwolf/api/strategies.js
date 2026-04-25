// 夜狼行动 - 策略API路由
// 版本: 0.1.0
// 功能: 策略配置的CRUD操作

const { isNightWolfAvailable, isModuleAvailable } = require('../config/feature-flags');
const { NightWolfConstants, getApiPath } = require('../config/constants');
const { ErrorFactory, errorHandler } = require('../config/errors');

/**
 * 策略API路由
 */
async function strategyRoutes(fastify, options) {
  
  // 前置检查：夜狼模块是否可用
  fastify.addHook('onRequest', async (request, reply) => {
    if (!isNightWolfAvailable()) {
      throw ErrorFactory.system.moduleDisabled();
    }
    
    if (!isModuleAvailable('STRATEGY_CONFIG')) {
      throw ErrorFactory.system.moduleDisabled();
    }
    
    // 简单的权限检查（后续可扩展）
    const token = request.headers.authorization;
    if (!token) {
      throw ErrorFactory.system.permissionDenied('admin', 'anonymous');
    }
  });
  
  // ==================== 策略管理 ====================
  
  /**
   * 获取所有策略
   * GET /api/nightwolf/v1/strategies
   */
  fastify.get('/', {
    schema: {
      description: '获取所有策略配置',
      tags: ['strategies'],
      querystring: {
        type: 'object',
        properties: {
          storeId: { type: 'string' },
          isActive: { type: 'boolean' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                strategies: { type: 'array' },
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { storeId, isActive, limit = 20, offset = 0 } = request.query;
    
    try {
      // 这里会查询数据库
      // 暂时返回模拟数据
      const strategies = [
        {
          id: 'strat_001',
          storeId: storeId || 'store_001',
          name: '快餐店策略',
          type: 'fast_food',
          isActive: isActive !== undefined ? isActive : true,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      return {
        success: true,
        data: {
          strategies,
          total: 1,
          limit,
          offset,
        },
      };
      
    } catch (error) {
      throw ErrorFactory.system.databaseError('query strategies', error);
    }
  });
  
  /**
   * 获取单个策略
   * GET /api/nightwolf/v1/strategies/:id
   */
  fastify.get('/:id', {
    schema: {
      description: '获取单个策略配置',
      tags: ['strategies'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'object' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    
    try {
      // 这里会查询数据库
      // 暂时返回模拟数据
      if (id === 'not_found') {
        throw ErrorFactory.strategy.notFound(id);
      }
      
      const strategy = {
        id,
        storeId: 'store_001',
        name: '测试策略',
        description: '这是一个测试策略配置',
        type: 'custom',
        config: {
          statusFlow: NightWolfConstants.DEFAULTS.STRATEGY.STATUS_FLOW,
          paymentTiming: NightWolfConstants.DEFAULTS.STRATEGY.PAYMENT_TIMING,
        },
        isActive: true,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        success: true,
        data: strategy,
      };
      
    } catch (error) {
      if (error.code === getErrorCode('STRATEGY_NOT_FOUND')) {
        reply.code(404);
      }
      throw error;
    }
  });
  
  /**
   * 创建策略
   * POST /api/nightwolf/v1/strategies
   */
  fastify.post('/', {
    schema: {
      description: '创建新的策略配置',
      tags: ['strategies'],
      body: {
        type: 'object',
        required: ['storeId', 'name', 'type'],
        properties: {
          storeId: { type: 'string' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          type: { type: 'string', enum: Object.values(NightWolfConstants.STRATEGY_TYPES) },
          config: { type: 'object' },
          isActive: { type: 'boolean', default: false },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'object' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const strategyData = request.body;
    
    try {
      // 验证配置
      if (!validateStrategyConfig(strategyData.config)) {
        throw ErrorFactory.strategy.invalid('配置格式不正确');
      }
      
      // 这里会保存到数据库
      // 暂时返回模拟数据
      const newStrategy = {
        id: `strat_${Date.now()}`,
        ...strategyData,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      reply.code(201);
      return {
        success: true,
        data: newStrategy,
        message: '策略创建成功',
      };
      
    } catch (error) {
      if (error.code === getErrorCode('STRATEGY_INVALID')) {
        reply.code(400);
      }
      throw error;
    }
  });
  
  /**
   * 更新策略
   * PUT /api/nightwolf/v1/strategies/:id
   */
  fastify.put('/:id', {
    schema: {
      description: '更新策略配置',
      tags: ['strategies'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          config: { type: 'object' },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const updateData = request.body;
    
    try {
      // 验证配置
      if (updateData.config && !validateStrategyConfig(updateData.config)) {
        throw ErrorFactory.strategy.invalid('配置格式不正确');
      }
      
      // 这里会更新数据库
      // 暂时返回模拟数据
      const updatedStrategy = {
        id,
        storeId: 'store_001',
        name: updateData.name || '更新后的策略',
        description: updateData.description,
        config: updateData.config || NightWolfConstants.DEFAULTS.STRATEGY,
        isActive: updateData.isActive !== undefined ? updateData.isActive : true,
        version: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        success: true,
        data: updatedStrategy,
        message: '策略更新成功',
      };
      
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * 删除策略
   * DELETE /api/nightwolf/v1/strategies/:id
   */
  fastify.delete('/:id', {
    schema: {
      description: '删除策略配置',
      tags: ['strategies'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    
    try {
      // 这里会从数据库删除
      // 暂时模拟删除
      
      return {
        success: true,
        message: `策略 ${id} 删除成功`,
      };
      
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * 激活/停用策略
   * PATCH /api/nightwolf/v1/strategies/:id/activate
   */
  fastify.patch('/:id/activate', {
    schema: {
      description: '激活或停用策略',
      tags: ['strategies'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['isActive'],
        properties: {
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { isActive } = request.body;
    
    try {
      // 这里会更新数据库
      // 暂时返回模拟数据
      
      return {
        success: true,
        data: {
          id,
          isActive,
          updatedAt: new Date().toISOString(),
        },
        message: `策略已${isActive ? '激活' : '停用'}`,
      };
      
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * 应用策略到店铺
   * POST /api/nightwolf/v1/strategies/:id/apply
   */
  fastify.post('/:id/apply', {
    schema: {
      description: '将策略应用到店铺',
      tags: ['strategies'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['storeId'],
        properties: {
          storeId: { type: 'string' },
          force: { type: 'boolean', default: false },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { storeId, force = false } = request.body;
    
    try {
      // 这里会应用策略到店铺
      // 暂时返回模拟数据
      
      return {
        success: true,
        data: {
          strategyId: id,
          storeId,
          appliedAt: new Date().toISOString(),
          force,
        },
        message: '策略应用成功',
      };
      
    } catch (error) {
      throw error;
    }
  });
  
  // ==================== 辅助函数 ====================
  
  /**
   * 验证策略配置
   */
  function validateStrategyConfig(config) {
    if (!config) return true; // 允许空配置
    
    // 基本验证
    if (typeof config !== 'object') return false;
    
    // 验证状态流配置
    if (config.statusFlow) {
      if (!Array.isArray(config.statusFlow.nodes)) return false;
      if (!Array.isArray(config.statusFlow.transitions)) return false;
    }
    
    // 验证支付时机配置
    if (config.paymentTiming) {
      if (!['pre_order', 'post_dining', 'hybrid'].includes(config.paymentTiming.default)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 获取错误代码
   */
  function getErrorCode(errorKey) {
    return NightWolfConstants.ERROR_CODES[errorKey] || 'NIGHTWOLF_999';
  }
}

module.exports = strategyRoutes;