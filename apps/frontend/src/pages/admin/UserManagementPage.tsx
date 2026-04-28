import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Select, Input, Tag, message, Space, Popconfirm, Form, InputNumber } from 'antd';
import { UserAddOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { apiGet, apiPost } from '../../utils/api-client';
import { API_ENDPOINTS } from '../../config/api-routes';

interface StoreOption {
  id: string;
  name: string;
  slug: string;
}

interface StoreAssignment {
  id: string;
  storeId: string;
  role: string;
  status: string;
  store: { id: string; name: string; slug: string };
}

interface User {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  role: string;
  derivedRole?: string; // 后端推导的真实角色
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  storeAssignments: StoreAssignment[];
}

/** 将 UTC 时间转为上海时区字符串 */
function toLocal(utcStr: string | null): string {
  if (!utcStr) return '-';
  return new Date(utcStr).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleStats, setRoleStats] = useState<Record<string, number>>({});
  // 0=全部, 1=SUPER_ADMIN, 2=TENANT_ADMIN, 3=USER… 用角色名直接存储
  const [activeRole, setActiveRole] = useState('');
  const pageSize = 15;

  const ROLES = [
    { key: '', label: '全部', color: '#666' },
    { key: 'SUPER_ADMIN', label: '超管', color: '#f5222d' },
    { key: 'TENANT_ADMIN', label: '租管', color: '#1890ff' },
    { key: 'STORE_ADMIN', label: '店长', color: '#52c41a' },
    { key: 'USER', label: '用户', color: '#999' },
  ];

  // 设为店长弹窗
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);

  // 创建用户弹窗
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadUsers();
  }, [page, debouncedSearch, activeRole]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (activeRole) params.set('role', activeRole);
      const json = await apiGet(`${API_ENDPOINTS.USERS.LIST}?${params}`);
      setUsers(json?.data || []);
      setTotal(json?.total || 0);
      if (json?.roleStats) setRoleStats(json.roleStats);
    } catch (err: any) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }

  const openStoreModal = async (user: User) => {
    setSelectedUser(user);
    setSelectedStoreId(null);
    setStoreModalVisible(true);
    // 加载店铺列表
    setStoreLoading(true);
    try {
      const json = await apiGet(API_ENDPOINTS.USERS.LIST.replace('/users', '/stores/select'));
      // 尝试 stores/select 端点
      const res = await apiGet(API_ENDPOINTS.STORES_SELECT + '?limit=100');
      setStores(res?.data || []);
    } catch {
      setStores([]);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleSetStoreAdmin = async () => {
    if (!selectedUser || !selectedStoreId) {
      message.warning('请选择店铺');
      return;
    }
    try {
      const json = await apiPost(API_ENDPOINTS.USERS.SET_STORE_ADMIN(selectedUser.id), { storeId: selectedStoreId });
      if (json?.success) {
        message.success('店长授权成功！该用户下次登录即可使用店长端');
        setStoreModalVisible(false);
        loadUsers();
      } else {
        message.error(json?.error || '授权失败');
      }
    } catch (err: any) {
      message.error('授权失败: ' + (err.message || ''));
    }
  };

  const handleRemoveStoreAdmin = async (userId: string, storeId: string, storeName: string) => {
    try {
      const json = await apiPost(API_ENDPOINTS.USERS.REMOVE_STORE_ADMIN(userId), { storeId });
      if (json?.success) {
        message.success(`已移除 ${storeName} 的店长权限`);
        loadUsers();
      } else {
        message.error(json?.error || '移除失败');
      }
    } catch (err: any) {
      message.error('移除失败: ' + (err.message || ''));
    }
  };

  const handleCreateUser = async (values: any) => {
    setCreateLoading(true);
    try {
      const json = await apiPost(API_ENDPOINTS.USERS.CREATE, values, { skipAuth: false });
      if (json?.success) {
        message.success('用户创建成功');
        setCreateModalVisible(false);
        createForm.resetFields();
        loadUsers();
      } else {
        message.error(json?.error || '创建失败');
      }
    } catch (err: any) {
      message.error('创建失败: ' + (err.message || ''));
    } finally {
      setCreateLoading(false);
    }
  };

  const roleBadge = (role: string, derivedRole?: string) => {
    const effectiveRole = derivedRole || role;
    const map: Record<string, { color: string; label: string }> = {
      SUPER_ADMIN: { color: 'red', label: '超管' },
      TENANT_ADMIN: { color: 'blue', label: '租管' },
      STORE_ADMIN: { color: 'green', label: '店长' },
      USER: { color: 'default', label: '用户' },
    };
    const info = map[effectiveRole] || { color: 'default', label: effectiveRole };
    return <Tag color={info.color}>{info.label}</Tag>;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'green',
      INACTIVE: 'orange',
      SUSPENDED: 'red',
    };
    return <Tag color={colors[status] || 'default'}>{status}</Tag>;
  };

  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: '姓名',
      key: 'name',
      width: 120,
      render: (_: any, row: User) => row.fullName || row.username || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 80,
      render: (role: string, row: User) => roleBadge(role, row.derivedRole),
    },
    {
      title: '密码',
      dataIndex: 'rawPassword',
      key: 'rawPassword',
      width: 130,
      render: (pwd: string) => pwd ? <span style={{ fontFamily: 'monospace', color: '#059669' }}>{pwd}</span> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: string) => statusBadge(s),
    },
    {
      title: '店长授权',
      key: 'stores',
      width: 300,
      render: (_: any, row: User) => {
        const activeAssignments = row.storeAssignments?.filter(a => a.status === 'ACTIVE') || [];
        if (activeAssignments.length === 0) return <span className="text-gray-400">未授权</span>;
        return (
          <Space size={[4, 4]} wrap>
            {activeAssignments.map(a => (
              <Tag key={a.id} color="orange" closable
                onClose={(e) => {
                  e.preventDefault();
                  handleRemoveStoreAdmin(row.id, a.storeId, a.store.name);
                }}
              >
                {a.store.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (v: string | null) => toLocal(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, row: User) => (
        <Button type="link" icon={<UserAddOutlined />}
          onClick={() => openStoreModal(row)}
          disabled={row.derivedRole === 'SUPER_ADMIN' || row.derivedRole === 'STORE_ADMIN'}
        >
          {row.derivedRole === 'STORE_ADMIN' ? '已是店长' : '设为店长'}
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">👤 用户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateModalVisible(true); }}>
          创建用户
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="搜索邮箱、用户名..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </div>

      {/* 角色分类标签栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {ROLES.map(r => {
          const count = r.key === '' ? (Object.values(roleStats).reduce((a, b) => a + b, 0) || 0) : (roleStats[r.key] || 0);
          const isActive = activeRole === r.key;
          return (
            <button
              key={r.key}
              onClick={() => {
                setActiveRole(r.key);
                setPage(1);
              }}
              style={{
                padding: '5px 14px',
                border: isActive ? `2px solid ${r.color}` : '1px solid #e5e7eb',
                borderRadius: 20,
                background: isActive ? `${r.color}15` : '#f9fafb',
                color: isActive ? r.color : '#666',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              }}>
              {r.label} <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>
            </button>
          );
        })}
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: p => setPage(p),
          showTotal: t => `共 ${t} 条`,
        }}
        size="middle"
      />

      {/* 设为店长弹窗 */}
      <Modal
        title={`设为店长 - ${selectedUser?.email || ''}`}
        open={storeModalVisible}
        onOk={handleSetStoreAdmin}
        onCancel={() => setStoreModalVisible(false)}
        okText="确认授权"
        cancelText="取消"
      >
        <p className="mb-3 text-gray-500 text-sm">
          选择一个店铺，授权该用户成为店长
        </p>
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="请选择店铺"
          loading={storeLoading}
          value={selectedStoreId}
          onChange={setSelectedStoreId}
          filterOption={(input, option) =>
            (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
          }
          options={stores.map(s => ({ label: `${s.name} (${s.slug})`, value: s.id }))}
          notFoundContent="暂无可用店铺"
        />
        <p className="mt-2 text-xs text-gray-400">
          授权后，该用户访问 /store-admin/login 即可进入店长端
        </p>
      </Modal>

      {/* 创建用户弹窗 */}
      <Modal
        title="创建用户"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item name="email" label="邮箱" rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}>
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' },
          ]}>
            <Input.Password placeholder="设置密码" />
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input placeholder="选填，默认取邮箱前缀" />
          </Form.Item>
          <Form.Item name="fullName" label="姓名">
            <Input placeholder="选填，如：张三" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="USER">
            <Select>
              <Select.Option value="USER">普通用户</Select.Option>
              <Select.Option value="TENANT_ADMIN">租户管理员</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
