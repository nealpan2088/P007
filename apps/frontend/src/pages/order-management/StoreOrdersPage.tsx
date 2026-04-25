// 店铺订单管理页面
// 支持查看订单列表、更新订单状态（标记出餐等）

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Select, message, Space, Typography, Badge } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPut } from '../../utils/api-client';
import { ADMIN_ROUTES } from '../../config/routes';

const { Title, Text } = Typography;

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customerName: string | null;
  customerNotes: string | null;
  table?: { tableNumber: string } | null;
  items?: { name: string; quantity: number; unitPrice: number }[];
};

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '⏳ 待确认' },
  { value: 'CONFIRMED', label: '✅ 已确认' },
  { value: 'PREPARING', label: '👨‍🍳 制作中' },
  { value: 'READY', label: '🍽️ 已出餐' },
  { value: 'SERVED', label: '✅ 已上菜' },
  { value: 'COMPLETED', label: '✔️ 已完成' },
  { value: 'CANCELLED', label: '❌ 已取消' },
];

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'orange', label: '待确认' },
  CONFIRMED: { color: 'blue', label: '已确认' },
  PREPARING: { color: 'processing', label: '制作中' },
  READY: { color: 'success', label: '已出餐' },
  SERVED: { color: 'purple', label: '已上菜' },
  COMPLETED: { color: 'default', label: '已完成' },
  CANCELLED: { color: 'error', label: '已取消' },
};

const StoreOrdersPage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await apiGet(`/store-admin/stores/${storeId}/orders`, {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setOrders(res?.data || []);
    } catch {
      // apiGet 会显示错误
    } finally {
      setLoading(false);
    }
  }, [storeId, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 更新订单状态
  const updateStatus = async (orderId: string, newStatus: string) => {
    setSubmittingId(orderId);
    try {
      await apiPut(`/store-admin/stores/${storeId}/orders/${orderId}/status`, { status: newStatus });
      message.success(`订单状态已更新为 ${STATUS_MAP[newStatus]?.label || newStatus}`);
      fetchOrders();
    } catch {
      // apiPut 会显示错误
    } finally {
      setSubmittingId(null);
    }
  };

  // 标记出餐一键操作
  const markAsReady = (orderId: string) => {
    updateStatus(orderId, 'READY');
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 160,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: '桌号',
      key: 'table',
      width: 80,
      render: (_: unknown, r: Order) => r.table?.tableNumber || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const s = STATUS_MAP[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{v}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 80,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 300,
      render: (_: unknown, r: Order) => {
        const status = r.status;

        if (status === 'PENDING') {
          return (
            <Space>
              <Button size="small" type="primary"
                onClick={() => updateStatus(r.id, 'PREPARING')}
                loading={submittingId === r.id}
              >
                接受制作
              </Button>
              <Button size="small" danger
                onClick={() => updateStatus(r.id, 'CANCELLED')}
                loading={submittingId === r.id}
              >
                取消订单
              </Button>
            </Space>
          );
        }

        if (status === 'PREPARING') {
          return (
            <Space>
              <Button size="small" type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => markAsReady(r.id)}
                loading={submittingId === r.id}
              >
                🍽️ 标记出餐
              </Button>
            </Space>
          );
        }

        if (status === 'READY') {
          return (
            <Space>
              <Button size="small"
                onClick={() => updateStatus(r.id, 'SERVED')}
                loading={submittingId === r.id}
              >
                确认上菜
              </Button>
              <Button size="small"
                onClick={() => updateStatus(r.id, 'COMPLETED')}
                loading={submittingId === r.id}
              >
                完成订单
              </Button>
            </Space>
          );
        }

        return <Text type="secondary">无操作</Text>;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Button style={{ marginRight: 12 }} onClick={() => navigate(ADMIN_ROUTES.STORES.LIST)}>← 返回店铺列表</Button>
            <Title level={4} style={{ display: 'inline', margin: 0 }}>订单管理</Title>
          </div>
          <Space>
            <span>状态筛选：</span>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={STATUS_OPTIONS}
            />
            <Button onClick={fetchOrders} loading={loading}>刷新</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 900 }}
          locale={{ emptyText: '暂无订单' }}
        />

        <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
          <Text type="secondary">
            💡 <b>标记出餐</b> 后，系统会更新订单状态为「已出餐」。
            该操作也可以触发夜狼流程（如超时催单计时器取消）。
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default StoreOrdersPage;
