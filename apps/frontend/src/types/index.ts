// 基础API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: number;
}

// 用户类型
export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  phone?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

// 租户类型
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 店铺类型
export interface Store {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  status: string;
  type: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// 店铺统计类型
export interface StoreStats {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  maintenanceStores: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

// 店铺列表响应
export interface StoreListResponse {
  stores: Store[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 店铺查询参数
export interface StoreQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 店铺请求数据
export interface StoreRequest {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  status?: string;
  type?: string;
  businessHours?: any;
  images?: string[];
}
