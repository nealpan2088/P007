import React from 'react';
import { Container, Typography, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TENANT_ROUTES } from '../config/routes';

const SimplestDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  console.log('SimplestDashboardPage 渲染');
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🏢 租户选择（简化版）
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        这是一个简化版的租户选择页面，用于测试基本功能。
      </Alert>
      
      <Typography variant="body1" paragraph>
        由于API调用可能有问题，这里显示静态的租户列表。
      </Typography>
      
      <div style={{ marginTop: '20px' }}>
        <Button
          variant="contained"
          onClick={() => navigate(TENANT_ROUTES.STORES.LIST.replace(':tenantId', '8'))}
          style={{ marginRight: '10px' }}
        >
          进入租户8的店铺
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => navigate(TENANT_ROUTES.TENANTS.CREATE)}
        >
          创建新租户
        </Button>
      </div>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        调试信息: 页面渲染时间: {new Date().toLocaleTimeString()}
      </Typography>
    </Container>
  );
};

export default SimplestDashboardPage;
