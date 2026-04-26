// 店长管理后台 — 我的店铺列表 + 店铺管理入口
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Typography, Button, Space, Tag, Spin, Empty, message,
} from 'antd';
import {
  ShopOutlined, MenuOutlined, ShoppingCartOutlined, PrinterOutlined,
  TableOutlined, SettingOutlined, LogoutOutlined, AppstoreOutlined,
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

export default function StoreAdminDashboard() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

  async function handleLogout() {
    clearAuth();
    navigate('/store-admin/login');
  }

  function goToMenu(storeId: string) {
    navigate(`/store-admin/stores/${storeId}/menu`);
  }

  function goToOrders(storeId: string) {
    navigate(`/store-admin/stores/${storeId}/orders`);
  }

  function goToPrinters(storeId: string) {
    navigate(`/store-admin/stores/${storeId}/printers`);
  }

  function goToTables(storeId: string) {
    navigate(`/store-admin/stores/${storeId}/tables`);
  }

  function goToSettings(storeId: string) {
    navigate(`/store-admin/stores/${storeId}/settings`);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spin size="large" description="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航 */}
      <div style={{
        background: '#fff', padding: '12px 24px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Space>
          <AppstoreOutlined style={{ fontSize: 22, color: '#667eea' }} />
          <Title level={4} style={{ margin: 0 }}>店长管理端</Title>
        </Space>
        <Space>
          <Text type="secondary">
            {user?.fullName || user?.email || ''}
          </Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} size="small">
            退出
          </Button>
        </Space>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <Space style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <ShopOutlined /> 我的店铺
          </Title>
          {user?.role === 'SUPER_ADMIN' && (
            <Tag color="red" style={{ fontSize: 12, padding: '2px 8px' }}>
              超管视角 — 可查看所有店铺
            </Tag>
          )}
          {user?.role === 'TENANT_ADMIN' && (
            <Tag color="blue" style={{ fontSize: 12, padding: '2px 8px' }}>
              租管视角 — 可查看所属租户店铺
            </Tag>
          )}
        </Space>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          共 {stores.length} 家店铺，点击进入管理
        </Text>

        {stores.length === 0 ? (
          <Empty description="暂无可用店铺" />
        ) : (
          <Row gutter={[16, 16]}>
            {stores.map(store => (
              <Col xs={24} sm={12} lg={8} key={store.id}>
                <Card
                  hoverable
                  style={{ borderRadius: 10 }}
                  actions={[
                    <MenuOutlined key="menu" onClick={() => goToMenu(store.id)} title="菜单管理" />,
                    <ShoppingCartOutlined key="orders" onClick={() => goToOrders(store.id)} title="订单管理" />,
                    <PrinterOutlined key="printers" onClick={() => goToPrinters(store.id)} title="打印机" />,
                    <TableOutlined key="tables" onClick={() => goToTables(store.id)} title="餐桌" />,
                    <SettingOutlined key="settings" onClick={() => goToSettings(store.id)} title="设置" />,
                  ]}
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
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {store.tenant?.name || ''}
                        </Text>
                        {store.description && (
                          <p style={{ margin: '4px 0', fontSize: 13 }}>{store.description}</p>
                        )}
                        {store.address && (
                          <p style={{ margin: 0, fontSize: 12, color: '#999' }}>📍 {store.address}</p>
                        )}
                        {store.contactPhone && (
                          <p style={{ margin: 0, fontSize: 12, color: '#999' }}>📞 {store.contactPhone}</p>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
