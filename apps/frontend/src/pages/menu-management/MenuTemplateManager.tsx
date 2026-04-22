import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchMenuTemplates,
  createMenuTemplate,
  updateMenuTemplate,
  deleteMenuTemplate,
  fetchStoreMenuConfig,
  updateStoreMenuConfig,
  uploadMenuImage,
} from './utils/api';

// 类型定义
interface MenuItem {
  id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  sort_order: number;
  is_available: boolean;
}

interface StoreConfig {
  template_id: number;
  is_active: boolean;
  is_sold_out: boolean;
  custom_price: number | null;
}

type TabType = 'templates' | 'store-config';

export default function MenuTemplateManager() {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [storeConfig, setStoreConfig] = useState<Map<number, StoreConfig>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 编辑表单
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_name: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
  });
  const [uploading, setUploading] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMenuTemplates();
      setItems(data.items || []);
      // 提取分类列表
      const cats = [...new Set((data.items || []).map((i: MenuItem) => i.category_name))];
      setCategories(cats);

      // 加载分店配置
      const configs = await fetchStoreMenuConfig();
      const configMap = new Map<number, StoreConfig>();
      (configs || []).forEach((c: StoreConfig) => {
        configMap.set(c.template_id, c);
      });
      setStoreConfig(configMap);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 按分类分组
  const itemsByCategory = categories.map(cat => ({
    name: cat,
    items: items.filter(i => i.category_name === cat),
  }));

  // ===== 模板管理 =====

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({
      category_name: categories[0] || '热菜',
      name: '',
      description: '',
      price: '',
      image_url: '',
    });
    setShowForm(true);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      category_name: item.category_name,
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      image_url: item.image_url || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) {
      setError('名称和价格必填');
      return;
    }

    try {
      setError('');
      const payload = {
        category_name: formData.category_name,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        image_url: formData.image_url,
      };

      if (editingItem) {
        await updateMenuTemplate(editingItem.id, payload);
        showSuccess('✅ 更新成功');
      } else {
        await createMenuTemplate(payload);
        showSuccess('✅ 创建成功');
      }

      setShowForm(false);
      loadData();
    } catch (err: any) {
      setError(err.message || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除此菜品？')) return;
    try {
      await deleteMenuTemplate(id);
      showSuccess('✅ 已删除');
      loadData();
    } catch (err: any) {
      setError(err.message || '删除失败');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('图片大小不能超过2MB');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadMenuImage(file);
      setFormData(prev => ({ ...prev, image_url: url }));
      showSuccess('✅ 上传成功');
    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // ===== 分店配置管理 =====

  const toggleStoreItem = async (templateId: number, field: 'is_active' | 'is_sold_out') => {
    const config = storeConfig.get(templateId);
    try {
      await updateStoreMenuConfig({
        template_id: templateId,
        [field]: !(config ? config[field] : field === 'is_active'),
      });
      showSuccess('✅ 配置已更新');
      loadData();
    } catch (err: any) {
      setError(err.message || '配置更新失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">菜品管理</h1>
          <p className="text-sm text-gray-500 mt-1">总部统一管控，分店独立配置</p>
        </div>
      </div>

      {/* 消息提示 */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          菜品模板库
        </button>
        <button
          onClick={() => setActiveTab('store-config')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'store-config'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          本店菜品配置
        </button>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'templates' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">共 {items.length} 道菜品</p>
            <button
              onClick={openCreateForm}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              + 添加菜品
            </button>
          </div>

          {/* 菜品列表 */}
          <div className="space-y-6">
            {itemsByCategory.map(cat => (
              <div key={cat.name}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>{cat.name}</span>
                  <span className="text-sm text-gray-400 font-normal">({cat.items.length}道)</span>
                </h3>
                <div className="grid gap-3">
                  {cat.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      {/* 缩略图 */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="30">🍽</text></svg>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
                            🍽
                          </div>
                        )}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                          <span className="text-sm font-bold text-orange-600">¥{item.price}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 truncate mt-0.5">{item.description}</p>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditForm(item)}
                          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'store-config' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            管理本店上架的菜品。关闭的菜品不会在点餐页面显示，售罄的会标注"今日售罄"。
          </p>
          <div className="space-y-2">
            {items.map(item => {
              const config = storeConfig.get(item.id);
              const isActive = config ? config.is_active : true;
              const isSoldOut = config?.is_sold_out || false;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 bg-white rounded-lg p-3 border transition-colors ${
                    isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">🍽</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-orange-600">¥{item.price}</span>
                      {isSoldOut && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">售罄</span>
                      )}
                      {!isActive && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">已下架</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{item.category_name}</p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {isActive && (
                      <button
                        onClick={() => toggleStoreItem(item.id, 'is_sold_out')}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                          isSoldOut
                            ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                            : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSoldOut ? '取消售罄' : '售罄'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleStoreItem(item.id, 'is_active')}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        isActive
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                      }`}
                    >
                      {isActive ? '下架' : '上架'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 编辑/创建弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? '编辑菜品' : '添加菜品'}
              </h2>

              <div className="space-y-4">
                {/* 分类 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={formData.category_name}
                    onChange={e => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：秘制红烧肉"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="菜品简介，显示在详情中"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* 价格 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格 *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="38.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 图片 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">菜品图片</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                      {uploading ? '上传中...' : '选择图片'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {formData.image_url && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={formData.image_url}
                          alt="预览"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  {formData.image_url && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{formData.image_url}</p>
                  )}
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
