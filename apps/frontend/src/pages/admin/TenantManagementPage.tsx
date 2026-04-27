import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Button, Modal, Select, InputNumber, message, Space, Input, Badge, Tooltip, Statistic, Row, Col, Descriptions } from 'antd';
import { SearchOutlined, ReloadOutlined, SwapOutlined, ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { apiGet, apiPost, apiPut } from '../../utils/api-client';
import { API_ENDPOINTS } from '../../config/api-routes';

const { Option } = Select;

const PLAN_NAMES: Record<string, string> = {
  FREE: '免费版',
  SINGLE: '单店版',
  PRO: '专业版',
  ENTERPRISE: '企业版',
};

const PLAN_COLORS: Record<string, string> = {
  FREE: 'default',
  SINGLE: 'blue',
  PRO: 'purple',
  ENTERPRISE: 'gold',
};

interface TenantItem {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  contactEmail: string | null;
  storeCount: number;
  userCount: number;
  createdAt: string;
}

interface TenantDetail {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  contactEmail: string | null;
  storeCount: number;
  userCount: number;
  stores: Array<{ id: string; name: string; slug: string; status: string; createdAt: string }>;
  userTenants: Array<{
    user: { id: string; email: string; username: string | null; fullName: string | null; role: string; status: string };
    role: string;
  }>;
}

interface UsageData {
  plan: string;
  trialEndsAt: string | null;
  usage: Record<string, { current: number; limit: string | number }>;
  dataRetentionDays: number;
}

const TenantManagementPage: React.FC = () => {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // 弹窗状态
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState<TenantDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [usageVisible, setUsageVisible] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planModalTenantId, setPlanModalTenantId] = useState('');
  const [newPlan, setNewPlan] = useState('FREE');
  const [extendDays, setExtendDays] = useState(0);
  const [planModalLoading, setPlanModalLoading] = useState(false);

  const fetchTenants = useCallback(async (page = 1, pageSize = 20, q = '') => {
    setLoading(true);
    try {
      const res = await apiGet(API_ENDPOINTS.TENANTS.LIST, { params: { page: String(page), pageSize: String(pageSize), ...(q ? { search: q } : {}) } });
      const data = res.data || res;
      setTenants(data.items || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: data.pagination?.total || 0 }));
    } catch (err: any) {
      message.error('获取租户列表失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  // 查看详情
  const showDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailVisible(true);
    try {
      const res = await apiGet(API_ENDPOINTS.TENANTS.DETAIL(id));
      setDetailData(res.data || res);
    } catch {
      message.error('获取租户详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 查看用量
  const showUsage = async (id: string) => {
    setUsageLoading(true);
    setUsageVisible(true);
    try {
      const res = await apiGet(API_ENDPOINTS.TENANTS.USAGE(id));
      setUsageData(res.data || res);
    } catch {
      message.error('获取用量统计失败');
    } finally {
      setUsageLoading(false);
    }
  };

  // 变更套餐
  const handleChangePlan = async () => {
    if (!planModalTenantId) return;
    setPlanModalLoading(true);
    try {
      const body: any = { plan: newPlan };
      if (extendDays > 0) body.extendDays = extendDays;
      await apiPost(API_ENDPOINTS.TENANTS.CHANGE_PLAN(planModalTenantId), body);
      message.success(`套餐已变更为 ${PLAN_NAMES[newPlan]}`);
      setPlanModalVisible(false);
      fetchTenants(pagination.current);
    } catch (err: any) {
      message.error('套餐变更失败: ' + (err.message || '未知错误'));
    } finally {
      setPlanModalLoading(false);
    }
  };

  const columns = [
    {
      title: '租户名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: TenantItem) => (
        <a onClick={() => showDetail(record.id)} style={{ fontWeight: 500 }}>{name}</a>
      ),
    },
    { title: '子域名', dataIndex: 'subdomain', key: 'subdomain', width: 140 },
    {
      title: '套餐',
      dataIndex: 'plan',
      key: 'plan',
      width: 100,
      render: (plan: string) => <Tag color={PLAN_COLORS[plan] || 'default'}>{PLAN_NAMES[plan] || plan}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: string) => (
        <Badge status={s === 'ACTIVE' ? 'success' : 'error'} text={s === 'ACTIVE' ? '启用' : '禁用'} />
      ),
    },
    {
      title: '门店',
      dataIndex: 'storeCount',
      key: 'storeCount',
      width: 70,
      render: (v: number) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '用户',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 70,
    },
    {
      title: '试用到期',
      dataIndex: 'trialEndsAt',
      key: 'trialEndsAt',
      width: 110,
      render: (d: string | null) => d ? new Date(d).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d: string) => new Date(d).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: TenantItem) => (
        <Space>
          <Button size="small" icon={<SwapOutlined />}
            onClick={() => { setPlanModalTenantId(record.id); setNewPlan(record.plan); setPlanModalVisible(true); }}>
            变更套餐
          </Button>
          <Button size="small" icon={<BarChartOutlined />}
            onClick={() => showUsage(record.id)}>用量
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>🏢 租户管理</h2>
          <Space>
            <Input.Search
              placeholder="搜索租户名/子域名/邮箱"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={q => { setSearch(q); fetchTenants(1, pagination.pageSize, q); }}
              style={{ width: 280 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchTenants(pagination.current, pagination.pageSize, search)} />
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={tenants}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 个租户`,
          }}
          onChange={pag => fetchTenants(pag.current, pag.pageSize, search)}
        />
      </Card>

      {/* 租户详情弹窗 */}
      <Modal title="租户详情" open={detailVisible}
        onCancel={() => setDetailVisible(false)} footer={null} width={640}>
        {detailLoading ? <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div> :
          detailData && (
            <div>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="租户名称">{detailData.name}</Descriptions.Item>
                <Descriptions.Item label="子域名">{detailData.subdomain}</Descriptions.Item>
                <Descriptions.Item label="套餐">
                  <Tag color={PLAN_COLORS[detailData.plan]}>{PLAN_NAMES[detailData.plan]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Badge status={detailData.status === 'ACTIVE' ? 'success' : 'error'} text={detailData.status === 'ACTIVE' ? '启用' : '禁用'} />
                </Descriptions.Item>
                <Descriptions.Item label="试用到期">{detailData.trialEndsAt ? new Date(detailData.trialEndsAt).toLocaleDateString('zh-CN') : '-'}</Descriptions.Item>
                <Descriptions.Item label="联系邮箱">{detailData.contactEmail || '-'}</Descriptions.Item>
                <Descriptions.Item label="门店数">{detailData.storeCount}</Descriptions.Item>
                <Descriptions.Item label="用户数">{detailData.userCount}</Descriptions.Item>
              </Descriptions>

              <h4 style={{ marginTop: 20, marginBottom: 8 }}>门店列表</h4>
              {detailData.stores.length === 0 ? <div style={{ color: '#999', fontSize: 13 }}>暂无门店</div> :
                <Table dataSource={detailData.stores} rowKey="id" pagination={false} size="small"
                  columns={[
                    { title: '门店名称', dataIndex: 'name', key: 'name' },
                    { title: '标识', dataIndex: 'slug', key: 'slug', width: 130 },
                    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
                    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: (d: string) => new Date(d).toLocaleDateString('zh-CN') },
                  ]} />
              }

              <h4 style={{ marginTop: 16, marginBottom: 8 }}>用户列表</h4>
              {detailData.userTenants.length === 0 ? <div style={{ color: '#999', fontSize: 13 }}>暂无用户</div> :
                <Table dataSource={detailData.userTenants} rowKey={r => r.user.id} pagination={false} size="small"
                  columns={[
                    { title: '邮箱', dataIndex: ['user', 'email'], key: 'email' },
                    { title: '姓名', dataIndex: ['user', 'fullName'], key: 'fullName' },
                    { title: '角色', dataIndex: 'role', key: 'role', width: 80 },
                    { title: '状态', dataIndex: ['user', 'status'], key: 'status', width: 70 },
                  ]} />
              }
            </div>
          )
        }
      </Modal>

      {/* 用量统计弹窗 */}
      <Modal title="📊 用量统计" open={usageVisible}
        onCancel={() => setUsageVisible(false)} footer={null} width={480}>
        {usageLoading ? <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div> :
          usageData && (
            <div>
              <Tag color={PLAN_COLORS[usageData.plan]} style={{ marginBottom: 16, fontSize: 13 }}>
                {PLAN_NAMES[usageData.plan]}
              </Tag>
              {usageData.trialEndsAt && (
                <span style={{ fontSize: 13, color: '#888', marginLeft: 8 }}>
                  试用到期: {new Date(usageData.trialEndsAt).toLocaleDateString('zh-CN')}
                </span>
              )}
              <Row gutter={[16, 16]}>
                {Object.entries(usageData.usage).map(([key, val]: [string, any]) => (
                  <Col span={12} key={key}>
                    <Card size="small">
                      <Statistic
                        title={{ stores: '门店', printers: '打印机', menuItems: '菜品', tables: '桌台' }[key] || key}
                        value={val.current}
                        suffix={`/ ${val.limit}`}
                        valueStyle={{ fontSize: 22, color: val.limit !== '无限制' && val.current >= val.limit ? '#ff4d4f' : '#333' }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
              <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                数据留存: {usageData.dataRetentionDays} 天
              </div>
            </div>
          )
        }
      </Modal>

      {/* 变更套餐弹窗 */}
      <Modal title="变更套餐" open={planModalVisible}
        onCancel={() => setPlanModalVisible(false)}
        onOk={handleChangePlan} confirmLoading={planModalLoading}
        okText="确认变更">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>选择新套餐</div>
          <Select value={newPlan} onChange={v => setNewPlan(v)} style={{ width: '100%' }}>
            {Object.entries(PLAN_NAMES).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
        </div>
        <div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>延长试用期（可选）</div>
          <InputNumber min={0} max={365} value={extendDays}
            onChange={v => setExtendDays(v || 0)}
            style={{ width: '100%' }}
            addonAfter="天"
            placeholder="0 表示不延长"
          />
        </div>
      </Modal>
    </div>
  );
};

export default TenantManagementPage;
