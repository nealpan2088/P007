/**
 * 打印机适配器工厂
 * 动态注册和获取品牌适配器
 */

import ShangpengAdapter from './ShangpengAdapter.js';

const adapters = {};

/**
 * 注册适配器
 */
export function registerAdapter(brandCode, AdapterClass) {
  adapters[brandCode] = new AdapterClass();
}

/**
 * 获取适配器
 */
export function getAdapter(brandCode) {
  const adapter = adapters[brandCode];
  if (!adapter) {
    throw new Error(`不支持的打印机品牌: ${brandCode}`);
  }
  return adapter;
}

/**
 * 获取所有注册的品牌代码
 */
export function getRegisteredBrands() {
  return Object.keys(adapters);
}

// 默认注册商鹏
registerAdapter('shangpeng', ShangpengAdapter);
