import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { apiPut } from '../../utils/api-client';

const API_BASE = '/api/admin/stores';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  status: string;
  themeColor?: string;
  logoUrl?: string;
  headerImageUrl?: string;
  themeTemplate?: string;
  createdAt: string;
  tenant: Tenant;
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const pageSize = 15;
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadStores();
  }, [page, debouncedSearch]);

  async function loadStores() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const res = await fetch(`${API_BASE}/list?${params}`);
      const json = await res.json();
      setStores(json?.data || []);
      setTotal(json?.total || 0);
    } catch (err: any) {
      setError('加载失败: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }

  const filtered = stores;
  const totalPages = Math.ceil(total / pageSize);

  const openThemeEditor = (store: Store) => setEditingStore(store);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      DRAFT: 'bg-gray-100 text-gray-600',
      SUSPENDED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  // 状态切换：ACTIVE ↔ DRAFT 互切
  const toggleStatus = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      const json = await apiPut(`${API_BASE}/${storeId}`, { status: newStatus });
      if (json.success) {
        setStores(prev => prev.map(s => s.id === storeId ? { ...s, status: newStatus } : s));
        message.success(`已切换到 ${newStatus === 'ACTIVE' ? '营业中' : '草稿'}`);
      }
    } catch (err: any) {
      message.error('状态切换失败: ' + (err.message || ''));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏪 店铺管理</h1>
          <p className="text-sm text-gray-500 mt-1">全局查看和管理所有店铺</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 搜索店铺名/租户..."
          className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]"><div className="text-gray-500 text-lg">加载中...</div></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">店铺名称</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">所属租户</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">创建时间</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((store, i) => (
                  <tr key={store.id} className={`border-b border-gray-100 hover:bg-orange-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-xs text-gray-400">{store.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {store.tenant?.name || '—'}
                      <div className="text-xs text-gray-400">{store.tenant?.subdomain || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(store.id, store.status)}
                        title={store.status === 'ACTIVE' ? '点击设为草稿' : '点击设为营业中'}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {statusBadge(store.status)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(store.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => navigate(`/t/${store.tenant?.subdomain}/s/${store.slug}/menu`)}
                          className="px-3 py-1.5 text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
                        >
                          📦 菜单
                        </button>
                        <button
                          onClick={() => {
                            const subdomain = store.tenant?.subdomain || store.tenant?.slug || store.tenant?.id;
                            window.open(`/t/${subdomain}/s/${store.slug}/scan/A01`, '_blank');
                          }}
                          className="px-3 py-1.5 text-xs bg-green-50 text-green-600 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                        >
                          👁️ 预览
                        </button>
                        <button
                          onClick={() => openThemeEditor(store)}
                          className="px-3 py-1.5 text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                        >
                          🎨 装修
                        </button>
                        <button
                          onClick={() => navigate(`/admin/stores/${store.id}/tables`)}
                          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          🪑 餐桌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 border-t border-gray-200 flex items-center justify-between">
            <span>共 {total} 家店铺</span>
            {totalPages > 1 && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-100"
                >上一页</button>
                <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-100"
                >下一页</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 装修弹窗 */}
      <ThemeEditorModal
        store={editingStore}
        onClose={() => setEditingStore(null)}
        onSaved={loadStores}
      />
    </div>
  );
}

// ====== 装修弹窗组件 ======

const THEME_COLORS = [
  '#ff6b35', // 暖橙（美团风格）
  '#1976d2', // 蓝
  '#e53935', // 红
  '#43a047', // 绿
  '#8e24aa', // 紫
  '#00acc1', // 青
  '#f4511e', // 深橙
  '#3949ab', // 靛蓝
  '#6d4c41', // 棕
  '#546e7a', // 蓝灰
];

function ThemeEditorModal({ store, onClose, onSaved }: {
  store: Store | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [themeColor, setThemeColor] = useState(store?.themeColor || '#ff6b35');
  const [customColor, setCustomColor] = useState('');
  const [themeTemplate, setThemeTemplate] = useState(store?.themeTemplate || 'gradient');
  const [logoUrl, setLogoUrl] = useState(store?.logoUrl || '');
  const [logoPreview, setLogoPreview] = useState(store?.logoUrl || '');
  const [headerImageUrl, setHeaderImageUrl] = useState(store?.headerImageUrl || '');
  const [headerPreview, setHeaderPreview] = useState(store?.headerImageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    if (store) {
      setThemeColor(store.themeColor || '#ff6b35');
      setCustomColor('');
      setThemeTemplate(store.themeTemplate || 'gradient');
      setLogoUrl(store.logoUrl || '');
      setLogoPreview(store.logoUrl || '');
      setHeaderImageUrl(store.headerImageUrl || '');
      setHeaderPreview(store.headerImageUrl || '');
      setMessage('');
    }
  }, [store]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 本地预览
    setLogoPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('qilin_access_token');
      const res = await fetch('/api/upload/store-logo', {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setLogoUrl(json.data.url);
        setMessage('✅ Logo 上传成功，请点击保存');
      } else {
        setMessage('❌ 上传失败: ' + (json.error || ''));
        setLogoPreview(store?.logoUrl || '');
      }
    } catch (err: any) {
      setMessage('❌ 上传失败: ' + err.message);
      setLogoPreview(store?.logoUrl || '');
    } finally {
      setUploading(false);
    }
  };

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeaderPreview(URL.createObjectURL(file));
    setUploadingHeader(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('qilin_access_token');
      const res = await fetch('/api/upload/store-header', {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setHeaderImageUrl(json.data.url);
        setMessage('✅ 背景图上传成功，请点击保存');
      } else {
        setMessage('❌ 上传失败: ' + (json.error || ''));
        setHeaderPreview(store?.headerImageUrl || '');
      }
    } catch (err: any) {
      setMessage('❌ 上传失败: ' + err.message);
      setHeaderPreview(store?.headerImageUrl || '');
    } finally {
      setUploadingHeader(false);
    }
  };

  if (!store) return null;

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeColor, logoUrl, themeTemplate, headerImageUrl }),
      });
      const json = await res.json();
      if (json.success || res.ok) {
        setMessage('✅ 保存成功！');
        setTimeout(onSaved, 800);
      } else {
        setMessage('❌ 保存失败: ' + (json.error || json.message || '未知错误'));
      }
    } catch (err: any) {
      setMessage('❌ 网络错误: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">🎨 装修设置 — {store.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* 主题色预览 */}
            <div className="h-20 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-inner transition-all"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${adjustHex(themeColor, -25)})` }}>
              主题色预览
            </div>

            {/* 预设颜色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">预设颜色</label>
              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setThemeColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      themeColor === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* 自定义颜色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">自定义颜色</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={e => {
                    setCustomColor(e.target.value);
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      setThemeColor(e.target.value);
                    }
                  }}
                  placeholder="#ff6b35"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="color"
                  value={themeColor}
                  onChange={e => { setThemeColor(e.target.value); setCustomColor(e.target.value); }}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">输入 Hex 色值或使用颜色选择器</p>
            </div>

            {/* Logo 上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">店铺 Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo 预览" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '🏪'; }} />
                  ) : (
                    <span className="text-2xl">🏪</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-block px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                    {uploading ? '上传中...' : '选择图片'}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/GIF/WebP，最大 1MB</p>
                  <p className="text-xs text-gray-400">建议使用 1:1 正方形图片，多余部分会被裁剪</p>
                  {logoUrl && (
                    <button onClick={() => { setLogoUrl(''); setLogoPreview(''); }} className="text-xs text-red-500 mt-1 hover:underline">
                      清除 Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 店头背景图 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">店头背景图</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0"
                  style={headerPreview ? { backgroundImage: `url(${headerPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                  {!headerPreview && <span className="text-2xl text-gray-300">🖼️</span>}
                </div>
                <div className="flex-1">
                  <label className="inline-block px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                    {uploadingHeader ? '上传中...' : '选择图片'}
                    <input type="file" accept="image/*" onChange={handleHeaderUpload} className="hidden" disabled={uploadingHeader} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/GIF/WebP，最大 1MB</p>
                  <p className="text-xs text-gray-400">建议宽高比 3:1，用于店头背景展示</p>
                  {headerImageUrl && (
                    <button onClick={() => { setHeaderImageUrl(''); setHeaderPreview(''); }} className="text-xs text-red-500 mt-1 hover:underline">
                      清除背景图
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 装修模板 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">装修模板</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setThemeTemplate('gradient')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                    themeTemplate === 'gradient' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(135deg, #ff6b35, #d84315)' }} />
                    <span className="font-medium">渐变风</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">彩色渐变头部，带装饰元素</div>
                </button>
                <button
                  onClick={() => setThemeTemplate('minimal')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                    themeTemplate === 'minimal' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-100 border border-gray-200" />
                    <span className="font-medium">极简白</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">纯白干净设计，简洁清爽</div>
                </button>
              </div>
            </div>

            {message && (
              <div className={`text-sm px-3 py-2 rounded-lg ${
                message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>{message}</div>
            )}
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => window.open('/admin/printers', '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              🖨️ 打印机管理 →
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm text-white rounded-lg"
                style={{ background: saving ? '#999' : themeColor }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 简单颜色变暗辅助函数 */
function adjustHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
