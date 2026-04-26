// 麒麟项目 - 统一API类型定义
// 所有API响应必须遵循此格式

// ==================== 基础类型 ====================

/**
 * 标准API响应格式
 * 所有后端API必须返回此格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== 认证相关类型 ====================

/**
 * 用户信息
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  fullName?: string | null;
  phone?: string;
  avatar?: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

/**
 * 令牌信息
 */
export interface Tokens {
  access: string;
  refresh: string;
  expiresIn: number;
}

/**
 * 认证响应
 */
export interface AuthResponse extends ApiResponse<{
  user: User;
  tokens: Tokens;
  sessionId?: string;
}> {}

// ==================== 租户相关类型 ====================

/**
 * 租户信息
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  displayName?: string;
  subdomain?: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  address?: string;
  businessType?: string;
  industry?: string;
  trialEndsAt?: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * 租户响应
 */
export interface TenantResponse extends ApiResponse<Tenant> {}

/**
 * 租户列表响应
 */
export interface TenantsResponse extends ApiResponse<Tenant[]> {}

// ==================== 店铺相关类型 ====================

/**
 * 店铺信息
 */
export interface Store {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  logoUrl?: string;
  headerImageUrl?: string;
  coverImage?: string;
  openingHours?: Record<string, any>;
  averagePrice?: number;
  capacity?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CLOSED';
  isDefault: boolean;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  
  // 关联数据
  tenant?: Tenant;
}

/**
 * 店铺响应
 */
export interface StoreResponse extends ApiResponse<Store> {}

/**
 * 店铺列表响应
 */
export interface StoresResponse extends ApiResponse<Store[]> {}

// ==================== 菜单相关类型 ====================

/**
 * 菜单分类
 */
export interface MenuCategory {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  sortOrder: number;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  category?: MenuCategory;
}

/**
 * 菜单响应
 */
export interface MenuResponse extends ApiResponse<{
  store: Store;
  categories: Array<{
    id: string;
    name: string;
    items: MenuItem[];
  }>;
  items_count: number;
  categories_count: number;
}> {}

// ==================== 订单相关类型 ====================

/**
 * 订单状态
 */
export type OrderStatus = 
  | 'PENDING'      // 待确认
  | 'CONFIRMED'    // 已确认
  | 'PREPARING'    // 制作中
  | 'READY'        // 已完成
  | 'SERVED'       // 已上菜
  | 'CANCELLED'    // 已取消
  | 'COMPLETED';   // 已完成

/**
 * 订单项
 */
export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialRequest?: string;
}

/**
 * 订单信息
 */
export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  tableId: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  specialRequest?: string;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod?: string;
  paidAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  store?: Store;
}

/**
 * 订单响应
 */
export interface OrderResponse extends ApiResponse<Order> {}

/**
 * 订单列表响应
 */
export interface OrdersResponse extends ApiResponse<Order[]> {}

// ==================== 表单数据类型 ====================

/**
 * 创建租户表单数据
 */
export interface CreateTenantFormData {
  tenantName: string;
  tenantSlug: string;
  plan: string;
  storeName: string;
  storeSlug: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerName?: string;
}

/**
 * 创建店铺表单数据
 */
export interface CreateStoreFormData {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

// ==================== 类型导出 ====================

// 注意：类型不能作为值导出，这里只做类型导出
// 使用 import type { User } from '../types' 导入类型