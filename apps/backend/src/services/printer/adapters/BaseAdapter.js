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
    const items = order.items || [];
    const lines = [];

    lines.push('[C]<B>' + (order.storeName || '订单') + '</B>');
    lines.push('[C]==============================');
    lines.push('订单号: ' + order.orderNumber);
    if (order.tableName) {
      lines.push('桌号: ' + order.tableName);
    }
    lines.push('时间: ' + (order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : ''));
    lines.push('[C]==============================');
    lines.push('[C]<B>菜品明细</B>');
    lines.push('');

    items.forEach(item => {
      const name = item.name || item.menuItem?.name || '未知菜品';
      const qty = item.quantity || 1;
      const price = item.price || item.unitPrice || 0;
      lines.push(name + ' x' + qty);
      lines.push('    ¥' + Number(price).toFixed(2));
      if (item.specialInstructions) {
        lines.push('    * ' + item.specialInstructions);
      }
    });

    lines.push('');
    lines.push('[C]==============================');
    lines.push('[C]<B>合计: ¥' + Number(order.totalAmount || 0).toFixed(2) + '</B>');
    lines.push('[C]==============================');
    lines.push('[C]感谢您的光临！');
    lines.push('[C]祝您用餐愉快！');
    lines.push('');
    lines.push('');  // 切纸留空

    return lines.join('\n');
  }
}
