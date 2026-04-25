/**
 * 商鹏云打印机适配器
 * 基于官方API文档实现
 * API地址: https://open.spyun.net/v1
 *
 * 设计说明：
 * - 平台统一管理所有分店打印机
 * - 签名使用平台 appid + appsecret
 * - 添加/删除打印机时同步云端
 * - 打印时只需sn，签名用平台凭证
 */

import BaseAdapter from './BaseAdapter.js';
import ShangpengSignatureService from './ShangpengSignatureService.js';

const BASE_URL = process.env.SHANGPENG_BASE_URL || 'https://open.spyun.net/v1';

// 打印机凭证必须通过环境变量配置，禁止硬编码
const PLATFORM_APPID = process.env.SHANGPENG_APP_ID;
const PLATFORM_APPSECRET = process.env.SHANGPENG_APP_SECRET;

if (!PLATFORM_APPID || !PLATFORM_APPSECRET) {
  throw new Error(
    '[打印机] 缺少凭证配置: 请在 .env 中设置 SHANGPENG_APP_ID 和 SHANGPENG_APP_SECRET'
  );
}

export default class ShangpengAdapter extends BaseAdapter {
  getBrandCode() {
    return 'shangpeng';
  }

  /**
   * 生成通用请求参数（含签名）
   */
  _makeParams(extraParams) {
    const sigService = new ShangpengSignatureService(PLATFORM_APPID, PLATFORM_APPSECRET);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = { appid: PLATFORM_APPID, timestamp, ...extraParams };
    return sigService.generateSignedParams(params);
  }

  /**
   * 转为 application/x-www-form-urlencoded 格式
   */
  _toFormBody(params) {
    const sigService = new ShangpengSignatureService(PLATFORM_APPID, PLATFORM_APPSECRET);
    return sigService.toFormUrlEncoded(params);
  }

  /**
   * 调API并统一解析响应
   */
  async _request(method, path, params) {
    const signedParams = this._makeParams(params);
    const url = `${BASE_URL}${path}`;
    const formBody = this._toFormBody(signedParams);

    const fetchOptions = {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      signal: AbortSignal.timeout(15000),
    };

    if (method === 'POST') {
      fetchOptions.body = formBody;
    } else if (method === 'DELETE') {
      // DELETE请求参数在URL中
      fetchOptions.method = 'DELETE';
    }

    // DELETE 或 GET 请求把参数放URL
    const requestUrl = (method === 'POST')
      ? url
      : `${url}?${formBody}`;

    const response = await fetch(requestUrl, fetchOptions);
    return response.json();
  }

  // ==================== 设备管理 ====================

  /**
   * 添加打印机到商鹏云平台
   * POST /printer/add
   * 参数: sn, pkey, name, business
   * 注意: name参数需使用英文，中文可能导致签名验证失败
   */
  async addPrinterToCloud(printerData) {
    const { serialNumber: sn, secretKey: pkey, name } = printerData;
    // 商鹏API签名对中文支持不稳定，使用sn作为云端设备名
    const cloudName = name ? name.replace(/[^\x00-\x7F]/g, '') || sn : sn;
    const result = await this._request('POST', '/printer/add', {
      sn, pkey,
      name: cloudName,
      business: '1',
    });

    if (result.errorcode === 0 || result.errorcode === 5) {
      return {
        success: true,
        message: result.errorcode === 0 ? '打印机已成功添加到云端' : '打印机已在云端注册',
      };
    }

    throw new Error(`添加打印机失败: ${result.errormsg || '错误码: ' + result.errorcode}`);
  }

  /**
   * 从商鹏云删除设备
   * DELETE /printer/delete
   * 参数: sn
   */
  async deletePrinterFromCloud(sn) {
    const result = await this._request('DELETE', '/printer/delete', { sn });
    if (result.errorcode === 0) {
      return { success: true, message: '设备已从云端删除' };
    }
    return {
      success: false,
      message: `删除失败: ${result.errormsg || '错误码: ' + result.errorcode}`,
    };
  }

  /**
   * 清空设备待打印订单
   * DELETE /printer/cleansqs
   * 参数: sn
   */
  async clearPrintQueue(sn) {
    const result = await this._request('DELETE', '/printer/cleansqs', { sn });
    if (result.errorcode === 0) {
      return { success: true, message: `已清空，清除了 ${result.cleannum || 0} 条待打印`, cleannum: result.cleannum };
    }
    return {
      success: false,
      message: `清空失败: ${result.errormsg || '错误码: ' + result.errorcode}`,
    };
  }

  /**
   * 获取设备信息
   * GET /printer/info
   * 参数: sn
   */
  async getPrinterInfo(sn) {
    const result = await this._request('GET', '/printer/info', { sn });
    if (result.errorcode === 0) {
      return {
        success: true,
        data: {
          sn: result.sn,
          model: result.model,
          modelName: result.model_name,
          modelType: result.model_type,
          name: result.name,
          online: result.online === 1,
          status: result.status,
          queueCount: result.sqsnum,
          voice: result.voice,
          autoCut: result.auto_cut,
          net: result.net,
        },
      };
    }
    return {
      success: false,
      message: `获取设备信息失败: ${result.errormsg || '错误码: ' + result.errorcode}`,
    };
  }

  /**
   * 查询打印订单状态
   * GET /printer/order/status
   * 参数: id (打印订单ID)
   */
  async getPrintStatus(printJobId) {
    const result = await this._request('GET', '/printer/order/status', { id: printJobId });
    if (result.errorcode === 0) {
      return {
        success: true,
        printed: result.status,
        printTime: result.print_time,
      };
    }
    return {
      success: false,
      message: `查询失败: ${result.errormsg || '错误码: ' + result.errorcode}`,
    };
  }

  /**
   * 查询设备历史打印订单数
   * GET /printer/order/number
   * 参数: sn, date (格式: 2019-01-01)
   */
  async getPrintOrderCount(sn, date) {
    const result = await this._request('GET', '/printer/order/number', { sn, date });
    if (result.errorcode === 0) {
      return {
        success: true,
        count: result.print_num || 0,
      };
    }
    return {
      success: false,
      message: `查询失败: ${result.errormsg || '错误码: ' + result.errorcode}`,
    };
  }

  // ==================== 核心打印 ====================

  /**
   * 打印订单
   * POST /printer/print
   * 参数: sn, content, times
   */
  async print(order, printer) {
    const { serialNumber: sn } = printer;
    const printContent = this.formatPrintContent(order);

    try {
      const result = await this._request('POST', '/printer/print', {
        sn,
        content: printContent,
        times: '1',
      });

      if (result.errorcode === 0) {
        return {
          success: true,
          message: '打印成功',
          printJobId: result.id,
          raw: result,
        };
      }

      return {
        success: false,
        message: `打印失败: ${result.errormsg || '错误码: ' + result.errorcode}`,
        errorCode: result.errorcode,
        raw: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `打印异常: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * 测试打印机连接（发送测试内容）
   */
  async testConnection(printer) {
    const { serialNumber: sn } = printer;
    const testContent = `[C]连接测试\n[C]${new Date().toLocaleString('zh-CN')}\n[C]如果看到此内容表示连接正常`;

    try {
      const result = await this._request('POST', '/printer/print', {
        sn,
        content: testContent,
        times: '1',
      });

      if (result.errorcode === 0) {
        return { success: true, message: '连接成功，测试打印已发送' };
      }

      return {
        success: false,
        message: `连接失败: ${result.errormsg || '错误码: ' + result.errorcode}`,
      };
    } catch (error) {
      return { success: false, message: `连接异常: ${error.message}` };
    }
  }
}
