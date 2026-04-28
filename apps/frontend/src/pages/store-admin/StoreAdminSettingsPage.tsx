// 店长端 — 店铺设置
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Typography, message, Spin, Space, Descriptions, Select, InputNumber,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { STORE_ADMIN_CONFIG, storeAdminFetch } from '../../config/store-admin';

const { Title } = Typography;

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  contactPhone?: string;
  status: string;
}


export default function StoreAdminSettingsPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (storeId) {
      // 等 Form 挂载完成再加载数据
      setTimeout(() => loadStore(), 100);
    }
  }, [storeId]);

  async function loadStore() {
    setLoading(true);
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}`);
      if (json.success) {
        setStore(json.data);
        form.setFieldsValue(json.data);
      }
    } catch (err: any) {
      if (err.status === 401) { navigate('/store-admin/login'); return; }
      message.error('加载店铺信息失败');
    } finally { setLoading(false); }
  }

  async function handleSave(values: any) {
    setSaving(true);
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}`, {
        method: 'PUT', body: JSON.stringify(values),
      });
      if (json.success) { message.success('已保存'); loadStore(); }
      else { message.error(json.error || '保存失败'); }
    } catch (err: any) { message.error('保存失败'); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/store-admin')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>⚙️ 店铺设置</Title>
      </Space>

      <Card title="基本信息" style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="店铺名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="店铺描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input />
          </Form.Item>
          <div style={{ borderTop: '1px solid #f0f0f0', margin: '16px 0' }} />
          <Title level={5}>订单流程</Title>
          <Form.Item name="orderFlow" label="订单模式" tooltip="精简模式：制作中→完成取餐一键操作，超时自动完成；标准模式：完成→已取餐两步操作">
            <Select>
              <Select.Option value="SIMPLE">精简模式（一键完成 + 自动超时）</Select.Option>
              <Select.Option value="STANDARD">标准模式（完成→已取餐两步）</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="autoCompleteMin" label="自动完成时间（分钟）" tooltip="精简模式下，制作中超过此时间未操作，系统自动标记为已取餐">
            <InputNumber min={5} max={240} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>保存</Button>
          </Form.Item>
        </Form>
      </Card>

      {store && (
        <Card title="店铺信息" style={{ maxWidth: 600, marginTop: 16 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="店铺slug">{store.slug}</Descriptions.Item>
            <Descriptions.Item label="营业状态">{store.status === 'ACTIVE' ? '🟢 营业中' : '🟡 草稿'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
}
