import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Card,
  Row,
  Col,
  TimePicker,
  Switch,
  Tag,
  message,
  Space,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { Store, StoreRequest, BusinessHours, STORE_TYPE_OPTIONS } from '../types';
import * as storeUtils from '../utils/store.utils';
import * as apiUtils from '../utils/api.utils';

const { TextArea } = Input;
const { Option } = Select;

interface StoreFormProps {
  initialValues?: Partial<Store>;
  onSubmit: (values: StoreRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

const StoreForm: React.FC<StoreFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [logoUrl, setLogoUrl] = useState<string | undefined>(initialValues?.logoUrl);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    initialValues?.coverImageUrl,
  );
  const [uploading, setUploading] = useState(false);

  // 初始化表单值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        // 处理营业时间
        businessHours: initialValues.businessHours || getDefaultBusinessHours(),
      });
      setLogoUrl(initialValues.logoUrl);
      setCoverImageUrl(initialValues.coverImageUrl);
    } else {
      // 设置默认值
      form.setFieldsValue({
        status: 'ACTIVE',
        type: 'RESTAURANT',
        businessHours: getDefaultBusinessHours(),
      });
    }
  }, [initialValues, form]);

  // 获取默认营业时间
  const getDefaultBusinessHours = (): BusinessHours[] => {
    return Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index,
      openTime: '09:00',
      closeTime: '22:00',
      isOpen: index !== 0, // 周日默认休息
    }));
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      // 转换营业时间格式
      const businessHours: BusinessHours[] = values.businessHours.map((hour: any) => ({
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime.format('HH:mm'),
        closeTime: hour.closeTime.format('HH:mm'),
        isOpen: hour.isOpen,
      }));

      const storeData: StoreRequest = {
        name: values.name,
        description: values.description,
        type: values.type,
        status: values.status,
        logoUrl,
        coverImageUrl,
        address: values.address,
        phone: values.phone,
        email: values.email,
        website: values.website,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        averagePrice: values.averagePrice ? Number(values.averagePrice) : undefined,
        businessHours,
      };

      await onSubmit(storeData);
    } catch (error) {
      console.error('表单提交失败:', error);
      // 错误处理在父组件中
    }
  };

  // 处理图片上传
  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await apiUtils.uploadStoreImage(file);
      setLogoUrl(result.url);
      message.success('Logo上传成功');
    } catch (error) {
      console.error('Logo上传失败:', error);
      message.error('Logo上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理封面图上传
  const handleCoverUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await apiUtils.uploadStoreImage(file);
      setCoverImageUrl(result.url);
      message.success('封面图上传成功');
    } catch (error) {
      console.error('封面图上传失败:', error);
      message.error('封面图上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  // 删除Logo
  const handleDeleteLogo = () => {
    setLogoUrl(undefined);
  };

  // 删除封面图
  const handleDeleteCover = () => {
    setCoverImageUrl(undefined);
  };

  // 验证手机号码
  const validatePhone = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    if (storeUtils.validatePhone(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('请输入有效的手机号码'));
  };

  // 验证邮箱
  const validateEmail = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    if (storeUtils.validateEmail(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('请输入有效的邮箱地址'));
  };

  // 验证URL
  const validateUrl = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    if (storeUtils.validateUrl(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('请输入有效的URL地址'));
  };

  // 验证数字
  const validateNumber = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    if (!isNaN(Number(value)) && Number(value) > 0) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('请输入有效的数字'));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues}
      size="large"
    >
      <Row gutter={24}>
        {/* 左侧：基本信息 */}
        <Col span={16}>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="店铺名称"
                  name="name"
                  rules={[
                    { required: true, message: '请输入店铺名称' },
                    { min: 2, message: '店铺名称至少2个字符' },
                    { max: 50, message: '店铺名称最多50个字符' },
                  ]}
                >
                  <Input placeholder="请输入店铺名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="店铺类型"
                  name="type"
                  rules={[{ required: true, message: '请选择店铺类型' }]}
                >
                  <Select placeholder="请选择店铺类型">
                    {STORE_TYPE_OPTIONS.map(opt => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="店铺描述"
              name="description"
              rules={[{ max: 500, message: '描述最多500个字符' }]}
            >
              <TextArea
                placeholder="请输入店铺描述"
                rows={3}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="联系电话"
                  name="phone"
                  rules={[{ validator: validatePhone }]}
                >
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="邮箱地址"
                  name="email"
                  rules={[{ validator: validateEmail }]}
                >
                  <Input placeholder="请输入邮箱地址" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="店铺地址"
              name="address"
              rules={[{ max: 200, message: '地址最多200个字符' }]}
            >
              <Input placeholder="请输入店铺地址" />
            </Form.Item>

            <Form.Item
              label="网站地址"
              name="website"
              rules={[{ validator: validateUrl }]}
            >
              <Input placeholder="请输入网站地址" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="店铺容量"
                  name="capacity"
                  rules={[{ validator: validateNumber }]}
                >
                  <Input placeholder="请输入店铺容量" suffix="人" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="人均消费"
                  name="averagePrice"
                  rules={[{ validator: validateNumber }]}
                >
                  <Input placeholder="请输入人均消费" prefix="¥" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="店铺状态"
              name="status"
              rules={[{ required: true, message: '请选择店铺状态' }]}
            >
              <Select placeholder="请选择店铺状态">
                <Option value="ACTIVE">
                  <Tag color="green">营业中</Tag>
                </Option>
                <Option value="INACTIVE">
                  <Tag color="gray">已停业</Tag>
                </Option>
                <Option value="MAINTENANCE">
                  <Tag color="orange">维护中</Tag>
                </Option>
                <Option value="CLOSED">
                  <Tag color="red">已关闭</Tag>
                </Option>
              </Select>
            </Form.Item>
          </Card>

          {/* 营业时间配置 */}
          <Card title="营业时间配置" style={{ marginBottom: 24 }}>
            <Form.List name="businessHours">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ marginBottom: 16 }}>
                      <Row gutter={16} align="middle">
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'dayOfWeek']}
                            style={{ marginBottom: 0 }}
                          >
                            <Select disabled>
                              <Option value={0}>周日</Option>
                              <Option value={1}>周一</Option>
                              <Option value={2}>周二</Option>
                              <Option value={3}>周三</Option>
                              <Option value={4}>周四</Option>
                              <Option value={5}>周五</Option>
                              <Option value={6}>周六</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'isOpen']}
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Switch checkedChildren="营业" unCheckedChildren="休息" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'openTime']}
                            style={{ marginBottom: 0 }}
                          >
                            <TimePicker
                              format="HH:mm"
                              placeholder="开始时间"
                              style={{ width: '100%' }}
                              disabled={!form.getFieldValue(['businessHours', name, 'isOpen'])}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'closeTime']}
                            style={{ marginBottom: 0 }}
                          >
                            <TimePicker
                              format="HH:mm"
                              placeholder="结束时间"
                              style={{ width: '100%' }}
                              disabled={!form.getFieldValue(['businessHours', name, 'isOpen'])}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: '#ff4d4f' }}
                          />
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加营业时间
                  </Button>
                </>
              )}
            </Form.List>
          </Card>
        </Col>

        {/* 右侧：图片上传 */}
        <Col span={8}>
          <Card title="店铺Logo" style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              {logoUrl ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={logoUrl}
                    alt="店铺Logo"
                    style={{
                      width: '100%',
                      maxWidth: 200,
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteLogo}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </div>
              ) : (
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleLogoUpload}
                  disabled={uploading}
                >
                  <div
                    style={{
                      width: 200,
                      height: 200,
                      border: '2px dashed #d9d9d9',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      margin: '0 auto',
                    }}
                  >
                    <UploadOutlined style={{ fontSize: 32, color: '#999' }} />
                    <div style={{ marginTop: 8, color: '#666' }}>
                      {uploading ? '上传中...' : '点击上传Logo'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      建议尺寸: 200x200px
                    </div>
                  </div>
                </Upload>
              )}
            </div>
          </Card>

          <Card title="店铺封面图">
            <div style={{ textAlign: 'center' }}>
              {coverImageUrl ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={coverImageUrl}
                    alt="店铺封面"
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteCover}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </div>
              ) : (
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleCoverUpload}
                  disabled={uploading}
                >
                  <div
                    style={{
                      width: '100%',
                      height: 200,
                      border: '2px dashed #d9d9d9',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <UploadOutlined style={{ fontSize: 32, color: '#999' }} />
                    <div style={{ marginTop: 8, color: '#666' }}>
                      {uploading ? '上传中...' : '点击上传封面图'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      建议尺寸: 800x400px
                    </div>
                  </div>
                </Upload>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 表单操作按钮 */}
      <div style={{ textAlign: 'right' }}>
        <Space>
          {onCancel && (
            <Button onClick={onCancel} disabled={loading}>
              取消
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={uploading}
          >
            {initialValues ? '更新店铺' : '创建店铺'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default StoreForm;