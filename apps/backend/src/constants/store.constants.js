// 麒麟项目 - 店铺相关常量
// 避免硬编码，统一管理

// 店铺类型
export const STORE_TYPES = {
  RESTAURANT: 'RESTAURANT',
  CAFE: 'CAFE',
  FAST_FOOD: 'FAST_FOOD',
  BAKERY: 'BAKERY',
  BAR: 'BAR',
  FOOD_TRUCK: 'FOOD_TRUCK',
  CATERING: 'CATERING',
  OTHER: 'OTHER'
};

// 店铺状态
export const STORE_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  CLOSED: 'CLOSED',
  DELETED: 'DELETED'
};

// 店铺验证规则
export const STORE_VALIDATION = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000
  },
  ADDRESS: {
    MAX_LENGTH: 500
  },
  PHONE: {
    PATTERN: '^[0-9+\\-\\s()]{10,20}$'
  }
};

// 默认值
export const STORE_DEFAULTS = {
  STATUS: STORE_STATUS.DRAFT,
  CURRENCY: 'CNY',
  TIMEZONE: 'Asia/Shanghai',
  COUNTRY: '中国'
};

// 导出所有常量
export default {
  STORE_TYPES,
  STORE_STATUS,
  STORE_VALIDATION,
  STORE_DEFAULTS
};