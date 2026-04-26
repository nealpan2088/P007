// 店长端 — 餐桌管理
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Tag, Typography, message, Empty, Space, Modal, Form, Input, InputNumber, Select,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API = '/api/store-admin';
const TOKEN_KEY = 'qilin_store_admin_token';

interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
}

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
  if (!res.ok) throw { status: res.status, message: await res.text() };
  return res.json();
}

export default function StoreAdminTablesPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { if (storeId) loadTables(); }, [storeId]);

  async function loadTables() {
    setLoading(true);
    try {
      const json = await storeAdminFetch(`${API}/stores/${storeId}/tables`);
      setTables(json.data || []);
    } catch (err: any) {
      if (err.status === 401) { navigate('/store-admin/login'); return; }
      message.error('加载餐桌失败');
    } finally { setLoading(false); }
  }

  function openEdit(table: TableItem) {
    setEditingTable(table);
    form.setFieldsValue(table);
    setEditModal(true);
  }

  async function handleSave(values: any) {
    if (!editingTable) return;
    try {
      const json = await storeAdminFetch(`${API}/stores/${storeId}/tables/${editingTable.id}`, {
        method: 'PUT', body: JSON.stringify(values),
      });
      if (json.success) { message.success('已更新'); setEditModal(false); loadTables(); }
      else { message.error(json.error || '更新失败'); }
    } catch (err: any) { message.error('更新失败'); }
  }

  const columns = [
    { title: '桌号', dataIndex: 'tableNumber', key: 'number' },
    { title: '座位数', dataIndex: 'capacity', key: 'capacity' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'AVAILABLE' ? 'green' : s === 'OCCUPIED' ? 'red' : 'orange'}>{s === 'AVAILABLE' ? '空闲' : s === 'OCCUPIED' ? '占用' : s}</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, r: TableItem) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/store-admin')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>🪑 餐桌管理</Title>
        <Button icon={<ReloadOutlined />} onClick={loadTables} size="small">刷新</Button>
      </Space>

      <Card>
        <Table
          dataSource={tables}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无餐桌" /> }}
        />
      </Card>

      <Modal title="编辑餐桌" open={editModal} onCancel={() => setEditModal(false)} onOk={() => form.submit()} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="tableNumber" label="桌号" rules={[{ required: true, message: '请输入桌号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="capacity" label="座位数" rules={[{ required: true, message: '请输入座位数' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'AVAILABLE', label: '空闲' }, { value: 'OCCUPIED', label: '占用' }, { value: 'RESERVED', label: '预留' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
