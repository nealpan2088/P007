// API工具函数
import axios from 'axios';
import { MenuCategory, OrderStatus, SubmitOrderRequest, ApiResponse } from '../types';

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api/public',
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
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response.data;
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
  }
);

/**
 * 获取店铺菜单
 */
export async function fetchStoreMenu(storeId: string): Promise<MenuCategory[]> {
  try {
    const response = await apiClient.get<ApiResponse<MenuCategory[]>>(
      `/stores/${storeId}/menu`
    );
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || '获取菜单失败');
    }
  } catch (error) {
    console.error('获取店铺菜单失败:', error);
    throw error;
  }
}

/**
 * 提交订单
 */
export async function submitOrder(
  orderData: SubmitOrderRequest
): Promise<{ orderId: string }> {
  try {
    const response = await apiClient.post<ApiResponse<{ orderId: string }>>(
      '/orders',
      orderData
    );
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || '提交订单失败');
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
    const response = await apiClient.get<ApiResponse<OrderStatus>>(
      `/orders/${orderId}/status`
    );
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || '获取订单状态失败');
    }
  } catch (error) {
    console.error('获取订单状态失败:', error);
    throw error;
  }
}

/**
 * 获取店铺信息
 */
export async function fetchStoreInfo(storeId: string): Promise<any> {
  try {
    // 注意：这个API端点可能需要后端实现
    const response = await apiClient.get<ApiResponse<any>>(
      `/stores/${storeId}`
    );
    
    if (response.success) {
      return response.data;
    } else {
      // 如果API不存在，返回模拟数据
      return {
        id: storeId,
        name: '麒麟测试餐厅',
        description: '欢迎光临麒麟测试餐厅',
        logoUrl: 'https://via.placeholder.com/100',
        address: '测试地址',
        phone: '13800138000',
        businessHours: {
          openTime: '09:00',
          closeTime: '22:00',
          isOpen: true,
        },
      };
    }
  } catch (error) {
    console.warn('获取店铺信息失败，使用模拟数据:', error);
    // 返回模拟数据
    return {
      id: storeId,
      name: '麒麟测试餐厅',
      description: '欢迎光临麒麟测试餐厅',
      logoUrl: 'https://via.placeholder.com/100',
      address: '测试地址',
      phone: '13800138000',
      businessHours: {
        openTime: '09:00',
        closeTime: '22:00',
        isOpen: true,
      },
    };
  }
}

/**
 * 获取餐桌信息
 */
export async function fetchTableInfo(
  storeId: string,
  tableId: string
): Promise<any> {
  try {
    // 注意：这个API端点可能需要后端实现
    const response = await apiClient.get<ApiResponse<any>>(
      `/stores/${storeId}/tables/${tableId}`
    );
    
    if (response.success) {
      return response.data;
    } else {
      // 如果API不存在，返回模拟数据
      return {
        id: tableId,
        name: `餐桌 ${tableId}`,
        code: tableId,
        capacity: 4,
        status: 'AVAILABLE',
      };
    }
  } catch (error) {
    console.warn('获取餐桌信息失败，使用模拟数据:', error);
    // 返回模拟数据
    return {
      id: tableId,
      name: `餐桌 ${tableId}`,
      code: tableId,
      capacity: 4,
      status: 'AVAILABLE',
    };
  }
}

/**
 * 健康检查
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get<ApiResponse>('/health');
    return response.success;
  } catch (error) {
    console.error('健康检查失败:', error);
    return false;
  }
}