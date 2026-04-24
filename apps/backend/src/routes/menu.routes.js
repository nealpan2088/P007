// 麒麟项目 - 菜单管理路由（新规范）
// 路径前缀：/api/store（在 index.js 注册时加）
// 使用 config/routes.js 中的路由常量

import menuService from '../services/menu.service.js';
import { authenticate } from '../middleware/index.js';
import { TENANT_ROUTES } from '../config/routes.js';

const MENU = TENANT_ROUTES.MENU;

/**
 * 菜单管理路由注册
 * @param {FastifyInstance} fastify
 */
async function menuRoutes(fastify) {
  // 所有菜单路由需要认证
  fastify.addHook('preHandler', authenticate);

  // ===== 分类管理 =====

  // 获取分类列表
  fastify.get(MENU.CATEGORIES.LIST, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const result = await menuService.getCategories(storeId, request.user.id);
      return result;
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // 创建分类
  fastify.post(MENU.CATEGORIES.CREATE, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const result = await menuService.createCategory(storeId, request.user.id, request.body);
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // 更新分类
  fastify.put(MENU.CATEGORIES.UPDATE, async (request, reply) => {
    try {
      const { storeId, categoryId } = request.params;
      const result = await menuService.updateCategory(storeId, categoryId, request.user.id, request.body);
      return result;
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // 删除分类
  fastify.delete(MENU.CATEGORIES.DELETE, async (request, reply) => {
    try {
      const { storeId, categoryId } = request.params;
      const result = await menuService.deleteCategory(storeId, categoryId, request.user.id);
      return result;
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // 分类排序
  fastify.put(MENU.CATEGORIES.REORDER, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const result = await menuService.reorderCategories(storeId, request.user.id, request.body.categoryIds);
      return result;
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // ===== 菜品管理 =====

  // 获取菜品列表
  fastify.get(MENU.ITEMS.LIST, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const result = await menuService.getMenuItems(storeId, request.user.id);
      return result;
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // 创建菜品
  fastify.post(MENU.ITEMS.CREATE, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const result = await menuService.createMenuItem(storeId, request.user.id, request.body);
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // 更新菜品
  fastify.put(MENU.ITEMS.UPDATE, async (request, reply) => {
    try {
      const { storeId, itemId } = request.params;
      const result = await menuService.updateMenuItem(storeId, itemId, request.user.id, request.body);
      return result;
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // 删除菜品
  fastify.delete(MENU.ITEMS.DELETE, async (request, reply) => {
    try {
      const { storeId, itemId } = request.params;
      const result = await menuService.deleteMenuItem(storeId, itemId, request.user.id);
      return result;
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  // 更新上架状态
  fastify.put(MENU.ITEMS.AVAILABILITY, async (request, reply) => {
    try {
      const { storeId, itemId } = request.params;
      const { isAvailable } = request.body;
      const result = await menuService.updateAvailability(storeId, itemId, request.user.id, isAvailable);
      return result;
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false, error: error.message, code: error.code || 'INTERNAL_ERROR'
      });
    }
  });

  console.log('✅ 菜单管理路由已注册');
}

export default menuRoutes;
