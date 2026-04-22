// API工具函数
import axios from 'axios';
import { MenuCategory, OrderStatus, SubmitOrderRequest, ApiResponse } from '../types';
import SCAN_ROUTES from '../../../config/scan-routes';

// 创建axios实例（baseURL为空，URL用完整路径）
const apiClient = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// 响应拦截器 - 不剥data层，保留完整响应结构
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API请求错误:', error);
    
    // 统一错误处理
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        '网络请求失败，请稍后重试';
    
    return Promise.reject({
      message: errorMessage,
      code: error.response?.status || 'NETWORK_ERROR',
      details: error.response?.data,
    });
  },
);

/**
 * 获取店铺菜单
 */
export async function fetchStoreMenu(storeSlug: string): Promise<MenuCategory[]> {
  const response = await apiClient.get<ApiResponse<MenuCategory[]>>(
    SCAN_ROUTES.api.utils.buildStoreMenuUrl(storeSlug),
  );
  
  if (response.data.success) {
    const data = response.data.data;
    // 后端返回格式: {store, categories: [...]}，提取 categories 数组
    if (data && Array.isArray(data.categories)) {
      return data.categories;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }
  throw new Error(response.data.message || '获取菜单失败');
}

/**
 * 提交订单
 */
export async function submitOrder(
  orderData: SubmitOrderRequest,
): Promise<{ order_number: string; total_amount: string }> {
  try {
    const response = await apiClient.post<ApiResponse<{ id: number; order_number: string; total_amount: string }>>(
      SCAN_ROUTES.api.CREATE_ORDER,
      orderData,
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '提交订单失败');
    }
  } catch (error) {
    console.error('提交订单失败:', error);
    throw error;
  }
}

/**
 * 获取订单状态
 */
export async function fetchOrderStatus(orderId: string): Promise<OrderStatus> {
  try {
    const response = await apiClient.get<ApiResponse<any>>(
      SCAN_ROUTES.api.utils.buildOrderStatusUrl(orderId),
    );
    
    if (response.data.success) {
      const raw = response.data.data;
      // 后端 snake_case → 前端 camelCase 映射
      return {
        orderId: raw.order_number || raw.id?.toString(),
        status: raw.status,
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
        totalAmount: Number(raw.total_amount || raw.totalAmount || 0),
        items: (raw.items || []).map((item: any) => ({
          menuItemId: item.menu_item_id || item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price || 0),
        })),
      };
    } else {
      throw new Error(response.data.message || '获取订单状态失败');
    }
  } catch (error) {
    console.error('获取订单状态失败:', error);
    throw error;
  }
}

/**
 * 获取店铺信息
 */
export async function fetchStoreInfo(storeSlug: string): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>(
    SCAN_ROUTES.api.utils.buildStoreInfoUrl(storeSlug),
  );
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.message || '获取店铺信息失败');
}

/**
 * 获取餐桌信息
 */
export async function fetchTableInfo(
  storeSlug: string,
  tableId: string,
): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>(
    SCAN_ROUTES.api.utils.buildTableInfoUrl(storeSlug, tableId),
  );
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.message || '获取餐桌信息失败');
}

/**
 * 健康检查
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get<ApiResponse>(SCAN_ROUTES.api.HEALTH);
    return response.data.success;
  } catch (error) {
    console.error('健康检查失败:', error);
    return false;
  }
}