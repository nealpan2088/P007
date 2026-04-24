/**
 * 打印机管理服务
 * CRUD操作 + 云端同步（商鹏等品牌）
 */

import { PrismaClient } from '@prisma/client';
import { getAdapter, registerAdapter } from './adapters/index.js';

const prisma = new PrismaClient();

export default class PrinterService {
  /**
   * 获取店铺的打印机列表
   */
  async getStorePrinters(storeId) {
    return prisma.printer.findMany({
      where: { storeId },
      include: { brand: { select: { name: true, code: true, baseUrl: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * 添加打印机
   * 同步注册到云端（如商鹏云）+ 写入本地数据库
   */
  async addPrinter(data) {
    const { storeId, brandCode, name, serialNumber, secretKey, model, printCopies, isDefault } = data;

    // 验证品牌存在
    const brand = await prisma.printerBrand.findUnique({ where: { code: brandCode } });
    if (!brand) {
      throw Object.assign(new Error(`打印机品牌 "${brandCode}" 不存在`), { statusCode: 400 });
    }

    // 同步注册到云端
    try {
      const adapter = getAdapter(brandCode);
      if (adapter && typeof adapter.addPrinterToCloud === 'function') {
        await adapter.addPrinterToCloud({ serialNumber, secretKey, name: name || serialNumber });
        console.log(`[打印机] 云端注册成功: ${serialNumber}`);
      }
    } catch (cloudError) {
      // 云端注册失败不影响本地保存，记录日志
      console.error(`[打印机] 云端注册失败 (${serialNumber}): ${cloudError.message}`);
    }

    // 如果设为默认，先取消其他默认
    if (isDefault) {
      await prisma.printer.updateMany({
        where: { storeId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.printer.create({
      data: {
        storeId,
        brandId: brand.id,
        name,
        serialNumber,
        secretKey,
        model,
        printCopies: printCopies || 1,
        isDefault: isDefault || false,
      },
      include: { brand: { select: { name: true, code: true } } },
    });
  }

  /**
   * 更新打印机（仅本地）
   */
  async updatePrinter(id, data) {
    const { name, serialNumber, secretKey, model, printCopies, status, isDefault } = data;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (secretKey !== undefined) updateData.secretKey = secretKey;
    if (model !== undefined) updateData.model = model;
    if (printCopies !== undefined) updateData.printCopies = printCopies;
    if (status !== undefined) updateData.status = status;
    if (isDefault !== undefined) {
      const printer = await prisma.printer.findUnique({ where: { id } });
      if (printer && isDefault) {
        await prisma.printer.updateMany({
          where: { storeId: printer.storeId, isDefault: true },
          data: { isDefault: false },
        });
      }
      updateData.isDefault = isDefault;
    }

    return prisma.printer.update({
      where: { id },
      data: updateData,
      include: { brand: { select: { name: true, code: true } } },
    });
  }

  /**
   * 删除打印机
   * 同步从云端移除 + 删除本地记录
   */
  async deletePrinter(id) {
    const printer = await prisma.printer.findUnique({
      where: { id },
      include: { brand: { select: { code: true } } },
    });

    if (!printer) {
      throw Object.assign(new Error('打印机不存在'), { statusCode: 404 });
    }

    // 同步从云端删除
    try {
      const adapter = getAdapter(printer.brand.code);
      if (adapter && typeof adapter.deletePrinterFromCloud === 'function') {
        await adapter.deletePrinterFromCloud(printer.serialNumber);
        console.log(`[打印机] 已从云端删除: ${printer.serialNumber}`);
      }
    } catch (cloudError) {
      console.error(`[打印机] 云端删除失败 (${printer.serialNumber}): ${cloudError.message}`);
    }

    return prisma.printer.delete({ where: { id } });
  }

  /**
   * 清空打印机待打印队列
   */
  async clearPrintQueue(printerId) {
    const printer = await prisma.printer.findUnique({
      where: { id: printerId },
      include: { brand: { select: { code: true } } },
    });

    if (!printer) {
      throw Object.assign(new Error('打印机不存在'), { statusCode: 404 });
    }

    const adapter = getAdapter(printer.brand.code);
    if (!adapter || typeof adapter.clearPrintQueue !== 'function') {
      throw Object.assign(new Error('该品牌不支持清空队列功能'), { statusCode: 400 });
    }

    return adapter.clearPrintQueue(printer.serialNumber);
  }

  /**
   * 测试打印机连接
   */
  async testPrinter(printerId) {
    const printer = await prisma.printer.findUnique({
      where: { id: printerId },
      include: { brand: true },
    });

    if (!printer) {
      throw Object.assign(new Error('打印机不存在'), { statusCode: 404 });
    }

    const adapter = getAdapter(printer.brand.code);
    return adapter.testConnection({
      serialNumber: printer.serialNumber,
      secretKey: printer.secretKey,
      name: printer.name,
    });
  }

  /**
   * 获取打印机信息（含在线状态）
   */
  async getPrinterInfo(printerId) {
    const printer = await prisma.printer.findUnique({
      where: { id: printerId },
      include: { brand: { select: { code: true } } },
    });

    if (!printer) {
      throw Object.assign(new Error('打印机不存在'), { statusCode: 404 });
    }

    const adapter = getAdapter(printer.brand.code);
    if (!adapter || typeof adapter.getPrinterInfo !== 'function') {
      throw Object.assign(new Error('该品牌不支持查询状态'), { statusCode: 400 });
    }

    return adapter.getPrinterInfo(printer.serialNumber);
  }

  /**
   * 获取所有打印机品牌
   */
  async getBrands() {
    return prisma.printerBrand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * 初始化默认品牌数据
   */
  async initDefaultBrands() {
    const count = await prisma.printerBrand.count();
    if (count > 0) return;

    await prisma.printerBrand.createMany({
      data: [
        {
          name: '商鹏云打印',
          code: 'shangpeng',
          baseUrl: 'https://open.spyun.net/v1',
          apiVersion: 'v1',
          isActive: true,
        },
        {
          name: '飞鹅云打印',
          code: 'feie',
          baseUrl: 'https://api.feieyun.cn',
          apiVersion: 'v1',
          isActive: false,
        },
        {
          name: '易联云',
          code: 'yilianyun',
          baseUrl: 'https://api.10ss.net',
          apiVersion: 'v1',
          isActive: false,
        },
      ],
    });

    console.log('[打印机] 默认品牌数据已初始化');
  }
}
