import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PUBLIC_ROUTES } from '../../config/routes';
import './AuthStyles.css';

const PLANS = [
  {
    key: 'FREE',
    name: '免费版',
    price: '¥0',
    period: '/月',
    badge: '14天全功能试用',
    badgeColor: '#667eea',
    features: [
      '✅ 1家门店',
      '✅ 扫码点餐基础功能',
      '✅ 1台云打印机',
      '✅ 30天数据留存',
      '✅ 基础数据看板',
    ],
    limits: [
      '❌ 最多1家门店',
      '❌ 最多1台打印机',
    ],
  },
  {
    key: 'PRO',
    name: '专业版',
    price: '¥199',
    period: '/月',
    badge: '推荐',
    badgeColor: '#ff6b35',
    features: [
      '✅ 最多5家门店',
      '✅ 不限打印机数量',
      '✅ 90天数据留存',
      '✅ 完整数据看板 + 报表',
      '✅ 多店统一管理',
    ],
  },
  {
    key: 'ENTERPRISE',
    name: '企业版',
    price: '¥499',
    period: '/月',
    badge: '连锁首选',
    badgeColor: '#764ba2',
    features: [
      '✅ 不限门店数量',
      '✅ 全部功能',
      '✅ 品牌定制域名',
      '✅ API 接口对接',
      '✅ 专属客户成功经理',
    ],
  },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    marketingConsent: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('FREE');

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.email.trim()) errors.email = '邮箱地址不能为空';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = '请输入有效的邮箱地址';
    if (!formData.username.trim()) errors.username = '用户名不能为空';
    else if (formData.username.length < 3) errors.username = '用户名至少需要3个字符';
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) errors.username = '用户名只能包含字母、数字和下划线';
    if (!formData.password) errors.password = '密码不能为空';
    else if (formData.password.length < 8) errors.password = '密码至少需要8个字符';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) errors.password = '密码必须包含大小写字母和数字';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = '两次输入的密码不一致';
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) errors.phone = '请输入有效的手机号码';
    if (!formData.agreeToTerms) errors.agreeToTerms = '请阅读并同意服务条款和隐私政策';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const userData = {
        email: formData.email,
        username: formData.username,
        fullName: formData.fullName || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
      };
      const success = await register(userData);
      if (success) {
        setRegistrationSuccess(true);
        setTimeout(() => navigate(PUBLIC_ROUTES.AUTH.LOGIN), 3000);
      }
    } catch (err) {
      console.error('注册失败:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleDemoRegistration = () => {
    setFormData({
      email: `demo_${Date.now()}@example.com`,
      username: `demo_user_${Date.now().toString().slice(-4)}`,
      fullName: '演示用户',
      phone: '13800138000',
      password: 'Demo123!',
      confirmPassword: 'Demo123!',
      agreeToTerms: true,
      marketingConsent: false,
    });
  };

  if (registrationSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card success-card">
          <div className="success-icon">🎉</div>
          <h1 className="auth-title">注册成功！</h1>
          <p className="auth-subtitle">
            欢迎加入麒麟云点餐，<strong>{formData.email}</strong>
          </p>
          <div className="success-message" style={{ background: '#f0f5ff', padding: 16, borderRadius: 8, margin: '16px 0' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#667eea' }}>🎁 已为您开通 14 天全功能免费试用</p>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#666' }}>
              包含 1 家门店 + 1 台云打印机，试用期内无任何限制
            </p>
          </div>
          <div className="success-actions">
            <button className="auth-button primary" onClick={() => navigate(PUBLIC_ROUTES.AUTH.LOGIN)}>前往登录</button>
            <p className="redirect-hint" style={{ fontSize: 12, color: '#999', marginTop: 8 }}>3秒后自动跳转...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">注册麒麟云点餐</h1>
          <p className="auth-subtitle">免费注册 · 14天全功能试用 · 无需绑定信用卡</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 套餐选择 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#333' }}>选择套餐方案</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}>
            {PLANS.map(plan => (
              <div
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                style={{
                  padding: '14px 10px',
                  borderRadius: 10,
                  border: selectedPlan === plan.key ? `2px solid ${plan.badgeColor}` : '1px solid #e8e8e8',
                  background: selectedPlan === plan.key ? '#f8f9ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '2px 10px',
                  borderRadius: 8,
                  background: plan.badgeColor,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, margin: '4px 0 2px' }}>{plan.name}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: plan.badgeColor }}>
                  {plan.price}
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#999' }}>{plan.period}</span>
                </div>
              </div>
            ))}
          </div>
          {/* 免费版功能说明 */}
          {selectedPlan === 'FREE' && (
            <div style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: '#f9f9ff',
              fontSize: 13,
              color: '#666',
              lineHeight: 1.8,
            }}>
              <div style={{ fontWeight: 600, color: '#667eea', marginBottom: 4 }}>🎯 免费版包含：</div>
              1家门店 · 扫码点餐 · 1台云打印机 · 30天数据留存 · 基础数据看板
              <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                💡 14天内可体验专业版全部功能，到期后自动降级为免费版
              </div>
            </div>
          )}
          {/* 专业版说明 */}
          {selectedPlan === 'PRO' && (
            <div style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: '#fff8f0',
              fontSize: 13,
              color: '#666',
              lineHeight: 1.8,
            }}>
              <div style={{ fontWeight: 600, color: '#ff6b35', marginBottom: 4 }}>🚀 专业版额外包含：</div>
              最多5家门店 · 不限打印机 · 90天数据留存 · 完整报表 · 多店统一管理
              <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                💡 注册后先使用免费版，后续可在设置中升级
              </div>
            </div>
          )}
          {/* 企业版说明 */}
          {selectedPlan === 'ENTERPRISE' && (
            <div style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: '#f5f0ff',
              fontSize: 13,
              color: '#666',
              lineHeight: 1.8,
            }}>
              <div style={{ fontWeight: 600, color: '#764ba2', marginBottom: 4 }}>🏢 企业版额外包含：</div>
              不限门店 · 全部功能 · 品牌域名 · API对接 · 专属服务经理
              <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                💡 注册后先使用免费版，后续可在设置中升级
              </div>
            </div>
          )}
        </div>

        {/* 注册表单 */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email" className="form-label">邮箱地址 *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
                placeholder="请输入您的邮箱" disabled={isLoading} autoComplete="email" />
              {validationErrors.email && <div className="form-error">{validationErrors.email}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="username" className="form-label">用户名 *</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleChange}
                className={`form-input ${validationErrors.username ? 'input-error' : ''}`}
                placeholder="字母数字下划线，至少3位" disabled={isLoading} autoComplete="username" />
              {validationErrors.username && <div className="form-error">{validationErrors.username}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">姓名</label>
              <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange}
                className="form-input" placeholder="姓名（可选）" disabled={isLoading} autoComplete="name" />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">手机号码</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange}
                className={`form-input ${validationErrors.phone ? 'input-error' : ''}`}
                placeholder="手机号码（可选）" disabled={isLoading} autoComplete="tel" />
              {validationErrors.phone && <div className="form-error">{validationErrors.phone}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">密码 *</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange}
                className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                placeholder="至少8位，包含大小写字母和数字" disabled={isLoading} autoComplete="new-password" />
              {validationErrors.password && <div className="form-error">{validationErrors.password}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">确认密码 *</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword}
                onChange={handleChange} className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="请再次输入密码" disabled={isLoading} autoComplete="new-password" />
              {validationErrors.confirmPassword && <div className="form-error">{validationErrors.confirmPassword}</div>}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange}
                disabled={isLoading} className={`checkbox-input ${validationErrors.agreeToTerms ? 'checkbox-error' : ''}`} />
              <span className="checkbox-text">
                我已阅读并同意{' '}
                <Link to={PUBLIC_ROUTES.PUBLIC.TERMS} className="terms-link">服务条款</Link> 和{' '}
                <Link to={PUBLIC_ROUTES.PUBLIC.PRIVACY} className="terms-link">隐私政策</Link>
              </span>
            </label>
            {validationErrors.agreeToTerms && <div className="form-error">{validationErrors.agreeToTerms}</div>}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" name="marketingConsent" checked={formData.marketingConsent}
                onChange={handleChange} disabled={isLoading} className="checkbox-input" />
              <span className="checkbox-text">我愿意接收产品更新、优惠信息等营销邮件</span>
            </label>
          </div>

          <button type="submit" className="auth-button primary" disabled={isLoading}>
            {isLoading ? <><span className="spinner"></span>注册中...</> : '免费创建账户'}
          </button>

          <div className="demo-section">
            <button type="button" className="auth-button secondary" onClick={handleDemoRegistration} disabled={isLoading}>
              快速填充演示数据
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <div className="auth-footer-text">
            已有账户？ <Link to={PUBLIC_ROUTES.AUTH.LOGIN} className="auth-link">立即登录</Link>
          </div>
          <div className="auth-footer-text">
            或 <Link to={PUBLIC_ROUTES.HOME} className="auth-link">返回首页</Link>
          </div>
        </div>

        {/* 套餐对比表 */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>📋 套餐功能对比</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
            gap: 0,
            fontSize: 13,
            border: '1px solid #e8e8e8',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            {/* 表头 */}
            {['功能', '免费版', '专业版', '企业版'].map((h, i) => (
              <div key={i} style={{
                padding: '10px 8px',
                fontWeight: 700,
                background: '#f8f9ff',
                borderBottom: '1px solid #e8e8e8',
                textAlign: 'center',
                color: i === 0 ? '#333' : (i === 1 ? '#667eea' : i === 2 ? '#ff6b35' : '#764ba2'),
              }}>{h}</div>
            ))}
            {/* 行数据 */}
            {[
              ['门店数量', '1家', '5家', '不限'],
              ['云打印机', '1台', '不限', '不限'],
              ['数据留存', '30天', '90天', '永久'],
              ['数据看板', '基础', '完整报表', '完整+API'],
              ['多店管理', '✗', '✓', '✓'],
              ['品牌定制', '✗', '✗', '✓'],
              ['专属服务', '✗', '✗', '✓'],
            ].map((row, ri) => (
              row.map((cell, ci) => (
                <div key={`${ri}-${ci}`} style={{
                  padding: '8px',
                  borderBottom: ri < 6 ? '1px solid #f0f0f0' : 'none',
                  textAlign: ci === 0 ? 'left' : 'center',
                  background: ri % 2 === 0 ? '#fafafa' : '#fff',
                  fontWeight: ci === 0 ? 500 : 400,
                  color: ci === 0 ? '#555' : '#333',
                  paddingLeft: ci === 0 ? 12 : 8,
                }}>{cell}</div>
              ))
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
