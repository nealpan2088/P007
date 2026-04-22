// 麒麟项目 - 系统模式工具（简化版）
// 系统始终为多租户模式，简化所有逻辑

/**
 * 系统模式工具类（简化版）
 * 系统始终为多租户模式，移除单店模式逻辑
 */
class SystemMode {
  constructor() {
    // 系统始终为多租户模式
    this.mode = 'multi';
    
    // 功能开关（所有功能默认启用）
    this.features = {
      multiTenant: true,
      scanningOrdering: true,
      cloudPrinting: true,
      analytics: true,
      mobileReady: true
    };
  }
  
  /**
   * 获取当前系统模式（始终返回'multi'）
   * @returns {string} 'multi'
   */
  getMode() {
    return this.mode;
  }
  
  /**
   * 检查是否为单店模式（始终返回false）
   * @returns {boolean} false
   */
  isSingleStore() {
    return false;
  }
  
  /**
   * 检查是否为多租户模式（始终返回true）
   * @returns {boolean} true
   */
  isMultiTenant() {
    return true;
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
   * 执行多租户逻辑（单店逻辑参数已移除）
   * @param {Function} logic 业务逻辑
   * @returns {*} 执行结果
   */
  execute(logic) {
    return logic();
  }
  
  /**
   * 验证租户ID
   * @param {string} tenantId 租户ID
   * @returns {boolean} 是否有效
   */
  validateTenantId(tenantId) {
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
      isMultiTenant: true
    };
  }
}

// 创建单例实例
const systemMode = new SystemMode();

// 导出单例和类
export default systemMode;
export { SystemMode };