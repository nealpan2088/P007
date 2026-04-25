/**
 * 打印机管理页面
 * 品牌列表（管理员）+ 店铺打印机配置（添加/编辑/删除/测试连接）
 */

import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api-client';
import { API_ENDPOINTS } from '../../config/api-routes';

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
  storeId: string;
  brandCode: string;
  name: string;
  serialNumber: string;
  secretKey: string;
  model: string;
  printCopies: number;
  isDefault: boolean;
}

const emptyForm: PrinterForm = {
  storeId: '',
  brandCode: 'shangpeng',
  name: '',
  serialNumber: '',
  secretKey: '',
  model: '',
  printCopies: 1,
  isDefault: false,
};

export default function PrinterManagement() {
  const [brands, setBrands] = useState<PrinterBrand[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [stores, setStores] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PrinterForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ printerId: string; message: string; success: boolean } | null>(null);

  // 页面加载时获取商店列表
  useEffect(() => {
    fetchStores();
    fetchBrands();
  }, []);

  // 选中店铺时加载打印机
  useEffect(() => {
    if (selectedStoreId) {
      fetchPrinters(selectedStoreId);
    } else {
      setPrinters([]);
    }
  }, [selectedStoreId]);

  async function fetchStores() {
    try {
      const json = await apiGet(API_ENDPOINTS.STORES_SELECT + '?limit=20');
      if (json.success && Array.isArray(json.data)) {
        setStores(json.data);
      }
    } catch (err) {
      console.error('[PrinterMgmt] 获取店铺列表失败:', err);
    }
  }

  async function fetchBrands() {
    try {
      const json = await apiGet(API_ENDPOINTS.PRINTER.BRANDS);
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
      const json = await apiGet(API_ENDPOINTS.PRINTER.LIST + `?storeId=${storeId}`);
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
      const json = editingId
        ? await apiPut(API_ENDPOINTS.PRINTER.UPDATE.replace(':id', editingId), body)
        : await apiPost(API_ENDPOINTS.PRINTER.CREATE, body);

      if (json.success) {
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
      const json = await apiDelete(API_ENDPOINTS.PRINTER.DELETE.replace(':id', printerId));
      if (json.success) {
        alert('打印机已删除');
        fetchPrinters(selectedStoreId);
      } else {
        alert('删除失败: ' + (json.error || '未知错误'));
      }
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请查看控制台详情');
    }
  }

  async function handleTest(printerId: string) {
    setTestResult(null);
    try {
      const json = await apiPost(API_ENDPOINTS.PRINTER.TEST.replace(':id', printerId), {});
      if (json.success && json.data) {
        setTestResult({ printerId, ...json.data });
      } else {
        setTestResult({ printerId, message: json.error || '测试失败', success: false });
      }
    } catch (err) {
      console.error('[PrinterMgmt] 测试打印机失败:', err);
      setTestResult({ printerId, message: '网络请求失败', success: false });
    }
  }

  function handleEdit(printer: Printer) {
    setEditingId(printer.id);
    setFormData({
      storeId: printer.storeId,
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
      <h1 className="text-2xl font-bold mb-6">🖨️ 打印机管理</h1>

      {/* 品牌列表 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">支持的打印机品牌</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brands.map(brand => (
            <div key={brand.id} className="border rounded p-3 flex items-center gap-3">
              <span className="text-2xl">🖨️</span>
              <div>
                <div className="font-medium">{brand.name}</div>
                <div className="text-xs text-gray-500">{brand.baseUrl}</div>
              </div>
              <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                已就绪
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 选择店铺 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block mb-2 font-medium">选择店铺</label>
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
          options={[
            ...stores.map(store => ({
              value: store.id,
              label: `${store.name} (${store.slug})`,
            })),
          ]}
        />
      </div>

      {selectedStoreId && (
        <>
          {/* 打印机列表 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">打印机列表</h2>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => { setEditingId(null); setFormData({ ...emptyForm }); setShowForm(true); }}
              >
                + 添加打印机
              </button>
            </div>

            {loading && <div className="text-gray-500">加载中...</div>}
            {error && <div className="text-red-500 mb-2">{error}</div>}

            {printers.length === 0 && !loading && (
              <div className="text-gray-400 text-center py-8">暂未配置打印机，点击上方按钮添加</div>
            )}

            <div className="space-y-3">
              {printers.map(printer => (
                <div key={printer.id} className="border rounded p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${printer.status === 'ACTIVE' ? '' : 'opacity-50'}`}>🖨️</span>
                    <div>
                      <div className="font-medium">
                        {printer.name || printer.serialNumber}
                        {printer.isDefault && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">默认</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {printer.brand.name} | SN: {printer.serialNumber}
                        {printer.model && ` | ${printer.model}`}
                        {printer.printCopies > 1 && ` | 打印${printer.printCopies}份`}
                      </div>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        printer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        printer.status === 'FAULT' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
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
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      onClick={() => handleTest(printer.id)}
                    >
                      测试
                    </button>
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      onClick={() => handleEdit(printer)}
                    >
                      编辑
                    </button>
                    <button
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                      onClick={() => handleDelete(printer.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 添加/编辑表单弹窗 */}
          {showForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">{editingId ? '编辑打印机' : '添加打印机'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">打印机品牌</label>
                    <select
                      className="w-full border rounded p-2"
                      value={formData.brandCode}
                      onChange={e => setFormData({ ...formData, brandCode: e.target.value })}
                      required
                    >
                      {brands.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">名称（可选）</label>
                    <input
                      className="w-full border rounded p-2"
                      placeholder="如：前台收银打印机"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">SN 编号 *</label>
                      <input
                        className="w-full border rounded p-2"
                        placeholder="打印机序列号"
                        value={formData.serialNumber}
                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">密钥 Key *</label>
                      <input
                        className="w-full border rounded p-2"
                        placeholder="打印机密钥"
                        value={formData.secretKey}
                        onChange={e => setFormData({ ...formData, secretKey: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">型号</label>
                      <input
                        className="w-full border rounded p-2"
                        placeholder="如：SP-580"
                        value={formData.model}
                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">打印份数</label>
                      <input
                        className="w-full border rounded p-2"
                        type="number"
                        min={1}
                        max={10}
                        value={formData.printCopies}
                        onChange={e => setFormData({ ...formData, printCopies: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                    />
                    <span className="text-sm">设为默认打印机</span>
                  </label>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                      onClick={() => setShowForm(false)}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? '保存中...' : (editingId ? '保存修改' : '添加')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
