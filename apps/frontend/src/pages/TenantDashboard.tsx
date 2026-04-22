import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Restaurant as RestaurantIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { TENANT_ROUTES } from '../config/routes';

// 模拟数据
const mockStores = [
  { id: '1', name: '凤凰餐厅总店', status: 'active', ordersToday: 42, revenueToday: 2560.00 },
  { id: '2', name: '凤凰餐厅分店', status: 'active', ordersToday: 28, revenueToday: 1820.00 },
];

const mockOrders = [
  { id: 'ORD-2026-00123', storeName: '凤凰餐厅总店', status: 'completed', totalAmount: 256.00, createdAt: '2026-04-21T10:30:00Z' },
  { id: 'ORD-2026-00122', storeName: '凤凰餐厅分店', status: 'preparing', totalAmount: 128.50, createdAt: '2026-04-21T09:15:00Z' },
];

const mockTenant = {
  name: '凤凰餐饮集团',
  plan: 'PREMIUM',
  trialEndsAt: '2026-05-21T00:00:00Z',
  storesCount: 2,
  totalRevenue: 12850.00,
  activeUsers: 8,
};

// 工具函数
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
    case 'active':
    case 'completed':
      return 'success';
    case 'preparing':
      return 'warning';
    case 'pending':
      return 'info';
    case 'inactive':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const TenantDashboard: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tenant, _setTenant] = useState(mockTenant);
  const [stores, _setStores] = useState(mockStores);
  const [recentOrders, _setRecentOrders] = useState(mockOrders);

  useEffect(() => {
    if (isAuthenticated() && tenantId) {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [isAuthenticated, tenantId]);

  const handleCreateStore = () => {
    navigate(`${TENANT_ROUTES.DASHBOARD}/${tenantId}/stores/create`);
  };

  const handleViewStore = (storeId: string) => {
    navigate(`${TENANT_ROUTES.DASHBOARD}/${tenantId}/stores/${storeId}`);
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`${TENANT_ROUTES.DASHBOARD}/${tenantId}/orders/${orderId}`);
  };

  const handleEditTenant = () => {
    navigate(`${TENANT_ROUTES.DASHBOARD}/${tenantId}/edit`);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          请先登录以访问租户仪表板
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/auth/login')}
          sx={{ mt: 2 }}
        >
          前往登录
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h6">加载中...</Typography>
      </Container>
    );
  }

  // 计算统计数据
  const totalOrdersToday = stores.reduce((sum, store) => sum + store.ordersToday, 0);
  const totalRevenueToday = stores.reduce((sum, store) => sum + store.revenueToday, 0);
  const activeStoresCount = stores.filter(store => store.status === 'active').length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 头部信息 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {tenant.name} - 管理仪表板
          </Typography>
          <Typography variant="body1" color="text.secondary">
            欢迎回来，{user?.fullName || user?.email}！
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEditTenant}
        >
          编辑租户信息
        </Button>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                今日订单
              </Typography>
              <Typography variant="h4" component="div">
                {totalOrdersToday}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +12% 较昨日
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                今日营收
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(totalRevenueToday)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +8% 较昨日
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                活跃店铺
              </Typography>
              <Typography variant="h4" component="div">
                {activeStoresCount}/{stores.length}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <StoreIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  共 {stores.length} 家店铺
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                活跃员工
              </Typography>
              <Typography variant="h4" component="div">
                {tenant.activeUsers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  可管理员工账户
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 主要内容区域 */}
      <Grid container spacing={3}>
        {/* 店铺管理 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2">
                <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                店铺管理
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateStore}
                size="small"
              >
                新增店铺
              </Button>
            </Box>
            
            <List>
              {stores.map((store) => (
                <ListItem
                  key={store.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleViewStore(store.id)}>
                      <VisibilityIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <StoreIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">{store.name}</Typography>
                        <Chip
                          label={store.status === 'active' ? '营业中' : '已关闭'}
                          size="small"
                          color={getStatusColor(store.status) as any}
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        今日订单: {store.ordersToday} | 营收: {formatCurrency(store.revenueToday)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 最近订单 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              <ShoppingCartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              最近订单
            </Typography>
            
            <List>
              {recentOrders.map((order) => (
                <ListItem
                  key={order.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleViewOrder(order.id)}>
                      <VisibilityIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <ShoppingCartIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">{order.id}</Typography>
                        <Chip
                          label={order.status === 'completed' ? '已完成' : 
                            order.status === 'preparing' ? '制作中' : '待处理'}
                          size="small"
                          color={getStatusColor(order.status) as any}
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {order.storeName} | {formatCurrency(order.totalAmount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 系统状态 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              系统状态
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                套餐信息
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip 
                  label={tenant.plan} 
                  color="primary" 
                  size="small"
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  试用到期: {new Date(tenant.trialEndsAt).toLocaleDateString('zh-CN')}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={70} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                试用期剩余 70%
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                最近活动
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                      <Typography variant="caption">1</Typography>
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="新店铺创建" 
                    secondary="凤凰餐厅新店已创建" 
                  />
                  <Typography variant="caption" color="text.secondary">
                    2小时前
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                      <Typography variant="caption">2</Typography>
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="大额订单" 
                    secondary="订单 ORD-2026-00123 金额 ¥256.00" 
                  />
                  <Typography variant="caption" color="text.secondary">
                    3小时前
                  </Typography>
                </ListItem>
              </List>
            </Box>
          </Paper>
        </Grid>

        {/* 快速操作 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              快速操作
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BarChartIcon />}
                  onClick={() => navigate(`${TENANT_ROUTES.DASHBOARD}/${tenantId}/analytics`)}
                  sx={{ height: 80, flexDirection: 'column' }}
                >
                  <Typography variant="body1">销售报表</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate(`${TENANT_ROUTES.DASHBOARD}/${tenantId}/users`)}
                  sx={{ height: 80, flexDirection: 'column' }}
                >
                  <Typography variant="body1">员工管理</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RestaurantIcon />}
                  onClick={() => navigate(`${TENANT_ROUTES.DASHBOARD}/${tenantId}/menu`)}
                  sx={{ height: 80, flexDirection: 'column' }}
                >
                  <Typography variant="body1">菜单管理</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate(`${TENANT_ROUTES.DASHBOARD}/${tenantId}/settings`)}
                  sx={{ height: 80, flexDirection: 'column' }}
                >
                  <Typography variant="body1">系统设置</Typography>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TenantDashboard;