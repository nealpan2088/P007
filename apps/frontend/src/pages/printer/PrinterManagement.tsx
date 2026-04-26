/**
 * 打印机管理页面
 * 品牌列表 + 店铺打印机配置（添加/编辑/删除/测试连接）
 * 
 * 访问方式：
 * 1. /admin/printers — 全局模式，需手动选店
 * 2. /t/:tenantSlug/s/:storeSlug/printers — 店铺模式，自动加载
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Select, message } from 'antd';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api-client';

// 类型定义
interface PrinterBrand {
  id: string;
  name: string;
  code: string;
  baseUrl: string;
  isActive: boolean;
}

interface Printer {
  id: string;
  storeId: string;
  brandId: string;
  name: string;
  serialNumber: string;
  model: string;
  status: 'ACTIVE' | 'INACTIVE' | 'FAULT';
  printCopies: number;
  isDefault: boolean;
  createdAt: string;
  brand: { name: string; code: string; baseUrl: string };
}

interface PrinterForm {
  brandCode: string;
  name: string;
  serialNumber: string;
  secretKey: string;
  model: string;
  printCopies: number;
  isDefault: boolean;
}

interface StoreOption {
  id: string;
  name: string;
  slug: string;
}

const emptyForm: PrinterForm = {
  brandCode: 'shangpeng',
  name: '',
  serialNumber: '',
  secretKey: '',
  model: '',
  printCopies: 1,
  isDefault: false,
};

export default function PrinterManagement() {
  const { tenantSlug, storeSlug } = useParams<{ tenantSlug?: string; storeSlug?: string }>();
  const navigate = useNavigate();
  const isStoreContext = !!storeSlug;  // 是否带店铺上下文

  const [brands, setBrands] = useState<PrinterBrand[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedStoreName, setSelectedStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PrinterForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ printerId: string; message: string; success: boolean } | null>(null);

  // 页面加载时获取品牌列表和商店列表
  useEffect(() => {
    fetchBrands();
    if (!isStoreContext) {
      fetchStores();
    }
  }, []);

  // 如果是店铺模式，通过 storeSlug 自动匹配店铺
  useEffect(() => {
    if (storeSlug) {
      resolveStoreBySlug(storeSlug);
    }
  }, [storeSlug]);

  // 选中店铺时加载打印机
  useEffect(() => {
    if (selectedStoreId) {
      fetchPrinters(selectedStoreId);
    } else {
      setPrinters([]);
    }
  }, [selectedStoreId]);

  async function resolveStoreBySlug(slug: string) {
    try {
      const json = await apiGet('/api/admin/stores/select?limit=100');
      if (json.success && Array.isArray(json.data)) {
        setStores(json.data);
        const match = json.data.find((s: StoreOption) => s.slug === slug);
        if (match) {
          setSelectedStoreId(match.id);
          setSelectedStoreName(match.name);
        } else {
          message.warning('未找到匹配的店铺，请手动选择');
        }
      }
    } catch (err) {
      console.error('[PrinterMgmt] 解析店铺失败:', err);
    }
  }

  async function fetchStores() {
    try {
      const json = await apiGet('/api/admin/stores/select?limit=20');
      if (json.success && Array.isArray(json.data)) {
        setStores(json.data);
      }
    } catch (err) {
      console.error('[PrinterMgmt] 获取店铺列表失败:', err);
    }
  }

  async function fetchBrands() {
    try {
      const json = await apiGet('/api/admin/printers/brands');
      if (json.success) {
        setBrands(json.data.filter((b: PrinterBrand) => b.isActive));
      }
    } catch (err) {
      console.error('[PrinterMgmt] 获取品牌列表失败:', err);
    }
  }

  async function fetchPrinters(storeId: string) {
    setLoading(true);
    setError('');
    try {
      const json = await apiGet(`/api/admin/printers?storeId=${storeId}`);
      if (json.success) {
        setPrinters(json.data);
      } else {
        setError(json.error || '获取打印机列表失败');
      }
    } catch (err) {
      console.error('[PrinterMgmt] 获取打印机列表失败:', err);
      setError('获取打印机列表失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const body = { ...formData, storeId: selectedStoreId };
      // 去掉空的 secretKey（编辑时可以不传）
      if (!body.secretKey?.trim()) delete (body as any).secretKey;

      const json = editingId
        ? await apiPut(`/api/admin/printers/${editingId}`, body)
        : await apiPost('/api/admin/printers', body);

      if (json.success) {
        message.success(editingId ? '打印机已更新' : '打印机已添加');
        setShowForm(false);
        setEditingId(null);
        setFormData({ ...emptyForm });
        fetchPrinters(selectedStoreId);
      } else {
        setError(json.error || '保存失败');
      }
    } catch (err) {
      console.error('[PrinterMgmt] 保存打印机失败:', err);
      setError('保存失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(printerId: string) {
    if (!confirm('确定删除此打印机？')) return;
    try {
      const json = await apiDelete(`/api/admin/printers/${printerId}`);
      if (json.success) {
        message.success('打印机已删除');
        fetchPrinters(selectedStoreId);
      } else {
        message.error('删除失败: ' + (json.error || '未知错误'));
      }
    } catch (err) {
      console.error('删除失败:', err);
      message.error('删除失败，请查看控制台详情');
    }
  }

  async function handleTest(printerId: string) {
    setTestResult(null);
    try {
      const json = await apiPost(`/api/admin/printers/${printerId}/test`, {});
      if (json.success && json.data) {
        setTestResult({ printerId, ...json.data });
        message.success(json.data.message || '测试请求已发送');
      } else {
        setTestResult({ printerId, message: json.error || '测试失败', success: false });
        message.error(json.error || '测试失败');
      }
    } catch (err) {
      console.error('[PrinterMgmt] 测试打印机失败:', err);
      setTestResult({ printerId, message: '网络请求失败', success: false });
      message.error('网络请求失败');
    }
  }

  function handleEdit(printer: Printer) {
    setEditingId(printer.id);
    setFormData({
      brandCode: printer.brand.code,
      name: printer.name || '',
      serialNumber: printer.serialNumber,
      secretKey: '',
      model: printer.model || '',
      printCopies: printer.printCopies,
      isDefault: printer.isDefault,
    });
    setShowForm(true);
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🖨️ 打印机管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStoreContext
              ? selectedStoreName ? `当前店铺：${selectedStoreName}` : '加载店铺中...'
              : '全局管理所有店铺的打印机'}
          </p>
        </div>
        {isStoreContext && (
          <button
            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {
              if (tenantSlug) navigate(`/t/${tenantSlug}/stores`);
            }}
          >
            ← 返回店铺列表
          </button>
        )}
      </div>

      {/* 品牌列表 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h2 className="text-md font-semibold mb-3 text-gray-700">支持的打印机品牌</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {brands.map(brand => (
            <div key={brand.id} className="border border-gray-100 rounded-lg p-3 flex items-center gap-3 bg-gray-50/50">
              <span className="text-2xl">🖨️</span>
              <div>
                <div className="font-medium text-gray-800">{brand.name}</div>
                <div className="text-xs text-gray-400">{brand.baseUrl}</div>
              </div>
              <span className="ml-auto px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full border border-green-200">
                已就绪
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 店铺选择（仅全局模式显示） */}
      {!isStoreContext && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <label className="block mb-2 font-medium text-gray-700">选择店铺</label>
          <Select
            className="w-full md:w-96"
            placeholder="🔍 搜索并选择店铺..."
            showSearch
            allowClear
            value={selectedStoreId || undefined}
            onChange={value => setSelectedStoreId(value || '')}
            filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }
            options={stores.map(store => ({ value: store.id, label: `${store.name} (${store.slug})` }))}
          />
        </div>
      )}

      {selectedStoreId && (
        <>
          {/* 打印机列表 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-semibold text-gray-700">
                打印机列表
                <span className="ml-2 text-sm text-gray-400 font-normal">（{printers.length} 台）</span>
              </h2>
              <button
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                onClick={() => { setEditingId(null); setFormData({ ...emptyForm }); setShowForm(true); }}
              >
                + 添加打印机
              </button>
            </div>

            {loading && <div className="text-gray-400 text-center py-8">加载中...</div>}
            {error && <div className="text-red-500 mb-2 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

            {printers.length === 0 && !loading && (
              <div className="text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-3xl mb-2">🖨️</div>
                <p>暂未配置打印机</p>
                <p className="text-xs mt-1">点击上方按钮添加</p>
              </div>
            )}

            <div className="space-y-3">
              {printers.map(printer => (
                <div key={printer.id} className="border border-gray-100 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl ${printer.status === 'ACTIVE' ? '' : 'opacity-40'}`}>🖨️</span>
                    <div>
                      <div className="font-medium text-gray-800">
                        {printer.name || printer.serialNumber}
                        {printer.isDefault && (
                          <span className="ml-2 text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full border border-orange-200">默认</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {printer.brand.name} · SN: {printer.serialNumber}
                        {printer.model && ` · ${printer.model}`}
                        {printer.printCopies > 1 && ` · 打印${printer.printCopies}份`}
                      </div>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        printer.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border border-green-200' :
                        printer.status === 'FAULT' ? 'bg-red-50 text-red-600 border border-red-200' :
                        'bg-gray-50 text-gray-500 border border-gray-200'
                      }`}>
                        {printer.status === 'ACTIVE' ? '在线' : printer.status === 'FAULT' ? '故障' : '停用'}
                      </span>
                      {testResult?.printerId === printer.id && (
                        <span className={`ml-2 text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                          {testResult.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleTest(printer.id)}>测试</button>
                    <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleEdit(printer)}>编辑</button>
                    <button className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors" onClick={() => handleDelete(printer.id)}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 添加/编辑表单弹窗 */}
          {showForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4 text-gray-800">{editingId ? '编辑打印机' : '添加打印机'}</h3>
                
                {/* 店铺名称提示 */}
                {isStoreContext && selectedStoreName && (
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg text-sm text-orange-700 border border-orange-200">
                    店铺：{selectedStoreName}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">打印机品牌</label>
                    <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none" value={formData.brandCode} onChange={e => setFormData({ ...formData, brandCode: e.target.value })} required>
                      {brands.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">名称（可选）</label>
                    <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none" placeholder="如：前台收银打印机" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">SN 编号 *</label>
                      <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none" placeholder="打印机序列号" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">密钥 Key {editingId ? '（留空不修改）' : '*'}</label>
                      <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none" placeholder={editingId ? '不修改则留空' : '打印机密钥'} value={formData.secretKey} onChange={e => setFormData({ ...formData, secretKey: e.target.value })} required={!editingId} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">型号</label>
                      <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none" placeholder="如：SP-580" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">打印份数</label>
                      <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none" type="number" min={1} max={10} value={formData.printCopies} onChange={e => setFormData({ ...formData, printCopies: parseInt(e.target.value) || 1 })} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={formData.isDefault} className="rounded border-gray-300" onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} />
                    设为默认打印机（订单打印时优先使用）
                  </label>
                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <button type="button" className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm" onClick={() => setShowForm(false)}>取消</button>
                    <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm disabled:opacity-50" disabled={loading}>
                      {loading ? '保存中...' : (editingId ? '保存修改' : '添加')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* 未选店铺提示 */}
      {!selectedStoreId && !loading && (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-5xl mb-4">🖨️</div>
          <p className="text-lg">{isStoreContext ? '正在加载店铺...' : '请先选择一家店铺'}</p>
          {!isStoreContext && <p className="text-sm mt-1">选择店铺后即可管理该店铺的打印机</p>}
        </div>
      )}
    </div>
  );
}
