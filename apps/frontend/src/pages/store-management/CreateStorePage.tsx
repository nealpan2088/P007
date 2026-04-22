import React, { useState } from 'react';
import { Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import StoreForm from '../store-management/components/StoreForm';
import { StoreRequest } from '../store-management/types';

import { TENANT_ROUTES } from '../../config/routes';

const { Title, Text } = Typography;

const CreateStorePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (_values: StoreRequest) => {
    setLoading(true);
    try {
      // TODO: 实现店铺创建逻辑
      message.success('店铺创建成功');
      navigate(TENANT_ROUTES.TENANTS.LIST);
    } catch (error: any) {
      message.error(error.message || '创建失败，请稍后重试');
      console.error('创建店铺失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(TENANT_ROUTES.TENANTS.LIST);
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ padding: '16px 0' }}>
          <Title level={2}>创建新店铺</Title>
          <Text type="secondary">填写店铺信息，创建新的店铺</Text>
        </div>
      </Card>
      
      <Card>
        <StoreForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default CreateStorePage;
