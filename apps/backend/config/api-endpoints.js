/**
 * 后端API端点常量配置
 * 与前端保持一致，避免硬编码
 */

const API_ENDPOINTS = {
  // ==================== 公共API ====================
  PUBLIC: {
    HEALTH: '/api/health',
    TENANT_INFO: '/api/public/tenants/:tenantSlug',
    TENANT_STORE_INFO: '/api/public/tenants/:tenantSlug/stores/:storeSlug',
    TENANT_STORE_MENU: '/api/public/tenants/:tenantSlug/stores/:storeSlug/menu',
    TENANT_TABLE_INFO: '/api/public/tenants/:tenantSlug/stores/:storeSlug/tables/:tableId',
    STORE_INFO: '/api/public/stores/:storeId',
    STORE_MENU: '/api/public/stores/:storeId/menu',
    TABLE_INFO: '/api/public/stores/:storeId/tables/:tableId',
    CREATE_ORDER: '/api/public/orders',
    ORDER_STATUS: '/api/public/orders/:orderId/status',
  },
  
  // ==================== 租户管理API (v1) ====================
  TENANT: {
    CHECK_SLUG: '/api/v1/tenant/check-slug',
    CHECK_SUBDOMAIN: '/api/v1/tenant/check-subdomain',
    REGISTER: '/api/v1/tenant/register',
    LIST: '/api/v1/tenant/list',
    DETAIL: '/api/v1/tenant/:tenantId',
    UPDATE: '/api/v1/tenant/:tenantId',
    
    STORES: {
      LIST: '/api/v1/tenant/stores',
      CREATE: '/api/v1/stores',
      DETAIL: '/api/v1/stores/:storeId',
      CHECK_SLUG: '/api/v1/stores/check-slug',
    },
    
    MENU_TEMPLATES: {
      LIST: '/api/v1/tenant/:tenantId/menu-templates',
      CREATE_UPDATE: '/api/v1/tenant/:tenantId/menu-templates',
      DELETE: '/api/v1/menu-templates/:id',
    },
    
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
};

module.exports = API_ENDPOINTS;
