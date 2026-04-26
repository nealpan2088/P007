// 麒麟项目 - 菜单管理服务
// 统一管理菜单分类（MenuCategory）和菜品（MenuItem）

import { PrismaClient } from '@prisma/client';
import { createError } from './error.service.js';

const prisma = new PrismaClient();

class MenuService {
  /**
   * 验证用户对店铺的访问权限
   */
  async verifyStoreAccess(storeId, userId) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, tenantId: true, name: true }
    });
    if (!store) throw createError('NOT_FOUND', '店铺不存在');

    // 检查是否超管（超管通吃所有店铺）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (user?.role === 'SUPER_ADMIN') return store;

    // 验证用户属于该租户
    const userTenant = await prisma.userTenant.findFirst({
      where: { tenantId: store.tenantId, userId }
    });
    if (!userTenant) throw createError('FORBIDDEN', '无权访问该店铺');

    return store;
  }

  // ===== 分类管理 =====
  async getCategories(storeId, userId) {
    await this.verifyStoreAccess(storeId, userId);
    const categories = await prisma.menuCategory.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { items: true } }
      }
    });
    return { success: true, data: categories };
  }

  async createCategory(storeId, userId, data) {
    await this.verifyStoreAccess(storeId, userId);
    
    // 获取当前最大排序值
    const last = await prisma.menuCategory.findFirst({
      where: { storeId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });
    
    // 查重：同一店铺不能有同名分类
    const existing = await prisma.menuCategory.findFirst({
      where: { storeId, name: data.name }
    });
    if (existing) {
      throw createError('CONFLICT', `分类 "${data.name}" 已存在`);
    }

    const category = await prisma.menuCategory.create({
      data: {
        storeId,
        name: data.name,
        description: data.description || null,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        isActive: true
      }
    });
    return { success: true, data: category };
  }

  async updateCategory(storeId, categoryId, userId, data) {
    await this.verifyStoreAccess(storeId, userId);
    const category = await prisma.menuCategory.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder,
        isActive: data.isActive
      }
    });
    return { success: true, data: category };
  }

  async deleteCategory(storeId, categoryId, userId) {
    await this.verifyStoreAccess(storeId, userId);
    await prisma.menuCategory.delete({ where: { id: categoryId } });
    return { success: true, message: '分类已删除' };
  }

  async reorderCategories(storeId, userId, categoryIds) {
    await this.verifyStoreAccess(storeId, userId);
    for (let i = 0; i < categoryIds.length; i++) {
      await prisma.menuCategory.update({
        where: { id: categoryIds[i] },
        data: { sortOrder: i }
      });
    }
    return { success: true, message: '排序已更新' };
  }

  // ===== 菜品管理 =====
  async getMenuItems(storeId, userId) {
    await this.verifyStoreAccess(storeId, userId);
    const items = await prisma.menuItem.findMany({
      where: {
        category: { storeId }
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        category: { select: { id: true, name: true } }
      }
    });
    return { success: true, data: items };
  }

  async createMenuItem(storeId, userId, data) {
    await this.verifyStoreAccess(storeId, userId);
    
    // 验证分类存在
    const category = await prisma.menuCategory.findFirst({
      where: { id: data.categoryId, storeId }
    });
    if (!category) throw createError('NOT_FOUND', '分类不存在');

    // 查重：同一分类下不能有同名菜品
    const existing = await prisma.menuItem.findFirst({
      where: { categoryId: data.categoryId, name: data.name }
    });
    if (existing) {
      throw createError('CONFLICT', `菜品 "${data.name}" 在该分类下已存在`);
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        imageUrl: data.imageUrl || null,
        isAvailable: data.isAvailable ?? true,
        isRecommended: data.isRecommended ?? false,
        preparationTime: data.preparationTime ?? 15,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        category: { select: { id: true, name: true } }
      }
    });
    return { success: true, data: item };
  }

  async updateMenuItem(storeId, itemId, userId, data) {
    await this.verifyStoreAccess(storeId, userId);
    
    const updateData = {};
    if (data.categoryId !== undefined) {
      const category = await prisma.menuCategory.findFirst({
        where: { id: data.categoryId, storeId }
      });
      if (!category) throw createError('NOT_FOUND', '分类不存在');
      updateData.categoryId = data.categoryId;
    }
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.isRecommended !== undefined) updateData.isRecommended = data.isRecommended;
    if (data.preparationTime !== undefined) updateData.preparationTime = data.preparationTime;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } }
      }
    });
    return { success: true, data: item };
  }

  async deleteMenuItem(storeId, itemId, userId) {
    await this.verifyStoreAccess(storeId, userId);
    await prisma.menuItem.delete({ where: { id: itemId } });
    return { success: true, message: '菜品已删除' };
  }

  async updateAvailability(storeId, itemId, userId, isAvailable) {
    await this.verifyStoreAccess(storeId, userId);
    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable },
      include: {
        category: { select: { id: true, name: true } }
      }
    });
    return { success: true, data: item };
  }
}

export default new MenuService();
