// 麒麟项目 - 店铺管理路由 (清洁版)
// 全新实现，无旧代码污染，使用统一常量

import storeService from '../services/store.service.js';
import { requireTenantAccess } from '../middleware/index.js';
import { STORE_TYPES, STORE_STATUS, STORE_VALIDATION, STORE_DEFAULTS } from '../constants/store.constants.js';
import routes from '../config/routes.js';
import { publicDb } from '../db/index.js';
const STORES = routes.tenant.STORES;

/**
 * 店铺管理路由注册
 * @param {FastifyInstance} fastify - Fastify实例
 */
async function storeRoutes(fastify) {
  // 使用统一的认证和租户检查中间件
  const authWithTenant = requireTenantAccess('header');
  
  // 获取店铺列表
  fastify.get(STORES.LIST, {
    preHandler: authWithTenant
  }, async (request, reply) => {
    try {
      console.log('店铺列表请求头:', request.headers);
      console.log('店铺列表用户:', request.user);
      
      const { tenantId, id: userId } = request.user;
      const queryOptions = request.query;
      
      console.log('店铺列表请求参数:', { tenantId, userId, queryOptions });
      const result = await storeService.getStoresByTenant(tenantId, userId, queryOptions);
      
      console.log('店铺列表结果:', result);
      return reply.code(200).send(result);
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      
      if (error.code === 'FORBIDDEN') {
        return reply.code(403).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: '获取店铺列表失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // 获取店铺详情
  fastify.get(STORES.DETAIL, {
    schema: {
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' }
        },
        required: ['storeId']
      }
    },
    preHandler: authWithTenant
  }, async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { storeId } = request.params;
      
      const result = await storeService.getStoreById(storeId, userId);
      
      return reply.code(200).send(result);
    } catch (error) {
      console.error('获取店铺详情失败:', error);
      
      if (error.code === 'NOT_FOUND') {
        return reply.code(404).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      if (error.code === 'FORBIDDEN') {
        return reply.code(403).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: '获取店铺详情失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // 检查店铺标识符可用性
  fastify.post(STORES.CHECK_SLUG, async (request, reply) => {
    try {
      const { slug } = request.body;
      if (!slug) {
        return reply.status(400).send({ success: false, message: '标识符是必需的' });
      }
      const existing = await publicDb.store.findUnique({ where: { slug } });
      return { success: true, data: { available: !existing, slug } };
    } catch (error) {
      request.log.error({ msg: '检查标识符错误', error: error.message, stack: error.stack });
      return reply.status(500).send({ success: false, message: error.message || '检查标识符失败' });
    }
  });

  // 创建新店铺
  fastify.post(STORES.CREATE, {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { 
            type: 'string', 
            minLength: STORE_VALIDATION.NAME.MIN_LENGTH, 
            maxLength: STORE_VALIDATION.NAME.MAX_LENGTH 
          },
          type: { 
            type: 'string', 
            enum: Object.values(STORE_TYPES)
          },
          description: { 
            type: 'string', 
            maxLength: STORE_VALIDATION.DESCRIPTION.MAX_LENGTH 
          },
          contactPhone: { 
            type: 'string', 
            pattern: STORE_VALIDATION.PHONE.PATTERN 
          },
          contactEmail: { type: 'string', format: 'email' },
          address: { 
            type: 'string', 
            maxLength: STORE_VALIDATION.ADDRESS.MAX_LENGTH 
          },
          status: { 
            type: 'string', 
            enum: Object.values(STORE_STATUS),
            default: STORE_DEFAULTS.STATUS
          }
        },
        required: ['name', 'type']
      }
    },
    preHandler: authWithTenant
  }, async (request, reply) => {
    try {
      const { tenantId, id: userId } = request.user;
      const storeData = request.body;
      
      const result = await storeService.createStore(storeData, tenantId, userId);
      
      return reply.code(201).send(result);
    } catch (error) {
      console.error('创建店铺失败:', error);
      
      if (error.code === 'VALIDATION_ERROR') {
        return reply.code(400).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      if (error.code === 'FORBIDDEN') {
        return reply.code(403).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: '创建店铺失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // 更新店铺
  fastify.put(STORES.UPDATE, {
    schema: {
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' }
        },
        required: ['storeId']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 1000 },
          contactPhone: { type: 'string', pattern: '^[0-9+\\-\\s()]{10,20}$' },
          contactEmail: { type: 'string', format: 'email' },
          address: { type: 'string', maxLength: 500 },
          status: { 
            type: 'string', 
            enum: Object.values(STORE_STATUS)
          }
        }
      }
    },
    preHandler: authWithTenant
  }, async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { storeId } = request.params;
      const storeData = request.body;
      
      const result = await storeService.updateStore(storeId, storeData, userId);
      
      return reply.code(200).send(result);
    } catch (error) {
      console.error('更新店铺失败:', error);
      
      if (error.code === 'NOT_FOUND') {
        return reply.code(404).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      if (error.code === 'FORBIDDEN') {
        return reply.code(403).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: '更新店铺失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // 删除店铺（软删除）
  fastify.delete(STORES.DELETE, {
    schema: {
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' }
        },
        required: ['storeId']
      }
    },
    preHandler: authWithTenant
  }, async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { storeId } = request.params;
      
      const result = await storeService.deleteStore(storeId, userId);
      
      return reply.code(200).send(result);
    } catch (error) {
      console.error('删除店铺失败:', error);
      
      if (error.code === 'NOT_FOUND') {
        return reply.code(404).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      if (error.code === 'FORBIDDEN') {
        return reply.code(403).send({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: '删除店铺失败',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // 店铺健康检查
  fastify.get(STORES.HEALTH, async (request, reply) => {
    return {
      success: true,
      service: 'qilin-store-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      status: 'healthy'
    };
  });
}

export default storeRoutes;