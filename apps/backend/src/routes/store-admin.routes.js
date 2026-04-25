/**
 * 店长端（STORE_ADMIN）独立路由
 * 店长登录、获取店铺、管理菜单/打印机/订单
 * 所有路径相对 /api/store-admin 前缀
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { publicDb } from '../db/index.js';
import { STORE_ADMIN_ROUTES } from '../config/routes.js';
import { requireStoreAccess } from '../middleware/store-auth.middleware.js';
import authService from '../services/auth.service.js';
import { storeAdminAuth } from '../middleware/auth.middleware.js';

/**
 * 店长登录（独立于主登录，专门验证 STORE_ADMIN 身份）
 */
async function storeAdminLogin(publicDb, email, password) {
  const user = await publicDb.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') {
    return { success: false, error: '账号不存在或已禁用' };
  }

  // 验证密码
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: '密码错误' };
  }

  // 检查是否有店铺关联（SUPER_ADMIN 和 TENANT_ADMIN 也算有资格）
  const hasStoreAccess = user.role === 'SUPER_ADMIN' || user.role === 'TENANT_ADMIN' ||
    await publicDb.userStore.findFirst({ where: { userId: user.id, status: 'ACTIVE' } });

  if (!hasStoreAccess) {
    return { success: false, error: '您没有被授权管理任何店铺' };
  }

  // 签发 token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'store_admin',
    },
    config.auth.jwtSecret,
    { expiresIn: '24h' }
  );

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

/**
 * 注册店长路由
 */
export default async function storeAdminRoutes(fastify) {
  
  const SA = STORE_ADMIN_ROUTES;

  // ====== 认证 ======
  fastify.post(SA.AUTH.LOGIN, async (request, reply) => {
    try {
      const { email, password } = request.body || {};
      if (!email || !password) {
        return reply.status(400).send({ success: false, error: '邮箱和密码是必填项' });
      }
      const result = await storeAdminLogin(publicDb, email, password);
      if (!result.success) {
        return reply.status(401).send(result);
      }
      return { success: true, data: result };
    } catch (error) {
      request.log.error({ msg: '店长登录失败', error: error.message });
      return reply.status(500).send({ success: false, error: '登录失败' });
    }
  });

  // 店长获取个人信息
  fastify.get(SA.AUTH.PROFILE, { preHandler: [storeAdminAuth] }, async (request, reply) => {
    try {
      const user = await publicDb.user.findUnique({
        where: { id: request.user.id },
        select: { id: true, email: true, username: true, fullName: true, role: true },
      });
      if (!user) return reply.status(404).send({ success: false, error: '用户不存在' });
      return { success: true, data: user };
    } catch (error) {
      request.log.error({ msg: '获取店长信息失败', error: error.message });
      return reply.status(500).send({ success: false, error: '获取信息失败' });
    }
  });

  // ====== 我的店铺 ======
  fastify.get(SA.MY_STORES, { preHandler: [storeAdminAuth] }, async (request, reply) => {
    try {
      const { getMyStores } = await import('../middleware/store-auth.middleware.js');
      return getMyStores(request, reply);
    } catch (error) {
      request.log.error({ msg: '获取店铺列表失败', error: error.message });
      return reply.status(500).send({ success: false, error: '获取店铺列表失败' });
    }
  });

  // ====== 菜单管理（需要店铺访问权限） ======

  // 获取分类列表
  fastify.get(SA.MENU.CATEGORIES, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const categories = await publicDb.menuCategory.findMany({
        where: { storeId },
        orderBy: { sortOrder: 'asc' },
      });
      return { success: true, data: categories };
    } catch (error) {
      request.log.error({ msg: '获取分类失败', error: error.message });
      return reply.status(500).send({ success: false, error: '获取分类失败' });
    }
  });

  // 获取菜品列表
  fastify.get(SA.MENU.ITEMS, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const items = await publicDb.menuItem.findMany({
        where: { storeId },
        include: { category: true },
        orderBy: { sortOrder: 'asc' },
      });
      return { success: true, data: items };
    } catch (error) {
      request.log.error({ msg: '获取菜品失败', error: error.message });
      return reply.status(500).send({ success: false, error: '获取菜品失败' });
    }
  });

  // 创建/更新/删除分类（简化为全量更新，店长只需要基础CRUD）
  fastify.post(SA.MENU.CATEGORIES, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const { name, sortOrder } = request.body || {};
      if (!name) return reply.status(400).send({ success: false, error: '分类名称不能为空' });
      const category = await publicDb.menuCategory.create({
        data: { storeId, name, sortOrder: sortOrder || 0 },
      });
      return reply.status(201).send({ success: true, data: category });
    } catch (error) {
      request.log.error({ msg: '创建分类失败', error: error.message });
      return reply.status(500).send({ success: false, error: '创建分类失败' });
    }
  });

  fastify.put(SA.MENU.CATEGORY_DETAIL, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId, categoryId } = request.params;
      const { name, sortOrder } = request.body || {};
      const category = await publicDb.menuCategory.update({
        where: { id: categoryId, storeId },
        data: { ...(name && { name }), ...(sortOrder !== undefined && { sortOrder }) },
      });
      return { success: true, data: category };
    } catch (error) {
      request.log.error({ msg: '更新分类失败', error: error.message });
      return reply.status(500).send({ success: false, error: '更新分类失败' });
    }
  });

  fastify.delete(SA.MENU.CATEGORY_DETAIL, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId, categoryId } = request.params;
      await publicDb.menuCategory.delete({ where: { id: categoryId, storeId } });
      return { success: true };
    } catch (error) {
      request.log.error({ msg: '删除分类失败', error: error.message });
      return reply.status(500).send({ success: false, error: '删除分类失败' });
    }
  });

  // 创建菜品
  fastify.post(SA.MENU.ITEMS, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const { name, price, categoryId, description, imageUrl, tags } = request.body || {};
      if (!name || price === undefined || !categoryId) {
        return reply.status(400).send({ success: false, error: '名称、价格和分类是必填项' });
      }
      const item = await publicDb.menuItem.create({
        data: {
          storeId, name, categoryId,
          price: parseFloat(price),
          description, imageUrl,
          tags: tags ? JSON.stringify(tags) : null,
          sortOrder: 0,
          isAvailable: true,
        },
      });
      return reply.status(201).send({ success: true, data: item });
    } catch (error) {
      request.log.error({ msg: '创建菜品失败', error: error.message });
      return reply.status(500).send({ success: false, error: '创建菜品失败' });
    }
  });

  // 更新菜品
  fastify.put(SA.MENU.ITEM_DETAIL, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId, itemId } = request.params;
      const { name, price, categoryId, description, imageUrl, tags, isAvailable } = request.body || {};
      const data = {};
      if (name) data.name = name;
      if (price !== undefined) data.price = parseFloat(price);
      if (categoryId) data.categoryId = categoryId;
      if (description !== undefined) data.description = description;
      if (imageUrl !== undefined) data.imageUrl = imageUrl;
      if (tags !== undefined) data.tags = typeof tags === 'string' ? tags : JSON.stringify(tags);
      if (isAvailable !== undefined) data.isAvailable = isAvailable;

      const item = await publicDb.menuItem.update({
        where: { id: itemId, storeId },
        data,
      });
      return { success: true, data: item };
    } catch (error) {
      request.log.error({ msg: '更新菜品失败', error: error.message });
      return reply.status(500).send({ success: false, error: '更新菜品失败' });
    }
  });

  // 删除菜品
  fastify.delete(SA.MENU.ITEM_DETAIL, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId, itemId } = request.params;
      await publicDb.menuItem.delete({ where: { id: itemId, storeId } });
      return { success: true };
    } catch (error) {
      request.log.error({ msg: '删除菜品失败', error: error.message });
      return reply.status(500).send({ success: false, error: '删除菜品失败' });
    }
  });

  // 上架/下架
  fastify.patch(SA.MENU.ITEM_AVAILABILITY, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId, itemId } = request.params;
      const { isAvailable } = request.body || {};
      if (isAvailable === undefined) {
        return reply.status(400).send({ success: false, error: '缺少 isAvailable 参数' });
      }
      const item = await publicDb.menuItem.update({
        where: { id: itemId, storeId },
        data: { isAvailable },
      });
      return { success: true, data: item };
    } catch (error) {
      request.log.error({ msg: '更新菜品状态失败', error: error.message });
      return reply.status(500).send({ success: false, error: '更新菜品状态失败' });
    }
  });

  // ====== 打印机管理 ======
  fastify.get(SA.PRINTERS.LIST, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const printers = await publicDb.printer.findMany({ where: { storeId } });
      return { success: true, data: printers };
    } catch (error) {
      request.log.error({ msg: '获取打印机列表失败', error: error.message });
      return reply.status(500).send({ success: false, error: '获取打印机列表失败' });
    }
  });

  // ====== 订单管理 ======
  fastify.get(SA.ORDERS.LIST, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const { status, page = 1, limit = 20 } = request.query || {};
      const where = { storeId };
      if (status) where.status = status;

      const [orders, total] = await Promise.all([
        publicDb.order.findMany({
          where,
          include: { items: true, table: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        publicDb.order.count({ where }),
      ]);
      return { success: true, data: orders, total, page, limit };
    } catch (error) {
      request.log.error({ msg: '获取订单列表失败', error: error.message });
      return reply.status(500).send({ success: false, error: '获取订单列表失败' });
    }
  });

  fastify.get(SA.ORDERS.DETAIL, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId, orderId } = request.params;
      const order = await publicDb.order.findFirst({
        where: { id: orderId, storeId },
        include: { items: true, table: true },
      });
      if (!order) return reply.status(404).send({ success: false, error: '订单不存在' });
      return { success: true, data: order };
    } catch (error) {
      request.log.error({ msg: '获取订单详情失败', error: error.message });
      return reply.status(500).send({ success: false, error: '获取订单详情失败' });
    }
  });

  fastify.patch(SA.ORDERS.UPDATE_STATUS, {
    preHandler: [storeAdminAuth, requireStoreAccess({ storeIdParam: 'storeId' })],
  }, async (request, reply) => {
    try {
      const { storeId, orderId } = request.params;
      const { status } = request.body || {};
      if (!status) return reply.status(400).send({ success: false, error: '缺少状态参数' });
      const order = await publicDb.order.update({
        where: { id: orderId, storeId },
        data: { status },
      });
      return { success: true, data: order };
    } catch (error) {
      request.log.error({ msg: '更新订单状态失败', error: error.message });
      return reply.status(500).send({ success: false, error: '更新订单状态失败' });
    }
  });

  console.log('✅ 店长端路由注册完成');
}
