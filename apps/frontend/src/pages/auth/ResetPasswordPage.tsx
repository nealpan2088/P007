import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './AuthStyles.css';

const API_BASE = '/api';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPwdError('请输入新密码');
      return false;
    }
    if (value.length < 6) {
      setPwdError('密码至少需要6个字符');
      return false;
    }
    setPwdError('');
    return true;
  };

  const validateConfirm = (value: string): boolean => {
    if (!value) {
      setConfirmError('请再次输入新密码');
      return false;
    }
    if (value !== password) {
      setConfirmError('两次密码输入不一致');
      return false;
    }
    setConfirmError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPwdValid = validatePassword(password);
    const isConfirmValid = validateConfirm(confirmPassword);
    if (!isPwdValid || !isConfirmValid) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || data.message || '重置失败，链接可能已过期');
      }
    } catch (err: any) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">密码已重置</h1>
            <p className="auth-subtitle">您的密码已成功更新</p>
          </div>
          <div className="auth-success-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#7c3aed" opacity="0.1" />
              <path d="M20 32l8 8 16-16" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="auth-footer">
            <Link to="/auth/login" className="auth-button" style={{ textDecoration: 'none' }}>
              前往登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">无效链接</h1>
            <p className="auth-subtitle">重置密码链接无效，请重新申请</p>
          </div>
          <div className="auth-footer">
            <Link to="/auth/forgot-password" className="auth-button" style={{ textDecoration: 'none' }}>
              重新申请
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">重置密码</h1>
          <p className="auth-subtitle">请输入您的新密码</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 2.5a.75.75 0 11.75.75A.75.75 0 018 3.5zm.75 9.25h-1.5v-6h1.5v6z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password" className="form-label">新密码</label>
            <input
              id="password"
              type="password"
              className={`form-input ${pwdError ? 'input-error' : ''}`}
              placeholder="至少6个字符"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (pwdError) setPwdError('');
              }}
              onBlur={() => validatePassword(password)}
              disabled={loading}
              autoFocus
            />
            {pwdError && <span className="field-error">{pwdError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">确认新密码</label>
            <input
              id="confirmPassword"
              type="password"
              className={`form-input ${confirmError ? 'input-error' : ''}`}
              placeholder="再次输入新密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError('');
              }}
              onBlur={() => validateConfirm(confirmPassword)}
              disabled={loading}
            />
            {confirmError && <span className="field-error">{confirmError}</span>}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !!pwdError || !!confirmError}
          >
            {loading ? (
              <span className="auth-loading">
                <span className="loading-spinner" />
                重置中...
              </span>
            ) : (
              '重置密码'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/auth/login" className="auth-link">返回登录</Link>
        </div>
      </div>
    </div>
  );
}
