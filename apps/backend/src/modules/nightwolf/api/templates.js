// 夜狼行动 - 模板API路由
// 版本: 0.1.0
// 功能: 策略模板的CRUD操作

const { isNightWolfAvailable, isModuleAvailable } = require('../config/feature-flags');
const { NightWolfConstants, getDefaultTemplate } = require('../config/constants');
const { ErrorFactory } = require('../config/errors');

/**
 * 模板API路由
 */
async function templateRoutes(fastify, options) {
  
  // 前置检查：夜狼模块是否可用
  fastify.addHook('onRequest', async (request, reply) => {
    if (!isNightWolfAvailable()) {
      throw ErrorFactory.system.moduleDisabled();
    }
    
    if (!isModuleAvailable('STRATEGY_CONFIG')) {
      throw ErrorFactory.system.moduleDisabled();
    }
  });
  
  // ==================== 模板管理 ====================
  
  /**
   * 获取所有模板
   * GET /api/nightwolf/v1/templates
   */
  fastify.get('/', {
    schema: {
      description: '获取所有策略模板',
      tags: ['templates'],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: Object.values(NightWolfConstants.TEMPLATE_TYPES) },
          isPublic: { type: 'boolean' },
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
                templates: { type: 'array' },
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
    const { type, isPublic = true, limit = 20, offset = 0 } = request.query;
    
    try {
      // 获取默认模板
      const defaultTemplates = Object.entries(NightWolfConstants.DEFAULTS.TEMPLATES)
        .filter(([templateType, template]) => {
          if (type && templateType !== type) return false;
          if (isPublic !== undefined && template.isPublic !== isPublic) return false;
          return true;
        })
        .map(([templateType, template]) => ({
          id: `template_${templateType}`,
          ...template,
          type: templateType,
          isDefault: true,
        }));
      
      // 这里可以添加从数据库查询的自定义模板
      const customTemplates = [];
      
      const allTemplates = [...defaultTemplates, ...customTemplates];
      const paginatedTemplates = allTemplates.slice(offset, offset + limit);
      
      return {
        success: true,
        data: {
          templates: paginatedTemplates,
          total: allTemplates.length,
          limit,
          offset,
        },
      };
      
    } catch (error) {
      throw ErrorFactory.system.databaseError('query templates', error);
    }
  });
  
  /**
   * 获取单个模板
   * GET /api/nightwolf/v1/templates/:id
   */
  fastify.get('/:id', {
    schema: {
      description: '获取单个策略模板',
      tags: ['templates'],
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
      // 检查是否是默认模板
      if (id.startsWith('template_')) {
        const templateType = id.replace('template_', '');
        const defaultTemplate = getDefaultTemplate(templateType);
        
        if (defaultTemplate) {
          return {
            success: true,
            data: {
              id,
              ...defaultTemplate,
              type: templateType,
              isDefault: true,
            },
          };
        }
      }
      
      // 这里会查询数据库中的自定义模板
      // 暂时模拟
      if (id === 'custom_001') {
        const customTemplate = {
          id: 'custom_001',
          name: '自定义模板',
          type: 'custom',
          description: '用户自定义的策略模板',
          strategy: NightWolfConstants.DEFAULTS.STRATEGY,
          isPublic: true,
          isDefault: false,
          usageCount: 5,
          createdBy: 'user_001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        return {
          success: true,
          data: customTemplate,
        };
      }
      
      throw ErrorFactory.template.notFound(id);
      
    } catch (error) {
      if (error.code === NightWolfConstants.ERROR_CODES.TEMPLATE_NOT_FOUND) {
        reply.code(404);
      }
      throw error;
    }
  });
  
  /**
   * 使用模板创建策略
   * POST /api/nightwolf/v1/templates/:id/apply
   */
  fastify.post('/:id/apply', {
    schema: {
      description: '使用模板创建策略',
      tags: ['templates'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['storeId', 'name'],
        properties: {
          storeId: { type: 'string' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          customizations: { type: 'object' },
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
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { storeId, name, description, customizations = {} } = request.body;
    
    try {
      // 获取模板
      let template;
      if (id.startsWith('template_')) {
        const templateType = id.replace('template_', '');
        template = getDefaultTemplate(templateType);
        if (!template) {
          throw ErrorFactory.template.notFound(id);
        }
      } else {
        // 这里会查询数据库中的自定义模板
        // 暂时模拟
        template = {
          name: '自定义模板',
          strategy: NightWolfConstants.DEFAULTS.STRATEGY,
        };
      }
      
      // 应用自定义配置
      const strategyConfig = mergeConfig(template.strategy, customizations);
      
      // 创建策略
      const newStrategy = {
        id: `strat_${Date.now()}`,
        storeId,
        name,
        description: description || template.description,
        type: template.type || 'custom',
        config: strategyConfig,
        isActive: false, // 默认不激活
        version: 1,
        templateId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // 这里会保存到数据库
      // 暂时返回模拟数据
      
      reply.code(201);
      return {
        success: true,
        data: newStrategy,
        message: '策略创建成功',
      };
      
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * 创建自定义模板
   * POST /api/nightwolf/v1/templates
   */
  fastify.post('/', {
    schema: {
      description: '创建自定义策略模板',
      tags: ['templates'],
      body: {
        type: 'object',
        required: ['name', 'type', 'strategy'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          type: { type: 'string', enum: Object.values(NightWolfConstants.TEMPLATE_TYPES) },
          description: { type: 'string', maxLength: 500 },
          strategy: { type: 'object' },
          isPublic: { type: 'boolean', default: false },
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
      },
    },
  }, async (request, reply) => {
    const templateData = request.body;
    
    try {
      // 验证策略配置
      if (!validateStrategyConfig(templateData.strategy)) {
        throw ErrorFactory.template.invalid('策略配置格式不正确');
      }
      
      // 创建模板
      const newTemplate = {
        id: `custom_${Date.now()}`,
        ...templateData,
        isDefault: false,
        usageCount: 0,
        createdBy: 'user_001', // 这里应该从认证信息获取
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // 这里会保存到数据库
      // 暂时返回模拟数据
      
      reply.code(201);
      return {
        success: true,
        data: newTemplate,
        message: '模板创建成功',
      };
      
    } catch (error) {
      throw error;
    }
  });
  
  /**
   * 更新模板使用次数
   * POST /api/nightwolf/v1/templates/:id/usage
   */
  fastify.post('/:id/usage', {
    schema: {
      description: '记录模板使用次数',
      tags: ['templates'],
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
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    
    try {
      // 这里会更新数据库中的使用次数
      // 暂时返回模拟数据
      
      return {
        success: true,
        data: {
          id,
          usageCount: 1, // 模拟增加
          updatedAt: new Date().toISOString(),
        },
        message: '使用次数已更新',
      };
      
    } catch (error) {
      throw error;
    }
  });
  
  // ==================== 辅助函数 ====================
  
  /**
   * 合并配置
   */
  function mergeConfig(baseConfig, customizations) {
    if (!customizations || Object.keys(customizations).length === 0) {
      return baseConfig;
    }
    
    // 深度合并
    const result = JSON.parse(JSON.stringify(baseConfig));
    
    for (const [key, value] of Object.entries(customizations)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value) && result[key]) {
          // 对象合并
          result[key] = { ...result[key], ...value };
        } else {
          // 直接替换
          result[key] = value;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 验证策略配置
   */
  function validateStrategyConfig(config) {
    if (!config) return false;
    
    // 基本验证
    if (typeof config !== 'object') return false;
    
    // 验证状态流配置
    if (config.statusFlow) {
      if (!Array.isArray(config.statusFlow.nodes)) return false;
      if (!Array.isArray(config.statusFlow.transitions)) return false;
      
      // 验证节点
      for (const node of config.statusFlow.nodes) {
        if (!node.id || !node.name) return false;
      }
      
      // 验证流转
      for (const transition of config.statusFlow.transitions) {
        if (!transition.from || !transition.to) return false;
      }
    }
    
    // 验证支付时机配置
    if (config.paymentTiming) {
      if (!['pre_order', 'post_dining', 'hybrid'].includes(config.paymentTiming.default)) {
        return false;
      }
    }
    
    return true;
  }
}

module.exports = templateRoutes;