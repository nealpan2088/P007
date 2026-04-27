// 店长端 — 餐桌管理
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Tag, Typography, message, Empty, Space, Modal, Form, Input, InputNumber, Select,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, EditOutlined, QrcodeOutlined } from '@ant-design/icons';
import { STORE_ADMIN_CONFIG, storeAdminFetch } from '../../config/store-admin';

const { Title } = Typography;

interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  shortCode?: string | null;
}


export default function StoreAdminTablesPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [qrModal, setQrModal] = useState(false);
  const [qrTable, setQrTable] = useState<TableItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { if (storeId) loadTables(); }, [storeId]);

  async function loadTables() {
    setLoading(true);
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}/tables`);
      setTables(json.data || []);
    } catch (err: any) {
      if (err.status === 401) { navigate('/store-admin/login'); return; }
      message.error('加载餐桌失败');
    } finally { setLoading(false); }
  }

  function openEdit(table: TableItem) {
    setEditingTable(table);
    form.setFieldsValue(table);
    setEditModal(true);
  }

  async function handleSave(values: any) {
    if (!editingTable) return;
    try {
      const json = await storeAdminFetch(`${STORE_ADMIN_CONFIG.API_BASE}/stores/${storeId}/tables/${editingTable.id}`, {
        method: 'PUT', body: JSON.stringify(values),
      });
      if (json.success) { message.success('已更新'); setEditModal(false); loadTables(); }
      else { message.error(json.error || '更新失败'); }
    } catch (err: any) { message.error('更新失败'); }
  }

  const columns = [
    { title: '桌号', dataIndex: 'tableNumber', key: 'number' },
    { title: '座位数', dataIndex: 'capacity', key: 'capacity' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'AVAILABLE' ? 'green' : s === 'OCCUPIED' ? 'red' : 'orange'}>{s === 'AVAILABLE' ? '空闲' : s === 'OCCUPIED' ? '占用' : s}</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, r: TableItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Button size="small" icon={<QrcodeOutlined />} onClick={() => { setQrTable(r); setQrModal(true); }}>二维码</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/store-admin')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>🪑 餐桌管理</Title>
        <Button icon={<ReloadOutlined />} onClick={loadTables} size="small">刷新</Button>
      </Space>

      <Card>
        <Table
          dataSource={tables}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无餐桌" /> }}
        />
      </Card>

      <Modal title="编辑餐桌" open={editModal} onCancel={() => setEditModal(false)} onOk={() => form.submit()} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="tableNumber" label="桌号" rules={[{ required: true, message: '请输入桌号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="capacity" label="座位数" rules={[{ required: true, message: '请输入座位数' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'AVAILABLE', label: '空闲' }, { value: 'OCCUPIED', label: '占用' }, { value: 'RESERVED', label: '预留' }]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 二维码弹窗 */}
      <Modal
        title={`${qrTable?.tableNumber || ''} 桌二维码`}
        open={qrModal}
        onCancel={() => setQrModal(false)}
        footer={null}
        width={360}
      >
        {qrTable?.shortCode ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              扫码短链（顾客扫码点餐）
            </div>
            <div
              style={{
                background: '#f5f5f5', borderRadius: 6, padding: '10px 14px',
                fontFamily: 'monospace', fontSize: 14, color: '#333',
                userSelect: 'all', cursor: 'pointer', marginBottom: 16,
                wordBreak: 'break-all',
              }}
              onClick={() => {
                navigator.clipboard.writeText(`https://saas.openyun.xin/s/${qrTable.shortCode}`);
                message.success('链接已复制');
              }}
            >
              https://saas.openyun.xin/s/{qrTable.shortCode}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              二维码图片（右键保存或截图打印）
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://saas.openyun.xin/s/${qrTable.shortCode}`)}`}
              alt={`${qrTable.tableNumber} 二维码`}
              style={{ width: 200, height: 200, border: '1px solid #eee', borderRadius: 8 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                onClick={() => {
                  navigator.clipboard.writeText(`https://saas.openyun.xin/s/${qrTable.shortCode}`);
                  message.success('短链已复制，可发给印刷店制作二维码');
                }}
              >
                复制短链
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
            该桌暂无短码，请联系管理员
          </div>
        )}
      </Modal>
    </div>
  );
}
