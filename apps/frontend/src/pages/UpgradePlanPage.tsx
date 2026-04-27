import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PUBLIC_ROUTES } from '../config/routes';

const PLANS = [
  {
    key: 'SINGLE',
    name: '单店版',
    price: '¥38',
    period: '/月',
    badge: '亲民价',
    badgeColor: '#00c853',
    features: [
      '2台云打印机',
      '90天数据留存',
      '完整数据看板',
      '快速客服支持',
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
      '最多5家门店',
      '不限打印机',
      '完整报表',
      '多店统一管理',
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
      '不限门店',
      '全部功能',
      '品牌域名',
      'API对接',
    ],
  },
];

export default function UpgradePlanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('SINGLE');
  const [submitted, setSubmitted] = useState(false);
  const [contact, setContact] = useState(user?.email || '');

  const currentPlan = (user as any)?.tenant?.plan || 'FREE';

  const handleSubmit = () => {
    // 构造升级申请消息
    const planName = PLANS.find(p => p.key === selectedPlan)?.name || selectedPlan;
    const msg = encodeURIComponent(
      `【套餐升级申请】\n` +
      `用户：${user?.email}\n` +
      `用户名：${user?.username}\n` +
      `当前套餐：免费版\n` +
      `目标套餐：${planName}\n` +
      `联系方式：${contact}\n` +
      `时间：${new Date().toLocaleString('zh-CN')}`
    );

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: '0 20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📨</div>
          <h2 style={{ margin: '0 0 8px', color: '#333' }}>升级申请已提交</h2>
          <p style={{ color: '#666', lineHeight: 1.6 }}>
            请添加微信号 <strong style={{ color: '#7c3aed' }}>cattlesoft</strong><br />
            备注您的邮箱 <strong>{user?.email}</strong><br />
            客服会尽快为您处理升级
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate(PUBLIC_ROUTES.HOME)}
              style={{
                padding: '10px 24px',
                border: '1px solid #7c3aed',
                borderRadius: 6,
                background: '#fff',
                color: '#7c3aed',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              返回首页
            </button>
            <button
              onClick={() => { setSubmitted(false); }}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: 6,
                background: '#7c3aed',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              重新选择
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, color: '#333', margin: '0 0 8px' }}>升级套餐</h1>
        <p style={{ color: '#999', margin: 0 }}>
          当前套餐：<strong>免费版</strong> · 选择适合您的方案
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {PLANS.map(plan => (
          <div
            key={plan.key}
            onClick={() => setSelectedPlan(plan.key)}
            style={{
              background: selectedPlan === plan.key ? '#f8f9ff' : '#fff',
              border: selectedPlan === plan.key ? `2px solid ${plan.badgeColor}` : '1px solid #e8e8e8',
              borderRadius: 12,
              padding: 24,
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              top: -8,
              right: 12,
              background: plan.badgeColor,
              color: '#fff',
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 10,
            }}>
              {plan.badge}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: plan.badgeColor, marginBottom: 16 }}>
              {plan.price}
              <span style={{ fontSize: 11, fontWeight: 400, color: '#999' }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: '#666', lineHeight: 2 }}>
              {plan.features.map((f, i) => (
                <li key={i}>✅ {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#333' }}>
            您的联系方式
          </label>
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="手机号或微信号，方便客服联系您"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{
          padding: 12,
          background: '#fff8f0',
          borderRadius: 8,
          fontSize: 13,
          color: '#666',
          marginBottom: 16,
          lineHeight: 1.8,
        }}>
          <strong style={{ color: '#ff6b35' }}>📌 升级流程</strong><br />
          ① 选择套餐 → ② 填写联系方式 → ③ 添加微信 <strong>cattlesoft</strong><br />
          客服确认后为您开通，当前免费版功能不受影响
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: 6,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          提交升级申请
        </button>
      </div>
    </div>
  );
}
