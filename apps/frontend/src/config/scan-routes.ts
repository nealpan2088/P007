// 扫码点餐路由常量配置 - 统一规范版本
// 所有扫码点餐相关路由必须使用此文件中的常量
// 规范: /t/{tenantSlug}/s/{storeSlug}/scan/{tableId}

import { PUBLIC_API_ROUTES } from './api-routes';

/**
 * 扫码点餐路由配置 - 统一规范
 * 规范: /t/{tenantSlug}/s/{storeSlug}/scan/{tableId}
 */
export const SCAN_ROUTES = {
  // ==================== 新规范路径 ====================
  
  // 基础扫码点餐路径 (新规范)
  BASE: '/t/:tenantSlug/s/:storeSlug/scan',
  
  // 完整扫码点餐路径 (新规范 - 推荐使用)
  SCAN_ORDER: '/t/:tenantSlug/s/:storeSlug/scan/:tableId',
  
  // 打包/外卖路径 (新规范)
  TAKEAWAY: '/t/:tenantSlug/s/:storeSlug/takeaway',
  
  // 仅租户+店铺路径 (新规范 - 可选)
  TENANT_STORE: '/t/:tenantSlug/s/:storeSlug',
  
  // 仅租户路径 (新规范 - 可选)
  TENANT_ONLY: '/t/:tenantSlug',
  
  // ==================== 旧规范兼容路径 ====================
  
  // 旧规范路径 (兼容性 - 已弃用，保留仅用于重定向)
  LEGACY: {
    BASE: '/scan',
    SCAN_ORDER: '/scan/:storeId/:tableId',
    STORE_ONLY: '/scan/:storeId',
  },
  
  // ==================== 测试数据 ====================
  
  // 测试用的标准租户、店铺和餐桌
  TEST: {
    TENANT: {
      SLUG: 'qilin-test',
      NAME: '快点餐测试租户',
    },
    STORE: {
      SLUG: 'qilin-test-restaurant',
      NAME: '快点餐测试餐厅',
    },
    TABLE: {
      CODE: 'A01',
      NAME: '餐桌A01',
    },
  },
  
  // 演示用的标准租户、店铺和餐桌
  DEMO: {
    TENANT: {
      SLUG: 'phoenix-demo',
      NAME: '凤凰演示租户',
    },
    STORE: {
      SLUG: 'demo-shop',
      NAME: '演示店铺',
    },
    TABLE: {
      CODE: 'B02',
      NAME: '演示餐桌B02',
    },
  },
  
  // ==================== 工具函数 ====================
  
  // 构建扫码点餐URL的工具函数 (新规范)
  utils: {
    /**
     * 构建扫码点餐URL (新规范)
     * @param tenantSlug 租户slug
     * @param storeSlug 店铺slug
     * @param tableId 餐桌ID或编号
     * @returns 完整的扫码点餐URL
     */
    buildScanUrl(tenantSlug: string, storeSlug: string, tableId: string): string {
      return `/t/${encodeURIComponent(tenantSlug)}/s/${encodeURIComponent(storeSlug)}/scan/${encodeURIComponent(tableId)}`;
    },
    
    /**
     * 构建旧规范扫码点餐URL (兼容性)
     * @param storeSlug 店铺slug
     * @param tableId 餐桌ID或编号
     * @returns 旧规范的扫码点餐URL
     */
    buildLegacyScanUrl(storeSlug: string, tableId: string): string {
      return `/scan/${encodeURIComponent(storeSlug)}/${encodeURIComponent(tableId)}`;
    },
    
    /**
     * 从URL解析参数 (新规范)
     * @param path 路径字符串
     * @returns 解析出的租户、店铺和餐桌参数
     */
    parseScanUrl(path: string): { 
      tenantSlug: string | null; 
      storeSlug: string | null; 
      tableId: string | null 
    } {
      // 尝试新规范解析
      const newMatch = path.match(/^\/t\/([^\/]+)\/s\/([^\/]+)\/scan\/([^\/]+)$/);
      if (newMatch) {
        return {
          tenantSlug: decodeURIComponent(newMatch[1]),
          storeSlug: decodeURIComponent(newMatch[2]),
          tableId: decodeURIComponent(newMatch[3]),
        };
      }
      
      // 尝试旧规范解析 (兼容性)
      const legacyMatch = path.match(/^\/scan\/([^\/]+)(?:\/([^\/]+))?$/);
      if (legacyMatch) {
        return {
          tenantSlug: null, // 旧规范没有租户信息
          storeSlug: decodeURIComponent(legacyMatch[1]),
          tableId: legacyMatch[2] ? decodeURIComponent(legacyMatch[2]) : null,
        };
      }
      
      return { tenantSlug: null, storeSlug: null, tableId: null };
    },
    
    /**
     * 验证扫码点餐路径是否符合规范
     * @param path 路径字符串
     * @returns 是否有效 (支持新旧规范)
     */
    isValidScanPath(path: string): boolean {
      // 新规范验证
      const newPattern = /^\/t\/[^\/]+\/s\/[^\/]+\/scan\/[^\/]+$/;
      // 旧规范验证 (兼容性)
      const legacyPattern = /^\/scan\/[^\/]+(\/[^\/]+)?$/;
      
      return newPattern.test(path) || legacyPattern.test(path);
    },
    
    /**
     * 获取测试扫码点餐URL (新规范)
     * @returns 测试用的扫码点餐URL
     */
    getTestUrl(): string {
      const tenantSlug = SCAN_ROUTES.TEST.TENANT?.SLUG;
      if (tenantSlug) {
        return this.buildScanUrl(
          tenantSlug,
          SCAN_ROUTES.TEST.STORE.SLUG,
          SCAN_ROUTES.TEST.TABLE.CODE,
        );
      }
      // 无租户时使用旧规范URL格式
      return this.buildLegacyScanUrl(
        SCAN_ROUTES.TEST.STORE.SLUG,
        SCAN_ROUTES.TEST.TABLE.CODE,
      );
    },
    
    /**
     * 获取演示扫码点餐URL (新规范)
     * @returns 演示用的扫码点餐URL
     */
    getDemoUrl(): string {
      const tenantSlug = SCAN_ROUTES.DEMO.TENANT?.SLUG;
      if (tenantSlug) {
        return this.buildScanUrl(
          tenantSlug,
          SCAN_ROUTES.DEMO.STORE.SLUG,
          SCAN_ROUTES.DEMO.TABLE.CODE,
        );
      }
      return this.buildLegacyScanUrl(
        SCAN_ROUTES.DEMO.STORE.SLUG,
        SCAN_ROUTES.DEMO.TABLE.CODE,
      );
    },
    
    /**
     * 获取旧规范测试URL (兼容性)
     * @returns 旧规范的测试URL
     */
    getLegacyTestUrl(): string {
      return this.buildLegacyScanUrl(
        SCAN_ROUTES.TEST.STORE.SLUG,
        SCAN_ROUTES.TEST.TABLE.CODE,
      );
    },
    
    /**
     * 获取旧规范演示URL (兼容性)
     * @returns 旧规范的演示URL
     */
    getLegacyDemoUrl(): string {
      return this.buildLegacyScanUrl(
        SCAN_ROUTES.DEMO.STORE.SLUG,
        SCAN_ROUTES.DEMO.TABLE.CODE,
      );
    },
    
    /**
     * 将旧规范URL转换为新规范URL
     * @param legacyUrl 旧规范URL
     * @param tenantSlug 租户slug
     * @returns 新规范URL
     */
    convertToNewFormat(legacyUrl: string, tenantSlug: string): string | null {
      const params = this.parseScanUrl(legacyUrl);
      if (params.storeSlug && params.tableId) {
        return this.buildScanUrl(tenantSlug, params.storeSlug, params.tableId);
      }
      return null;
    },
  },
};

/**
 * 扫码点餐API端点配置 - 统一规范版本
 * 所有API调用必须使用此配置
 * 所有路径引用自 api-routes.ts 的路由常量
 */
export const SCAN_API_ENDPOINTS = {
  // ==================== 基础API路径 ====================
  
  // 基础API路径 (公共API)
  BASE: '/api/public',
  
  // 租户API路径 (需要租户上下文)
  TENANT_BASE: '/api/tenant',
  
  // ==================== 新规范API端点 ====================
  
  // 租户信息 (新规范)
  TENANT_INFO: PUBLIC_API_ROUTES.SCAN.STORE.INFO,
  
  // 租户下的店铺信息 (新规范)
  TENANT_STORE_INFO: PUBLIC_API_ROUTES.SCAN.STORE.INFO,
  
  // 租户下的店铺菜单 (新规范)
  TENANT_STORE_MENU: PUBLIC_API_ROUTES.SCAN.STORE.MENU,
  
  // 租户下的餐桌信息 (新规范)
  TENANT_TABLE_INFO: PUBLIC_API_ROUTES.SCAN.STORE.TABLE,
  
  // ==================== 旧规范API端点 (兼容性) ====================
  
  // 店铺信息 (旧规范 - 兼容性)
  STORE_INFO: PUBLIC_API_ROUTES.SCAN.STORE.INFO,
  
  // 店铺菜单 (旧规范 - 兼容性)
  STORE_MENU: PUBLIC_API_ROUTES.SCAN.STORE.MENU,
  
  // 餐桌信息 (旧规范 - 兼容性)
  TABLE_INFO: PUBLIC_API_ROUTES.SCAN.STORE.TABLE,
  
  // ==================== 通用API端点 ====================
  
  // 创建订单
  CREATE_ORDER: PUBLIC_API_ROUTES.SCAN.ORDER.CREATE,
  
  // 订单状态
  ORDER_STATUS: PUBLIC_API_ROUTES.SCAN.ORDER.STATUS,
  
  // 健康检查
  HEALTH: PUBLIC_API_ROUTES.HEALTH,
  
  // ==================== 工具函数 ====================
  
  // 构建API URL的工具函数
  utils: {
    /**
     * 构建店铺信息API URL (新规范)
     * @param tenantSlug 租户slug
     * @param storeSlug 店铺slug
     * @returns 完整的API URL
     */
    buildTenantStoreInfoUrl(tenantSlug: string, storeSlug: string): string {
      return SCAN_API_ENDPOINTS.TENANT_STORE_INFO
        .replace(':tenantSlug', encodeURIComponent(tenantSlug))
        .replace(':storeSlug', encodeURIComponent(storeSlug));
    },
    
    /**
     * 构建店铺菜单API URL (新规范)
     * @param tenantSlug 租户slug
     * @param storeSlug 店铺slug
     * @returns 完整的API URL
     */
    buildTenantStoreMenuUrl(tenantSlug: string, storeSlug: string): string {
      return SCAN_API_ENDPOINTS.TENANT_STORE_MENU
        .replace(':tenantSlug', encodeURIComponent(tenantSlug))
        .replace(':storeSlug', encodeURIComponent(storeSlug));
    },
    
    /**
     * 构建餐桌信息API URL (新规范)
     * @param tenantSlug 租户slug
     * @param storeSlug 店铺slug
     * @param tableId 餐桌ID
     * @returns 完整的API URL
     */
    buildTenantTableInfoUrl(tenantSlug: string, storeSlug: string, tableId: string): string {
      return SCAN_API_ENDPOINTS.TENANT_TABLE_INFO
        .replace(':tenantSlug', encodeURIComponent(tenantSlug))
        .replace(':storeSlug', encodeURIComponent(storeSlug))
        .replace(':tableId', encodeURIComponent(tableId));
    },
    
    /**
     * 构建店铺信息API URL (旧规范 - 兼容性)
     * @param storeId 店铺ID
     * @returns 完整的API URL
     */
    buildStoreInfoUrl(storeId: string): string {
      return SCAN_API_ENDPOINTS.STORE_INFO.replace(':storeId', encodeURIComponent(storeId));
    },
    
    /**
     * 构建店铺菜单API URL (旧规范 - 兼容性)
     * @param storeId 店铺ID
     * @returns 完整的API URL
     */
    buildStoreMenuUrl(storeId: string): string {
      return SCAN_API_ENDPOINTS.STORE_MENU.replace(':storeId', encodeURIComponent(storeId));
    },
    
    /**
     * 构建餐桌信息API URL (旧规范 - 兼容性)
     * @param storeId 店铺ID
     * @param tableId 餐桌ID
     * @returns 完整的API URL
     */
    buildTableInfoUrl(storeId: string, tableId: string): string {
      return SCAN_API_ENDPOINTS.TABLE_INFO
        .replace(':storeId', encodeURIComponent(storeId))
        .replace(':tableId', encodeURIComponent(tableId));
    },
    
    /**
     * 构建订单状态API URL
     * @param orderId 订单ID
     * @returns 完整的API URL
     */
    buildOrderStatusUrl(orderId: string): string {
      return SCAN_API_ENDPOINTS.ORDER_STATUS.replace(':orderId', encodeURIComponent(orderId));
    },
    
    /**
     * 根据路径模式选择合适的API URL构建器
     * @param path 前端路径
     * @returns 对应的API URL构建参数
     */
    getApiBuilderForPath(path: string): {
      type: 'new' | 'legacy' | 'unknown';
      builder?: (tenantSlug?: string, storeSlug?: string, tableId?: string) => string;
    } {
      const params = SCAN_ROUTES.utils.parseScanUrl(path);
      
      if (params.tenantSlug && params.storeSlug && params.tableId) {
        // 新规范路径
        return {
          type: 'new',
          builder: () => this.buildTenantTableInfoUrl(params.tenantSlug!, params.storeSlug!, params.tableId!),
        };
      } else if (params.storeSlug && params.tableId) {
        // 旧规范路径
        return {
          type: 'legacy',
          builder: () => this.buildTableInfoUrl(params.storeSlug!, params.tableId!),
        };
      }
      
      return { type: 'unknown' };
    },
  },
};

/**
 * 扫码点餐路由规范文档 - 统一规范版本
 */
export const SCAN_ROUTES_SPEC = {
  // ==================== 新规范 ====================
  
  // 前端路由规范 (新规范)
  FRONTEND_ROUTES_NEW: [
    '<Route path="/t/:tenantSlug/s/:storeSlug/scan/:tableId" element={<ScanOrderPage />} />',
    '<Route path="/t/:tenantSlug/s/:storeSlug" element={<ScanOrderPage />} />',
    '<Route path="/t/:tenantSlug" element={<ScanOrderPage />} />',
  ],
  
  // 前端路由规范 (旧规范 - 兼容性)
  FRONTEND_ROUTES_LEGACY: [
    '<Route path="/scan/:storeId/:tableId" element={<ScanOrderPage />} />',
    '<Route path="/scan/:storeId" element={<ScanOrderPage />} />',
    '<Route path="/scan" element={<ScanOrderPage />} />',
  ],
  
  // 参数规范 (新规范)
  PARAM_SPEC_NEW: {
    tenantSlug: '租户slug (如: qilin-test)',
    storeSlug: '店铺slug (如: test-store)',
    tableId: '餐桌ID或编号 (如: A01)',
  },
  
  // 参数规范 (旧规范 - 兼容性)
  PARAM_SPEC_LEGACY: {
    storeId: '店铺ID或slug (如: test-store)',
    tableId: '餐桌ID或编号 (如: A01)',
  },
  
  // ==================== API端点规范 ====================
  
  // API端点规范 (新规范)
  API_ENDPOINTS_NEW: [
    'GET /api/public/tenants/:tenantSlug # 租户信息',
    'GET /api/public/tenants/:tenantSlug/stores/:storeSlug # 租户下的店铺信息',
    'GET /api/public/tenants/:tenantSlug/stores/:storeSlug/menu # 租户下的店铺菜单',
    'GET /api/public/tenants/:tenantSlug/stores/:storeSlug/tables/:tableId # 租户下的餐桌信息',
    'POST /api/public/orders # 创建订单',
    'GET /api/public/orders/:orderId/status # 订单状态',
  ],
  
  // API端点规范 (旧规范 - 兼容性)
  API_ENDPOINTS_LEGACY: [
    'GET /api/public/stores/:storeId # 店铺信息',
    'GET /api/public/stores/:storeId/menu # 店铺菜单',
    'GET /api/public/stores/:storeId/tables/:tableId # 餐桌信息',
    'POST /api/public/orders # 创建订单',
    'GET /api/public/orders/:orderId/status # 订单状态',
  ],
  
  // ==================== 使用示例 ====================
  
  // 使用示例 (新规范)
  EXAMPLES_NEW: [
    {
      description: '快点餐测试租户 - 测试店铺扫码点餐',
      url: '/t/qilin-test/s/test-store/scan/A01',
      tenantSlug: 'qilin-test',
      storeSlug: 'test-store',
      tableId: 'A01',
    },
    {
      description: '凤凰演示租户 - 演示店铺扫码点餐',
      url: '/t/phoenix-demo/s/demo-shop/scan/B02',
      tenantSlug: 'phoenix-demo',
      storeSlug: 'demo-shop',
      tableId: 'B02',
    },
    {
      description: '快点餐 - 北京分店VIP餐桌',
      url: '/t/qilin/s/beijing-branch/scan/VIP-01',
      tenantSlug: 'qilin',
      storeSlug: 'beijing-branch',
      tableId: 'VIP-01',
    },
  ],
  
  // 使用示例 (旧规范 - 兼容性)
  EXAMPLES_LEGACY: [
    {
      description: '测试店铺扫码点餐 (旧规范)',
      url: '/scan/test-store/A01',
      storeId: 'test-store',
      tableId: 'A01',
    },
    {
      description: '演示店铺扫码点餐 (旧规范)',
      url: '/scan/demo-shop/B02',
      storeId: 'demo-shop',
      tableId: 'B02',
    },
  ],
  
  // ==================== 迁移指南 ====================
  
  MIGRATION_GUIDE: {
    from: '/scan/:storeSlug/:tableId',
    to: '/t/:tenantSlug/s/:storeSlug/scan/:tableId',
    
    steps: [
      '1. 更新前端路由配置使用新规范',
      '2. 更新API调用支持租户参数',
      '3. 实现路径重定向保持兼容性',
      '4. 更新二维码生成使用新格式',
      '5. 逐步迁移现有用户到新路径',
    ],
    
    compatibility: {
      enabled: true,
      redirects: true,
      dualSupport: true, // 同时支持新旧规范
      sunsetDate: '2026-07-01', // 旧规范下线日期
    },
  },
};

// 默认导出
export default {
  routes: SCAN_ROUTES,
  api: SCAN_API_ENDPOINTS,
  spec: SCAN_ROUTES_SPEC,
  
  // ==================== 便捷方法 ====================
  
  // 新规范URL
  getTestScanUrl(): string {
    return SCAN_ROUTES.utils.getTestUrl();
  },
  
  getDemoScanUrl(): string {
    return SCAN_ROUTES.utils.getDemoUrl();
  },
  
  // 旧规范URL (兼容性)
  getLegacyTestScanUrl(): string {
    return SCAN_ROUTES.utils.getLegacyTestUrl();
  },
  
  getLegacyDemoScanUrl(): string {
    return SCAN_ROUTES.utils.getLegacyDemoUrl();
  },
  
  // ==================== 验证方法 ====================
  
  validateScanPath(path: string): boolean {
    return SCAN_ROUTES.utils.isValidScanPath(path);
  },
  
  isNewFormat(path: string): boolean {
    return /^\/t\/[^\/]+\/s\/[^\/]+\/scan\/[^\/]+$/.test(path);
  },
  
  isLegacyFormat(path: string): boolean {
    return /^\/scan\/[^\/]+(\/[^\/]+)?$/.test(path);
  },
  
  // ==================== 转换方法 ====================
  
  convertToNewFormat(legacyUrl: string, tenantSlug: string): string | null {
    return SCAN_ROUTES.utils.convertToNewFormat(legacyUrl, tenantSlug);
  },
  
  // ==================== 配置方法 ====================
  
  getConfig() {
    return {
      format: 'new', // 当前使用的格式
      compatibility: true, // 是否兼容旧格式
      migration: {
        enabled: true,
        redirects: true,
      },
    };
  },
};