// 店长端 — 打印机管理页面（列表查看，待实现绑定/解绑）
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Tag, Typography, message, Empty, Space,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API = '/api/store-admin';
const TOKEN_KEY = 'qilin_store_admin_token';

interface Printer {
  id: string;
  name: string;
  brand: string;
  serialNumber: string;
  status: string;
  type: string;
}

async function storeAdminFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) throw { status: res.status, message: await res.text() };
  return res.json();
}

export default function StoreAdminPrintersPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (storeId) loadPrinters(); }, [storeId]);

  async function loadPrinters() {
    setLoading(true);
    try {
      const json = await storeAdminFetch(`${API}/stores/${storeId}/printers`);
      setPrinters(json.data || []);
    } catch (err: any) {
      if (err.status === 401) { navigate('/store-admin/login'); return; }
      message.error('加载打印机失败');
    } finally { setLoading(false); }
  }

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '序列号', dataIndex: 'serialNumber', key: 'sn' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => t === 'LABEL' ? '🏷 标签' : '📄 小票' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'ACTIVE' ? 'green' : 'red'}>{s === 'ACTIVE' ? '在线' : '离线'}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/store-admin')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>🖨️ 打印机管理</Title>
        <Button icon={<ReloadOutlined />} onClick={loadPrinters} size="small">刷新</Button>
      </Space>

      <Card>
        <Table
          dataSource={printers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无绑定打印机" /> }}
        />
      </Card>
    </div>
  );
}
