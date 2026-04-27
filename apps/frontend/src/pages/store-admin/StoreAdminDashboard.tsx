// 店长管理后台 — 运营看板（店长视角）
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Typography, Button, Space, Tag, Spin, Empty, message,
  Statistic, Timeline, List, Badge, Switch, Divider,
} from 'antd';
import {
  ShopOutlined, MenuOutlined, ShoppingCartOutlined, PrinterOutlined,
  TableOutlined, SettingOutlined, LogoutOutlined, AppstoreOutlined,
  RiseOutlined, ClockCircleOutlined, CheckCircleOutlined, DollarOutlined,
  FireOutlined, OrderedListOutlined, ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const STORE_ADMIN_TOKEN_KEY = 'qilin_store_admin_token';
const STORE_ADMIN_USER_KEY = 'qilin_store_admin_user';
const API_BASE = '/api/store-admin';

interface Store {
  id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
  address?: string;
  contactPhone?: string;
  tenant: { name: string; subdomain: string };
  tableCount?: number;
  createdAt: string;
}

interface OrderItem {
  id: string;
  name?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  tableNumber?: string | null;
  createdAt: string;
  items?: OrderItem[];
}

interface StoreStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  activeTables: number;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORE_ADMIN_TOKEN_KEY);
}

function getStoredUser(): any | null {
  try {
    const raw = localStorage.getItem(STORE_ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearAuth() {
  localStorage.removeItem(STORE_ADMIN_TOKEN_KEY);
  localStorage.removeItem(STORE_ADMIN_USER_KEY);
}

// 状态映射
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待确认', color: 'orange' },
  CONFIRMED: { label: '已确认', color: 'blue' },
  PREPARING: { label: '制作中', color: 'processing' },
  READY: { label: '已出餐', color: 'cyan' },
  COMPLETED: { label: '已完成', color: 'green' },
  CANCELLED: { label: '已取消', color: 'default' },
};

export default function StoreAdminDashboard() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [statsMap, setStatsMap] = useState<Record<string, StoreStats>>({});
  const [showStoreList, setShowStoreList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 订单动态
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getToken();
    if (!token || !storedUser) {
      navigate('/store-admin/login');
      return;
    }
    setUser(storedUser);
    fetchStores();
  }, []);

  // 如果只有1家店，直接进入看板
  useEffect(() => {
    if (stores.length === 1 && !currentStore) {
      enterStore(stores[0]);
    }
  }, [stores]);

  async function fetchStores() {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(API_BASE + '/my-stores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const active = (json.data || []).filter((s: Store) =>
          s.status === 'ACTIVE' || s.status === 'DRAFT'
        );
        setStores(active);
      } else {
        message.error(json.error || '获取店铺列表失败');
      }
    } catch (err: any) {
      console.error('[StoreAdmin] 获取店铺列表失败:', err);
      clearAuth();
      navigate('/store-admin/login');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDashboardData(store: Store) {
    const token = getToken();
    if (!token) return;
    setOrdersLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // 并发请求：今日订单 + 待处理订单 + 在用桌台
      const [ordersRes, tablesRes] = await Promise.all([
        fetch(
          `${API_BASE}/stores/${store.id}/orders?page=1&limit=10&dateFrom=${today}&dateTo=${today}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `${API_BASE}/stores/${store.id}/tables`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      const ordersJson = await ordersRes.json();
      const tablesJson = await tablesRes.json();

      const allOrders: Order[] = ordersJson.data || [];
      const tables = tablesJson.data || [];

      // 统计
      const pending = allOrders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
      const preparing = allOrders.filter(o => o.status === 'PREPARING').length;
      const completed = allOrders.filter(o => o.status === 'COMPLETED' || o.status === 'READY').length;
      const revenue = allOrders
        .filter(o => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const activeTables = tables.filter((t: any) => t.status === 'OCCUPIED').length;

      setStatsMap(prev => ({
        ...prev,
        [store.id]: {
          todayOrders: allOrders.length,
          todayRevenue: revenue,
          pendingOrders: pending,
          preparingOrders: preparing,
          completedOrders: completed,
          activeTables,
        },
      }));

      setRecentOrders(allOrders.slice(0, 10));
    } catch (err) {
      console.error('[StoreAdmin] 获取看板数据失败:', err);
    } finally {
      setOrdersLoading(false);
    }
  }

  function enterStore(store: Store) {
    setCurrentStore(store);
    setShowStoreList(false);
    fetchDashboardData(store);
  }

  function backToList() {
    setCurrentStore(null);
    setShowStoreList(true);
    setRecentOrders([]);
  }

  function refreshDashboard() {
    if (currentStore) fetchDashboardData(currentStore);
  }

  async function handleLogout() {
    clearAuth();
    navigate('/store-admin/login');
  }

  function goTo(route: string) {
    if (currentStore) navigate(`/store-admin/stores/${currentStore.id}${route}`);
  }

  function formatTime(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  function getOrderItemsText(order: Order): string {
    if (!order.items || order.items.length === 0) return '（无明细）';
    return order.items
      .filter(it => it.name)
      .slice(0, 3)
      .map(it => `${it.name}×${it.quantity}`)
      .join('、');
  }

  // ——— 加载中 ———
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // ——— 店铺列表页 ———
  if (showStoreList) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <HeaderBar user={user} onLogout={handleLogout} title="店长管理端" />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 32px' }}>
          <Space style={{ marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}><ShopOutlined /> 我的店铺</Title>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
            选择一家店铺进入管理
          </Text>
          {stores.length === 0 ? (
            <Empty description="暂无可用店铺" />
          ) : (
            <Row gutter={[16, 16]}>
              {stores.map(store => (
                <Col xs={24} key={store.id}>
                  <Card
                    hoverable
                    onClick={() => enterStore(store)}
                    style={{ borderRadius: 10, cursor: 'pointer' }}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          {store.name}
                          <Tag color={store.status === 'ACTIVE' ? 'green' : 'orange'}>
                            {store.status === 'ACTIVE' ? '营业中' : '草稿'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Text type="secondary">
                          {store.address || store.tenant?.name || ''}
                        </Text>
                      }
                    />
                    {statsMap[store.id] && (
                      <>
                        <Divider style={{ margin: '12px 0 8px' }} />
                        <Row gutter={16}>
                          <Col span={8}><Statistic title="今日订单" value={statsMap[store.id].todayOrders} prefix={<ShoppingCartOutlined />} valueStyle={{ fontSize: 18 }} /></Col>
                          <Col span={8}><Statistic title="待处理" value={statsMap[store.id].pendingOrders} prefix={<ClockCircleOutlined />} valueStyle={{ fontSize: 18, color: '#faad14' }} /></Col>
                          <Col span={8}><Statistic title="在用桌台" value={statsMap[store.id].activeTables} prefix={<TableOutlined />} valueStyle={{ fontSize: 18 }} /></Col>
                        </Row>
                      </>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    );
  }

  // ——— 店铺运营看板 ———
  if (!currentStore) return null;
  const stats = statsMap[currentStore.id] || {
    todayOrders: 0, todayRevenue: 0, pendingOrders: 0,
    preparingOrders: 0, completedOrders: 0, activeTables: 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 顶部导航 */}
      <HeaderBar
        user={user}
        onLogout={handleLogout}
        title={currentStore.name}
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={refreshDashboard} loading={ordersLoading}>
              刷新
            </Button>
            <Button size="small" icon={<ShoppingCartOutlined />} type="primary" onClick={() => goTo('/orders')}>
              订单管理
            </Button>
          </Space>
        }
      />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px' }}>
        {/* 返回按钮 */}
        <Button type="link" onClick={backToList} style={{ padding: 0, marginBottom: 12 }}>
          ← 切换店铺
        </Button>

        {/* ======= 第一行：核心数据卡片 ======= */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="今日订单"
                value={stats.todayOrders}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                suffix="笔"
                valueStyle={{ fontSize: 24, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="待处理"
                value={stats.pendingOrders + stats.preparingOrders}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                suffix="单"
                valueStyle={{ fontSize: 24, fontWeight: 700, color: stats.pendingOrders > 0 ? '#faad14' : undefined }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="预估收入"
                value={stats.todayRevenue}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                suffix="元"
                valueStyle={{ fontSize: 24, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="在用桌台"
                value={stats.activeTables}
                prefix={<TableOutlined style={{ color: '#722ed1' }} />}
                suffix={`/ ${(currentStore as any).tableCount || '-'} 桌`}
                valueStyle={{ fontSize: 24, fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>

        {/* ======= 第二行：订单动态 + 快捷操作 ======= */}
        <Row gutter={[12, 12]}>
          {/* 左侧：订单动态 */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <OrderedListOutlined /> 今日订单动态
                  {stats.pendingOrders > 0 && (
                    <Badge count={stats.pendingOrders} style={{ backgroundColor: '#faad14' }} />
                  )}
                </Space>
              }
              size="small"
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: 0 }}
            >
              {recentOrders.length === 0 ? (
                <Empty description="今日暂无订单" style={{ margin: '32px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  size="small"
                  loading={ordersLoading}
                  dataSource={recentOrders}
                  renderItem={(order) => {
                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'default' };
                    return (
                      <List.Item
                        style={{
                          padding: '8px 16px',
                          background: order.status === 'PENDING' ? '#fffbe6' : 'transparent',
                        }}
                        actions={[
                          <Tag color={statusInfo.color} key="status">{statusInfo.label}</Tag>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space size={4}>
                              <Text strong style={{ fontSize: 13 }}>{order.orderNumber}</Text>
                              {order.tableNumber && (
                                <Tag style={{ fontSize: 11, marginLeft: 4 }}>桌 {order.tableNumber}</Tag>
                              )}
                              <Text type="secondary" style={{ fontSize: 11 }}>{formatTime(order.createdAt)}</Text>
                            </Space>
                          }
                          description={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {getOrderItemsText(order)}
                              {order.totalAmount > 0 && (
                                <Text strong style={{ marginLeft: 8, color: '#52c41a' }}>
                                  ¥{order.totalAmount}
                                </Text>
                              )}
                            </Text>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>

          {/* 右侧：快捷操作 */}
          <Col xs={24} lg={8}>
            <Card title="快捷操作" size="small" style={{ borderRadius: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Button block icon={<ShoppingCartOutlined />} onClick={() => goTo('/orders')} size="large" style={{ height: 44, textAlign: 'left' }}>
                  订单管理
                  {stats.pendingOrders > 0 && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>{stats.pendingOrders} 待处理</Tag>
                  )}
                </Button>
                <Button block icon={<MenuOutlined />} onClick={() => goTo('/menu')} size="large" style={{ height: 44, textAlign: 'left' }}>
                  菜单管理
                </Button>
                <Button block icon={<TableOutlined />} onClick={() => goTo('/tables')} size="large" style={{ height: 44, textAlign: 'left' }}>
                  餐桌管理
                </Button>
                <Button block icon={<PrinterOutlined />} onClick={() => goTo('/printers')} size="large" style={{ height: 44, textAlign: 'left' }}>
                  打印机
                </Button>
                <Button block icon={<SettingOutlined />} onClick={() => goTo('/settings')} size="large" style={{ height: 44, textAlign: 'left' }}>
                  店铺设置
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

// ===== 顶部导航栏组件 =====
function HeaderBar({ user, onLogout, title, extra }: {
  user: any;
  onLogout: () => void;
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#fff', padding: '8px 16px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap', gap: 8,
    }}>
      <Space>
        <AppstoreOutlined style={{ fontSize: 22, color: '#667eea' }} />
        <Title level={4} style={{ margin: 0, fontSize: window.innerWidth < 576 ? 16 : 18 }}>{title}</Title>
      </Space>
      <Space>
        {extra}
        <Text type="secondary" style={{ fontSize: window.innerWidth < 576 ? 12 : 14 }}>
          {user?.fullName || user?.email || ''}
        </Text>
        <Button icon={<LogoutOutlined />} onClick={onLogout} size="small">退出</Button>
      </Space>
    </div>
  );
}
