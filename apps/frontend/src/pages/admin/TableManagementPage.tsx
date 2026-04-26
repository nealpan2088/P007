/**
 * TableManagementPage - 餐桌管理页面
 * 
 * 功能：
 * - 查看店铺下的所有餐桌
 * - 新增、编辑、删除餐桌
 * - 批量创建餐桌（快速生成桌号）
 * - 批量更新餐桌状态（激活/停用）
 * - 复制餐桌扫码二维码链接
 * 
 * 入口：/admin/stores → 操作栏"🪑 餐桌"按钮
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../../utils/api-client';
import { API_ENDPOINTS } from '../../config/api-routes';
import './TableManagementPage.css';

interface Table {
  id: string;
  storeId: string;
  tableNumber: string;
  name: string | null;
  capacity: number;
  status: string;
  qrCodeUrl: string | null;
  qrCodeData: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoreOption {
  id: string;
  name: string;
  slug: string;
  tenant?: { name: string };
}

type TabView = 'list' | 'batch-create';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: '可用', color: '#52c41a' },
  OCCUPIED: { label: '已占用', color: '#faad14' },
  RESERVED: { label: '已预订', color: '#1890ff' },
  CLEANING: { label: '清洁中', color: '#d9d9d9' },
  INACTIVE: { label: '已停用', color: '#ff4d4f' },
};

const TableManagementPage: React.FC = () => {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string>('');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabView>('list');
  const [batchCount, setBatchCount] = useState(10);
  const [batchPrefix, setBatchPrefix] = useState('A');
  const [batchStartNum, setBatchStartNum] = useState(1);

  // 加载店铺列表
  useEffect(() => {
    async function loadStores() {
      try {
        const json = await apiGet(API_ENDPOINTS.STORES_SELECT + '?limit=100');
        const list: StoreOption[] = json?.data || [];
        setStores(list);
      } catch (err) {
        console.error('加载店铺列表失败:', err);
      }
    }
    loadStores();
  }, []);

  // 加载餐桌列表
  const loadTables = useCallback(async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    try {
      const json = await apiGet(
        API_ENDPOINTS.TABLES.LIST.replace(':storeId', selectedStoreId),
      );
      setTables(json?.data || []);
    } catch (err) {
      console.error('加载餐桌列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // 选中店铺
  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedIds(new Set());
    const store = stores.find((s) => s.id === storeId);
    if (store) setSelectedStoreSlug(store.slug);
  };

  // 复制扫码链接
  const copyQrLink = async (table: Table) => {
    const slug = selectedStoreSlug;
    const url = `${window.location.origin}/t/sdsd/s/${slug}/scan/${table.tableNumber}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(table.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(table.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // 复制所有桌子的链接
  const copyAllQrLinks = async () => {
    const slug = selectedStoreSlug;
    const lines = tables
      .filter((t) => t.status !== 'INACTIVE')
      .map((t) => `${t.tableNumber}\t${window.location.origin}/t/sdsd/s/${slug}/scan/${t.tableNumber}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      alert(`已复制 ${tables.filter((t) => t.status !== 'INACTIVE').length} 个链接到剪贴板`);
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  // 切换选中
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // 全选/取消
  const toggleSelectAll = () => {
    if (selectedIds.size === tables.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tables.map((t) => t.id)));
    }
  };

  // 批量更新状态
  const batchUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) {
      alert('请先选择餐桌');
      return;
    }
    try {
      await apiPost(API_ENDPOINTS.TABLES.BATCH_STATUS.replace(':storeId', selectedStoreId), {
        tableIds: Array.from(selectedIds),
        status,
      });
      setSelectedIds(new Set());
      loadTables();
    } catch (err) {
      console.error('批量更新状态失败:', err);
      alert('操作失败');
    }
  };

  // 删除选中
  const batchDelete = async () => {
    if (selectedIds.size === 0 || !confirm(`确认删除选中的 ${selectedIds.size} 张餐桌？`)) return;
    let failCount = 0;
    for (const id of selectedIds) {
      try {
        await apiDelete(API_ENDPOINTS.TABLES.DELETE.replace(':storeId', selectedStoreId).replace(':tableId', id));
      } catch {
        failCount++;
      }
    }
    setSelectedIds(new Set());
    loadTables();
    if (failCount > 0) alert(`${selectedIds.size - failCount} 张已删除，${failCount} 张失败`);
  };

  // 批量创建
  const batchCreate = async () => {
    if (!confirm(`确认批量创建 ${batchCount} 张餐桌（编号：${batchPrefix}${batchStartNum} ~ ${batchPrefix}${batchStartNum + batchCount - 1}）？`)) return;
    const tables = Array.from({ length: batchCount }, (_, i) => ({
      tableNumber: `${batchPrefix}${batchStartNum + i}`,
      capacity: 4,
    }));
    try {
      await apiPost(API_ENDPOINTS.TABLES.BATCH_CREATE.replace(':storeId', selectedStoreId), { tables });
      loadTables();
      setActiveTab('list');
    } catch (err) {
      console.error('批量创建失败:', err);
      alert('部分桌号可能已存在');
    }
  };

  // 删除单张
  const deleteTable = async (table: Table) => {
    if (!confirm(`确认删除餐桌 ${table.tableNumber}？`)) return;
    try {
      await apiDelete(
        API_ENDPOINTS.TABLES.DELETE.replace(':storeId', selectedStoreId).replace(':tableId', table.id),
      );
      loadTables();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  // 状态中文
  const statusLabel = (status: string) => STATUS_MAP[status]?.label || status;
  const statusColor = (status: string) => STATUS_MAP[status]?.color || '#999';

  return (
    <div className="table-management-page">
      <div className="page-header">
        <h1>🪑 餐桌管理</h1>
        <p className="page-subtitle">管理店铺下的餐桌，批量生成和激活</p>
      </div>

      {/* 店铺选择 */}
      <div className="store-selector">
        <label>选择店铺：</label>
        <select
          value={selectedStoreId}
          onChange={(e) => handleStoreSelect(e.target.value)}
          className="store-select"
        >
          <option value="">-- 请选择店铺 --</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.slug}) {s.tenant ? `- ${s.tenant.name}` : ''}
            </option>
          ))}
        </select>
      </div>

      {!selectedStoreId && (
        <div className="no-store-tip">
          <p>请先选择要管理的店铺</p>
        </div>
      )}

      {selectedStoreId && (
        <>
          {/* 操作 Tab */}
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              📋 餐桌列表
            </button>
            <button
              className={`tab-btn ${activeTab === 'batch-create' ? 'active' : ''}`}
              onClick={() => setActiveTab('batch-create')}
            >
              ➕ 批量创建
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="table-list-section">
              {/* 工具栏 */}
              {selectedIds.size > 0 && (
                <div className="batch-toolbar">
                  <span>已选 {selectedIds.size} 张</span>
                  <button className="btn btn-success" onClick={() => batchUpdateStatus('AVAILABLE')}>
                    批量激活
                  </button>
                  <button className="btn btn-danger" onClick={() => batchUpdateStatus('INACTIVE')}>
                    批量停用
                  </button>
                  <button className="btn btn-outline-danger" onClick={batchDelete}>
                    批量删除
                  </button>
                  <button className="btn btn-outline" onClick={() => setSelectedIds(new Set())}>
                    取消选择
                  </button>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="table-actions">
                <label className="select-all-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === tables.length && tables.length > 0}
                    onChange={toggleSelectAll}
                  />
                  全选
                </label>
                <span className="table-count">共 {tables.length} 张餐桌</span>
                <button className="btn btn-outline" onClick={copyAllQrLinks} title="复制所有激活桌子的扫码链接">
                  📋 复制所有链接
                </button>
              </div>

              {/* 餐桌列表 */}
              {loading ? (
                <div className="loading-state">加载中...</div>
              ) : tables.length === 0 ? (
                <div className="empty-state">
                  <p>暂无餐桌，请先批量创建</p>
                </div>
              ) : (
                <div className="table-grid">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      className={`table-card ${selectedIds.has(table.id) ? 'selected' : ''}`}
                    >
                      <label className="card-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(table.id)}
                          onChange={() => toggleSelect(table.id)}
                        />
                      </label>
                      <div className="card-header">
                        <span className="table-number">{table.tableNumber}</span>
                        <span
                          className="table-status"
                          style={{ backgroundColor: statusColor(table.status) }}
                        >
                          {statusLabel(table.status)}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="card-info">
                          <span className="info-label">名称：</span>
                          <span>{table.name || '-'}</span>
                        </div>
                        <div className="card-info">
                          <span className="info-label">容量：</span>
                          <span>{table.capacity} 人</span>
                        </div>
                        {table.notes && (
                          <div className="card-info">
                            <span className="info-label">备注：</span>
                            <span>{table.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="card-actions">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => copyQrLink(table)}
                          title="复制扫码链接"
                        >
                          {copiedId === table.id ? '✅ 已复制' : '📋 复制链接'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteTable(table)}
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'batch-create' && (
            <div className="batch-create-section">
              <h3>批量创建餐桌</h3>
              <p className="section-desc">快速生成一批餐桌，编号格式为"前缀+序号"，如 A01, A02, A03...</p>

              <div className="batch-form">
                <div className="form-row">
                  <label>桌号前缀：</label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    className="form-input short"
                    maxLength={2}
                  />
                </div>
                <div className="form-row">
                  <label>起始编号：</label>
                  <input
                    type="number"
                    value={batchStartNum}
                    onChange={(e) => setBatchStartNum(parseInt(e.target.value) || 1)}
                    className="form-input short"
                    min={1}
                  />
                </div>
                <div className="form-row">
                  <label>生成数量：</label>
                  <input
                    type="number"
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value) || 10)}
                    className="form-input short"
                    min={1}
                    max={100}
                  />
                </div>
              </div>

              <div className="batch-preview">
                <p>
                  将生成：{batchPrefix}
                  {String(batchStartNum).padStart(2, '0')} ~ {batchPrefix}
                  {String(batchStartNum + batchCount - 1).padStart(2, '0')}
                </p>
              </div>

              <button className="btn btn-primary btn-large" onClick={batchCreate}>
                🚀 批量创建 {batchCount} 张餐桌
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TableManagementPage;
