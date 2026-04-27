import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthStyles.css';

const API_BASE = '/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setValidationError('请输入邮箱地址');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setValidationError('请输入有效的邮箱地址');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/v1/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || data.message || '请求失败，请稍后重试');
      }
    } catch (err: any) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">邮件已发送</h1>
            <p className="auth-subtitle">如果该邮箱已注册，您将收到一封密码重置邮件</p>
          </div>
          <div className="auth-success-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#7c3aed" opacity="0.1" />
              <path d="M20 32l8 8 16-16" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="auth-email-hint">
            <p>请登录您的邮箱 <strong>{email}</strong> 查看重置邮件</p>
            <p className="hint-text">如未收到，请检查垃圾邮件箱或稍后重试</p>
          </div>
          <div className="auth-footer">
            <Link to="/auth/login" className="auth-link">返回登录</Link>
            <button
              className="auth-button"
              onClick={() => setSent(false)}
              style={{ marginTop: '12px' }}
            >
              重新发送
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">忘记密码</h1>
          <p className="auth-subtitle">输入您的注册邮箱，我们将发送重置链接</p>
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
            <label htmlFor="email" className="form-label">注册邮箱</label>
            <input
              id="email"
              type="email"
              className={`form-input ${validationError ? 'input-error' : ''}`}
              placeholder="请输入注册时使用的邮箱"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) setValidationError('');
              }}
              onBlur={() => validateEmail(email)}
              disabled={loading}
              autoFocus
            />
            {validationError && (
              <span className="field-error">{validationError}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !!validationError}
          >
            {loading ? (
              <span className="auth-loading">
                <span className="loading-spinner" />
                发送中...
              </span>
            ) : (
              '发送重置链接'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/auth/login" className="auth-link">想起密码了？返回登录</Link>
        </div>
      </div>
    </div>
  );
}
