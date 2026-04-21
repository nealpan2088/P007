import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  message,
  Statistic,
  Tooltip,
  Dropdown,
  Menu,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Store, StoreQueryParams, StoreStatus, StoreType } from './types';
import * as apiUtils from './utils/api.utils';
import * as storeUtils from './utils/store.utils';
import { TENANT_ROUTES } from '../../config/routes';

const { Search } = Input;
const { Option } = Select;

const StoreListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<StoreQueryParams>({
    page: 1,
    pageSize: 10,
  });
  
  // 筛选状态
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<StoreType | undefined>();
  
  // 统计信息
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    closed: 0,
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 并行加载店铺列表和统计信息
      const [storeList, storeStats] = await Promise.all([
        apiUtils.fetchStores(queryParams),
        apiUtils.fetchStoreStats(),
      ]);
      
      setStores(storeList.items);
      setTotal(storeList.total);
      setCurrentPage(storeList.page);
      setPageSize(storeList.pageSize);
      
      setStats({
        total: storeStats.totalStores,
        active: storeStats.activeStores,
        inactive: storeStats.inactiveStores,
        maintenance: storeStats.maintenanceStores,
        closed: storeStats.closedStores,
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败，请稍后重试');
      
      // 使用模拟数据
      setStores(getMockStores());
      setTotal(5);
      setStats({
        total: 5,
        active: 3,
        inactive: 1,
        maintenance: 1,
        closed: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadData();
  }, [queryParams]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    setQueryParams(prev => ({
      ...prev,
      search: value,
      page: 1, // 搜索时回到第一页
    }));
  };

  // 处理状态筛选
  const handleStatusFilter = (value: StoreStatus | undefined) => {
    setStatusFilter(value);
    setQueryParams(prev => ({
      ...prev,
      status: value,
      page: 1,
    }));
  };

  // 处理类型筛选
  const handleTypeFilter = (value: StoreType | undefined) => {
    setTypeFilter(value);
    setQueryParams(prev => ({
      ...prev,
      type: value,
      page: 1,
    }));
  };

  // 处理分页
  const handlePageChange = (page: number, size: number) => {
    setQueryParams(prev => ({
      ...prev,
      page,
      pageSize: size,
    }));
  };

  // 处理表格排序
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setQueryParams(prev => ({
      ...prev,
      sortBy: sorter.field,
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc',
    }));
  };

  // 刷新数据
  const handleRefresh = () => {
    loadData();
  };

  // 导出数据
  const handleExport = async () => {
    try {
      message.loading({ content: '正在导出数据...', key: 'export' });
      const blob = await apiUtils.exportStores(queryParams);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `店铺列表_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      message.success({ content: '导出成功', key: 'export' });
    } catch (error) {
      console.error('导出失败:', error);
      message.error({ content: '导出失败', key: 'export' });
    }
  };

  // 创建新店铺
  const handleCreateStore = () => {
    navigate(TENANT_ROUTES.STORES.CREATE);
  };

  // 查看店铺详情
  const handleViewStore = (storeId: string) => {
    navigate(TENANT_ROUTES.STORES.DETAIL.replace(':storeId', storeId));
  };

  // 编辑店铺
  const handleEditStore = (storeId: string) => {
    navigate(TENANT_ROUTES.STORES.EDIT.replace(':storeId', storeId));
  };

  // 删除店铺
  const handleDeleteStore = async (storeId: string, storeName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除店铺 "${storeName}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await apiUtils.deleteStore(storeId);
          message.success('删除成功');
          loadData(); // 重新加载数据
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败，请稍后重试');
        }
      },
    });
  };

  // 更新店铺状态
  const handleUpdateStatus = async (storeId: string, status: StoreStatus) => {
    try {
      await apiUtils.updateStoreStatus(storeId, status);
      message.success('状态更新成功');
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error('状态更新失败，请稍后重试');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '店铺名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Store) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.logoUrl ? (
            <img
              src={record.logoUrl}
              alt={text}
              style={{ width: 32, height: 32, borderRadius: 4, marginRight: 8 }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
                color: '#999',
                fontSize: 12,
              }}
            >
              店
            </div>
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            {record.description && (
              <div style={{ fontSize: 12, color: '#666' }}>
                {record.description.length > 30
                  ? `${record.description.substring(0, 30)}...`
                  : record.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: StoreType) => storeUtils.getStoreTypeText(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: StoreStatus) => {
        const color = storeUtils.getStoreStatusColor(status);
        const text = storeUtils.getStoreStatusText(status);
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '营业中', value: 'ACTIVE' },
        { text: '已停业', value: 'INACTIVE' },
        { text: '维护中', value: 'MAINTENANCE' },
        { text: '已关闭', value: 'CLOSED' },
      ],
      filteredValue: statusFilter ? [statusFilter] : null,
    },
    {
      title: '联系方式',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone: string) => phone || '-',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 150,
      render: (address: string) =>
        address ? (
          <Tooltip title={address}>
            <span>
              {address.length > 15 ? `${address.substring(0, 15)}...` : address}
            </span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 80,
      render: (capacity: number) => storeUtils.formatCapacity(capacity),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      render: (rating: number) => storeUtils.formatRating(rating),
      sorter: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Store) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="view"
              icon={<EyeOutlined />}
              onClick={() => handleViewStore(record.id)}
            >
              查看详情
            </Menu.Item>
            <Menu.Item
              key="edit"
              icon={<EditOutlined />}
              onClick={() => handleEditStore(record.id)}
            >
              编辑
            </Menu.Item>
            <Menu.Item
              key="delete"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteStore(record.id, record.name)}
            >
              删除
            </Menu.Item>
            <Menu.Divider />
            <Menu.SubMenu title="状态变更">
              <Menu.Item
                key="active"
                onClick={() => handleUpdateStatus(record.id, 'ACTIVE')}
              >
                设为营业中
              </Menu.Item>
              <Menu.Item
                key="inactive"
                onClick={() => handleUpdateStatus(record.id, 'INACTIVE')}
              >
                设为已停业
              </Menu.Item>
              <Menu.Item
                key="maintenance"
                onClick={() => handleUpdateStatus(record.id, 'MAINTENANCE')}
              >
                设为维护中
              </Menu.Item>
              <Menu.Item
                key="closed"
                onClick={() => handleUpdateStatus(record.id, 'CLOSED')}
              >
                设为已关闭
              </Menu.Item>
            </Menu.SubMenu>
          </Menu>
        );

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewStore(record.id)}
            >
              查看
            </Button>
            <Dropdown overlay={menu} trigger={['click']}>
              <Button type="link" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总店铺数"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="营业中"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已停业"
              value={stats.inactive}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="维护中"
              value={stats.maintenance}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已关闭"
              value={stats.closed}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总容量"
              value={stats.total}
              suffix="人"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="搜索店铺名称、地址、联系方式"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col>
            <Select
              placeholder="店铺类型"
              allowClear
              style={{ width: 120 }}
              value={typeFilter}
              onChange={handleTypeFilter}
            >
              <Option value="RESTAURANT">餐厅</Option>
              <Option value="CAFE">咖啡厅</Option>
              <Option value="FAST_FOOD">快餐店</Option>
              <Option value="BAKERY">面包店</Option>
              <Option value="OTHER">其他</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="店铺状态"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <Option value="ACTIVE">营业中</Option>
              <Option value="INACTIVE">已停业</Option>
              <Option value="MAINTENANCE">维护中</Option>
              <Option value="CLOSED">已关闭</Option>
            </Select>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateStore}
              >
                新建店铺
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 店铺表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={stores}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handlePageChange,
            onShowSizeChange: handlePageChange,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

// 模拟数据（用于开发测试）
function getMockStores(): Store[] {
  return [
    {
      id: '1',
      tenantId: 'tenant-1',
      name: '麒麟测试餐厅',
      description: '这是一家测试餐厅，提供各种美食',
      type: 'RESTAURANT',
      status: 'ACTIVE',
      logoUrl: 'https://via.placeholder.com/100',
      coverImageUrl: 'https://via.placeholder.com/800x400',
      address: '北京市朝阳区测试路123号',
      phone: '13800138000',
      email: 'test@qilin.com',
      website: 'https://qilin.com',
      capacity: 50,
      averagePrice: 80,
      rating: 4.5,
      businessHours: [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 0, openTime: '10:00', closeTime: '22:00', isOpen: true },
      ],
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-21T15:00:00Z',
    },
    {
      id: '2',
      tenantId: 'tenant-1',
      name: '星巴克咖啡',
      description: '国际连锁咖啡品牌',
      type: 'CAFE',
      status: 'ACTIVE',
      logoUrl: 'https://via.placeholder.com/100',
      address: '上海市浦东新区测试路456号',
      phone: '13900139000',
      capacity: 30,
      averagePrice: 35,
      rating: 4.2,
      businessHours: [
        { dayOfWeek: 1, openTime: '07:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 2, openTime: '07:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 3, openTime: '07:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 4, openTime: '07:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 5, openTime: '07:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 6, openTime: '08:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00', isOpen: true },
      ],
      createdAt: '2026-03-15T09:00:00Z',
      updatedAt: '2026-04-20T14:00:00Z',
    },
    {
      id: '3',
      tenantId: 'tenant-1',
      name: '肯德基快餐',
      description: '国际快餐连锁品牌',
      type: 'FAST_FOOD',
      status: 'ACTIVE',
      logoUrl: 'https://via.placeholder.com/100',
      address: '广州市天河区测试路789号',
      phone: '13700137000',
      capacity: 60,
      averagePrice: 45,
      rating: 4.0,
      businessHours: [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '24:00', isOpen: true },
        { dayOfWeek: 6, openTime: '08:00', closeTime: '24:00', isOpen: true },
        { dayOfWeek: 0, openTime: '08:00', closeTime: '23:00', isOpen: true },
      ],
      createdAt: '2026-02-20T08:00:00Z',
      updatedAt: '2026-04-19T16:00:00Z',
    },
    {
      id: '4',
      tenantId: 'tenant-1',
      name: '巴黎贝甜面包店',
      description: '专业面包烘焙店',
      type: 'BAKERY',
      status: 'MAINTENANCE',
      logoUrl: 'https://via.placeholder.com/100',
      address: '深圳市南山区测试路101号',
      phone: '13600136000',
      capacity: 20,
      averagePrice: 25,
      rating: 4.3,
      businessHours: [
        { dayOfWeek: 1, openTime: '06:00', closeTime: '21:00', isOpen: true },
        { dayOfWeek: 2, openTime: '06:00', closeTime: '21:00', isOpen: true },
        { dayOfWeek: 3, openTime: '06:00', closeTime: '21:00', isOpen: true },
        { dayOfWeek: 4, openTime: '06:00', closeTime: '21:00', isOpen: true },
        { dayOfWeek: 5, openTime: '06:00', closeTime: '21:00', isOpen: true },
        { dayOfWeek: 6, openTime: '07:00', closeTime: '21:00', isOpen: true },
        { dayOfWeek: 0, openTime: '07:00', closeTime: '20:00', isOpen: true },
      ],
      createdAt: '2026-01-10T07:00:00Z',
      updatedAt: '2026-04-18T10:00:00Z',
    },
    {
      id: '5',
      tenantId: 'tenant-1',
      name: '测试火锅店',
      description: '特色火锅餐厅',
      type: 'RESTAURANT',
      status: 'INACTIVE',
      logoUrl: 'https://via.placeholder.com/100',
      address: '成都市锦江区测试路202号',
      phone: '13500135000',
      capacity: 40,
      averagePrice: 120,
      rating: 4.1,
      businessHours: [
        { dayOfWeek: 1, openTime: '11:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 2, openTime: '11:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 3, openTime: '11:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 4, openTime: '11:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 5, openTime: '11:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 6, openTime: '11:00', closeTime: '23:00', isOpen: true },
        { dayOfWeek: 0, openTime: '11:00', closeTime: '22:00', isOpen: true },
      ],
      createdAt: '2025-12-05T11:00:00Z',
      updatedAt: '2026-04-17T09:00:00Z',
    },
  ];
}

export default StoreListPage;