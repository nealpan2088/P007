/**
 * 打印调度器
 * 订单提交成功后异步触发打印，不阻塞下单流程
 */

import { PrismaClient } from '@prisma/client';
import { getAdapter } from './adapters/index.js';

const prisma = new PrismaClient();

/**
 * 订单创建后触发打印
 * @param {Object} order - 完整订单数据（含 items）
 * @param {string} storeId - 店铺ID
 */
export async function dispatchPrintJob(order, storeId) {
  // 异步执行，不阻塞主流程
  setTimeout(async () => {
    try {
      // 查找该店铺的活跃打印机
      const printers = await prisma.printer.findMany({
        where: {
          storeId,
          status: 'ACTIVE',
        },
        include: {
          brand: true,
        },
      });

      if (printers.length === 0) {
        console.log(`[打印] 店铺 ${storeId} 未配置打印机，跳过`);
        return;
      }

      for (const printer of printers) {
        try {
          const adapter = getAdapter(printer.brand.code);
          // 标准化order数据结构（Prisma返回嵌套结构，formatPrintContent需要扁平字段）
          const formattedOrder = {
            ...order,
            storeName: order.store?.name || '',
            tableName: order.table?.tableNumber || order.tableId || '',
            // items已经是完整结构，formatPrintContent兼容 item.menuItem?.name
          };
          const result = await adapter.print(formattedOrder, {
            serialNumber: printer.serialNumber,
            secretKey: printer.secretKey,
            model: printer.model,
            name: printer.name,
          });

          if (result.success) {
            console.log(`[打印] ✅ 订单 ${order.orderNumber} 打印成功，打印机: ${printer.name || printer.serialNumber}`);
          } else {
            console.error(`[打印] ❌ 订单 ${order.orderNumber} 打印失败: ${result.message}`);
          }
        } catch (adapterError) {
          console.error(`[打印] ❌ 适配器异常 (${printer.brand?.code}):`, adapterError.message);
        }
      }
    } catch (error) {
      console.error('[打印] 调度异常:', error.message);
    }
  }, 0);
}
