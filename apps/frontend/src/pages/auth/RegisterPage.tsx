import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PUBLIC_ROUTES } from '../../config/routes';
import './AuthStyles.css';

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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // 邮箱验证
    if (!formData.email.trim()) {
      errors.email = '邮箱地址不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    // 用户名验证
    if (!formData.username.trim()) {
      errors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      errors.username = '用户名至少需要3个字符';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = '用户名只能包含字母、数字和下划线';
    }
    
    // 密码验证
    if (!formData.password) {
      errors.password = '密码不能为空';
    } else if (formData.password.length < 8) {
      errors.password = '密码至少需要8个字符';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = '密码必须包含大小写字母和数字';
    }
    
    // 确认密码验证
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }
    
    // 手机号验证（可选）
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.phone = '请输入有效的手机号码';
    }
    
    // 条款同意验证
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = '请阅读并同意服务条款和隐私政策';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
        // 3秒后自动跳转到登录页面
        setTimeout(() => {
          navigate(PUBLIC_ROUTES.AUTH.LOGIN);
        }, 3000);
      }
    } catch (err) {
      console.error('注册失败:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // 清除该字段的验证错误
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDemoRegistration = () => {
    // 填充演示数据
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
            我们已经向您的邮箱 <strong>{formData.email}</strong> 发送了验证邮件
          </p>
          
          <div className="success-message">
            <p>请检查您的邮箱并点击验证链接激活账户。</p>
            <p>验证后即可登录系统。</p>
          </div>
          
          <div className="success-actions">
            <button
              className="auth-button primary"
              onClick={() => navigate(PUBLIC_ROUTES.AUTH.LOGIN)}
            >
              前往登录
            </button>
            <p className="redirect-hint">
              3秒后自动跳转到登录页面...
            </p>
          </div>
          
          <div className="success-tips">
            <h3>下一步建议：</h3>
            <ul>
              <li>✅ 验证邮箱后登录系统</li>
              <li>✅ 创建您的第一个店铺</li>
              <li>✅ 配置打印机和菜单</li>
              <li>✅ 开始接受顾客订单</li>
            </ul>
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
          <p className="auth-subtitle">创建您的账户，开启智能餐饮管理之旅</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                邮箱地址 *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
                placeholder="请输入您的邮箱"
                disabled={isLoading}
                autoComplete="email"
              />
              {validationErrors.email && (
                <div className="form-error">{validationErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                用户名 *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${validationErrors.username ? 'input-error' : ''}`}
                placeholder="请输入用户名"
                disabled={isLoading}
                autoComplete="username"
              />
              {validationErrors.username && (
                <div className="form-error">{validationErrors.username}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                姓名
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="请输入您的姓名（可选）"
                disabled={isLoading}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                手机号码
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${validationErrors.phone ? 'input-error' : ''}`}
                placeholder="请输入手机号码（可选）"
                disabled={isLoading}
                autoComplete="tel"
              />
              {validationErrors.phone && (
                <div className="form-error">{validationErrors.phone}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                密码 *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                placeholder="至少8位，包含大小写字母和数字"
                disabled={isLoading}
                autoComplete="new-password"
              />
              {validationErrors.password && (
                <div className="form-error">{validationErrors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                确认密码 *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="请再次输入密码"
                disabled={isLoading}
                autoComplete="new-password"
              />
              {validationErrors.confirmPassword && (
                <div className="form-error">{validationErrors.confirmPassword}</div>
              )}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                disabled={isLoading}
                className={`checkbox-input ${validationErrors.agreeToTerms ? 'checkbox-error' : ''}`}
              />
              <span className="checkbox-text">
                我已阅读并同意{' '}
                <Link to={PUBLIC_ROUTES.PUBLIC.TERMS} className="terms-link">
                  服务条款
                </Link>{' '}
                和{' '}
                <Link to={PUBLIC_ROUTES.PUBLIC.PRIVACY} className="terms-link">
                  隐私政策
                </Link>
              </span>
            </label>
            {validationErrors.agreeToTerms && (
              <div className="form-error">{validationErrors.agreeToTerms}</div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
                disabled={isLoading}
                className="checkbox-input"
              />
              <span className="checkbox-text">
                我愿意接收产品更新、优惠信息等营销邮件
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                注册中...
              </>
            ) : (
              '创建账户'
            )}
          </button>

          <div className="demo-section">
            <button
              type="button"
              className="auth-button secondary"
              onClick={handleDemoRegistration}
              disabled={isLoading}
            >
              快速填充演示数据
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            已有账户？{' '}
            <Link to={PUBLIC_ROUTES.AUTH.LOGIN} className="auth-link">
              立即登录
            </Link>
          </p>
          <p className="auth-footer-text">
            或{' '}
            <Link to={PUBLIC_ROUTES.HOME} className="auth-link">
              返回首页
            </Link>
          </p>
        </div>

        <div className="registration-benefits">
          <h3 className="benefits-title">注册即享权益</h3>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h4>14天免费试用</h4>
              <p>完整功能体验，无需绑定信用卡</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🚀</div>
              <h4>快速上线</h4>
              <p>10分钟完成店铺配置，立即开始营业</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📱</div>
              <h4>移动端管理</h4>
              <p>随时随地管理店铺，实时查看订单</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🛡️</div>
              <h4>数据安全</h4>
              <p>企业级数据加密，多重备份保障</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;