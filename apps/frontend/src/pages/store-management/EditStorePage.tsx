import React, { useState, useEffect } from 'react';
import { Card, Typography, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import StoreForm from '../store-management/components/StoreForm';
import { Store, StoreRequest } from '../store-management/types';
import * as apiUtils from '../store-management/utils/api.utils';
import { TENANT_ROUTES } from '../../config/routes';

const { Title, Text } = Typography;

const EditStorePage: React.FC = () => {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStore();
  }, [storeId]);

  const fetchStore = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const response = await apiUtils.getStore(storeId);
      if (response.success && response.data) {
        setStore(response.data);
      } else {
        message.error(response.message || '获取店铺信息失败');
        navigate(TENANT_ROUTES.TENANTS.LIST);
      }
    } catch (error) {
      message.error('获取店铺信息失败');
      console.error('获取店铺失败:', error);
      navigate(TENANT_ROUTES.TENANTS.LIST);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: StoreRequest) => {
    if (!storeId) return;
    
    setSubmitting(true);
    try {
      const response = await apiUtils.updateStore(storeId, values);
      if (response.success) {
        message.success('店铺更新成功');
        navigate(TENANT_ROUTES.TENANTS.LIST);
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败，请稍后重试');
      console.error('更新店铺失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(TENANT_ROUTES.TENANTS.LIST);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Title level={3}>店铺不存在</Title>
            <Text type="secondary">您要编辑的店铺不存在或已被删除</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ padding: '16px 0' }}>
          <Title level={2}>编辑店铺: {store.name}</Title>
          <Text type="secondary">修改店铺信息</Text>
        </div>
      </Card>
      
      <Card>
        <StoreForm
          initialValues={store}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      </Card>
    </div>
  );
};

export default EditStorePage;
