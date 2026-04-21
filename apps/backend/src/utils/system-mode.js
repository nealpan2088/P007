// 麒麟项目 - 系统模式工具
// 根据环境变量 SYSTEM_MODE 提供不同的业务逻辑实现

import config from '../config/dynamic-config.js';

/**
 * 系统模式工具类
 * 提供根据系统模式选择不同实现的工具函数
 */
class SystemMode {
  constructor() {
    this.systemConfig = config.system;
  }
  
  /**
   * 获取当前系统模式
   * @returns {string} 'single' 或 'multi'
   */
  getMode() {
    return this.systemConfig.mode;
  }
  
  /**
   * 检查是否为单店模式
   * @returns {boolean}
   */
  isSingleStore() {
    return this.systemConfig.isSingleStore;
  }
  
  /**
   * 检查是否为多租户模式
   * @returns {boolean}
   */
  isMultiTenant() {
    return this.systemConfig.isMultiTenant;
  }
  
  /**
   * 获取单店配置
   * @returns {Object} 单店配置信息
   */
  getSingleStoreConfig() {
    return this.systemConfig.singleStore;
  }
  
  /**
   * 获取功能开关状态
   * @returns {Object} 功能开关对象
   */
  getFeatures() {
    return this.systemConfig.features;
  }
  
  /**
   * 检查特定功能是否启用
   * @param {string} featureName 功能名称
   * @returns {boolean}
   */
  isFeatureEnabled(featureName) {
    return this.systemConfig.features[featureName] === true;
  }
  
  /**
   * 根据系统模式执行不同的逻辑
   * @param {Function} singleStoreLogic 单店模式逻辑
   * @param {Function} multiTenantLogic 多租户模式逻辑
   * @returns {*} 执行结果
   */
  executeByMode(singleStoreLogic, multiTenantLogic) {
    if (this.isSingleStore()) {
      return singleStoreLogic();
    } else {
      return multiTenantLogic();
    }
  }
  
  /**
   * 获取店铺ID（根据模式）
   * @param {string} tenantId 租户ID（多租户模式）
   * @param {string} storeId 店铺ID（多租户模式）
   * @returns {string} 实际使用的店铺ID
   */
  getStoreId(tenantId = null, storeId = null) {
    if (this.isSingleStore()) {
      return this.systemConfig.singleStore.storeId;
    } else {
      // 多租户模式需要租户ID和店铺ID
      if (!tenantId || !storeId) {
        throw new Error('多租户模式需要提供租户ID和店铺ID');
      }
      return storeId;
    }
  }
  
  /**
   * 获取租户ID（单店模式返回默认租户）
   * @param {string} tenantId 租户ID（多租户模式）
   * @returns {string} 实际使用的租户ID
   */
  getTenantId(tenantId = null) {
    if (this.isSingleStore()) {
      // 单店模式使用默认租户
      return 'single_store_tenant';
    } else {
      if (!tenantId) {
        throw new Error('多租户模式需要提供租户ID');
      }
      return tenantId;
    }
  }
  
  /**
   * 构建数据库Schema名称（根据模式）
   * @param {string} tenantId 租户ID
   * @returns {string} Schema名称
   */
  buildSchemaName(tenantId = null) {
    if (this.isSingleStore()) {
      // 单店模式使用公共Schema
      return 'public';
    } else {
      if (!tenantId) {
        throw new Error('多租户模式需要提供租户ID来构建Schema名称');
      }
      return `tenant_${tenantId}`;
    }
  }
  
  /**
   * 验证API访问权限（根据模式）
   * @param {Object} user 用户对象
   * @param {string} tenantId 租户ID
   * @param {string} storeId 店铺ID
   * @returns {boolean} 是否有权限
   */
  validateAccess(user, tenantId = null, storeId = null) {
    if (this.isSingleStore()) {
      // 单店模式：所有认证用户都可以访问
      return !!user;
    } else {
      // 多租户模式：需要验证用户-租户关系
      if (!user || !tenantId) {
        return false;
      }
      
      // 这里可以添加更复杂的权限验证逻辑
      // 例如检查用户是否属于该租户，是否有特定角色等
      return true; // 简化实现
    }
  }
  
  /**
   * 获取系统模式信息（用于API响应）
   * @returns {Object} 系统模式信息
   */
  getSystemInfo() {
    return {
      mode: this.systemConfig.mode,
      description: this.isSingleStore() ? '单店版本' : '多店SaaS版本',
      features: this.systemConfig.features,
      singleStore: this.isSingleStore() ? this.systemConfig.singleStore : null,
      timestamp: new Date().toISOString(),
    };
  }
}

// 创建单例实例
const systemMode = new SystemMode();

export default systemMode;