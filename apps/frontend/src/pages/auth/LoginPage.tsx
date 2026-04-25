import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PUBLIC_ROUTES, ADMIN_ROUTES } from '../../config/routes';
import './AuthStyles.css';

const LoginPage: React.FC = () => {
  const { login, isLoading, error, user } = useAuth();

  const getRedirectPath = () => {
    if (!user) return ADMIN_ROUTES.ADMIN;
    const role = user.role;
    if (role === 'SUPER_ADMIN') return ADMIN_ROUTES.ADMIN;
    const userData = user as any;
    const tenants = userData.userTenants || [];
    if (tenants.length > 0) {
      const subdomain = tenants[0].subdomain || tenants[0].id;
      return `/t/${subdomain}/dashboard`;
    }
    return PUBLIC_ROUTES.HOME;
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      errors.email = '邮箱地址不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.password) {
      errors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      errors.password = '密码至少需要6个字符';
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
      const success = await login(formData.email, formData.password);
      if (success) {
        // 强制刷新使导航栏等组件重新读取localStorage的token
        window.location.href = getRedirectPath();
      }
    } catch (err) {
      // 错误由useAuth处理
      console.error('登录失败:', err);
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

  const handleDemoLogin = async () => {
    // 演示账号登录
    setFormData({
      email: 'demo@example.com',
      password: 'Demo123!',
      rememberMe: false,
    });
    
    // 等待一下让用户看到填充的数据
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const success = await login('demo@example.com', 'Demo123!');
      if (success) {
        window.location.href = getRedirectPath();
      }
    } catch (err) {
      console.error('演示登录失败:', err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">登录麒麟云点餐</h1>
          <p className="auth-subtitle">欢迎回来，请登录您的账户</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              邮箱地址
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
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">
                密码
              </label>
              <Link to={PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD} className="forgot-password">
                忘记密码？
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
              placeholder="请输入您的密码"
              disabled={isLoading}
              autoComplete="current-password"
            />
            {validationErrors.password && (
              <div className="form-error">{validationErrors.password}</div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
                className="checkbox-input"
              />
              <span className="checkbox-text">记住我</span>
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
                登录中...
              </>
            ) : (
              '登录'
            )}
          </button>

          <div className="demo-login-section">
            <button
              type="button"
              className="auth-button secondary"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              体验演示账号
            </button>
            <p className="demo-hint">
              演示账号: demo@example.com / Demo123!
            </p>
          </div>
        </form>

        <div className="auth-footer">
          <div className="auth-footer-text">
            还没有账户？{' '}
            <Link to={PUBLIC_ROUTES.AUTH.REGISTER} className="auth-link">
              立即注册
            </Link>
          </div>
          <div className="auth-footer-text">
            或{' '}
            <Link to={PUBLIC_ROUTES.HOME} className="auth-link">
              返回首页
            </Link>
          </div>
        </div>

        <div className="auth-features">
          <h3 className="features-title">麒麟云点餐特色功能</h3>
          <ul className="features-list">
            <li>✅ 多店铺统一管理</li>
            <li>✅ 扫码点餐，顾客自助下单</li>
            <li>✅ 云打印，实时订单处理</li>
            <li>✅ 数据分析，智能报表</li>
            <li>✅ 移动端优化，随时随地管理</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;