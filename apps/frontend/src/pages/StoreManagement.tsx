/**
 * @deprecated 旧规范店铺管理页面
 * 后端路由已变更，不再使用 /api/v1/ 前缀
 * 新规范请使用 store-management/StoreListPage.tsx
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

  Alert,
  CircularProgress,
  Tooltip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Store as StoreIcon,
  QrCode as QrCodeIcon,
  Star as StarIcon,

} from '@mui/icons-material';
import { TENANT_ROUTES } from '../config/routes';

interface Store {
  id: number;
  name: string;
  slug: string;
  status: string;
  is_default: boolean;
  created_at: string;
  item_count?: number;
  order_count?: number;
}

const StoreManagement: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
  const [storeToSetDefault, setStoreToSetDefault] = useState<Store | null>(null);

  // 获取店铺列表
  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/tenant/stores', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qilin_access_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('获取店铺列表失败');
      }
      
      const data = await response.json();
      if (data.success) {
        setStores(data.data);
      } else {
        throw new Error(data.message || '获取店铺列表失败');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // 设置默认店铺
  const handleSetDefault = async (store: Store) => {
    try {
      const response = await fetch(`/api/v1/tenant/stores/${store.id}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qilin_access_token')}`,
        },
      });
      
      if (response.ok) {
        await fetchStores(); // 刷新列表
        setDefaultDialogOpen(false);
        setStoreToSetDefault(null);
      } else {
        throw new Error('设置默认店铺失败');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 删除店铺
  const handleDelete = async () => {
    if (!storeToDelete) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/tenant/stores/${storeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qilin_access_token')}`,
        },
      });
      
      if (response.ok) {
        await fetchStores(); // 刷新列表
        setDeleteDialogOpen(false);
        setStoreToDelete(null);
      } else {
        throw new Error('删除店铺失败');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 生成二维码
  const handleGenerateQR = (store: Store) => {
    // 这里可以打开二维码生成对话框
    alert(`为店铺 "${store.name}" 生成二维码\nURL: /t/tenant-slug/s/${store.slug}/scan/A01`);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'CLOSED': return 'error';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '营业中';
      case 'INACTIVE': return '暂停营业';
      case 'CLOSED': return '已关闭';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* 面包屑导航 */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/dashboard" underline="hover">
            仪表板
          </Link>
          <Typography color="text.primary">店铺管理</Typography>
        </Breadcrumbs>
      </Box>

      {/* 标题和操作按钮 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            店铺管理
          </Typography>
          <Typography variant="body1" color="text.secondary">
            管理您的所有店铺（分店），每个店铺可以独立设置菜单和接收订单
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(TENANT_ROUTES.STORES.CREATE)}
        >
          添加新店铺
        </Button>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 多店模式说明卡片 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🏢 多店模式说明
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            您的品牌 <strong>可以拥有多个店铺（分店）</strong>，每个店铺：
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                • 独立菜单和价格设置
              </Typography>
              <Typography variant="body2">
                • 独立订单管理
              </Typography>
              <Typography variant="body2">
                • 独立二维码和扫码点餐
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                • 统一品牌管理
              </Typography>
              <Typography variant="body2">
                • 统一会员系统
              </Typography>
              <Typography variant="body2">
                • 统一数据报表
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 店铺列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            店铺列表 ({stores.length})
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>店铺名称</TableCell>
                  <TableCell>标识符</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>默认店铺</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {store.is_default && (
                          <Tooltip title="默认店铺">
                            <StarIcon color="primary" sx={{ mr: 1 }} />
                          </Tooltip>
                        )}
                        <Typography variant="body2">
                          {store.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {store.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(store.status)}
                        color={getStatusColor(store.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {store.is_default ? (
                        <Chip label="是" color="primary" size="small" />
                      ) : (
                        <Button
                          size="small"
                          startIcon={<StarIcon />}
                          onClick={() => {
                            setStoreToSetDefault(store);
                            setDefaultDialogOpen(true);
                          }}
                        >
                          设为默认
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(store.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="生成二维码">
                        <IconButton
                          size="small"
                          onClick={() => handleGenerateQR(store)}
                          sx={{ mr: 1 }}
                        >
                          <QrCodeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="编辑">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`${TENANT_ROUTES.STORES.EDIT.replace(':storeId', store.id.toString())}`)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {!store.is_default && (
                        <Tooltip title="删除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setStoreToDelete(store);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {stores.length === 0 && (
            <Box textAlign="center" py={4}>
              <StoreIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                暂无店铺
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                添加您的第一个店铺开始使用多店功能
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(TENANT_ROUTES.STORES.CREATE)}
              >
                添加第一个店铺
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 操作指南 */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 操作指南
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                默认店铺
              </Typography>
              <Typography variant="body2" color="text.secondary">
                默认店铺是顾客访问品牌URL时自动显示的店铺。
                例如：访问 <code>/t/your-brand</code> 会显示默认店铺。
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                店铺二维码
              </Typography>
              <Typography variant="body2" color="text.secondary">
                每个店铺有独立的二维码，顾客扫码后进入该店铺的点餐页面。
                格式：<code>/t/your-brand/s/store-slug/scan/table-number</code>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 设置默认店铺对话框 */}
      <Dialog open={defaultDialogOpen} onClose={() => setDefaultDialogOpen(false)}>
        <DialogTitle>设置默认店铺</DialogTitle>
        <DialogContent>
          <Typography>
            确定要将 <strong>{storeToSetDefault?.name}</strong> 设为默认店铺吗？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            默认店铺是顾客访问品牌主页时显示的店铺。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDefaultDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={() => storeToSetDefault && handleSetDefault(storeToSetDefault)}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除店铺对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>删除店铺</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除店铺 <strong>{storeToDelete?.name}</strong> 吗？
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            此操作不可撤销！该店铺的所有菜单、订单数据将被标记为删除。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StoreManagement;