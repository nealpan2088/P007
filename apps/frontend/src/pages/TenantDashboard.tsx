import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TENANT_ROUTES } from '../config/routes';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Restaurant as RestaurantIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { TENANT_ROUTES } from '../config/routes';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'completed':
      return 'success';
    case 'PREPARING':
    case 'preparing':
      return 'warning';
    case 'PENDING':
    case 'pending':
      return 'info';
    case 'INACTIVE':
    case 'CANCELLED':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待处理',
    PREPARING: '制作中',
    READY: '已完成',
    COMPLETED: '已取餐',
    CANCELLED: '已取消',
  };
  return map[status] || status;
};

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  address: string;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  store: { id: string; name: string; slug?: string };
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface OrderStats {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
  cancelled: number;
  todayCount: number;
  todayRevenue: number;
  totalRevenue: number;
}

const TenantDashboard: React.FC = () => {
  const params = useParams<{ tenantSlug: string; tenantId: string }>();
  const tenantSlug = params.tenantSlug || params.tenantId || '';
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated() && tenantSlug) {
      loadData();
    } else if (!isAuthenticated()) {
      setLoading(false);
    }
  }, [isAuthenticated, tenantSlug]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { apiGet } = await import('../utils/api-client');
      const baseUrl = `/api/tenant/${tenantSlug}`;

      const [storesRes, ordersRes, statsRes] = await Promise.allSettled([
        apiGet(`${baseUrl}/stores?limit=50`),
        apiGet(`${baseUrl}/orders?limit=10`),
        apiGet(`${baseUrl}/orders/stats`),
      ]);

      if (storesRes.status === 'fulfilled' && storesRes.value?.success) {
        setStores(storesRes.value.data || []);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.success) {
        setOrders(ordersRes.value.data || []);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
    } catch (err: any) {
      setError('加载数据失败: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          请先登录以访问租户仪表板
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          前往登录
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 头部 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {user?.fullName || user?.email} — 管理控制台
          </Typography>
          <Typography variant="body1" color="text.secondary">
            欢迎回来！
            {error && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{error}</Typography>}
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Typography variant="h6" sx={{ textAlign: 'center', py: 8, color: '#999' }}>
          加载数据中...
        </Typography>
      ) : (
        <>
          {/* 统计卡片 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>今日订单</Typography>
                  <Typography variant="h4">{stats?.todayCount || 0}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      总订单 {stats?.total || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>今日营收</Typography>
                  <Typography variant="h4">{formatCurrency(stats?.todayRevenue || 0)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      累计 {formatCurrency(stats?.totalRevenue || 0)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>门店数</Typography>
                  <Typography variant="h4">{stores.length}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <StoreIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      活跃 {stores.filter(s => s.status === 'ACTIVE').length} 家
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>待处理订单</Typography>
                  <Typography variant="h4">{stats ? stats.pending + stats.preparing : 0}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <ShoppingCartIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="warning.main">
                      制作中 {stats?.preparing || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 两列布局 */}
          <Grid container spacing={3}>
            {/* 店铺列表 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    店铺列表
                  </Typography>
                  <Button variant="contained" startIcon={<EditIcon />} size="small"
                    onClick={() => navigate(TENANT_ROUTES.STORES.LIST.replace(':tenantSlug', tenantSlug))}>
                    管理店铺
                  </Button>
                </Box>

                {stores.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                    <Typography>暂无店铺</Typography>
                    <Button variant="outlined" size="small" sx={{ mt: 2 }}
                      onClick={() => navigate(TENANT_ROUTES.STORES.CREATE.replace(':tenantSlug', tenantSlug))}>
                      创建店铺
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {stores.map(store => (
                      <ListItem key={store.id}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton edge="end" onClick={() =>
                              navigate(TENANT_ROUTES.STORES.DETAIL
                                .replace(':tenantSlug', tenantSlug)
                                .replace(':storeId', store.id))
                            }>
                              <VisibilityIcon />
                            </IconButton>
                          </Box>
                        }>
                        <ListItemIcon><StoreIcon /></ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1">{store.name}</Typography>
                              <Chip
                                label={store.status === 'ACTIVE' ? '营业中' : '草稿'}
                                size="small"
                                color={store.status === 'ACTIVE' ? 'success' : 'default'}
                                sx={{ ml: 2 }}
                              />
                            </Box>
                          }
                          secondary={store.address || store.slug}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* 订单列表 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <ShoppingCartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  最近订单
                </Typography>

                {orders.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                    <Typography>暂无订单</Typography>
                  </Box>
                ) : (
                  <List>
                    {orders.map(order => (
                      <ListItem key={order.id}>
                        <ListItemIcon><ShoppingCartIcon /></ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1">{order.orderNumber || order.id.slice(-8)}</Typography>
                              <Chip
                                label={getStatusLabel(order.status)}
                                size="small"
                                color={getStatusColor(order.status) as any}
                                sx={{ ml: 2 }}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              {order.store?.name} | {formatCurrency(order.totalAmount)}
                              <br />
                              {formatDate(order.createdAt)}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* 快速操作 */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  快速操作
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Button fullWidth variant="outlined" startIcon={<RestaurantIcon />}
                      onClick={() => navigate(TENANT_ROUTES.STORES.LIST.replace(':tenantSlug', tenantSlug))}
                      sx={{ height: 70, flexDirection: 'column' }}>
                      菜单管理
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button fullWidth variant="outlined" startIcon={<PeopleIcon />}
                      onClick={() => {/* 员工管理后续实现 */ }}
                      sx={{ height: 70, flexDirection: 'column' }}>
                      员工管理
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button fullWidth variant="outlined" startIcon={<SettingsIcon />}
                      onClick={() => navigate(TENANT_ROUTES.STORES.LIST.replace(':tenantSlug', tenantSlug))}
                      sx={{ height: 70, flexDirection: 'column' }}>
                      店铺设置
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button fullWidth variant="outlined" startIcon={<TrendingUpIcon />}
                      onClick={() => {/* 报表后续实现 */ }}
                      sx={{ height: 70, flexDirection: 'column' }}>
                      销售报表
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default TenantDashboard;
