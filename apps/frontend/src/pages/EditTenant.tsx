import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiPut } from '../utils/api-client';
import { API_ENDPOINTS } from '../config/api-routes';
import { ADMIN_ROUTES, PUBLIC_ROUTES } from '../config/routes';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

interface TenantFormData {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const EditTenant: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '中国',
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (isAuthenticated() && tenantId) {
      fetchTenantData();
    }
  }, [isAuthenticated, tenantId]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 这里应该调用获取租户详情的API
      // 暂时使用模拟数据
      setTimeout(() => {
        setFormData({
          name: '测试餐厅',
          description: '这是一个测试餐厅的描述',
          contactEmail: 'contact@testrestaurant.com',
          contactPhone: '13800138000',
          contactPerson: '张经理',
          address: '测试路123号',
          city: '上海',
          province: '上海',
          postalCode: '200000',
          country: '中国',
        });
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error('获取租户数据错误:', err);
      setError('获取租户数据失败');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // 清除该字段的验证错误
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = '租户名称是必需的';
    }
    
    if (!formData.contactEmail.trim()) {
      errors.contactEmail = '联系邮箱是必需的';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      errors.contactEmail = '邮箱格式无效';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // 这里应该调用更新租户的API
      if (!tenantId) {
        throw new Error('租户ID不能为空');
      }
      const res = await apiPut(API_ENDPOINTS.TENANT.UPDATE.replace(':tenantId', tenantId), {
          name: formData.name,
          description: formData.description,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          contactPerson: formData.contactPerson,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: formData.country,
      });
      
      if (!res.success) {
        throw new Error(res.message || '更新失败');
      }
      
      setSuccess('租户信息更新成功！');
        // 3秒后返回租户管理页面
        setTimeout(() => {
          navigate(ADMIN_ROUTES.TENANTS.LIST);
        }, 3000);
    } catch (err) {
      console.error('更新租户错误:', err);
      setError(err instanceof Error ? err.message : '更新租户失败');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(ADMIN_ROUTES.TENANTS.LIST);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          请先登录以编辑租户
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(PUBLIC_ROUTES.AUTH.LOGIN)}
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          编辑租户
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>
              租户基本信息
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="租户名称 *"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="描述"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  disabled={saving}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              联系信息
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="联系邮箱 *"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  error={!!validationErrors.contactEmail}
                  helperText={validationErrors.contactEmail}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="联系电话"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="联系人"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              地址信息
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="地址"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="城市"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="省份"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="邮政编码"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="国家"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
            </Grid>
          </form>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={saving}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存更改'}
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default EditTenant;