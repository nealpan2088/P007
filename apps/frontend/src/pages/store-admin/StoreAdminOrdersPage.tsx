// 店长端 — 订单管理页面
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table, Tag, Button, Space, Typography, message, Select, Popconfirm, Empty,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { STORE_ADMIN_CONFIG, storeAdminFetch } from '../../config/store-admin';

const { Title, Text } = Typography;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  orderType: string;
  customerNotes?: string;
  table?: { tableNumber: string } | null;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'orange', label: '待确认' },
  CONFIRMED: { color: 'blue', label: '已确认' },
  PREPARING: { color: 'processing', label: '制作中' },
  READY: { color: 'green', label: '已完成' },
  DELIVERED: { color: 'default', label: '已取餐' },
  CANCELLED: { color: 'red', label: '已取消' },
};

export default function StoreAdminOrdersPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [orderFlow, setOrderFlow] = useState<string>('SIMPLE');

  useEffect(() => { if (storeId) { loadStore(); loadOrders(); } }, [storeId, statusFilter]);

  async function loadStore() {
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}`);
      setOrderFlow(json.data?.orderFlow || 'SIMPLE');
    } catch (_) {}
  }

  async function loadOrders() {
    setLoading(true);
    try {
      let path = `${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}/orders?limit=50`;
      if (statusFilter) path += `&status=${statusFilter}`;
      const json = await storeAdminFetch(path);
      setOrders(json.data || []);
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem(STORE_ADMIN_CONFIG.TOKEN_KEY);
        navigate('/store-admin/login');
        return;
      }
      message.error('加载订单失败');
    } finally { setLoading(false); }
  }

  async function updateStatus(orderId: string, status: string) {
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (json.success) { message.success('状态已更新'); loadOrders(); }
      else { message.error(json.error || '更新失败'); }
    } catch (err: any) { message.error('更新失败'); }
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNumber', key: 'orderNumber', width: 140 },
    {
      title: '餐桌', key: 'table', width: 80,
      render: (_: any, r: Order) => r.table?.tableNumber || (r.orderType === 'TAKEAWAY' ? '📦 打包' : '-'),
    },
    {
      title: '金额', dataIndex: 'totalAmount', key: 'amount', width: 80,
      render: (v: number) => `¥${v?.toFixed(2)}`,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const info = STATUS_MAP[s] || { color: 'default', label: s };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '下单时间', dataIndex: 'createdAt', key: 'time', width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    },
    {
      title: '操作', key: 'actions', width: 200,
      render: (_: any, r: Order) => (
        <Space>
          {orderFlow === 'STANDARD' && r.status === 'PREPARING' && (
            <Popconfirm title="标记完成？" onConfirm={() => updateStatus(r.id, 'READY')}>
              <Button size="small" type="primary">完成</Button>
            </Popconfirm>
          )}
          {orderFlow === 'STANDARD' && r.status === 'READY' && (
            <Popconfirm title="已取餐？" onConfirm={() => updateStatus(r.id, 'DELIVERED')}>
              <Button size="small">已取餐</Button>
            </Popconfirm>
          )}
          {orderFlow === 'SIMPLE' && r.status === 'PREPARING' && (
            <Popconfirm title="标记完成并已取餐？" onConfirm={() => updateStatus(r.id, 'DELIVERED')}>
              <Button size="small" type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }}>完成取餐</Button>
            </Popconfirm>
          )}
          {r.status === 'PENDING' && (
            <Popconfirm title="确认此订单？" onConfirm={() => updateStatus(r.id, 'CONFIRMED')}>
              <Button size="small" type="primary">确认</Button>
            </Popconfirm>
          )}
          {r.status === 'CONFIRMED' && (
            <Popconfirm title="开始制作？" onConfirm={() => updateStatus(r.id, 'PREPARING')}>
              <Button size="small">制作</Button>
            </Popconfirm>
          )}
          {r.status === 'READY' && (
            <Popconfirm title="已取餐？" onConfirm={() => updateStatus(r.id, 'DELIVERED')}>
              <Button size="small">已取餐</Button>
            </Popconfirm>
          )}
          {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
            <Popconfirm title="取消此订单？" onConfirm={() => updateStatus(r.id, 'CANCELLED')}>
              <Button size="small" danger>取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/store-admin')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>🛒 订单管理</Title>
        <Button icon={<ReloadOutlined />} onClick={loadOrders} size="small">刷新</Button>
      </Space>

      <Space style={{ marginBottom: 12 }}>
        <Select
          style={{ width: 140 }}
          value={statusFilter || '全部'}
          onChange={(v) => setStatusFilter(v === '全部' ? '' : v)}
          options={[
            { value: '全部', label: '全部订单' },
            { value: 'PENDING', label: '待确认' },
            { value: 'CONFIRMED', label: '已确认' },
            { value: 'PREPARING', label: '制作中' },
            { value: 'READY', label: '已完成' },
            { value: 'DELIVERED', label: '已取餐' },
            { value: 'CANCELLED', label: '已取消' },
          ]}
        />
        <Text type="secondary">共 {orders.length} 单</Text>
      </Space>

      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
        locale={{ emptyText: <Empty description="暂无订单" /> }}
      />
    </div>
  );
}
