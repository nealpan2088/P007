// 麒麟项目 - 订单服务
// 提供订单查询相关的业务逻辑

import { publicDb } from '../db/index.js';
import { createError } from '../utils/error-handler.js';

/**
 * 订单服务类
 */
class OrderService {
  constructor() {
    this.db = publicDb;
  }

  /**
   * 获取租户下所有店铺的订单
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 订单列表和统计
   */
  async getOrdersByTenant(tenantId, userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      // 检查用户权限
      const userTenant = await this.db.userTenant.findFirst({
        where: {
          userId,
          tenantId,
          status: 'ACTIVE'
        }
      });

      if (!userTenant) {
        throw createError('FORBIDDEN', '没有权限查看订单');
      }

      // 获取租户下所有店铺ID
      const stores = await this.db.store.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true }
      });

      const storeIds = stores.map(s => s.id);

      if (storeIds.length === 0) {
        return {
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        };
      }

      // 构建查询条件
      const where = {
        storeId: { in: storeIds }
      };

      if (status) {
        where.status = status;
      }

      // 查询订单
      const [orders, total] = await Promise.all([
        this.db.order.findMany({
          where,
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            table: {
              select: {
                id: true,
                label: true
              }
            },
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
                notes: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        this.db.order.count({ where })
      ]);

      return {
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      if (error.code === 'FORBIDDEN') throw error;
      throw createError('INTERNAL_ERROR', '获取订单列表失败');
    }
  }

  /**
   * 获取租户下订单统计
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 订单统计信息
   */
  async getOrderStatsByTenant(tenantId, userId) {
    try {
      // 检查用户权限
      const userTenant = await this.db.userTenant.findFirst({
        where: {
          userId,
          tenantId,
          status: 'ACTIVE'
        }
      });

      if (!userTenant) {
        throw createError('FORBIDDEN', '没有权限查看订单统计');
      }

      // 获取租户下所有店铺ID
      const stores = await this.db.store.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true }
      });

      const storeIds = stores.map(s => s.id);

      if (storeIds.length === 0) {
        return {
          success: true,
          data: {
            total: 0,
            pending: 0,
            preparing: 0,
            ready: 0,
            completed: 0,
            cancelled: 0,
            todayCount: 0,
            todayRevenue: 0,
            totalRevenue: 0
          }
        };
      }

      // 并行查询各种统计
      const [
        total,
        pending,
        preparing,
        ready,
        completed,
        cancelled,
        todayOrders,
        allOrders
      ] = await Promise.all([
        this.db.order.count({ where: { storeId: { in: storeIds } } }),
        this.db.order.count({ where: { storeId: { in: storeIds }, status: 'PENDING' } }),
        this.db.order.count({ where: { storeId: { in: storeIds }, status: 'PREPARING' } }),
        this.db.order.count({ where: { storeId: { in: storeIds }, status: 'READY' } }),
        this.db.order.count({ where: { storeId: { in: storeIds }, status: 'COMPLETED' } }),
        this.db.order.count({ where: { storeId: { in: storeIds }, status: 'CANCELLED' } }),
        this.db.order.findMany({
          where: {
            storeId: { in: storeIds },
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          select: { totalAmount: true }
        }),
        this.db.order.findMany({
          where: { storeId: { in: storeIds } },
          select: { totalAmount: true }
        })
      ]);

      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        success: true,
        data: {
          total,
          pending,
          preparing,
          ready,
          completed,
          cancelled,
          todayCount: todayOrders.length,
          todayRevenue,
          totalRevenue
        }
      };
    } catch (error) {
      if (error.code === 'FORBIDDEN') throw error;
      throw createError('INTERNAL_ERROR', '获取订单统计失败');
    }
  }
}

// 创建单例实例
const orderService = new OrderService();

export default orderService;
