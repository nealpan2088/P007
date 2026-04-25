import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiPost } from '../utils/api-client';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Store as StoreIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { TENANT_ROUTES } from '../config/routes';
import { API_ENDPOINTS } from '../config/api-routes';

interface StoreFormData {
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: string;
  capacity: number;
  status: string;
}

const CreateStore: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdStore, setCreatedStore] = useState<any>(null);

  // 表单数据
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    opening_hours: '09:00-22:00',
    capacity: 50,
    status: 'ACTIVE',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const steps = [
    '填写基本信息',
    '填写联系信息',
    '确认创建',
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: '营业中' },
    { value: 'INACTIVE', label: '暂停营业' },
    { value: 'COMING_SOON', label: '即将开业' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // 自动生成slug
    if (name === 'name' && value.trim() && !formData.slug) {
      // 去掉中文，只保留英文 + 数字，用连字符连接
      const latinOnly = value.trim()
        .replace(/[\u4e00-\u9fa5]+/g, '')  // 去掉中文
        .trim();
      
      const generatedSlug = latinOnly
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // 只保留小写字母和数字
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // 纯中文名或清理后为空 → 不自动填充，让用户手动输入
      if (generatedSlug.length >= 3) {
        setFormData(prev => ({
          ...prev,
          slug: generatedSlug,
        }));
      } else if (generatedSlug.length > 0) {
        setFormData(prev => ({
          ...prev,
          slug: generatedSlug,
        }));
      }
    }

    // 清除对应字段的错误
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    // 实时校验：联系电话输入时即时检查格式
    if (name === 'phone' && value.trim()) {
      const isValid = /^[\d\s\-\+\(\)]{6,20}$/.test(value);
      if (!isValid && value.length > 1) {
        setValidationErrors(prev => ({
          ...prev,
          phone: '电话格式：6~20位数字、空格、+、-或括号',
        }));
      }
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 0) {
      // 店铺名称验证
      if (!formData.name.trim()) {
        errors.name = '店铺名称不能为空';
      } else if (formData.name.length < 2) {
        errors.name = '店铺名称至少2个字符';
      }

      // 店铺标识符验证
      if (!formData.slug.trim()) {
        errors.slug = '店铺标识符不能为空';
      } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(formData.slug)) {
        errors.slug = '标识符只能包含小写字母、数字和连字符，且不能以连字符开头或结尾';
      } else if (formData.slug.length < 3) {
        errors.slug = '标识符至少3个字符';
      } else if (formData.slug.length > 30) {
        errors.slug = '标识符最多30个字符';
      }

      // 容量验证
      if (formData.capacity < 1) {
        errors.capacity = '容量必须大于0';
      } else if (formData.capacity > 1000) {
        errors.capacity = '容量不能超过1000';
      }
    }

    if (step === 1) {
      // 地址验证
      if (!formData.address.trim()) {
        errors.address = '地址不能为空';
      }

      // 电话验证（可选，但有值时要验证格式）
      if (formData.phone.trim() && !/^[\d\s\-\+\(\)]{6,20}$/.test(formData.phone)) {
        errors.phone = '电话号码格式不正确';
      }

      // 邮箱验证（可选，但有值时要验证格式）
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = '邮箱格式不正确';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    try {
      const res = await apiPost<any>(API_ENDPOINTS.TENANT.STORES.CHECK_SLUG, { slug });
      return res.success && res.data?.available === true;
    } catch (error) {
      console.error('检查标识符可用性错误:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      setActiveStep(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 检查店铺标识符可用性
      const isSlugAvailable = await checkSlugAvailability(formData.slug);
      if (!isSlugAvailable) {
        throw new Error(`店铺标识符 "${formData.slug}" 不可用，请尝试其他标识符`);
      }

      // 创建店铺
      const res = await apiPost<any>(API_ENDPOINTS.TENANT.STORES.CREATE, {
        name: formData.name,
        type: 'RESTAURANT',
        slug: formData.slug,
        tenantSlug: tenantSlug, // 传递租户标识符
        description: formData.description,
        address: formData.address,
        contactPhone: formData.phone, // 前端用 phone 但后端期望 contactPhone
        status: formData.status,
      });
      if (!res.success) {
        throw new Error(res.message || '创建店铺失败');
      }

      setCreatedStore(res.data);
      setSuccess(true);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤内容
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                店铺基本信息
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                填写店铺的基本信息，这些信息将显示给顾客。
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="店铺名称"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!validationErrors.name}
                helperText={validationErrors.name || '例如：北京王府井店、上海南京路旗舰店'}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="店铺标识符"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                error={!!validationErrors.slug}
                helperText={validationErrors.slug || '用于URL路径，例如：beijing-wangfujing'}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="店铺描述"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                helperText="简要描述店铺特色，可选"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!validationErrors.status}>
                <InputLabel>营业状态</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="营业状态"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.status && (
                  <FormHelperText>{validationErrors.status}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="座位容量"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                error={!!validationErrors.capacity}
                helperText={validationErrors.capacity || '店铺可容纳的顾客数量'}
                InputProps={{ inputProps: { min: 1, max: 1000 } }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                联系信息
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                填写店铺的联系信息，方便顾客联系和查找。
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="店铺地址"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                error={!!validationErrors.address}
                helperText={validationErrors.address || '详细地址，将显示给顾客'}
                required
                InputProps={{
                  startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="联系电话"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={!!validationErrors.phone}
                helperText={validationErrors.phone || '可选，用于顾客联系'}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="联系邮箱"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!validationErrors.email}
                helperText={validationErrors.email || '可选，用于接收通知'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="营业时间"
                name="opening_hours"
                value={formData.opening_hours}
                onChange={handleInputChange}
                helperText="例如：09:00-22:00 或 周一至周五 10:00-21:00，周末 09:00-23:00"
                InputProps={{
                  startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            {success && createdStore ? (
              <Box textAlign="center" py={4}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  店铺创建成功！
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  店铺 <strong>{createdStore.name}</strong> 已成功创建。
                </Typography>
                
                <Card variant="outlined" sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      店铺信息
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          名称：
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {createdStore.name}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          标识符：
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {createdStore.slug}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          状态：
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {createdStore.status === 'ACTIVE' ? '营业中' : '其他'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          扫码地址：
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          /t/{tenantSlug}/s/{createdStore.slug}/scan/A01
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                
                <Box mt={4}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(TENANT_ROUTES.STORES.LIST.replace(':tenantSlug', tenantSlug||''))}
                    sx={{ mr: 2 }}
                  >
                    查看所有店铺
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(TENANT_ROUTES.STORES.CREATE.replace(':tenantSlug', tenantSlug||''))}
                  >
                    继续添加店铺
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  正在创建店铺...
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      {/* 面包屑导航 */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href={TENANT_ROUTES.DASHBOARD} underline="hover">
            仪表板
          </Link>
          <Link color="inherit" href={TENANT_ROUTES.STORES.LIST} underline="hover">
            店铺管理
          </Link>
          <Typography color="text.primary">添加店铺</Typography>
        </Breadcrumbs>
      </Box>

      {/* 标题 */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          添加新店铺
        </Typography>
        <Typography variant="body1" color="text.secondary">
          为您的品牌添加一个新的店铺（分店）。每个店铺可以独立设置菜单和接收订单。
        </Typography>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 多店模式说明 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🏢 多店模式优势
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                • <strong>统一品牌管理</strong> - 所有店铺共享品牌形象
              </Typography>
              <Typography variant="body2">
                • <strong>独立运营</strong> - 每个店铺可设置不同菜单和价格
              </Typography>
              <Typography variant="body2">
                • <strong>灵活扩展</strong> - 轻松添加新分店
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                • <strong>数据统一</strong> - 所有店铺数据集中管理
              </Typography>
              <Typography variant="body2">
                • <strong>独立二维码</strong> - 每个店铺有专属扫码点餐
              </Typography>
              <Typography variant="body2">
                • <strong>成本节约</strong> - 一套系统管理所有店铺
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 步骤指示器 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* 步骤内容 */}
      <Card>
        <CardContent>
          {renderStepContent(activeStep)}
        </CardContent>
      </Card>

      {/* 导航按钮 */}
      {activeStep < 2 && (
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            上一步
          </Button>
          
          {activeStep === steps.length - 2 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? '创建中...' : '创建店铺'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              下一步
            </Button>
          )}
        </Box>
      )}
    </Container>
  );
};

export default CreateStore;