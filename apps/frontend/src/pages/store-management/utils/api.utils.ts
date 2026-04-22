// 店铺管理API工具函数
import axios from 'axios';
import { Store, StoreListResponse, StoreQueryParams, StoreRequest, StoreStats, ApiResponse } from '../types';

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api/v1/admin',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('qilin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    // 返回完整的响应，让调用者处理data
    return response;
  },
  error => {
    console.error('API请求错误:', error);
    
    // 统一错误处理
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        '网络请求失败，请稍后重试';
    
    // 如果是401错误，跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('qilin_access_token');
      window.location.href = '/login';
    }
    
    return Promise.reject({
      message: errorMessage,
      code: error.response?.status || 'NETWORK_ERROR',
      details: error.response?.data,
    });
  },
);

/**
 * 获取店铺列表
 */
export async function fetchStores(params: StoreQueryParams = {}): Promise<StoreListResponse> {
  try {
    const response = await apiClient.get<ApiResponse<StoreListResponse>>('/stores', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        search: params.search,
        status: params.status,
        type: params.type,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '获取店铺列表失败');
    }
  } catch (error) {
    console.error('获取店铺列表失败:', error);
    throw error;
  }
}

/**
 * 获取店铺详情
 */
export async function fetchStore(storeId: string): Promise<Store> {
  try {
    const response = await apiClient.get<ApiResponse<Store>>(`/stores/${storeId}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '获取店铺详情失败');
    }
  } catch (error) {
    console.error('获取店铺详情失败:', error);
    throw error;
  }
}

/**
 * 创建店铺
 */
export async function createStore(storeData: StoreRequest): Promise<Store> {
  try {
    const response = await apiClient.post<ApiResponse<Store>>('/stores', storeData);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '创建店铺失败');
    }
  } catch (error) {
    console.error('创建店铺失败:', error);
    throw error;
  }
}

/**
 * 更新店铺
 */
export async function updateStore(storeId: string, storeData: Partial<StoreRequest>): Promise<Store> {
  try {
    const response = await apiClient.put<ApiResponse<Store>>(`/stores/${storeId}`, storeData);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '更新店铺失败');
    }
  } catch (error) {
    console.error('更新店铺失败:', error);
    throw error;
  }
}

/**
 * 删除店铺
 */
export async function deleteStore(storeId: string): Promise<void> {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(`/stores/${storeId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '删除店铺失败');
    }
  } catch (error) {
    console.error('删除店铺失败:', error);
    throw error;
  }
}

/**
 * 更新店铺状态
 */
export async function updateStoreStatus(storeId: string, status: string): Promise<Store> {
  try {
    const response = await apiClient.patch<ApiResponse<Store>>(`/stores/${storeId}/status`, { status });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '更新店铺状态失败');
    }
  } catch (error) {
    console.error('更新店铺状态失败:', error);
    throw error;
  }
}

/**
 * 获取店铺统计信息
 */
export async function fetchStoreStats(): Promise<StoreStats> {
  try {
    const response = await apiClient.get<ApiResponse<StoreStats>>('/stores/stats');
    
    if (response.data.success) {
      return response.data.data;
    } else {
      // 如果API不存在，返回模拟数据
      return {
        totalStores: 0,
        activeStores: 0,
        inactiveStores: 0,
        maintenanceStores: 0,
        closedStores: 0,
        averageRating: 0,
        totalCapacity: 0,
      };
    }
  } catch (error) {
    console.warn('获取店铺统计信息失败，使用模拟数据:', error);
    // 返回模拟数据
    return {
      totalStores: 0,
      activeStores: 0,
      inactiveStores: 0,
      maintenanceStores: 0,
      closedStores: 0,
      averageRating: 0,
      totalCapacity: 0,
    };
  }
}

/**
 * 上传店铺图片
 */
export async function uploadStoreImage(file: File): Promise<{ url: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/stores/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      // 如果上传API不存在，返回模拟URL
      return {
        url: URL.createObjectURL(file),
      };
    }
  } catch (error) {
    console.warn('上传图片失败，使用本地URL:', error);
    // 返回本地URL
    return {
      url: URL.createObjectURL(file),
    };
  }
}

/**
 * 批量更新店铺状态
 */
export async function batchUpdateStoreStatus(storeIds: string[], status: string): Promise<void> {
  try {
    const response = await apiClient.post<ApiResponse<void>>('/stores/batch-status', {
      storeIds,
      status,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || '批量更新店铺状态失败');
    }
  } catch (error) {
    console.error('批量更新店铺状态失败:', error);
    throw error;
  }
}

/**
 * 导出店铺数据
 */
export async function exportStores(params: StoreQueryParams = {}): Promise<Blob> {
  try {
    const response = await apiClient.get('/stores/export', {
      params,
      responseType: 'blob',
    });
    
    return response.data;
  } catch (error) {
    console.error('导出店铺数据失败:', error);
    throw error;
  }
}