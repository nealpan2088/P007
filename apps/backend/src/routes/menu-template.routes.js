/**
 * 平台级菜品素材库 API
 * 管理员维护的公共菜品模板，店铺可从素材库选品上架
 */
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/index.js';
import { ADMIN_ROUTES } from '../config/routes.js';

const MENU_TPL = ADMIN_ROUTES.MENU_TEMPLATES;
const prisma = new PrismaClient();

export default async function menuTemplateRoutes(fastify) {
  // 所有素材库接口需要认证
  fastify.addHook('preHandler', authenticate);

  // 获取素材库分类列表
  fastify.get(MENU_TPL.CATEGORIES, async (request, reply) => {
    try {
      const templates = await prisma.menuTemplate.findMany({
        where: { isActive: true },
        orderBy: { categoryName: 'asc' },
        select: { categoryName: true },
        distinct: ['categoryName'],
      });
      return { success: true, data: templates.map(t => t.categoryName) };
    } catch (error) {
      request.log.error({ msg: '获取素材库分类失败', error: error.message });
      return reply.code(500).send({ success: false, error: '获取素材库分类失败' });
    }
  });

  // 获取素材库菜品列表（分页+搜索+分类筛选）
  fastify.get(MENU_TPL.ITEMS, async (request, reply) => {
    try {
      const { category, page = '1', limit = '50', search = '' } = request.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

      const where = { isActive: true };
      if (category) where.categoryName = category;
      if (search.trim()) {
        where.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.menuTemplate.findMany({
          where,
          orderBy: [{ categoryName: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.menuTemplate.count({ where }),
      ]);

      return { success: true, data: items, total, page: pageNum, limit: limitNum };
    } catch (error) {
      request.log.error({ msg: '获取素材库菜品失败', error: error.message });
      return reply.code(500).send({ success: false, error: '获取素材库菜品失败' });
    }
  });

  // 创建素材菜品
  fastify.post(MENU_TPL.ITEMS, async (request, reply) => {
    try {
      const { name, categoryName, description, price, imageUrl, tags } = request.body;
      if (!name || !categoryName || price === undefined) {
        return reply.code(400).send({ success: false, error: '名称、分类和价格为必填' });
      }

      const item = await prisma.menuTemplate.create({
        data: {
          name,
          categoryName,
          description: description || null,
          price: parseFloat(price),
          imageUrl: imageUrl || null,
          tags: tags ? JSON.stringify(tags) : null,
          createdById: request.user.id,
        },
      });
      return { success: true, data: item };
    } catch (error) {
      request.log.error({ msg: '创建素材菜品失败', error: error.message });
      return reply.code(500).send({ success: false, error: '创建素材菜品失败' });
    }
  });

  // 批量创建素材菜品（从 CSV 导入）
  fastify.post(MENU_TPL.BATCH_CREATE, async (request, reply) => {
    try {
      const { items } = request.body;
      if (!Array.isArray(items) || items.length === 0) {
        return reply.code(400).send({ success: false, error: '菜品列表为空' });
      }
      if (items.length > 200) {
        return reply.code(400).send({ success: false, error: '单次最多导入 200 条' });
      }

      let created = 0, skipped = 0, errors = [];
      for (const item of items) {
        const { name, categoryName, price, description, imageUrl, tags } = item;
        if (!name || !categoryName || price === undefined) {
          errors.push(`跳过: "${name || '无名'}" - 缺少必填字段`);
          continue;
        }

        const existing = await prisma.menuTemplate.findFirst({
          where: { name, categoryName },
        });
        if (existing) {
          skipped++;
          continue;
        }

        await prisma.menuTemplate.create({
          data: {
            name,
            categoryName,
            description: description || null,
            price: parseFloat(price),
            imageUrl: imageUrl || null,
            tags: tags ? (Array.isArray(tags) ? JSON.stringify(tags) : tags) : null,
            sortOrder: 0,
            isActive: true,
            createdById: request.user.id,
          },
        });
        created++;
      }

      return { success: true, data: { created, skipped, errors: errors.length > 0 ? errors : undefined } };
    } catch (error) {
      request.log.error({ msg: '批量创建素材菜品失败', error: error.message });
      return reply.code(500).send({ success: false, error: '批量创建失败: ' + error.message });
    }
  });

  // 更新素材菜品
  fastify.put(MENU_TPL.ITEM, async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, categoryName, description, price, imageUrl, tags, isActive, sortOrder } = request.body;

      const item = await prisma.menuTemplate.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(categoryName !== undefined && { categoryName }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(tags !== undefined && { tags: JSON.stringify(tags) }),
          ...(isActive !== undefined && { isActive }),
          ...(sortOrder !== undefined && { sortOrder }),
        },
      });
      return { success: true, data: item };
    } catch (error) {
      request.log.error({ msg: '更新素材菜品失败', error: error.message });
      return reply.code(500).send({ success: false, error: '更新素材菜品失败' });
    }
  });

  // 删除素材菜品
  fastify.delete(MENU_TPL.ITEM, async (request, reply) => {
    try {
      const { id } = request.params;
      await prisma.menuTemplate.delete({ where: { id } });
      return { success: true, message: '已删除' };
    } catch (error) {
      request.log.error({ msg: '删除素材菜品失败', error: error.message });
      return reply.code(500).send({ success: false, error: '删除素材菜品失败' });
    }
  });

  // 从素材库导入菜品到店铺
  fastify.post(MENU_TPL.IMPORT, async (request, reply) => {
    try {
      const { storeId, templateIds } = request.body;
      if (!storeId || !templateIds?.length) {
        return reply.code(400).send({ success: false, error: '店铺ID和模板ID列表为必填' });
      }

      const templates = await prisma.menuTemplate.findMany({
        where: { id: { in: templateIds } },
      });

      if (templates.length === 0) {
        return reply.code(404).send({ success: false, error: '未找到指定的模板' });
      }

      // 按分类名自动创建店铺分类
      const categoryMap = new Map();
      for (const tpl of templates) {
        if (!categoryMap.has(tpl.categoryName)) {
          let category = await prisma.menuCategory.findFirst({
            where: { storeId, name: tpl.categoryName },
          });
          if (!category) {
            category = await prisma.menuCategory.create({
              data: { storeId, name: tpl.categoryName },
            });
          }
          categoryMap.set(tpl.categoryName, category);
        }
      }

      // 批量导入（跳过重名）
      let created = 0, skipped = 0;
      for (const tpl of templates) {
        const category = categoryMap.get(tpl.categoryName);
        const existing = await prisma.menuItem.findFirst({
          where: { categoryId: category.id, name: tpl.name },
        });
        if (existing) { skipped++; continue; }
        await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: tpl.name,
            description: tpl.description,
            price: tpl.price,
            imageUrl: tpl.imageUrl,
            templateId: tpl.id,
            isAvailable: true,
          },
        });
        created++;
      }

      return { success: true, data: { created, skipped } };
    } catch (error) {
      request.log.error({ msg: '导入素材失败', error: error.message });
      return reply.code(500).send({ success: false, error: '导入素材失败' });
    }
  });
}
