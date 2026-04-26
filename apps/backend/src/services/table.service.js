/**
 * 餐桌管理服务
 * 提供餐桌的CRUD、批量状态更新、二维码信息生成等功能
 */

import { publicDb } from '../db/index.js';

class TableService {
  /**
   * 获取店铺下的所有餐桌
   * @param {string} storeId
   */
  async getTables(storeId) {
    return publicDb.table.findMany({
      where: { storeId },
      orderBy: { tableNumber: 'asc' },
      include: {
        _count: { select: { orders: true } },
      },
    });
  }

  /**
   * 获取单个餐桌详情
   * @param {string} tableId
   */
  async getTableById(tableId) {
    return publicDb.table.findUnique({
      where: { id: tableId },
      include: {
        _count: { select: { orders: true } },
      },
    });
  }

  /**
   * 创建餐桌
   * @param {string} storeId
   * @param {Object} data
   */
  async createTable(storeId, data) {
    const { tableNumber, name, capacity, notes } = data;
    return publicDb.table.create({
      data: {
        storeId,
        tableNumber,
        name: name || tableNumber,
        capacity: capacity || 4,
        notes,
      },
    });
  }

  /**
   * 批量创建餐桌
   * @param {string} storeId
   * @param {Array<{tableNumber: string, name?: string, capacity?: number}>} tables
   */
  async batchCreateTables(storeId, tables) {
    const result = await publicDb.$transaction(
      tables.map((t) =>
        publicDb.table.create({
          data: {
            storeId,
            tableNumber: t.tableNumber,
            name: t.name || t.tableNumber,
            capacity: t.capacity || 4,
          },
        }),
      ),
    );
    return result;
  }

  /**
   * 更新餐桌
   * @param {string} tableId
   * @param {Object} data
   */
  async updateTable(tableId, data) {
    return publicDb.table.update({
      where: { id: tableId },
      data,
    });
  }

  /**
   * 批量更新餐桌状态
   * @param {string} storeId - 店铺ID
   * @param {string[]} tableIds - 餐桌ID数组
   * @param {string} status - 目标状态
   */
  async batchUpdateStatus(storeId, tableIds, status) {
    const result = await publicDb.table.updateMany({
      where: {
        id: { in: tableIds },
        storeId,
      },
      data: { status },
    });
    return result;
  }

  /**
   * 删除餐桌
   * @param {string} tableId
   */
  async deleteTable(tableId) {
    return publicDb.table.delete({
      where: { id: tableId },
    });
  }

  /**
   * 批量删除餐桌
   * @param {string} storeId
   * @param {string[]} tableIds
   */
  async batchDeleteTables(storeId, tableIds) {
    return publicDb.table.deleteMany({
      where: {
        id: { in: tableIds },
        storeId,
      },
    });
  }

  /**
   * 获取餐桌的扫码二维码链接
   * @param {string} storeId
   * @param {string} storeSlug
   * @param {string} tableId
   * @param {string} tableNumber
   */
  getQrCodeUrl(storeSlug, tableId, tableNumber) {
    return `/t/sdsd/s/${storeSlug}/scan/${tableNumber}`;
  }
}

export default new TableService();
