import React, { useState, useEffect } from 'react';
import { Card, message, PageHeader, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import StoreForm from '../store-management/components/StoreForm';
import { Store, StoreRequest } from '../store-management/types';
import * as apiUtils from '../store-management/utils/api.utils';
import { TENANT_ROUTES } from '../../config/routes';

const EditStorePage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [store, setStore] = useState<Store | null>(null);

  // 加载店铺数据
  useEffect(() => {
    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      
      // 调用API获取店铺详情
      const storeData = await apiUtils.fetchStore(storeId!);
      setStore(storeData);
    } catch (error) {
      console.error('加载店铺数据失败:', error);
      message.error('加载店铺数据失败，请稍后重试');
      navigate(TENANT_ROUTES.STORES.LIST);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (storeData: StoreRequest) => {
    if (!storeId) return;
    
    try {
      setSubmitting(true);
      
      // 调用API更新店铺
      const updatedStore = await apiUtils.updateStore(storeId, storeData);
      
      message.success(`店铺 "${updatedStore.name}" 更新成功`);
      
      // 更新成功后跳转到店铺列表
      navigate(TENANT_ROUTES.STORES.LIST);
    } catch (error) {
      console.error('更新店铺失败:', error);
      message.error('更新店铺失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    navigate(TENANT_ROUTES.STORES.LIST);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="加载店铺数据中..." />
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>未找到店铺信息</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title={`编辑店铺: ${store.name}`}
        subTitle="修改店铺信息"
        onBack={handleCancel}
        style={{ marginBottom: 24 }}
      />
      
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