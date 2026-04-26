// 店长端 — 占位页面（功能待建）
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

export default function StoreAdminPlaceholder({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/store-admin')}
        style={{ marginBottom: 16 }}>
        返回
      </Button>
      <Result
        status="info"
        title={title}
        subTitle="功能开发中，敬请期待"
      />
    </div>
  );
}
