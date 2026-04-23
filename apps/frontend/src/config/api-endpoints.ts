/**
 * API端点常量配置
 * 所有后端API路径必须在此定义，禁止硬编码
 * 前后端共享此配置（后端通过环境变量或导入）
 */

export const API_ENDPOINTS = {
  // ==================== 公共API ====================
  PUBLIC: {
    // 健康检查
    HEALTH: '/api/health',
    
    // 租户相关
    TENANT_INFO: '/api/public/tenants/:tenantSlug',
    TENANT_STORE_INFO: '/api/public/tenants/:tenantSlug/stores/:storeSlug',
    TENANT_STORE_MENU: '/api/public/tenants/:tenantSlug/stores/:storeSlug/menu',
    TENANT_TABLE_INFO: '/api/public/tenants/:tenantSlug/stores/:storeSlug/tables/:tableId',
    
    // 店铺相关（旧规范兼容）
    STORE_INFO: '/api/public/stores/:storeId',
    STORE_MENU: '/api/public/stores/:storeId/menu',
    TABLE_INFO: '/api/public/stores/:storeId/tables/:tableId',
    
    // 订单相关
    CREATE_ORDER: '/api/public/orders',
    ORDER_STATUS: '/api/public/orders/:orderId/status',
  },
  
  // ==================== 租户管理API (v1) ====================
  TENANT: {
    // 租户认证与注册
    CHECK_SLUG: '/api/v1/tenant/check-slug',
    CHECK_SUBDOMAIN: '/api/v1/tenant/check-subdomain',
    REGISTER: '/api/v1/tenant/register',
    
    // 租户列表与管理
    LIST: '/api/v1/tenant/list',
    DETAIL: '/api/v1/tenant/:tenantId',
    UPDATE: '/api/v1/tenant/:tenantId',
    
    // 店铺管理
    STORES: {
      LIST: '/api/v1/tenants/:tenantId/stores',
      CREATE: '/api/v1/stores',
      DETAIL: '/api/v1/stores/:storeId',
      CHECK_SLUG: '/api/v1/stores/check-slug',
    },
    
    // 菜单模板管理
    MENU_TEMPLATES: {
      LIST: '/api/v1/tenant/:tenantId/menu-templates',
      CREATE_UPDATE: '/api/v1/tenant/:tenantId/menu-templates',
      DELETE: '/api/v1/menu-templates/:id',
    },
    
    // 店铺菜单配置
    STORE_MENU_CONFIG: {
      GET: '/api/v1/store/:storeId/menu-config',
      UPDATE: '/api/v1/store/:storeId/menu-config',
    },
  },
  
  // ==================== 上传API ====================
  UPLOAD: {
    MENU_IMAGE: '/api/v1/upload/menu-image',
  },
  
  // ==================== 测试API ====================
  TEST: {
    TENANTS: '/api/test/tenants',
  },
  
  // ==================== 工具函数 ====================
  utils: {
    /**
     * 构建带参数的API URL
     * @param template 模板字符串，如 '/api/v1/tenant/:tenantId'
     * @param params 参数对象，如 { tenantId: '123' }
     * @returns 完整的API URL
     */
    buildUrl(template: string, params: Record<string, string | number>): string {
      let url = template;
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, encodeURIComponent(String(value)));
      });
      return url;
    },
    
    /**
     * 构建租户店铺信息URL
     */
    buildTenantStoreInfoUrl(tenantSlug: string, storeSlug: string): string {
      return API_ENDPOINTS.PUBLIC.TENANT_STORE_INFO
        .replace(':tenantSlug', encodeURIComponent(tenantSlug))
        .replace(':storeSlug', encodeURIComponent(storeSlug));
    },
    
    /**
     * 构建店铺菜单URL
     */
    buildTenantStoreMenuUrl(tenantSlug: string, storeSlug: string): string {
      return API_ENDPOINTS.PUBLIC.TENANT_STORE_MENU
        .replace(':tenantSlug', encodeURIComponent(tenantSlug))
        .replace(':storeSlug', encodeURIComponent(storeSlug));
    },
  },
};

export default API_ENDPOINTS;
