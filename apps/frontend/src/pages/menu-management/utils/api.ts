/**
 * @deprecated 旧规范菜单管理API工具函数
 * 新规范请使用 src/config/api-routes.ts 中的路由常量
 */
import axios from 'axios';
import { API_ENDPOINTS } from '../../../config/api-routes';

const API_BASE = '';  // 使用 Vite 代理，空字符串自动走本地

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// 获取租户ID (当前临时方案)
function getTenantId(): number {
  return 8; // qilin-test
}

// 获取当前店铺ID
function getStoreId(): number {
  return 6; // test-store
}

// ===== 菜品模板 API =====

export async function fetchMenuTemplates(tenantId?: number) {
  const tid = tenantId || getTenantId();
  const res = await api.get(`/api/v1/tenant/${tid}/menu-templates`);
  return res.data.data;
}

export async function createMenuTemplate(data: {
  category_name: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  sort_order?: number;
}) {
  const tid = getTenantId();
  const res = await api.post(`/api/v1/tenant/${tid}/menu-templates`, data);
  return res.data;
}

export async function updateMenuTemplate(id: number, data: {
  category_name: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  sort_order?: number;
}) {
  const tid = getTenantId();
  const res = await api.post(`/api/v1/tenant/${tid}/menu-templates`, { id, ...data });
  return res.data;
}

export async function deleteMenuTemplate(id: number) {
  const res = await api.delete(`/api/v1/menu-templates/${id}`);
  return res.data;
}

// ===== 分店菜品配置 API =====

export async function fetchStoreMenuConfig(storeId?: number) {
  const sid = storeId || getStoreId();
  const res = await api.get(`/api/v1/store/${sid}/menu-config`);
  return res.data.data;
}

export async function updateStoreMenuConfig(data: {
  template_id: number;
  is_active?: boolean;
  is_sold_out?: boolean;
}) {
  const sid = getStoreId();
  const res = await api.post(`/api/v1/store/${sid}/menu-config`, data);
  return res.data;
}

// ===== 图片上传 API =====

export async function uploadMenuImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await api.post(API_ENDPOINTS.UPLOAD.MENU_IMAGE, {
          tenant_id: getTenantId(),
          image_base64: base64,
          filename: file.name,
        });
        resolve(res.data.data.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

export default api;
