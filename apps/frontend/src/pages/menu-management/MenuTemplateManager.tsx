import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api-routes';
import {
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateItemAvailability,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './utils/api.new';

// 类型定义
interface Store {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { items: number };
}

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isRecommended: boolean;
  preparationTime: number | null;
  sortOrder: number;
  category: { id: string; name: string };
}

type TabType = 'items' | 'categories';

/** 构建带参数URL */
function buildUrl(template: string, params: Record<string, string>): string {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  }
  return url;
}

/** 获取token */
function getToken(): string | null {
  return localStorage.getItem('qilin_access_token');
}

/** 带Token的fetch */
async function authFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return response.json();
}

export default function MenuTemplateManager() {
  const { tenantSlug, storeSlug } = useParams<{ tenantSlug: string; storeSlug: string }>();

  // 店铺选择
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storesLoading, setStoresLoading] = useState(true);

  // 菜单数据
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab和表单
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '', name: '', description: '', price: '', imageUrl: '',
  });
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 加载店铺列表 + 自动选中（有storeSlug的话）
  useEffect(() => {
    async function loadStores() {
      setStoresLoading(true);
      try {
        const url = buildUrl(API_ENDPOINTS.STORES_SELECT, {}) + '?limit=20';
        const res = await fetch(url);
        const json = await res.json();
        const list: Store[] = json?.data || [];
        setStores(list);

        // 优先级：URL中的 storeSlug > localStorage
        if (storeSlug) {
          const matched = list.find(s => s.slug === storeSlug);
          if (matched) {
            setStoreId(matched.id);
            setStoreName(matched.name);
            localStorage.setItem('menuManagement-storeId', matched.id);
            return;
          }
        }
        const saved = localStorage.getItem('menuManagement-storeId');
        if (saved && list.some(s => s.id === saved)) {
          setStoreId(saved);
          setStoreName(list.find(s => s.id === saved)?.name || '');
        }
      } catch (err: any) {
        setError('加载店铺列表失败: ' + (err.message || ''));
      } finally {
        setStoresLoading(false);
      }
    }
    loadStores();
  }, [storeSlug]);

  // 切换店铺时保存
  const handleStoreChange = (sid: string) => {
    setStoreId(sid);
    setStoreName(stores.find(s => s.id === sid)?.name || '');
    localStorage.setItem('menuManagement-storeId', sid);
    // 立即加载（React state 异步，手动触发）
    if (sid) {
      setTimeout(() => loadData(), 0);
    } else {
      setItems([]);
      setCategories([]);
    }
  };

  // 加载菜单数据
  const loadData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetchMenuItems(storeId),
        fetchCategories(storeId),
      ]);
      setItems(itemsRes?.data || itemsRes || []);
      setCategories(catsRes?.data || catsRes || []);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) loadData();
  }, [storeId, loadData]);

  // 按分类分组
  const itemsByCategory = categories
    .filter(cat => cat.isActive)
    .map(cat => ({
      name: cat.name, id: cat.id,
      items: items.filter(i => i.categoryId === cat.id),
    }));

  // ===== 菜单项CRUD =====
  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ categoryId: categories[0]?.id || '', name: '', description: '', price: '', imageUrl: '' });
    setShowForm(true);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ categoryId: item.categoryId, name: item.name, description: item.description || '', price: String(item.price), imageUrl: item.imageUrl || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) { setError('名称和价格必填'); return; }
    try {
      setError('');
      const payload = { categoryId: formData.categoryId, name: formData.name.trim(), description: formData.description.trim(), price: parseFloat(formData.price), imageUrl: formData.imageUrl || undefined };
      if (editingItem) { await updateMenuItem(storeId, editingItem.id, payload); showSuccess('✅ 更新成功'); }
      else { await createMenuItem(storeId, payload); showSuccess('✅ 创建成功'); }
      setShowForm(false);
      loadData();
    } catch (err: any) { setError(err.message || '保存失败'); }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('确定删除此菜品？')) return;
    try { await deleteMenuItem(storeId, itemId); showSuccess('✅ 已删除'); loadData(); }
    catch (err: any) { setError(err.message || '删除失败'); }
  };

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    try { await updateItemAvailability(storeId, itemId, !isAvailable); showSuccess('✅ 状态已更新'); loadData(); }
    catch (err: any) { setError(err.message || '操作失败'); }
  };

  // ===== 分类CRUD =====
  const openCategoryForm = (cat?: Category) => {
    if (cat) { setEditingCategory(cat); setCategoryFormData({ name: cat.name, description: cat.description || '' }); }
    else { setEditingCategory(null); setCategoryFormData({ name: '', description: '' }); }
    setShowCategoryForm(true);
  };

  const handleCategorySave = async () => {
    if (!categoryFormData.name.trim()) { setError('分类名称必填'); return; }
    try {
      setError('');
      if (editingCategory) { await updateCategory(storeId, editingCategory.id, categoryFormData); showSuccess('✅ 分类已更新'); }
      else { await createCategory(storeId, categoryFormData.name, categoryFormData.description); showSuccess('✅ 分类已创建'); }
      setShowCategoryForm(false);
      loadData();
    } catch (err: any) { setError(err.message || '操作失败'); }
  };

  const handleCategoryDelete = async (categoryId: string) => {
    if (!window.confirm('确定删除此分类？菜品也会被删除！')) return;
    try { await deleteCategory(storeId, categoryId); showSuccess('✅ 分类已删除'); loadData(); }
    catch (err: any) { setError(err.message || '删除失败'); }
  };

  // ===== 渲染 =====
  if (storesLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-500 text-lg">加载店铺列表...</div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 头部 + 店铺选择器 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">菜品管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理各店铺的菜单和分类</p>
        </div>
        <select
          value={storeId}
          onChange={e => handleStoreChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-w-[200px]"
        >
          <option value="">-- 请选择店铺 --</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.status !== 'ACTIVE' ? `(${s.status})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 消息 */}
      {successMsg && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{successMsg}</div>}
      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* 未选店铺 */}
      {!storeId && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-6 rounded-lg text-center">
          请从上方下拉框选择一个店铺来管理其菜单
        </div>
      )}

      {/* 已选店铺 → 显示内容 */}
      {storeId && (
        <>
          {storeName && (
            <div className="mb-4 px-4 py-2 bg-orange-50 text-orange-700 text-sm rounded-lg font-medium">
              🏪 当前店铺：{storeName}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]"><div className="text-gray-500">加载菜单数据...</div></div>
          ) : (
            <>
              {/* Tab */}
              <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setActiveTab('items')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'items' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  菜品管理 ({items.length})
                </button>
                <button onClick={() => setActiveTab('categories')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  分类管理 ({categories.length})
                </button>
              </div>

              {/* 菜品管理 */}
              {activeTab === 'items' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">共 {items.length} 道菜品</p>
                    <button onClick={openCreateForm} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ 添加菜品</button>
                  </div>
                  <div className="space-y-6">
                    {itemsByCategory.map(cat => (
                      <div key={cat.id}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span className="text-sm text-gray-400 font-normal">({cat.items.length}道)</span>
                        </h3>
                        <div className="grid gap-3">
                          {cat.items.map(item => (
                            <div key={item.id} className={`flex items-center gap-4 bg-white rounded-lg p-3 border transition-shadow hover:shadow-sm ${item.isAvailable ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl text-gray-300">🍽</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-medium truncate ${item.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>{item.name}</h4>
                                  <span className="text-sm font-bold text-orange-600">¥{item.price}</span>
                                  {item.isRecommended && <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">推荐</span>}
                                  {!item.isAvailable && <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">已下架</span>}
                                </div>
                                {item.description && <p className="text-sm text-gray-500 truncate mt-0.5">{item.description}</p>}
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${item.isAvailable ? 'text-gray-600 border-gray-300 hover:bg-gray-50' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
                                  {item.isAvailable ? '下架' : '上架'}
                                </button>
                                <button onClick={() => openEditForm(item)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">编辑</button>
                                <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50">删除</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 分类管理 */}
              {activeTab === 'categories' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">共 {categories.length} 个分类</p>
                    <button onClick={() => openCategoryForm()} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ 添加分类</button>
                  </div>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-4 bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{cat.name}</h4>
                            <span className="text-xs text-gray-400">排序 {cat.sortOrder}</span>
                            {!cat.isActive && <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">已停用</span>}
                          </div>
                          {cat.description && <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">{cat._count.items} 道菜品</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => openCategoryForm(cat)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">编辑</button>
                          <button onClick={() => handleCategoryDelete(cat.id)} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50">删除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 菜品编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingItem ? '编辑菜品' : '添加菜品'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select value={formData.categoryId} onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
                <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="秘制红烧肉" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="菜品简介" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格 *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                  <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                    placeholder="38.00" className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 分类编辑弹窗 */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingCategory ? '编辑分类' : '添加分类'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
                <input type="text" value={categoryFormData.name} onChange={e => setCategoryFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="招牌菜" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input type="text" value={categoryFormData.description} onChange={e => setCategoryFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="分类说明" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCategoryForm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleCategorySave} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
