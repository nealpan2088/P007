/**
 * 平台级菜品素材库管理
 * 管理员维护公共菜品模板（名称、分类、图片、标签）
 * 店铺可从素材库选品导入到自己的菜单
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Popconfirm, Upload } from 'antd';
import { PlusOutlined, ImportOutlined, SearchOutlined, UploadOutlined, DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api-client';
import { API_ENDPOINTS } from '../../config/api-routes';
import { getFoodImageUrl, validateImageFile, DEFAULT_FOOD_IMAGE } from '../../utils/image.utils';

const ACCEPTED_IMAGE_TYPES = '.jpg,.jpeg,.png,.gif,.webp';

interface TemplateItem {
  id: string;
  name: string;
  categoryName: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  tags: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function FoodTemplateLibrary() {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 20;

  // 导入弹窗
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [stores, setStores] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectingIds, setSelectingIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (filterCategory) params.set('category', filterCategory);
      if (search.trim()) params.set('search', search.trim());
      const json = await apiGet(`${API_ENDPOINTS.MENU_TEMPLATES.ITEMS}?${params}`);
      if (json.success) {
        setItems(json.data);
        setTotal(json.total);
      }
    } catch (err: any) {
      message.error('加载素材库失败: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, search]);

  const loadCategories = useCallback(async () => {
    try {
      const json = await apiGet(API_ENDPOINTS.MENU_TEMPLATES.CATEGORIES);
      if (json.success) setCategories(json.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadItems, loadCategories]);

  // 新建/编辑
  const openEditModal = (item?: TemplateItem) => {
    if (item) {
      setEditingItem(item);
      setPreviewUrl(item.imageUrl || '');
      form.setFieldsValue({
        name: item.name,
        categoryName: item.categoryName,
        description: item.description || '',
        price: item.price,
        imageUrl: item.imageUrl || '',
        tags: item.tags ? JSON.parse(item.tags) : [],
      });
    } else {
      setEditingItem(null);
      setPreviewUrl('');
      form.resetFields();
    }
    setModalOpen(true);
  };

  // 图片上传
  const handleUpload = async (file: File) => {
    const err = validateImageFile(file);
    if (err) { message.error(err); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('qilin_access_token');
      const res = await fetch(API_ENDPOINTS.UPLOAD.FOOD_IMAGE, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setPreviewUrl(json.data.url);
        form.setFieldValue('imageUrl', json.data.url);
        message.success('图片上传成功');
      } else {
        message.error(json.error || '上传失败');
      }
    } catch (err: any) {
      message.error('上传失败: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const body = {
        ...values,
        tags: values.tags?.length ? values.tags : undefined,
      };
      const json = editingItem
        ? await apiPut(API_ENDPOINTS.MENU_TEMPLATES.ITEM.replace(':id', editingItem.id), body)
        : await apiPost(API_ENDPOINTS.MENU_TEMPLATES.ITEMS, body);
      if (json.success) {
        message.success(editingItem ? '已更新' : '已创建');
        setModalOpen(false);
        loadItems();
        loadCategories();
      } else {
        message.error(json.error || '保存失败');
      }
    } catch (err: any) {
      message.error('保存失败: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const json = await apiDelete(API_ENDPOINTS.MENU_TEMPLATES.ITEM.replace(':id', id));
      if (json.success) {
        message.success('已删除');
        loadItems();
      } else {
        message.error(json.error || '删除失败');
      }
    } catch (err: any) {
      message.error('删除失败: ' + (err.message || ''));
    }
  };

  // 导入
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleBatchCsvImport = () => {
    csvFileInputRef.current?.click();
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const csv = evt.target?.result as string;
      const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        message.error('CSV 文件为空或格式不正确');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIdx = headers.indexOf('name');
      const priceIdx = headers.indexOf('price');
      const catIdx = headers.indexOf('categoryname') > -1 ? headers.indexOf('categoryname') : headers.indexOf('category');
      if (nameIdx === -1 || priceIdx === -1 || catIdx === -1) {
        message.error('CSV 格式错误，需要包含 name, price, categoryName 列');
        return;
      }

      const items: any[] = [];
      const parseErrors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim());
        const name = vals[nameIdx];
        const price = parseFloat(vals[priceIdx]);
        const categoryName = vals[catIdx];
        if (!name || isNaN(price) || !categoryName) {
          parseErrors.push(`第 ${i + 1} 行: 缺少必填字段`);
          continue;
        }
        items.push({
          name,
          price,
          categoryName,
          description: headers.includes('description') ? vals[headers.indexOf('description')] : undefined,
          imageUrl: headers.includes('imageurl') ? vals[headers.indexOf('imageurl')] : undefined,
          tags: headers.includes('tags') ? vals[headers.indexOf('tags')] : undefined,
        });
      }

      if (items.length === 0) {
        message.error('没有有效的菜品数据');
        return;
      }

      Modal.confirm({
        title: '确认批量导入',
        content: `共读取 ${lines.length - 1} 行，有效数据 ${items.length} 条${parseErrors.length ? `，${parseErrors.length} 行跳过` : ''}。确定导入？`,
        onOk: async () => {
          try {
            const json = await apiPost(API_ENDPOINTS.MENU_TEMPLATES.BATCH_CREATE, { items });
            if (json.success) {
              const { created, skipped, errors } = json.data;
              let msg = `✅ 导入完成：新增 ${created} 个`;
              if (skipped) msg += `，跳过 ${skipped} 个（已存在）`;
              if (errors?.length) msg += `，${errors.length} 个错误`;
              message.success(msg);
              loadItems();
              loadCategories();
            } else {
              message.error(json.error || '批量导入失败');
            }
          } catch (err: any) {
            message.error('批量导入失败: ' + (err.message || ''));
          }
        },
      });
    };
    reader.readAsText(file);
  };

  const openImportModal = async () => {
    try {
      const json = await apiGet(API_ENDPOINTS.STORES_SELECT + '?limit=20');
      setStores(json?.data || []);
    } catch { /* ignore */ }
    setStoreSearch('');
    setSelectedStoreId('');
    setImportModalOpen(true);
  };

  const handleImport = async () => {
    if (!selectedStoreId || selectingIds.length === 0) {
      message.warning('请选择目标店铺和要导入的菜品');
      return;
    }
    setImporting(true);
    try {
      const json = await apiPost(API_ENDPOINTS.MENU_TEMPLATES.IMPORT, {
        storeId: selectedStoreId,
        templateIds: selectingIds,
      });
      if (json.success) {
        message.success(`导入完成：新增 ${json.data.created} 个，跳过 ${json.data.skipped} 个（已存在）`);
        setImportModalOpen(false);
      } else {
        message.error(json.error || '导入失败');
      }
    } catch (err: any) {
      message.error('导入失败: ' + (err.message || ''));
    } finally {
      setImporting(false);
    }
  };

  // 表格行选择（用于导入）
  const rowSelection = {
    selectedRowKeys: selectingIds,
    onChange: (keys: React.Key[]) => {
      console.log('rowSelection.onChange called with:', keys);
      setSelectingIds(keys as string[]);
    },
  };

  const columns = [
    {
      title: '菜品名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: TemplateItem) => (
        <div className="flex items-center gap-3">
          <img src={getFoodImageUrl(record.imageUrl)} alt={name} className="w-10 h-10 rounded object-cover" />
          <div>
            <div className="font-medium">{name}</div>
            {record.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{record.description}</div>}
          </div>
        </div>
      ),
    },
    { title: '分类', dataIndex: 'categoryName', key: 'categoryName', width: 120 },
    {
      title: '价格', dataIndex: 'price', key: 'price', width: 80,
      render: (p: number) => <span className="text-orange-600 font-medium">¥{p.toFixed(2)}</span>,
    },
    {
      title: '标签', dataIndex: 'tags', key: 'tags', width: 160,
      render: (tags: string | null) => tags ? (
        <Space size={4} wrap>{(JSON.parse(tags) as string[]).map(t => <Tag key={t}>{t}</Tag>)}</Space>
      ) : null,
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: any, record: TemplateItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEditModal(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 菜品素材库</h1>
          <p className="text-sm text-gray-500 mt-1">管理公共菜品模板，店铺可从素材库选品上架</p>
        </div>
        <Space>
          <Button icon={<ImportOutlined />} onClick={openImportModal}>
            导入到店铺
          </Button>
          <Button icon={<FileAddOutlined />} onClick={handleBatchCsvImport}>
            批量导入 CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditModal()}>
            新增菜品
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4 items-center">
        <Input
          placeholder="搜索菜品名称..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          placeholder="全部分类"
          value={filterCategory || undefined}
          onChange={v => { setFilterCategory(v || ''); setPage(1); }}
          allowClear
          style={{ width: 180 }}
          options={categories.map(c => ({ value: c, label: c }))}
        />
        <span className="text-xs text-gray-400">共 {total} 个菜品</span>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: p => setPage(p),
            showSizeChanger: false,
            showTotal: t => `共 ${t} 个菜品`,
          }}
          locale={{ emptyText: '暂无菜品素材，点击右上角新增' }}
          size="middle"
        />
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingItem ? '编辑菜品' : '新增菜品'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editingItem ? '保存' : '创建'}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="菜品名称" rules={[{ required: true, message: '请输入菜品名称' }]}>
            <Input placeholder="如：宫保鸡丁" />
          </Form.Item>
          <Form.Item name="categoryName" label="菜品分类" rules={[{ required: true, message: '请选择或输入分类' }]}>
            <Select
              mode="tags"
              maxCount={1}
              placeholder="选择或输入新分类"
              options={categories.map(c => ({ value: c, label: c }))}
              onChange={v => form.setFieldValue('categoryName', v[0])}
            />
          </Form.Item>
          <Form.Item name="description" label="菜品描述">
            <Input.TextArea rows={2} placeholder="可选，如：经典川菜，麻辣鲜香" />
          </Form.Item>
          <Form.Item name="price" label="参考价格" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} step={0.5} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="imageUrl" label="菜品图片">
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 图片预览 */}
                            <div className="relative inline-block">
                <img
                  src={previewUrl || DEFAULT_FOOD_IMAGE}
                  alt="预览"
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={e => { (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE; }}
                />
                {previewUrl && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    className="absolute -top-2 -right-2 bg-white rounded-full shadow"
                    onClick={() => { setPreviewUrl(''); form.setFieldValue('imageUrl', ''); }}
                  />
                )}
              </div>
              <Space>
                <Button
                  icon={<UploadOutlined />}
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  上传图片
                </Button>
                <span className="text-xs text-gray-400">支持 JPG/PNG/GIF/WebP，最大 2MB</span>
              </Space>
              <Input
                placeholder="或输入图片链接（支持外部URL）"
                onChange={e => { setPreviewUrl(e.target.value); form.setFieldValue('imageUrl', e.target.value); }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
            </Space>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车" tokenSeparators={[',']} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入弹窗 */}
      <Modal
        title="导入菜品到店铺"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => setImportModalOpen(false)}
        confirmLoading={importing}
        okText="导入选中菜品"
        okButtonProps={{ disabled: !selectedStoreId || selectingIds.length === 0 }}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">选择目标店铺</label>
          <Select
            showSearch
            placeholder="搜索并选择店铺..."
            value={selectedStoreId || undefined}
            onChange={v => setSelectedStoreId(v)}
            onSearch={v => {
              setStoreSearch(v);
              const timer = setTimeout(async () => {
                try {
                  const json = await apiGet(API_ENDPOINTS.STORES_SELECT + '?search=' + encodeURIComponent(v));
                  setStores(json?.data || []);
                } catch { /* ignore */ }
              }, 300);
              return () => clearTimeout(timer);
            }}
            filterOption={false}
            style={{ width: '100%' }}
            options={stores.map(s => ({ value: s.id, label: `${s.name} (${s.slug})` }))}
          />
        </div>
        <p className="text-sm text-gray-500">
          已选中 <strong>{selectingIds.length}</strong> 个菜品，点击确定导入到店铺菜单。
          如果店铺已有同名菜品则会跳过。
        </p>
      </Modal>

      {/* 隐藏的 CSV 文件选择器 */}
      <input
        ref={csvFileInputRef}
        type="file"
        accept=".csv,.txt"
        style={{ display: 'none' }}
        onChange={handleCsvFileChange}
      />
    </div>
  );
}
