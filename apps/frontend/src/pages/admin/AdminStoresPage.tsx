import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api-routes';

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
  createdAt: string;
  tenant: Tenant;
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(API_ENDPOINTS.STORES_LIST);
        const json = await res.json();
        setStores(json?.data || []);
      } catch (err: any) {
        setError('加载失败: ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = stores.filter(s =>
    !search || s.name.includes(search) || s.tenant?.name?.includes(search) || s.slug.includes(search)
  );

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
                    <td className="px-4 py-3">{statusBadge(store.status)}</td>
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
                          onClick={() => navigate(`/t/${store.tenant?.subdomain}/s/${store.slug}/printers`)}
                          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          🖨️ 打印机
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
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 border-t border-gray-200">
            共 {filtered.length} 家店铺
          </div>
        </div>
      )}
    </div>
  );
}
