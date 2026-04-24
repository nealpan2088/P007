/**
 * 商鹏云签名服务（ESM版）
 * 严格按官方签名算法实现
 * 规则：
 * 1. 空字符串不参与签名，"0"参与签名
 * 2. 参数按ASCII字典序排序
 * 3. 签名结果转大写
 * 4. sign参数不参与签名
 */

import crypto from 'crypto';

const DEFAULT_APPID = process.env.SHANGPENG_APP_ID || 'sp69c62e5025d1e';
const DEFAULT_APPSECRET = process.env.SHANGPENG_APP_SECRET || '3e9bd77a8e2f8d571a06ca777269dfbb';

export default class ShangpengSignatureService {
  constructor(appid = DEFAULT_APPID, appsecret = DEFAULT_APPSECRET) {
    this.appid = appid;
    this.appsecret = appsecret;
  }

  /**
   * 检查参数是否为空（按文档定义）
   * 空字符串不参与签名，"0"参与签名
   */
  isEmpty(value) {
    return value === null || value === undefined || value === '';
  }

  /**
   * 生成签名
   */
  generateSignature(params) {
    const paramsForSign = { ...params };
    delete paramsForSign.sign;

    // 过滤空值
    const filteredParams = {};
    Object.keys(paramsForSign).forEach(key => {
      if (!this.isEmpty(paramsForSign[key])) {
        filteredParams[key] = paramsForSign[key];
      }
    });

    // ASCII字典序排序
    const sortedKeys = Object.keys(filteredParams).sort((a, b) => a.localeCompare(b));

    // 构建stringA
    const stringA = sortedKeys
      .map(key => `${key}=${filteredParams[key].toString()}`)
      .join('&');

    // 拼接appsecret
    const stringSignTemp = stringA + '&appsecret=' + this.appsecret;

    // MD5 + 大写
    return crypto.createHash('md5')
      .update(stringSignTemp)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * 生成带签名的完整参数
   */
  generateSignedParams(params) {
    const signature = this.generateSignature(params);
    return { ...params, sign: signature };
  }

  /**
   * 将参数转换为URL编码格式
   */
  toFormUrlEncoded(params) {
    return Object.keys(params)
      .filter(key => !this.isEmpty(params[key]))
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key].toString())}`)
      .join('&');
  }
}
