// 店铺管理工具函数
import { Store, StoreStatus, StoreType, BusinessHours } from '../types';

/**
 * 获取店铺状态显示文本
 */
export function getStoreStatusText(status: StoreStatus): string {
  const statusMap: Record<StoreStatus, string> = {
    ACTIVE: '营业中',
    INACTIVE: '已停业',
    MAINTENANCE: '维护中',
    CLOSED: '已关闭',
  };
  return statusMap[status] || status;
}

/**
 * 获取店铺状态颜色
 */
export function getStoreStatusColor(status: StoreStatus): string {
  const colorMap: Record<StoreStatus, string> = {
    ACTIVE: 'green',
    INACTIVE: 'gray',
    MAINTENANCE: 'orange',
    CLOSED: 'red',
  };
  return colorMap[status] || 'default';
}

/**
 * 获取店铺类型显示文本
 */
export function getStoreTypeText(type: StoreType): string {
  const typeMap: Record<StoreType, string> = {
    RESTAURANT: '餐厅',
    CAFE: '咖啡厅',
    FAST_FOOD: '快餐店',
    BAKERY: '面包店',
    OTHER: '其他',
  };
  return typeMap[type] || type;
}

/**
 * 获取星期几的中文名称
 */
export function getDayOfWeekName(day: number): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[day] || `周${day}`;
}

/**
 * 格式化营业时间
 */
export function formatBusinessHours(hours: BusinessHours[]): string {
  if (!hours || hours.length === 0) {
    return '未设置营业时间';
  }

  // 按天分组
  const dayGroups: Record<string, BusinessHours[]> = {};
  hours.forEach(hour => {
    if (hour.isOpen) {
      const key = `${hour.openTime}-${hour.closeTime}`;
      if (!dayGroups[key]) {
        dayGroups[key] = [];
      }
      dayGroups[key].push(hour);
    }
  });

  // 生成格式化字符串
  const formattedGroups = Object.entries(dayGroups).map(([timeRange, days]) => {
    const dayNames = days.map(hour => getDayOfWeekName(hour.dayOfWeek));
    return `${dayNames.join('、')}: ${timeRange.replace('-', ' - ')}`;
  });

  return formattedGroups.join('； ') || '休息中';
}

/**
 * 检查店铺当前是否营业
 */
export function isStoreOpenNow(businessHours: BusinessHours[]): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0-6，0表示周日
  const currentTime = now.getHours() * 60 + now.getMinutes(); // 转换为分钟数

  const todayHours = businessHours.find(
    hour => hour.dayOfWeek === currentDay && hour.isOpen
  );

  if (!todayHours) {
    return false;
  }

  const openTime = parseTimeToMinutes(todayHours.openTime);
  const closeTime = parseTimeToMinutes(todayHours.closeTime);

  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * 解析时间字符串为分钟数
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 格式化价格
 */
export function formatPrice(price?: number): string {
  if (price === undefined || price === null) {
    return '未设置';
  }
  return `¥${price.toFixed(2)}`;
}

/**
 * 格式化容量
 */
export function formatCapacity(capacity?: number): string {
  if (capacity === undefined || capacity === null) {
    return '未设置';
  }
  return `${capacity}人`;
}

/**
 * 格式化评分
 */
export function formatRating(rating?: number): string {
  if (rating === undefined || rating === null) {
    return '暂无评分';
  }
  return rating.toFixed(1);
}

/**
 * 获取店铺默认Logo
 */
export function getDefaultStoreLogo(): string {
  return 'https://via.placeholder.com/100x100/3b82f6/ffffff?text=店铺';
}

/**
 * 获取店铺默认封面图
 */
export function getDefaultStoreCover(): string {
  return 'https://via.placeholder.com/800x400/3b82f6/ffffff?text=店铺封面';
}

/**
 * 验证手机号码
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成店铺二维码数据
 */
export function generateStoreQrData(storeId: string, tableId?: string): string {
  const baseUrl = window.location.origin;
  if (tableId) {
    return `${baseUrl}/scan/${storeId}/${tableId}`;
  }
  return `${baseUrl}/scan/${storeId}`;
}

/**
 * 获取店铺操作权限
 */
export function getStorePermissions(userRole: string): {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageStaff: boolean;
  canViewStats: boolean;
} {
  const permissions = {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageStaff: false,
    canViewStats: false,
  };

  switch (userRole) {
    case 'SUPER_ADMIN':
    case 'TENANT_OWNER':
      permissions.canCreate = true;
      permissions.canEdit = true;
      permissions.canDelete = true;
      permissions.canManageStaff = true;
      permissions.canViewStats = true;
      break;
    case 'STORE_MANAGER':
      permissions.canEdit = true;
      permissions.canManageStaff = true;
      permissions.canViewStats = true;
      break;
    case 'STORE_STAFF':
      permissions.canEdit = true;
      break;
  }

  return permissions;
}

/**
 * 计算店铺统计信息
 */
export function calculateStoreStats(stores: Store[]): {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  closed: number;
  averageRating: number;
  totalCapacity: number;
} {
  const stats = {
    total: stores.length,
    active: 0,
    inactive: 0,
    maintenance: 0,
    closed: 0,
    averageRating: 0,
    totalCapacity: 0,
  };

  let totalRating = 0;
  let ratedStores = 0;

  stores.forEach(store => {
    // 统计状态
    switch (store.status) {
      case 'ACTIVE':
        stats.active++;
        break;
      case 'INACTIVE':
        stats.inactive++;
        break;
      case 'MAINTENANCE':
        stats.maintenance++;
        break;
      case 'CLOSED':
        stats.closed++;
        break;
    }

    // 统计评分
    if (store.rating !== undefined && store.rating !== null) {
      totalRating += store.rating;
      ratedStores++;
    }

    // 统计容量
    if (store.capacity !== undefined && store.capacity !== null) {
      stats.totalCapacity += store.capacity;
    }
  });

  // 计算平均评分
  stats.averageRating = ratedStores > 0 ? totalRating / ratedStores : 0;

  return stats;
}