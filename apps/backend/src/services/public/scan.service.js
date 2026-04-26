// 扫码点餐公开API服务 - 适配新数据库
// 无需认证，顾客可直接访问

import { PrismaClient } from '@prisma/client';
import { createError } from '../error.service.js';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// 简单菜单缓存 (TTL: 5秒)
const menuCache = new Map();
const CACHE_TTL = 5000;

function getCachedMenu(key) {
  const entry = menuCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  menuCache.delete(key);
  return null;
}

function setCachedMenu(key, data) {
  menuCache.set(key, { data, timestamp: Date.now() });
  // 定期清理过期缓存，防止内存泄漏
  if (menuCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of menuCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) menuCache.delete(k);
    }
  }
}

class ScanService {
  /**
   * 获取店铺信息（公开API）
   * @param {string} storeId - 店铺ID或slug
   * @returns {Promise<Object>} 店铺信息
   */
  async getStoreInfo(storeId) {
    try {
      console.log('获取店铺信息，参数:', storeId);
      
      // 新数据库：使用字符串ID，直接查询
      const store = await prisma.store.findFirst({
        where: {
          OR: [
            { id: storeId, status: 'ACTIVE' },
            { slug: storeId, status: 'ACTIVE' }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          type: true,
          status: true,
          contactPhone: true,
          contactEmail: true,
          address: true,
          logoUrl: true,
          themeColor: true,
          themeTemplate: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!store) {
        console.log('店铺未找到:', storeId);
        throw createError('NOT_FOUND', '店铺不存在或已停用');
      }

      console.log('找到店铺:', store.name, '(ID:', store.id, ')');
      return {
        success: true,
        data: store
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        throw error;
      }
      throw createError('INTERNAL_ERROR', '获取店铺信息失败', error.message);
    }
  }

  /**
   * 获取店铺菜单（公开API）
   * @param {string} storeId - 店铺ID或slug
   * @param {string} tableId - 餐桌ID或tableNumber（可选）
   * @returns {Promise<Object>} 店铺信息和菜单
   */
  async getStoreMenu(storeId, tableId = null) {
    try {
      // 缓存键：含tableId时按不同餐桌区分缓存
      const cacheKey = `menu:${storeId}:${tableId || 'all'}`;
      const cached = getCachedMenu(cacheKey);
      if (cached) {
        console.log('菜单缓存命中:', storeId);
        return cached;
      }
      
      console.log('获取店铺菜单，店铺:', storeId, '餐桌:', tableId || '无');
      
      // 1. 获取店铺信息
      const store = await prisma.store.findFirst({
        where: {
          OR: [
            { id: storeId, status: 'ACTIVE' },
            { slug: storeId, status: 'ACTIVE' }
          ]
        }
      });

      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在或已停用');
      }

      // 2. 获取餐桌信息（如果提供了tableId）
      let table = null;
      if (tableId) {
        table = await prisma.table.findFirst({
          where: {
            storeId: store.id,
            OR: [
              { id: tableId },
              { tableNumber: tableId }
            ]
          }
        });
        
        if (!table) {
          throw createError('NOT_FOUND', '餐桌不存在');
        }
      }

      // 3. 获取菜单分类和菜品
      const categories = await prisma.menuCategory.findMany({
        where: {
          storeId: store.id,
          isActive: true
        },
        orderBy: {
          sortOrder: 'asc'
        },
        include: {
          items: {
            where: {
              isAvailable: true
            },
            orderBy: {
              sortOrder: 'asc'
            }
          }
        }
      });

      // 4. 构建API响应
      const result = {
        success: true,
        data: {
          store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            description: store.description,
            type: store.type,
            status: store.status,
            contactPhone: store.contactPhone,
            address: store.address
          },
          table: table ? {
            id: table.id,
            tableNumber: table.tableNumber,
            name: table.name,
            capacity: table.capacity
          } : null,
          menuItems: categories.flatMap(cat => cat.items),
          categories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            sortOrder: cat.sortOrder,
            itemCount: cat.items.length,
            items: cat.items.map(item => ({
              id: item.id,
              categoryId: item.categoryId,
              name: item.name,
              description: item.description,
              price: item.price,
              imageUrl: item.imageUrl,
              isAvailable: item.isAvailable,
              isRecommended: item.isRecommended,
              preparationTime: item.preparationTime,
              sortOrder: item.sortOrder,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            }))
          }))
        }
      };
      
      // 写入缓存
      setCachedMenu(cacheKey, result);
      return result;
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        throw error;
      }
      throw createError('INTERNAL_ERROR', '获取菜单失败', error.message);
    }
  }

  /**
   * 获取餐桌信息（公开API）
   * @param {string} storeId - 店铺ID或slug
   * @param {string} tableId - 餐桌ID或tableNumber
   * @returns {Promise<Object>} 餐桌信息
   */
  async getTableInfo(storeId, tableId) {
    try {
      console.log('获取餐桌信息，店铺:', storeId, '餐桌:', tableId);
      
      // 先查店铺
      const store = await prisma.store.findFirst({
        where: {
          OR: [
            { id: storeId, status: 'ACTIVE' },
            { slug: storeId, status: 'ACTIVE' }
          ]
        }
      });

      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在或已停用');
      }

      // 查餐桌
      const table = await prisma.table.findFirst({
        where: {
          storeId: store.id,
          OR: [
            { id: tableId },
            { tableNumber: tableId }
          ]
        }
      });

      if (!table) {
        throw createError('NOT_FOUND', '餐桌不存在');
      }

      return {
        success: true,
        data: {
          id: table.id,
          storeId: table.storeId,
          tableNumber: table.tableNumber,
          name: table.name,
          capacity: table.capacity,
          status: table.status
        }
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      throw createError('INTERNAL_ERROR', '获取餐桌信息失败', error.message);
    }
  }

  // 其他方法暂时省略...

  /**
   * 创建扫码点餐订单（公开API）
   * @param {Object} data
   * @param {string} data.storeId - 店铺ID
   * @param {string} [data.tableId] - 餐桌ID或tableNumber
   * @param {string} [data.customerName] - 顾客姓名
   * @param {string} [data.customerPhone] - 顾客手机号
   * @param {string} [data.customerNotes] - 备注
   * @param {string} [data.orderType] - 订单类型 (DINE_IN|TAKEAWAY|DELIVERY)
   * @param {Array} data.items - 菜品列表
   * @returns {Promise<Object>} 订单信息
   */
  async createScanOrder(data) {
    // 1. 验证店铺存在（支持slug或ID）
    let storeId = data.storeId;
    let store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      // 也可能是slug
      store = await prisma.store.findFirst({ where: { slug: storeId } });
      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在', 404);
      }
      storeId = store.id;
    }

    // 2. 验证餐桌
    let tableId = data.tableId || null;
    if (tableId) {
      const table = await prisma.table.findFirst({
        where: {
          storeId: storeId,
          OR: [
            { id: tableId },
            { tableNumber: tableId }
          ]
        }
      });
      if (table) {
        tableId = table.id;
      }
    }

    // 3. 提取菜品ID列表并验证菜品都存在于该店铺
    const menuItemIds = data.items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { category: { select: { storeId: true } } }
    });
    // 过滤出属于该店铺的菜品
    const validItems = menuItems.filter(item => item.category.storeId === storeId);
    if (validItems.length !== menuItemIds.length) {
      throw createError('BAD_REQUEST', '部分菜品不存在', 400);
    }

    // 4. 计算金额
    const itemPriceMap = {};
    validItems.forEach(item => { itemPriceMap[item.id] = item.price; });

    const subtotal = data.items.reduce((sum, item) => {
      return sum + (itemPriceMap[item.menuItemId] || 0) * (item.quantity || 1);
    }, 0);

    // 5. 生成订单号
    const orderNumber = 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    // 6. 创建订单
    const order = await prisma.order.create({
      data: {
        storeId: storeId,
        tableId: tableId,
        orderNumber: orderNumber,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        customerNotes: data.customerNotes || null,
        orderType: data.orderType || 'DINE_IN',
        status: 'PENDING',
        subtotal: subtotal,
        totalAmount: subtotal,
        items: {
          create: data.items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity || 1,
            unitPrice: itemPriceMap[item.menuItemId] || 0,
            totalPrice: (itemPriceMap[item.menuItemId] || 0) * (item.quantity || 1),
            specialInstructions: item.specialInstructions || null
          }))
        }
      },
      include: {
        items: true
      }
    });

    // 重新获取完整订单（含菜品名、餐桌号、店铺名）供打印使用
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { menuItem: { select: { name: true, price: true } } }
        },
        table: { select: { tableNumber: true } },
        store: { select: { name: true } }
      }
    });

    return {
      success: true,
      order: fullOrder
    };
  }

  /**
   * 获取订单状态（公开API）
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 订单状态信息
   */
  async getOrderStatus(orderId) {
    // 先用orderNumber查找，如果不存在则用id查找
    let order = await prisma.order.findUnique({
      where: { orderNumber: orderId },
      include: {
        items: {
          include: { menuItem: { select: { name: true, price: true } } }
        }
      }
    });

    if (!order) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { menuItem: { select: { name: true, price: true } } }
          }
        }
      });
    }

    if (!order) {
      throw createError('NOT_FOUND', '订单不存在', 404);
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerNotes: order.customerNotes,
      orderType: order.orderType,
      paymentStatus: order.paymentStatus,
      estimatedReadyAt: order.estimatedReadyAt,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        name: item.menuItem?.name || '未知菜品',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        specialInstructions: item.specialInstructions
      }))
    };
  }
}

export default new ScanService();