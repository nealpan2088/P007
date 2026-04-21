// 店铺管理类型定义

// 店铺状态
export type StoreStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CLOSED';

// 店铺类型
export type StoreType = 'RESTAURANT' | 'CAFE' | 'FAST_FOOD' | 'BAKERY' | 'OTHER';

// 营业时间
export interface BusinessHours {
  dayOfWeek: number; // 0-6，0表示周日
  openTime: string; // HH:mm格式
  closeTime: string; // HH:mm格式
  isOpen: boolean;
}

// 店铺信息
export interface Store {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: StoreType;
  status: StoreStatus;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  averagePrice?: number;
  rating?: number;
  businessHours: BusinessHours[];
  createdAt: string;
  updatedAt: string;
}

// 店铺创建/更新请求
export interface StoreRequest {
  name: string;
  description?: string;
  type: StoreType;
  status: StoreStatus;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  averagePrice?: number;
  businessHours: BusinessHours[];
}

// 店铺列表查询参数
export interface StoreQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: StoreStatus;
  type?: StoreType;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

// 店铺列表响应
export interface StoreListResponse {
  items: Store[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 店铺统计信息
export interface StoreStats {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  maintenanceStores: number;
  closedStores: number;
  averageRating: number;
  totalCapacity: number;
}

// 表格列定义
export interface StoreTableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  sorter?: boolean;
  filter?: boolean;
  render?: (value: any, record: Store) => React.ReactNode;
}

// 表单验证规则
export interface StoreFormRules {
  name: { required: boolean; minLength?: number; maxLength?: number };
  description: { maxLength?: number };
  phone: { pattern?: RegExp };
  email: { pattern?: RegExp };
  website: { pattern?: RegExp };
  capacity: { min?: number; max?: number };
  averagePrice: { min?: number };
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details?: any;
  };
}