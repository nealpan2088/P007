import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Store as StoreIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { TENANT_ROUTES } from '../config/routes';

const CreateTenant: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<any>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan: 'FREE',
  });

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    subdomain: '',
  });

  const steps = [
    '填写基本信息',
    '选择套餐计划',
    '确认创建',
  ];

  const plans = [
    { value: 'FREE', label: '免费版', description: '适合初创餐厅，基础功能' },
    { value: 'BASIC', label: '基础版', description: '适合小型餐厅，更多功能' },
    { value: 'PREMIUM', label: '高级版', description: '适合中型餐厅，完整功能' },
    { value: 'ENTERPRISE', label: '企业版', description: '适合连锁餐厅，定制功能' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // 清除对应字段的错误
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
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
    const errors: any = {};

    if (step === 0) {
      if (!formData.name.trim()) {
        errors.name = '租户名称不能为空';
      } else if (formData.name.length < 2) {
        errors.name = '租户名称至少2个字符';
      }

      if (!formData.subdomain.trim()) {
        errors.subdomain = '子域名不能为空';
      } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(formData.subdomain)) {
        errors.subdomain = '子域名只能包含小写字母、数字和连字符，且不能以连字符开头或结尾';
      } else if (formData.subdomain.length < 3) {
        errors.subdomain = '子域名至少3个字符';
      } else if (formData.subdomain.length > 30) {
        errors.subdomain = '子域名最多30个字符';
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

  const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
    try {
      const response = await fetch(apiRoutes.tenant.TENANT.CHECK_SUBDOMAIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qilin_access_token')}`,
        },
        body: JSON.stringify({ subdomain }),
      });

      const data = await response.json();
      return data.success && data.data?.available === true;
    } catch (error) {
      console.error('检查子域名可用性错误:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(0)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 检查子域名可用性
      const isAvailable = await checkSubdomainAvailability(formData.subdomain);
      if (!isAvailable) {
        throw new Error(`子域名 "${formData.subdomain}" 不可用，请尝试其他子域名`);
      }

      // 创建租户
      const response = await fetch('/api/v1/tenant/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qilin_access_token')}`,
        },
        body: JSON.stringify({
          tenant: {
            name: formData.name,
            subdomain: formData.subdomain,
            plan: formData.plan,
          },
          owner: {
            email: user?.email,
            username: user?.username,
            fullName: user?.fullName,
            phone: user?.phone || '',
            password: '', // 密码不需要，用户已经登录
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '创建租户失败');
      }

      setCreatedTenant(data.data);
      setSuccess(true);
      setActiveStep(3); // 跳转到成功步骤
    } catch (err) {
      console.error('创建租户错误:', err);
      setError(err instanceof Error ? err.message : '创建租户失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToTenants = () => {
    navigate(TENANT_ROUTES.TENANTS.LIST);
  };

  const handleGoToTenant = () => {
    if (createdTenant?.tenant?.subdomain) {
      // 这里可以跳转到租户管理页面
      navigate(`/dashboard`);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          请先登录以创建租户
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

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(TENANT_ROUTES.TENANTS.LIST)}
        sx={{ mb: 3 }}
      >
        返回租户列表
      </Button>

      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <StoreIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              创建新租户
            </Typography>
            <Typography variant="body1" color="text.secondary">
              为您的餐厅创建一个新的租户，开始使用麒麟点餐系统
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              租户创建成功！
            </Alert>
          )}

          <Stepper activeStep={activeStep} orientation="vertical">
            {/* 步骤1: 填写基本信息 */}
            <Step>
              <StepLabel>填写基本信息</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="租户名称"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={!!validationErrors.name}
                      helperText={validationErrors.name || '例如: 凤凰餐厅、美味小吃店等'}
                      placeholder="请输入租户名称"
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="子域名"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleInputChange}
                      error={!!validationErrors.subdomain}
                      helperText={validationErrors.subdomain || '例如: phoenix、meiwei 等，将用于访问您的餐厅页面'}
                      placeholder="请输入子域名"
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <Typography variant="body2" color="text.secondary">
                            .qilin.com
                          </Typography>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    下一步：选择套餐
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* 步骤2: 选择套餐计划 */}
            <Step>
              <StepLabel>选择套餐计划</StepLabel>
              <StepContent>
                <FormControl fullWidth error={false}>
                  <InputLabel>套餐计划</InputLabel>
                  <Select
                    name="plan"
                    value={formData.plan}
                    onChange={handleSelectChange}
                    label="套餐计划"
                    disabled={loading}
                  >
                    {plans.map((plan) => (
                      <MenuItem key={plan.value} value={plan.value}>
                        <Box>
                          <Typography variant="body1">{plan.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {plan.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    免费版提供14天试用期，试用期结束后可选择升级
                  </FormHelperText>
                </FormControl>
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button onClick={handleBack} disabled={loading}>
                    上一步
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    下一步：确认创建
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* 步骤3: 确认创建 */}
            <Step>
              <StepLabel>确认创建</StepLabel>
              <StepContent>
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    创建信息确认
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        租户名称:
                      </Typography>
                      <Typography variant="body1">{formData.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        子域名:
                      </Typography>
                      <Typography variant="body1">
                        {formData.subdomain}.qilin.com
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        套餐计划:
                      </Typography>
                      <Typography variant="body1">
                        {plans.find(p => p.value === formData.plan)?.label}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        所有者:
                      </Typography>
                      <Typography variant="body1">{user?.fullName || user?.username}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button onClick={handleBack} disabled={loading}>
                    上一步
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? '创建中...' : '确认创建'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* 步骤4: 创建成功 */}
            <Step>
              <StepLabel>创建成功</StepLabel>
              <StepContent>
                {createdTenant && (
                  <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                      <Typography variant="h5" gutterBottom>
                        租户创建成功！
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        您的租户已成功创建，可以开始使用了
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          租户ID:
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                          {createdTenant.tenant.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          访问地址:
                        </Typography>
                        <Typography variant="body1">
                          https://{createdTenant.tenant.subdomain}.qilin.com
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          试用到期:
                        </Typography>
                        <Typography variant="body1">
                          {new Date(createdTenant.tenant.trialEndsAt).toLocaleDateString('zh-CN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          您的角色:
                        </Typography>
                        <Typography variant="body1">
                          {createdTenant.userTenant.role}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleGoToTenants}
                  >
                    查看所有租户
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGoToTenant}
                  >
                    进入租户管理
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateTenant;