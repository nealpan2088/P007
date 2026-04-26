// 店长端 — 菜单管理页面
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space,
  Typography, message, Popconfirm, Spin, Empty,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getFoodImageUrl, DEFAULT_FOOD_IMAGE } from '../../utils/image.utils';

const { Title } = Typography;
const API = '/api/store-admin';
const TOKEN_KEY = 'qilin_store_admin_token';

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
  category?: Category;
}

/** 店长端专用 fetch：自动带 token */
async function storeAdminFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw { status: res.status, message: text };
  }
  return res.json();
}

export default function StoreAdminMenuPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (storeId) loadData();
  }, [storeId]);

  async function loadData() {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        storeAdminFetch(`${API}/stores/${storeId}/menu/categories`),
        storeAdminFetch(`${API}/stores/${storeId}/menu/items`),
      ]);
      if (catRes.success) setCategories(catRes.data || []);
      if (itemRes.success) setItems(itemRes.data || []);
    } catch (err: any) {
      console.error('[StoreAdminMenu] 加载失败:', err);
      if (err.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('qilin_store_admin_user');
        navigate('/store-admin/login');
        return;
      }
      message.error('加载菜单数据失败');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  }

  async function handleSave(values: any) {
    try {
      if (editingItem) {
        const json = await storeAdminFetch(`${API}/stores/${storeId}/menu/items/${editingItem.id}`, {
          method: 'PUT', body: JSON.stringify(values),
        });
        if (json.success) { message.success('更新成功'); }
        else { message.error(json.error || '更新失败'); }
      } else {
        const json = await storeAdminFetch(`${API}/stores/${storeId}/menu/items`, {
          method: 'POST', body: JSON.stringify(values),
        });
        if (json.success) { message.success('添加成功'); }
        else { message.error(json.error || '添加失败'); }
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '保存失败');
    }
  }

  async function handleDelete(itemId: string) {
    try {
      const json = await storeAdminFetch(`${API}/stores/${storeId}/menu/items/${itemId}`, {
        method: 'DELETE', body: JSON.stringify({}),
      });
      if (json.success) { message.success('已删除'); loadData(); }
      else { message.error(json.error || '删除失败'); }
    } catch (err: any) { message.error(err.message || '删除失败'); }
  }

  async function toggleAvailability(item: MenuItem) {
    try {
      const json = await storeAdminFetch(`${API}/stores/${storeId}/menu/items/${item.id}/availability`, {
        method: 'PATCH', body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (json.success) { message.success(item.isAvailable ? '已下架' : '已上架'); loadData(); }
    } catch (err: any) { message.error(err.message || '操作失败'); }
  }

  const columns = [
    {
      title: '菜品名', key: 'name',
      render: (_: any, record: MenuItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={getFoodImageUrl(record.imageUrl)}
            alt={record.name}
            style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', background: '#f5f5f5' }}
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE; }}
          />
          <span>{record.name}</span>
        </div>
      ),
    },
    {
      title: '分类', dataIndex: 'categoryId', key: 'category',
      render: (catId: string) => categories.find(c => c.id === catId)?.name || '-',
    },
    {
      title: '价格', dataIndex: 'price', key: 'price',
      render: (p: number) => `¥${p?.toFixed(2)}`,
    },
    {
      title: '状态', dataIndex: 'isAvailable', key: 'status',
      render: (avail: boolean, record: MenuItem) => (
        <Tag color={avail ? 'green' : 'red'} style={{ cursor: 'pointer' }}
          onClick={() => toggleAvailability(record)}>
          {avail ? '在售' : '已下架'}
        </Tag>
      ),
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: MenuItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title={record.isAvailable ? '确认下架？' : '确认上架？'} onConfirm={() => toggleAvailability(record)}>
            <Button size="small" type={record.isAvailable ? 'default' : 'primary'}>{record.isAvailable ? '下架' : '上架'}</Button>
          </Popconfirm>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" description="加载中..." /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/store-admin')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>📋 菜单管理</Title>
      </Space>

      <Card
        title={<span>菜品列表 ({items.length})</span>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>添加菜品</Button>}
      >
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: <Empty description="暂无菜品，点击添加" /> }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑菜品' : '添加菜品'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="菜品名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select>
              {categories.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="imageUrl" label="图片URL">
            <Input placeholder="http://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
