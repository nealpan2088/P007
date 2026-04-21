// 麒麟项目 - 系统模式工具（简化版）
// 根据环境变量 SYSTEM_MODE 提供不同的业务逻辑实现

/**
 * 系统模式工具类
 * 提供根据系统模式选择不同实现的工具函数
 */
class SystemMode {
  constructor() {
    this.mode = process.env.SYSTEM_MODE || 'multi';
    
    // 验证系统模式
    if (!['single', 'multi'].includes(this.mode)) {
      throw new Error(`系统模式无效: ${this.mode}，必须是 'single' 或 'multi'`);
    }
    
    // 单店模式配置
    this.singleStoreConfig = {
      storeId: process.env.DEFAULT_STORE_ID || 'store_001',
      storeName: process.env.DEFAULT_STORE_NAME || '默认店铺',
      subdomain: process.env.DEFAULT_STORE_SUBDOMAIN || 'default'
    };
    
    // 功能开关
    this.features = {
      multiTenant: this.mode === 'multi',
      scanningOrdering: true,
      cloudPrinting: true,
      analytics: true,
      mobileReady: true
    };
  }
  
  /**
   * 获取当前系统模式
   * @returns {string} 'single' 或 'multi'
   */
  getMode() {
    return this.mode;
  }
  
  /**
   * 检查是否为单店模式
   * @returns {boolean}
   */
  isSingleStore() {
    return this.mode === 'single';
  }
  
  /**
   * 检查是否为多租户模式
   * @returns {boolean}
   */
  isMultiTenant() {
    return this.mode === 'multi';
  }
  
  /**
   * 获取单店配置
   * @returns {Object} 单店配置信息
   */
  getSingleStoreConfig() {
    return this.isSingleStore() ? this.singleStoreConfig : null;
  }
  
  /**
   * 获取功能开关状态
   * @returns {Object} 功能开关对象
   */
  getFeatures() {
    return this.features;
  }
  
  /**
   * 检查特定功能是否启用
   * @param {string} featureName 功能名称
   * @returns {boolean}
   */
  isFeatureEnabled(featureName) {
    return this.features[featureName] === true;
  }
  
  /**
   * 根据系统模式执行不同的逻辑
   * @param {Function} singleStoreLogic 单店模式逻辑
   * @param {Function} multiTenantLogic 多租户模式逻辑
   * @returns {*} 执行结果
   */
  executeByMode(singleStoreLogic, multiTenantLogic) {
    if (this.isSingleStore()) {
      return singleStoreLogic(this.singleStoreConfig);
    } else {
      return multiTenantLogic();
    }
  }
  
  /**
   * 获取默认店铺ID（单店模式）
   * @returns {string} 店铺ID
   */
  getDefaultStoreId() {
    if (this.isSingleStore()) {
      return this.singleStoreConfig.storeId;
    }
    throw new Error('多租户模式下没有默认店铺ID');
  }
  
  /**
   * 验证租户ID（多租户模式）
   * @param {string} tenantId 租户ID
   * @returns {boolean} 是否有效
   */
  validateTenantId(tenantId) {
    if (this.isSingleStore()) {
      // 单店模式下，只接受默认店铺ID
      return tenantId === this.singleStoreConfig.storeId;
    }
    // 多租户模式下，需要验证租户存在性（这里只做基本验证）
    return tenantId && tenantId.length > 0;
  }
  
  /**
   * 获取系统信息
   * @returns {Object} 系统信息
   */
  getSystemInfo() {
    return {
      mode: this.mode,
      features: this.features,
      singleStore: this.isSingleStore() ? this.singleStoreConfig : null,
      isSingleStore: this.isSingleStore(),
      isMultiTenant: this.isMultiTenant()
    };
  }
}

// 创建单例实例
const systemMode = new SystemMode();

// 导出单例和类
export default systemMode;
export { SystemMode };