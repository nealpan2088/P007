/**
 * 麒麟项目 - 菜单管理工具函数（新规范）
 * 使用 api-routes.ts 中的路由常量，通过 api-client 调用
 */
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/api-client';
import { API_ENDPOINTS } from '../../../config/api-routes';

/** 构建替换参数URL */
function buildUrl(template: string, params: Record<string, string>): string {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  }
  return url;
}

// ===== 菜品管理 =====

export async function fetchMenuItems(storeId: string) {
  const url = buildUrl(API_ENDPOINTS.MENU.ITEMS, { storeId });
  return apiGet(url);
}

export async function createMenuItem(storeId: string, data: {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isRecommended?: boolean;
  preparationTime?: number;
}) {
  const url = buildUrl(API_ENDPOINTS.MENU.ITEMS, { storeId });
  return apiPost(url, data);
}

export async function updateMenuItem(storeId: string, itemId: string, data: any) {
  const url = buildUrl(API_ENDPOINTS.MENU.ITEM_DETAIL, { storeId, itemId });
  return apiPut(url, data);
}

export async function deleteMenuItem(storeId: string, itemId: string) {
  const url = buildUrl(API_ENDPOINTS.MENU.ITEM_DETAIL, { storeId, itemId });
  return apiDelete(url);
}

export async function updateItemAvailability(storeId: string, itemId: string, isAvailable: boolean) {
  const url = buildUrl(API_ENDPOINTS.MENU.ITEM_AVAILABILITY, { storeId, itemId });
  return apiPut(url, { isAvailable });
}

// ===== 分类管理 =====

export async function fetchCategories(storeId: string) {
  const url = buildUrl(API_ENDPOINTS.MENU.CATEGORIES, { storeId });
  return apiGet(url);
}

export async function createCategory(storeId: string, name: string, description?: string) {
  const url = buildUrl(API_ENDPOINTS.MENU.CATEGORIES, { storeId });
  return apiPost(url, { name, description });
}

export async function updateCategory(storeId: string, categoryId: string, data: any) {
  const url = buildUrl(API_ENDPOINTS.MENU.CATEGORY_DETAIL, { storeId, categoryId });
  return apiPut(url, data);
}

export async function deleteCategory(storeId: string, categoryId: string) {
  const url = buildUrl(API_ENDPOINTS.MENU.CATEGORY_DETAIL, { storeId, categoryId });
  return apiDelete(url);
}
