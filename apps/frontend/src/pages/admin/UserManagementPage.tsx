import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Select, Input, Tag, message, Space, Popconfirm } from 'antd';
import { UserAddOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
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
  const pageSize = 15;

  // 设为店长弹窗
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadUsers();
  }, [page, debouncedSearch]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const json = await apiGet(`${API_ENDPOINTS.USERS.LIST}?${params}`);
      setUsers(json?.data || []);
      setTotal(json?.total || 0);
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
      // 尝试 /api/admin/stores/select
      const res = await apiGet('/api/admin/stores/select?limit=100');
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

  const roleBadge = (role: string) => {
    const map: Record<string, { color: string; label: string }> = {
      SUPER_ADMIN: { color: 'red', label: '超管' },
      TENANT_ADMIN: { color: 'blue', label: '租管' },
      USER: { color: 'default', label: '用户' },
    };
    const info = map[role] || { color: 'default', label: role };
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
      render: (role: string) => roleBadge(role),
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
          disabled={row.role === 'SUPER_ADMIN'}
        >
          设为店长
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">👤 用户管理</h1>
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
    </div>
  );
}
