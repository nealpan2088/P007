import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PUBLIC_ROUTES, ADMIN_ROUTES } from '../../config/routes';
import './AuthStyles.css';

const AdminLoginPage: React.FC = () => {
  const { adminLogin, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.email.trim()) errors.email = '邮箱地址不能为空';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = '请输入有效的邮箱地址';
    if (!formData.password) errors.password = '密码不能为空';
    else if (formData.password.length < 6) errors.password = '密码至少需要6个字符';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const success = await adminLogin(formData.email, formData.password);
    if (success) {
      window.location.href = ADMIN_ROUTES.ADMIN;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">超管登录</h1>
          <p className="auth-subtitle">管理员后台，请使用管理员账号登录</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">邮箱地址</label>
            <input
              type="email" id="email" name="email"
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
              placeholder="请输入管理员邮箱" disabled={isLoading}
              autoComplete="email"
            />
            {validationErrors.email && <div className="form-error">{validationErrors.email}</div>}
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">密码</label>
              <Link to={PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD} className="forgot-password">忘记密码？</Link>
            </div>
            <input
              type="password" id="password" name="password"
              value={formData.password}
              onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
              className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
              placeholder="请输入密码" disabled={isLoading}
              autoComplete="current-password"
            />
            {validationErrors.password && <div className="form-error">{validationErrors.password}</div>}
          </div>

          <button type="submit" className="auth-button primary" disabled={isLoading}>
            {isLoading ? <><span className="spinner"></span>登录中...</> : '超管登录'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/auth/tenant/login" className="auth-link">租户管理员登录 →</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
