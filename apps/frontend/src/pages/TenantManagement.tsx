import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TENANT_ROUTES } from '../config/routes';
import apiRoutes from '../config/api-routes';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { TENANT_ROUTES } from '../config/routes';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  trialEndsAt: string;
  settings: any;
  createdAt: string;
  joinedAt: string;
  role: string;
}

const TenantManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [creatingTenant, setCreatingTenant] = useState(false);

  useEffect(() => {
    console.log('TenantManagement useEffect triggered, isAuthenticated:', isAuthenticated());
    console.log('Token in localStorage:', localStorage.getItem('qilin_access_token'));
    
    if (isAuthenticated()) {
      console.log('用户已认证，开始获取租户列表');
      fetchTenants();
    } else {
      // 如果未认证，设置加载完成状态
      console.log('用户未认证，跳过API调用');
      setLoading(false);
      setError('请先登录以查看租户列表');
    }
  }, [isAuthenticated]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取Token
      const token = localStorage.getItem('qilin_access_token');
      if (!token) {
        throw new Error('未找到认证Token，请重新登录');
      }

      console.log('调用租户列表API，Token长度:', token.length);
      
      const response = await fetch(apiRoutes.tenant.TENANT.LIST, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API响应状态:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token无效，清除登录状态
          localStorage.removeItem('qilin_access_token');
          localStorage.removeItem('qilin_user');
          localStorage.removeItem('qilin_session_id');
          throw new Error('认证已过期，请重新登录');
        }
        throw new Error(`获取租户列表失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('API响应数据:', data);
      
      if (data.success) {
        setTenants(data.data || []);
      } else {
        throw new Error(data.message || '获取租户列表失败');
      }
    } catch (err) {
      console.error('获取租户列表错误:', err);
      setError(err instanceof Error ? err.message : '获取租户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = () => {
    navigate(TENANT_ROUTES.TENANTS.CREATE);
  };

  const handleEditTenant = (tenantId: string) => {
    navigate(`/tenants/${tenantId}/edit`);
  };

  const handleViewDashboard = (tenantId: string) => {
    navigate(`/tenants/${tenantId}`);
  };

  const handleSwitchTenant = (tenantId: string) => {
    // 切换到该租户
    console.log('切换到租户:', tenantId);
    // 这里应该调用切换租户的API
    alert(`切换到租户 ${tenantId}（功能待实现）`);
  };

  const handleDeleteTenant = (tenantId: string) => {
    if (window.confirm('确定要删除这个租户吗？此操作不可撤销。')) {
      console.log('删除租户:', tenantId);
      // 这里应该调用删除租户的API
      alert(`删除租户 ${tenantId}（功能待实现）`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'default';
      case 'BASIC': return 'primary';
      case 'PREMIUM': return 'secondary';
      case 'ENTERPRISE': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'TRIAL': return 'warning';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          请先登录以管理租户
        </Alert>
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
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                欢迎回来，{user?.fullName || user?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                邮箱: {user?.email} | 角色: {user?.role || '用户'}
              </Typography>
            </Box>
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateTenant}
                disabled={creatingTenant}
              >
                {creatingTenant ? '创建中...' : '创建新租户'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={logout}
                sx={{ ml: 2 }}
              >
                退出登录
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h5" component="h2" gutterBottom>
        <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        我的租户
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph={true}>
        您可以管理以下租户。每个租户代表一个独立的餐厅或业务。
      </Typography>

      <Divider sx={{ my: 3 }} />

      {tenants.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无租户
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph={true}>
            您还没有创建任何租户。租户代表一个独立的餐厅或业务。
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTenant}
            size="large"
          >
            创建第一个租户
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tenants.map((tenant) => (
            <Grid item xs={12} md={6} key={tenant.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {tenant.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        子域名: {tenant.subdomain}.qilin.com
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                      <Chip 
                        label={tenant.plan} 
                        size="small" 
                        color={getPlanColor(tenant.plan) as any}
                      />
                      <Chip 
                        label={tenant.status} 
                        size="small" 
                        color={getStatusColor(tenant.status) as any}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      您的角色: <Chip label={tenant.role} size="small" variant="outlined" />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      创建时间: {formatDate(tenant.createdAt)} | 加入时间: {formatDate(tenant.joinedAt)}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="进入仪表板">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDashboard(tenant.id)}
                        color="primary"
                      >
                        <DashboardIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="切换到该租户">
                      <IconButton 
                        size="small" 
                        onClick={() => handleSwitchTenant(tenant.id)}
                        color="info"
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="编辑租户">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditTenant(tenant.id)}
                        color="warning"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除租户">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteTenant(tenant.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => window.location.href = `https://${tenant.subdomain}.qilin.com`}
                  >
                    访问租户
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          共 {tenants.length} 个租户
        </Typography>
      </Box>
    </Container>
  );
};

export default TenantManagement;