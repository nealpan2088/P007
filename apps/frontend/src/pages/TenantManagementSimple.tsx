import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
}

const TenantManagementSimple: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('简单版本：开始获取租户数据');
    
    fetch('/api/test/tenants')
      .then(async (response) => {
        console.log('API响应状态:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }
        const data = await response.json();
        console.log('API响应数据:', data);
        
        if (data.success) {
          setTenants(data.data || []);
        } else {
          throw new Error(data.message || '获取数据失败');
        }
      })
      .catch((err) => {
        console.error('获取租户数据错误:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        租户管理（简单版本）
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          找到 {tenants.length} 个租户
        </Typography>
        
        {tenants.length === 0 ? (
          <Alert severity="info">暂无租户数据</Alert>
        ) : (
          <ul>
            {tenants.map((tenant) => (
              <li key={tenant.id}>
                <strong>{tenant.name}</strong> ({tenant.subdomain}) - {tenant.plan} - {tenant.status}
              </li>
            ))}
          </ul>
        )}
      </Box>
      
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          这是一个简化版本，用于测试API连接和基本渲染功能。
          原始版本有认证检查和更复杂的UI。
        </Typography>
      </Box>
    </Container>
  );
};

export default TenantManagementSimple;
