/**
 * 打印机适配器基类
 * 所有品牌适配器必须继承此类
 */

export default class BaseAdapter {
  /**
   * 打印订单
   * @param {Object} order  - 订单数据
   * @param {Object} printer - 打印机配置 {serialNumber, secretKey, brand, model}
   * @returns {Promise<{success: boolean, message: string, printJobId?: string}>}
   */
  async print(order, printer) {
    throw new Error('未实现 print 方法');
  }

  /**
   * 测试打印机连接
   * @param {Object} printer - 打印机配置
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testConnection(printer) {
    throw new Error('未实现 testConnection 方法');
  }

  /**
   * 获取品牌代码
   */
  getBrandCode() {
    throw new Error('未实现 getBrandCode 方法');
  }

  /**
   * 格式化打印内容（子类可覆写）
   */
  formatPrintContent(order) {
    // printType: order(普通订单) | timeout_reminder(超时催单)
    const printType = order.printType || 'order';

    if (printType === 'timeout_reminder') {
      return this._formatTimeoutReminder(order);
    }

    return this._formatOrderTicket(order);
  }

  /**
   * 普通订单小票排版
   */
  _formatOrderTicket(order) {
    const items = order.items || [];
    const lines = [];

    lines.push('[C]<B>' + (order.storeName || '订单') + '</B>');
    lines.push('[C]==============================');
    lines.push('订单号: ' + order.orderNumber);
    // 显示就餐桌号或打包标识
    if (order.orderType === 'TAKEAWAY') {
      lines.push('就餐方式: 📦 打包带走');
    } else if (order.tableName) {
      lines.push('桌号: ' + order.tableName);
    }
    // 显示备注信息
    if (order.customerNotes) {
      lines.push('备注: ' + order.customerNotes);
    }
    lines.push('订单类型: ' + (order.printType === 'timeout_reminder' ? '催单' : '新单'));
    lines.push('时间: ' + (order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : ''));
    lines.push('[C]==============================');
    lines.push('[L]<B>菜品                   金额</B>');
    lines.push('[C]------------------------------');

    items.forEach(item => {
      const name = item.name || item.menuItem?.name || '未知菜品';
      const qty = item.quantity || 1;
      const price = item.price || item.unitPrice || 0;
      const total = Number(price * qty).toFixed(2);
      const displayName = qty > 1 ? name + ' x' + qty : name;
      // 左对齐菜名，右对齐金额（58mm纸约32个中文字符宽）
      const padWidth = 28;
      const namePart = displayName.length > padWidth ? displayName.substring(0, padWidth - 2) + '..' : displayName;
      const dots = '.'.repeat(Math.max(2, padWidth - namePart.length - total.length));
      lines.push(namePart + dots + '¥' + total);
      if (item.specialInstructions) {
        lines.push('  ※ ' + item.specialInstructions);
      }
    });

    lines.push('[C]------------------------------');
    lines.push('[L]<B>合计:                        ¥' + Number(order.totalAmount || 0).toFixed(2) + '</B>');
    lines.push('[C]==============================');
    lines.push('[C]感谢您的光临！');
    lines.push('[C]祝您用餐愉快！');
    lines.push('');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 超时催单小票排版（醒目区分，顶部大标题+闪烁）
   */
  _formatTimeoutReminder(order) {
    const items = order.items || [];
    const lines = [];

    lines.push('[C]<B><FB>⚠️ 超时提醒 ⚠️</FB></B>');
    lines.push('[C]==============================');
    lines.push('[C]以下订单已超15分钟未出餐！');
    lines.push('[C]请尽快处理！');
    lines.push('[C]==============================');
    lines.push('订单号: ' + order.orderNumber);
    if (order.tableName) {
      lines.push('桌号: ' + order.tableName);
    }
    lines.push('下单时间: ' + (order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : ''));
    lines.push('[C]==============================');
    if (items.length > 0) {
      lines.push('[C]未出餐菜品:');
      items.forEach(item => {
        const name = item.name || item.menuItem?.name || '未知菜品';
        const qty = item.quantity || 1;
        lines.push('  ' + name + ' x' + qty);
      });
    }
    lines.push('[C]==============================');
    lines.push('[C]<B><FB>请尽快出餐！</FB></B>');
    lines.push('[C]==============================');
    lines.push('');
    lines.push('');

    return lines.join('\n');
  }
}
