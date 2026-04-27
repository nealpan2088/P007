// 店长登录页面
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { apiPost } from '../../utils/api-client';
import ImageCaptcha from '../../components/ImageCaptcha';

const { Title, Text } = Typography;

const STORE_ADMIN_TOKEN_KEY = 'qilin_store_admin_token';
const STORE_ADMIN_USER_KEY = 'qilin_store_admin_user';

export default function StoreAdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    if (!captchaValid) {
      message.error('请先完成图形验证码验证');
      return;
    }
    setLoading(true);
    try {
      const json = await apiPost('/api/store-admin/login', values, { skipAuth: true });
      if (json.success && json.data?.token) {
        localStorage.setItem(STORE_ADMIN_TOKEN_KEY, json.data.token);
        localStorage.setItem(STORE_ADMIN_USER_KEY, JSON.stringify(json.data.user));
        message.success('登录成功');
        navigate('/store-admin');
      } else {
        message.error(json.error || json.data?.error || '登录失败，请检查账号密码');
      }
    } catch (err: any) {
      // ApiError 的 message 是后端返回的 JSON 字符串
      let errorMsg = '登录失败，请检查网络连接';
      try {
        const parsed = JSON.parse(err.message);
        errorMsg = parsed.error || parsed.message || errorMsg;
      } catch {
        errorMsg = err.message || errorMsg;
      }
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20,
    }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>📋 店长管理端</Title>
          <Text type="secondary">登录后管理店铺菜单、订单、打印机</Text>
        </div>
        <Form
          name="store_admin_login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱/手机号/用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱 / 手机号 / 用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item label={null}>
            <div className="flex items-center gap-2">
              <SafetyCertificateOutlined className="text-gray-400" />
              <span className="text-sm text-gray-500">图形验证码</span>
            </div>
            <ImageCaptcha onChange={(valid) => setCaptchaValid(valid)} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/auth/login" style={{ fontSize: 13 }}>返回通用登录</Link>
        </div>
      </Card>
    </div>
  );
}
