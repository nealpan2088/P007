import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  Space,
  message,
  
  Spin,
  Image,
  Divider,
  Statistic,
  Timeline,
} from 'antd';
import {
  EditOutlined,
  ArrowLeftOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  TeamOutlined,
  DollarOutlined,
  StarOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Store } from './types';
import * as storeUtils from './utils/store.utils';
import { apiGet } from '../../utils/api-client';
import { API_ENDPOINTS } from '../../config/api-routes';
import { TENANT_ROUTES } from '../../config/routes';

const StoreDetailPage: React.FC = () => {
  const { tenantSlug, storeId } = useParams<{ tenantSlug: string; storeId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState<Store | null>(null);

  // 加载店铺数据
  useEffect(() => {
    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      
      // 调用API获取店铺详情
      const url = API_ENDPOINTS.TENANT.STORES.DETAIL.replace(':storeId', storeId!) + `?tenantSlug=${encodeURIComponent(tenantSlug || '')}`;
      const res = await apiGet(url);
      setStore(res.data);
    } catch (error) {
      console.error('加载店铺数据失败:', error);
      message.error('加载店铺数据失败，请稍后重试');
      navigate(TENANT_ROUTES.STORES.LIST.replace(':tenantSlug', tenantSlug || ''));
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑
  const handleEdit = () => {
    if (store) {
      navigate(TENANT_ROUTES.STORES.EDIT.replace(':storeId', store.id));
    }
  };

  // 处理返回
  const handleBack = () => {
    navigate(TENANT_ROUTES.STORES.LIST.replace(':tenantSlug', tenantSlug || ''));
  };

  // 生成二维码
  const handleGenerateQrCode = () => {
    if (store) {
      const qrData = storeUtils.generateStoreQrData(store.id);
      message.info(`店铺二维码数据: ${qrData}`);
      // 这里可以添加二维码生成和下载功能
    }
  };

  // 打印店铺信息
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" description="加载店铺数据中..." />
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>未找到店铺信息</p>
        <Button type="primary" onClick={handleBack}>
          返回店铺列表
        </Button>
      </div>
    );
  }

  // 检查店铺当前是否营业
  const isOpenNow = storeUtils.isStoreOpenNow(store.businessHours);
  const statusColor = storeUtils.getStoreStatusColor(store.status);
  const statusText = storeUtils.getStoreStatusText(store.status);
  const typeText = storeUtils.getStoreTypeText(store.type);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={store.name}
        extra={[
          <Button key="back" onClick={handleBack} icon={<ArrowLeftOutlined />}>
            返回
          </Button>,
          <Button key="edit" type="primary" onClick={handleEdit} icon={<EditOutlined />}>
            编辑
          </Button>,
          <Button key="qr" onClick={handleGenerateQrCode} icon={<QrcodeOutlined />}>
            生成二维码
          </Button>,
          <Button key="print" onClick={handlePrint} icon={<PrinterOutlined />}>
            打印
          </Button>,
        ]}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={24}>
        {/* 左侧：店铺基本信息 */}
        <Col span={16}>
          <Card title="店铺信息" style={{ marginBottom: 24 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="店铺名称">{store.name}</Descriptions.Item>
              <Descriptions.Item label="店铺类型">
                <Tag color="blue">{typeText}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="店铺状态">
                <Tag color={statusColor}>{statusText}</Tag>
                {isOpenNow && (
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    <ClockCircleOutlined /> 营业中
                  </Tag>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label="创建时间">
                {new Date(store.createdAt).toLocaleString()}
              </Descriptions.Item>
              
              <Descriptions.Item label="最后更新">
                {new Date(store.updatedAt).toLocaleString()}
              </Descriptions.Item>
              
              <Descriptions.Item label="店铺评分" span={2}>
                {store.rating ? (
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>{storeUtils.formatRating(store.rating)}</span>
                    <span>(5分制)</span>
                  </Space>
                ) : '暂无评分'}
              </Descriptions.Item>
              
              <Descriptions.Item label="店铺描述" span={2}>
                {store.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 联系信息 */}
          <Card title="联系信息" style={{ marginBottom: 24 }}>
            <div>
            </div>
            <Row gutter={16}>
              {store.phone && (
                <Col span={12}>
                  <Descriptions.Item label={<><PhoneOutlined /> 电话</>}>
                    {store.phone}
                  </Descriptions.Item>
                </Col>
              )}
              
              {store.email && (
                <Col span={12}>
                  <Descriptions.Item label={<><MailOutlined /> 邮箱</>}>
                    {store.email}
                  </Descriptions.Item>
                </Col>
              )}
              
              {store.address && (
                <Col span={24}>
                  <Descriptions.Item label={<><EnvironmentOutlined /> 地址</>}>
                    {store.address}
                  </Descriptions.Item>
                </Col>
              )}
              
              {store.website && (
                <Col span={24}>
                  <Descriptions.Item label={<><GlobalOutlined /> 网站</>}>
                    <a href={store.website} target="_blank" rel="noopener noreferrer">
                      {store.website}
                    </a>
                  </Descriptions.Item>
                </Col>
              )}
            </Row>
          </Card>

          {/* 营业时间 */}
          <Card title="营业时间">
            <div>
            </div>
            <Timeline
              items={(store.businessHours || []).map((hour, index) => ({
                key: index,
                color: hour.isOpen ? 'green' : 'red',
                dot: hour.isOpen ? <ClockCircleOutlined /> : null,
                children: (
                  <Space>
                    <strong>{storeUtils.getDayOfWeekName(hour.dayOfWeek)}:</strong>
                    {hour.isOpen ? (
                      <span>{hour.openTime} - {hour.closeTime}</span>
                    ) : (
                      <span style={{ color: '#999' }}>休息</span>
                    )}
                  </Space>
                ),
              }))}
            />
            <div style={{ marginTop: 16 }}>
              <p>
                <strong>营业时间总结:</strong>{' '}
                {storeUtils.formatBusinessHours(store.businessHours)}
              </p>
            </div>
          </Card>
        </Col>

        {/* 右侧：统计信息和图片 */}
        <Col span={8}>
          {/* 店铺Logo */}
          <Card title="店铺Logo" style={{ marginBottom: 24 }}>
            <div>
            </div>
            <div style={{ textAlign: 'center' }}>
              {store.logoUrl ? (
                <Image
                  src={store.logoUrl}
                  alt={store.name}
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 200,
                    height: 200,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    color: '#999',
                    fontSize: 16,
                  }}
                >
                  暂无Logo
                </div>
              )}
            </div>
          </Card>

          {/* 店铺封面图 */}
          {store.coverImageUrl && (
            <Card title="店铺封面" style={{ marginBottom: 24 }}>
              <div>
              </div>
              <Image
                src={store.coverImageUrl}
                alt="店铺封面"
                style={{
                  width: '100%',
                  height: 150,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
            </Card>
          )}

          {/* 统计信息 */}
          <Card title="统计信息">
            <div>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="店铺容量"
                  value={store.capacity || 0}
                  suffix="人"
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="人均消费"
                  value={store.averagePrice || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <div>
              <h4>店铺状态时间线</h4>
              <Timeline
                mode="start"
                items={[
                  { color: 'green', children: `创建时间: ${new Date(store.createdAt).toLocaleDateString()}` },
                  { color: 'blue', children: `最后更新: ${new Date(store.updatedAt).toLocaleDateString()}` },
                  { color: isOpenNow ? 'green' : 'red', children: `当前状态: ${isOpenNow ? '营业中' : '休息中'}` },
                ]}
              />
            </div>
          </Card>

          {/* 快速操作 */}
          <Card title="快速操作" style={{ marginTop: 24 }}>
            <div>
            </div>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                block
                onClick={handleEdit}
                icon={<EditOutlined />}
              >
                编辑店铺信息
              </Button>
              
              <Button
                block
                onClick={handleGenerateQrCode}
                icon={<QrcodeOutlined />}
              >
                生成餐桌二维码
              </Button>
              
              <Button
                block
                onClick={() => navigate(`/menu/${store.id}`)}
                icon={<QrcodeOutlined />}
              >
                扫码点餐测试
              </Button>

              <Button
                block
                type="primary"
                onClick={() => navigate(`/admin/stores/${store.id}/orders`)}
                icon={<OrderedListOutlined />}
              >
                订单管理
              </Button>
              
              <Button
                block
                onClick={handlePrint}
                icon={<PrinterOutlined />}
              >
                打印店铺信息
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StoreDetailPage;