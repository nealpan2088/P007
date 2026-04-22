// 扫码点餐公开API服务
// 无需认证，顾客可直接访问

import { PrismaClient } from '@prisma/client';
import { createError } from '../error.service.js';

const prisma = new PrismaClient();

class ScanService {
  /**
   * 获取店铺菜单（公开API）
   * @param {string} storeId - 店铺ID
   * @param {string} tableId - 餐桌ID（可选）
   * @returns {Promise<Object>} 店铺信息和菜单
   */
  async getStoreMenu(storeId, tableId = null) {
    try {
      // 1. 获取店铺信息 - 支持ID或slug查找
      const store = await prisma.store.findFirst({
        where: {
          OR: [
            { id: storeId, status: 'ACTIVE' },
            { slug: storeId, status: 'ACTIVE' }
          ]
        }
        // 暂时不包含menuCategories，先测试店铺查找
      });

      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在或已停用');
      }

      // 2. 获取餐桌信息（如果提供了tableId）
      let table = null;
      if (tableId) {
        // 支持通过ID或tableNumber查找餐桌
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

      // 3. 构建API响应
      return {
        success: true,
        data: {
          store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            description: store.description,
            type: store.type,
            status: store.status
          },
          table: table ? {
            id: table.id,
            code: table.tableNumber,
            name: table.name
          } : null,
          menuItems: [],
          categories: []
        }
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        throw error;
      }
      throw createError('INTERNAL_ERROR', '获取菜单失败', error.message);
    }
  }

  /**
   * 创建扫码点餐订单（公开API）
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 创建的订单
   */
  async createScanOrder(orderData) {
    try {
      const {
        storeId,
        tableId,
        customerName,
        customerPhone,
        customerNotes,
        orderType = 'DINE_IN',
        items
      } = orderData;

      // 1. 验证店铺和餐桌 - 支持ID或slug查找
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

      let table = null;
      if (tableId) {
        // 支持通过ID或tableNumber查找餐桌
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

      // 2. 验证菜单项和计算价格
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId }
        });

        if (!menuItem) {
          throw createError('VALIDATION_ERROR', `菜品不存在: ${item.menuItemId}`);
        }

        if (!menuItem.isAvailable) {
          throw createError('VALIDATION_ERROR', `菜品已下架: ${menuItem.name}`);
        }

        const quantity = item.quantity || 1;
        const unitPrice = menuItem.price;
        const totalPrice = unitPrice.times(quantity);

        subtotal += parseFloat(totalPrice);

        orderItems.push({
          menuItemId: item.menuItemId,
          quantity,
          unitPrice,
          totalPrice,
          specialInstructions: item.specialInstructions || '',
          options: item.options || null
        });
      }

      if (orderItems.length === 0) {
        throw createError('VALIDATION_ERROR', '订单不能为空');
      }

      // 3. 计算总金额（暂时不考虑税费、折扣、配送费）
      const totalAmount = subtotal;

      // 4. 生成订单号
      const orderNumber = this.generateOrderNumber();

      // 5. 创建订单（使用事务确保数据一致性）
      const order = await prisma.$transaction(async (tx) => {
        // 创建订单
        const newOrder = await tx.order.create({
          data: {
            storeId,
            tableId,
            orderNumber,
            customerName,
            customerPhone,
            customerNotes,
            orderType,
            subtotal,
            totalAmount,
            items: {
              create: orderItems
            }
          },
          include: {
            items: {
              include: {
                menuItem: true
              }
            },
            store: true,
            table: true
          }
        });

        // 更新餐桌状态（如果是在店就餐）
        if (tableId && orderType === 'DINE_IN') {
          await tx.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' }
          });
        }

        return newOrder;
      });

      // 6. 异步触发打印（不阻塞响应）
      this.triggerPrintOrder(order.id).catch(err => {
        console.error('打印任务触发失败:', err);
        // 记录错误但不影响订单创建
      });

      // 7. 格式化响应
      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          orderType: order.orderType,
          status: order.status,
          subtotal: order.subtotal.toString(),
          totalAmount: order.totalAmount.toString(),
          estimatedReadyAt: order.estimatedReadyAt,
          createdAt: order.createdAt,
          items: order.items.map(item => ({
            id: item.id,
            name: item.menuItem.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
            specialInstructions: item.specialInstructions
          }))
        }
      };
    } catch (error) {
      console.error('创建订单失败 - 详细错误:', error);
      console.error('错误堆栈:', error.stack);
      console.error('请求数据:', orderData);
      
      if (error.code === 'NOT_FOUND' || error.code === 'VALIDATION_ERROR') {
        throw error;
      }
      throw createError('INTERNAL_ERROR', `创建订单失败: ${error.message}`, error.code);
    }
  }

  /**
   * 获取订单状态（公开API）
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 订单状态
   */
  async getOrderStatus(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              displayName: true,
              contactPhone: true
            }
          },
          table: {
            select: {
              id: true,
              tableNumber: true,
              name: true
            }
          },
          items: {
            include: {
              menuItem: {
                select: {
                  name: true,
                  preparationTime: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw createError('NOT_FOUND', '订单不存在');
      }

      // 计算预计就绪时间（基于菜品准备时间）
      let maxPreparationTime = 0;
      order.items.forEach(item => {
        if (item.menuItem.preparationTime > maxPreparationTime) {
          maxPreparationTime = item.menuItem.preparationTime;
        }
      });

      const estimatedReadyAt = new Date(order.createdAt);
      estimatedReadyAt.setMinutes(estimatedReadyAt.getMinutes() + maxPreparationTime);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        orderType: order.orderType,
        subtotal: order.subtotal.toString(),
        totalAmount: order.totalAmount.toString(),
        estimatedReadyAt: estimatedReadyAt.toISOString(),
        readyAt: order.readyAt,
        servedAt: order.servedAt,
        completedAt: order.completedAt,
        store: order.store,
        table: order.table,
        items: order.items.map(item => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          status: item.status,
          specialInstructions: item.specialInstructions
        })),
        printerStatus: order.printerStatus,
        printedAt: order.printedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        throw error;
      }
      throw createError('INTERNAL_ERROR', '获取订单状态失败', error.message);
    }
  }

  /**
   * 生成订单号
   * @returns {string} 订单号
   */
  generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `ORD-${year}${month}${day}-${random}`;
  }

  /**
   * 异步触发打印订单
   * @param {string} orderId - 订单ID
   */
  async triggerPrintOrder(orderId) {
    try {
      // 这里会调用打印服务
      // 为了快速上线，我们先简单记录，稍后实现完整打印服务
      console.log(`[打印任务] 触发订单打印: ${orderId}`);
      
      // 更新订单打印状态
      await prisma.order.update({
        where: { id: orderId },
        data: {
          printerStatus: 'PENDING',
          updatedAt: new Date()
        }
      });
      
      // TODO: 实现完整的打印队列系统
    } catch (error) {
      console.error('触发打印失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取店铺信息（公开API）
   * @param {string} storeId - 店铺ID或slug
   * @returns {Promise<Object>} 店铺信息
   */
  async getStoreInfo(storeId) {
    try {
      // 支持ID或slug查找
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
          logoUrl: true,
          address: true,
          contactPhone: true,
          contactEmail: true,
          businessHours: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在或已停用');
      }

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
   * 获取餐桌信息（公开API）
   * @param {string} storeId - 店铺ID或slug
   * @param {string} tableId - 餐桌ID或tableNumber
   * @returns {Promise<Object>} 餐桌信息
   */
  async getTableInfo(storeId, tableId) {
    try {
      // 1. 先查找店铺
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

      // 2. 查找餐桌 - 支持ID或tableNumber查找
      const table = await prisma.table.findFirst({
        where: {
          storeId: store.id,
          OR: [
            { id: tableId },
            { tableNumber: tableId }
          ]
        },
        select: {
          id: true,
          name: true,
          tableNumber: true,
          capacity: true,
          status: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!table) {
        throw createError('NOT_FOUND', '餐桌不存在');
      }

      return {
        success: true,
        data: {
          ...table,
          code: table.tableNumber // 兼容前端使用的code字段
        }
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        throw error;
      }
      throw createError('INTERNAL_ERROR', '获取餐桌信息失败', error.message);
    }
  }
}

export default new ScanService();