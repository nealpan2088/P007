/**
 * 数据库表名常量配置
 * 避免SQL查询中的硬编码表名
 */

const DATABASE_TABLES = {
  // 租户相关
  TENANTS: 'tenants',
  STORES: 'stores',
  
  // 菜单相关
  MENU_TEMPLATES: 'menu_templates',
  MENU_CATEGORY_TEMPLATES: 'menu_category_templates',
  STORE_MENU_ITEMS: 'store_menu_items',
  MENU_CATEGORIES: 'menu_categories',
  MENU_ITEMS: 'menu_items',
  
  // 订单相关
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  
  // 餐桌相关
  TABLES: 'tables',
  
  // 用户相关
  USERS: 'users',
  SESSIONS: 'sessions',
  
  // 系统相关
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
};

// 表字段常量（常用字段）
const TABLE_FIELDS = {
  COMMON: {
    ID: 'id',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
    DELETED_AT: 'deleted_at',
    STATUS: 'status',
  },
  
  TENANTS: {
    NAME: 'name',
    SLUG: 'slug',
    SUBDOMAIN: 'subdomain',
    SETTINGS: 'settings',
  },
  
  STORES: {
    TENANT_ID: 'tenant_id',
    NAME: 'name',
    SLUG: 'slug',
    DESCRIPTION: 'description',
    ADDRESS: 'address',
    PHONE: 'phone',
  },
  
  MENU_ITEMS: {
    STORE_ID: 'store_id',
    CATEGORY_ID: 'category_id',
    NAME: 'name',
    DESCRIPTION: 'description',
    PRICE: 'price',
    IMAGE_URL: 'image_url',
    IS_AVAILABLE: 'is_available',
    SORT_ORDER: 'sort_order',
  },
  
  ORDERS: {
    STORE_ID: 'store_id',
    ORDER_NUMBER: 'order_number',
    TABLE_ID: 'table_id',
    TOTAL_AMOUNT: 'total_amount',
    CUSTOMER_NAME: 'customer_name',
    CUSTOMER_PHONE: 'customer_phone',
  },
};

module.exports = {
  DATABASE_TABLES,
  TABLE_FIELDS,
};
