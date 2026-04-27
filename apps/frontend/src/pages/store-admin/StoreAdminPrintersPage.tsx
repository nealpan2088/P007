// 店长端 — 打印机管理（列表 + 添加 + 删除 + 测试打印）
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Tag, Typography, message, Empty, Space, Modal, Form, Input, Select, Popconfirm,
} from 'antd';
import { STORE_ADMIN_CONFIG, storeAdminFetch } from '../../config/store-admin';
import {
  ArrowLeftOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, ThunderboltOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

interface Printer {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  model: string;
  brand?: { name: string } | null;
}


export default function StoreAdminPrintersPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { if (storeId) loadPrinters(); }, [storeId]);

  async function loadPrinters() {
    setLoading(true);
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}/printers`);
      setPrinters(json.data || []);
    } catch (err: any) {
      if (err.status === 401) { navigate('/store-admin/login'); return; }
      message.error('加载打印机失败');
    } finally { setLoading(false); }
  }

  async function handleAdd(values: any) {
    setAdding(true);
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}/printers`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      if (json.success || json.data) {
        message.success('打印机已添加');
        setAddModal(false);
        form.resetFields();
        loadPrinters();
      } else {
        message.error(json.error || '添加失败');
      }
    } catch (err: any) {
      message.error(err.message || '添加失败');
    } finally { setAdding(false); }
  }

  async function handleDelete(printerId: string) {
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}/printers/${printerId}`, {
        method: 'DELETE',
      });
      if (json.success) {
        message.success('已删除');
        loadPrinters();
      } else {
        message.error(json.error || '删除失败');
      }
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  }

  async function handleTest(printerId: string) {
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}/printers/${printerId}/test`, {
        method: 'POST',
      });
      if (json.success) {
        message.success('测试打印已发送');
      } else {
        message.error(json.error || '测试失败');
      }
    } catch (err: any) {
      message.error(err.message || '测试失败');
    }
  }

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', render: (n: string, r: Printer) => n || r.serialNumber },
    { title: '品牌', dataIndex: 'brand', key: 'brand', render: (b: { name: string } | null) => b?.name || '未指定' },
    { title: '序列号', dataIndex: 'serialNumber', key: 'sn' },
    { title: '型号', dataIndex: 'model', key: 'model', render: (t: string) => t || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'ACTIVE' ? 'green' : 'red'}>{s === 'ACTIVE' ? '在线' : '离线'}</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, r: Printer) => (
        <Space>
          <Button size="small" icon={<ThunderboltOutlined />} onClick={() => handleTest(r.id)}>测试</Button>
          <Popconfirm title="确定删除此打印机？" onConfirm={() => handleDelete(r.id)} okText="删除" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/store-admin')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>🖨️ 打印机管理</Title>
        <Button icon={<ReloadOutlined />} onClick={loadPrinters} size="small">刷新</Button>
      </Space>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>
            添加打印机
          </Button>
        }
      >
        <Table
          dataSource={printers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无绑定打印机，点击右上角添加" /> }}
        />
      </Card>

      {/* 添加打印机弹窗 */}
      <Modal
        title="添加打印机"
        open={addModal}
        onCancel={() => { setAddModal(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={adding}
        destroyOnClose
        width={420}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="serialNumber" label="打印机编号（SN）" rules={[{ required: true, message: '请输入打印机序列号' }]}>
            <Input placeholder="打印机底部贴纸上的 SN 编号" />
          </Form.Item>
          <Form.Item name="secretKey" label="打印机密钥（Key）" rules={[{ required: true, message: '请输入打印机密钥' }]}>
            <Input.Password placeholder="在打印机管理后台获取的密钥" />
          </Form.Item>
          <Form.Item name="name" label="打印机名称">
            <Input placeholder="如：前台小票、后厨" />
          </Form.Item>
          <Form.Item name="type" label="打印类型" initialValue="RECEIPT">
            <Select options={[
              { value: 'RECEIPT', label: '📄 前台小票' },
              { value: 'KITCHEN', label: '🍳 后厨' },
              { value: 'LABEL', label: '🏷 标签' },
            ]} />
          </Form.Item>
          <Form.Item name="brandCode" label="品牌" initialValue="shangpeng">
            <Select options={[
              { value: 'shangpeng', label: '商鹏' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
