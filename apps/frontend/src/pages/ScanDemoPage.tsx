import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../config/routes';

const DEMO_SCAN_URL = 'https://saas.openyun.xin/t/qilin-test/s/qilin-test-restaurant/scan/A01';
const QR_API_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(DEMO_SCAN_URL)}`;

/* ───── 公用素材 ───── */
const BRAND_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '40px 16px',
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  tabs: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 32,
  },
};

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '10px 28px',
    borderRadius: 24,
    border: active ? 'none' : '1px solid #ddd',
    background: active ? BRAND_GRADIENT : 'white',
    color: active ? 'white' : '#666',
    fontSize: 15,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };
}

/* ─── QR 码图片组件（使用 qrserver.com 公共 API） ─── */
function QRCode({ url, size = 200 }: { url: string; size?: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`}
        alt="扫码体验"
        width={size}
        height={size}
        style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: '100%' }}
      />
    </div>
  );
}

/* ════════════════════════════════════════
   版本 A：场景流程型（竖屏卡片链路）
   ════════════════════════════════════════ */
function VersionA() {
  return (
    <div style={{
      background: 'white', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      padding: '40px 32px', maxWidth: 480, margin: '0 auto',
    }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 700, background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📱 扫码点餐
        </div>
        <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>一次完整的数字化就餐体验</div>
      </div>

      {/* 流程步骤 */}
      {[
        { emoji: '📷', title: '① 顾客扫码', desc: '落座后扫描桌上二维码，进入点餐页面', color: '#667eea' },
        { emoji: '🛒', title: '② 手机点餐', desc: '浏览菜品，加购下单，支持多口味选择', color: '#5b8def' },
        { emoji: '🖨️', title: '③ 云打印出单', desc: '订单自动发送到后厨打印机，无需人工传单', color: '#764ba2' },
        { emoji: '📊', title: '④ 后台管理', desc: '订单管理、菜品编辑、数据统计，一部手机搞定', color: '#667eea' },
      ].map((step, i) => (
        <div key={i} style={{
          display: 'flex', gap: 16, alignItems: 'flex-start',
          padding: '16px 0', borderBottom: i < 3 ? '1px dashed #eee' : 'none',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: `${step.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {step.emoji}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#2d2d2d' }}>{step.title}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{step.desc}</div>
          </div>
        </div>
      ))}

      {/* 分隔 */}
      <div style={{ margin: '24px 0', textAlign: 'center', color: '#ccc', fontSize: 13 }}>— 扫码体验 —</div>

      {/* 二维码 */}
      <QRCode url={DEMO_SCAN_URL} size={180} />

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#999' }}>
        用微信扫一扫，体验完整点餐流程
      </div>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: '#ccc' }}>
        测试餐厅 · 桌号 A01
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   版本 B：信息看板型（横屏面板布局）
   ════════════════════════════════════════ */
function VersionB() {
  return (
    <div style={{
      background: 'white', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      padding: '36px 32px', maxWidth: 800, margin: '0 auto',
    }}>
      {/* 大标题 */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-block', fontSize: 13, color: '#667eea',
          background: '#f0f2ff', padding: '4px 14px', borderRadius: 20, marginBottom: 8,
        }}>
          🚀 数字化餐饮管理系统
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e' }}>
          麒麟云点餐
        </div>
        <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>
          扫码点餐 · 云打印 · 后台管理 一站式解决
        </div>
      </div>

      {/* 功能卡片网格 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        marginBottom: 28,
      }}>
        {[
          { emoji: '📷', title: '扫码即点', desc: '顾客扫码点餐\n无需下载App', color: '#667eea' },
          { emoji: '🖨️', title: '云打印', desc: '后厨自动出单\n支持多品牌打印机', color: '#764ba2' },
          { emoji: '📊', title: '数据看板', desc: '实时营业数据\n菜品销量统计', color: '#ff6b35' },
          { emoji: '🔧', title: '后台管理', desc: '菜品编辑上架\n订单管理/多店管理', color: '#00c853' },
          { emoji: '🛒', title: '在线点餐', desc: '购物车/备注\n多种支付方式', color: '#2196f3' },
          { emoji: '🏪', title: '多店管理', desc: '一个账号管理\n多家门店', color: '#e91e63' },
        ].map((card, i) => (
          <div key={i} style={{
            background: '#f8f9ff', borderRadius: 14, padding: '16px 14px',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{card.emoji}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#2d2d2d' }}>{card.title}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2, whiteSpace: 'pre-line' }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* 分隔 + 二维码 + CTA */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          position: 'relative', display: 'inline-block',
          background: '#f0f2ff', borderRadius: 16, padding: '20px 28px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: '#667eea', marginBottom: 12, fontWeight: 500 }}>
            📲 扫描二维码体验点餐
          </div>
          <QRCode url={DEMO_SCAN_URL} size={160} />
          <div style={{ marginTop: 8, fontSize: 11, color: '#aaa' }}>
            麒麟测试餐厅 · 桌号 A01
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
          用微信扫一扫 → 选菜加购 → 提交订单 → 后厨出单
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   主页面：Tab 切换两个版本
   ════════════════════════════════════════ */
const ScanDemoPage: React.FC = () => {
  const [tab, setTab] = useState<'A' | 'B'>('A');

  const containerStyle: React.CSSProperties = {
    ...styles.page,
  };

  return (
    <div style={containerStyle}>
      <div style={styles.inner}>
        {/* 切换 Tab */}
        <div style={styles.tabs}>
          <button onClick={() => setTab('A')} style={tabBtnStyle(tab === 'A')}>
            版本 A · 场景流程
          </button>
          <button onClick={() => setTab('B')} style={tabBtnStyle(tab === 'B')}>
            版本 B · 信息看板
          </button>
        </div>

        {/* 渲染选中的版本 */}
        {tab === 'A' ? <VersionA /> : <VersionB />}

        {/* 底部返回 */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/" style={{ color: '#667eea', textDecoration: 'none', fontSize: 14 }}>
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ScanDemoPage;
