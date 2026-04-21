import React, { useState } from 'react';
import { Card, message, PageHeader } from 'antd';
import { useNavigate } from 'react-router-dom';
import StoreForm from '../store-management/components/StoreForm';
import { StoreRequest } from '../store-management/types';
import * as apiUtils from '../store-management/utils/api.utils';

const CreateStorePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 处理表单提交
  const handleSubmit = async (storeData: StoreRequest) => {
    try {
      setLoading(true);
      
      // 调用API创建店铺
      const createdStore = await apiUtils.createStore(storeData);
      
      message.success(`店铺 "${createdStore.name}" 创建成功`);
      
      // 创建成功后跳转到店铺列表
      navigate('/stores');
    } catch (error) {
      console.error('创建店铺失败:', error);
      message.error('创建店铺失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    navigate('/stores');
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="创建新店铺"
        subTitle="填写店铺信息，创建新的店铺"
        onBack={handleCancel}
        style={{ marginBottom: 24 }}
      />
      
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