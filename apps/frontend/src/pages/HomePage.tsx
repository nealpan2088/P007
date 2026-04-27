/* eslint-disable react/no-unescaped-entities */
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SCAN_ROUTES from '../config/scan-routes';

/* ===================== 内联样式（避免破坏现有 CSS） ===================== */
const styles = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    color: '#1a1a2e',
    overflow: 'auto' as const,
  },

  /* ─── Nav ─── */
  nav: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0,
    height: 64,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a2e',
    textDecoration: 'none',
  },
  navLogoDot: {
    width: 10, height: 10,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    fontSize: 14,
    color: '#555',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  navCta: {
    padding: '8px 20px',
    borderRadius: 20,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textDecoration: 'none',
  },

  /* ─── Hero ─── */
  hero: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px 60px',
    background: 'linear-gradient(135deg, #f5f7ff 0%, #fff0f5 50%, #f0f4ff 100%)',
    position: 'relative',
    overflow: 'hidden',
  } as React.CSSProperties,
  heroBg: {
    position: 'absolute' as const,
    top: '10%', left: '5%',
    width: 500, height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(102,126,234,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  } as React.CSSProperties,
  heroBg2: {
    position: 'absolute' as const,
    bottom: '5%', right: '10%',
    width: 400, height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(118,75,162,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  } as React.CSSProperties,
  heroContent: {
    textAlign: 'center' as const,
    maxWidth: 720,
    position: 'relative' as const,
    zIndex: 1,
  },
  heroBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: 20,
    background: 'linear-gradient(135deg, #667eea20, #764ba220)',
    color: '#667eea',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 24,
    border: '1px solid rgba(102,126,234,0.15)',
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: 800,
    lineHeight: 1.2,
    margin: '0 0 16px',
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #667eea 50%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666',
    lineHeight: 1.7,
    margin: '0 0 40px',
  },
  heroActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  heroBtnPrimary: {
    padding: '14px 36px',
    borderRadius: 30,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
  },
  heroBtnSecondary: {
    padding: '14px 36px',
    borderRadius: 30,
    background: '#fff',
    color: '#667eea',
    fontSize: 16,
    fontWeight: 600,
    border: '2px solid #667eea',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  /* ─── Sections ─── */
  section: {
    padding: '100px 24px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 700,
    textAlign: 'center' as const,
    margin: '0 0 12px',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center' as const,
    margin: '0 0 60px',
  },

  /* ─── Features Grid ─── */
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 24,
  },
  featureCard: {
    padding: '32px 28px',
    borderRadius: 16,
    background: '#fff',
    border: '1px solid #f0f0f5',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  },
  featureIcon: {
    width: 52, height: 52,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 8px',
  },
  featureDesc: {
    fontSize: 14,
    color: '#888',
    lineHeight: 1.7,
    margin: 0,
  },

  /* ─── Screenshots / Mockup ─── */
  mockupSection: {
    background: '#f8f9ff',
    padding: '100px 24px',
    textAlign: 'center' as const,
  },
  mockupContainer: {
    maxWidth: 1000,
    margin: '0 auto',
  },
  mockupImage: {
    width: '100%',
    maxWidth: 800,
    borderRadius: 16,
    border: '1px solid #e8e8f0',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    marginTop: 40,
  },

  /* ─── Pricing ─── */
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
    maxWidth: 1000,
    margin: '0 auto',
  },
  pricingCard: {
    padding: '40px 28px',
    borderRadius: 16,
    background: '#fff',
    border: '1px solid #f0f0f5',
    textAlign: 'center' as const,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  pricingPopular: {
    border: '2px solid #667eea',
    position: 'relative' as const,
    boxShadow: '0 8px 30px rgba(102,126,234,0.12)',
  },
  popularBadge: {
    position: 'absolute' as const,
    top: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 16px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
  },
  pricingName: {
    fontSize: 14,
    color: '#888',
    fontWeight: 600,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  pricingPrice: {
    fontSize: 48,
    fontWeight: 800,
    margin: '12px 0',
  },
  pricingPeriod: {
    fontSize: 14,
    color: '#888',
  },
  pricingDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.7,
    margin: '16px 0 24px',
    minHeight: 60,
  },
  pricingFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 32px',
    textAlign: 'left' as const,
  },
  pricingFeature: {
    padding: '8px 0',
    fontSize: 14,
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  pricingBtn: {
    display: 'inline-block',
    padding: '12px 36px',
    borderRadius: 24,
    background: '#f5f5f8',
    color: '#333',
    fontSize: 15,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  pricingBtnPrimary: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(102,126,234,0.25)',
  },

  /* ─── Stats ─── */
  statsBar: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: '60px 24px',
    color: '#fff',
  },
  statsGrid: {
    maxWidth: 1000,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 32,
    textAlign: 'center' as const,
  },
  statNumber: {
    fontSize: 40,
    fontWeight: 800,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
  },

  /* ─── CTA ─── */
  ctaSection: {
    padding: '100px 24px',
    textAlign: 'center' as const,
    background: 'linear-gradient(135deg, #f5f7ff 0%, #fff0f5 100%)',
  },
  ctaTitle: {
    fontSize: 40,
    fontWeight: 800,
    margin: '0 0 16px',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#888',
    margin: '0 0 40px',
    maxWidth: 500,
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  /* ─── Footer ─── */
  footer: {
    padding: '40px 24px',
    textAlign: 'center' as const,
    fontSize: 13,
    color: '#aaa',
    borderTop: '1px solid #f0f0f5',
  },
};

/* ===================== 图标组件（纯 SVG） ===================== */
const icons = {
  qilin: <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 麒麟身体 — 流线型 */}
    <path d="M30 65 Q35 35 50 30 Q65 35 70 65 Q65 80 50 85 Q35 80 30 65Z" fill="url(#qilinGrad)" stroke="#667eea" strokeWidth="1.5"/>
    {/* 头部 */}
    <ellipse cx="50" cy="28" rx="12" ry="10" fill="url(#qilinGrad)" stroke="#667eea" strokeWidth="1.5"/>
    {/* 角 */}
    <path d="M42 20 L38 8 L45 16" fill="#764ba2" opacity="0.8"/>
    <path d="M58 20 L62 8 L55 16" fill="#764ba2" opacity="0.8"/>
    {/* 眼睛 */}
    <circle cx="46" cy="27" r="2.5" fill="#1a1a2e"/>
    <circle cx="54" cy="27" r="2.5" fill="#1a1a2e"/>
    <circle cx="46.5" cy="26.5" r="1" fill="#fff"/>
    <circle cx="54.5" cy="26.5" r="1" fill="#fff"/>
    {/* 鬃毛 */}
    <path d="M38 32 Q28 30 32 38 Q36 42 38 40" fill="#764ba2" opacity="0.6"/>
    <path d="M62 32 Q72 30 68 38 Q64 42 62 40" fill="#764ba2" opacity="0.6"/>
    {/* 尾巴 */}
    <path d="M50 85 Q42 90 35 92 Q28 88 25 90" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round"/>
    {/* 火焰装饰 */}
    <path d="M25 90 Q22 82 18 86 Q14 78 12 82" fill="none" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    {/* 祥云底座 */}
    <ellipse cx="50" cy="88" rx="25" ry="4" fill="#667eea" opacity="0.15"/>
    {/* 渐变定义 */}
    <defs>
      <linearGradient id="qilinGrad" x1="30" y1="30" x2="70" y2="85">
        <stop offset="0%" stopColor="#667eea"/>
        <stop offset="100%" stopColor="#764ba2"/>
      </linearGradient>
    </defs>
  </svg>,
  scan: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 8v8M8 12h8"/></svg>,
  print: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  multi: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  chart: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  shield: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bolt: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  check: '✓',
  cross: '✗',
};

const featureIconBgs = [
  'linear-gradient(135deg, #667eea20, #764ba220)',
  'linear-gradient(135deg, #ff6b3520, #ff8c0020)',
  'linear-gradient(135deg, #00c85320, #00e67620)',
  'linear-gradient(135deg, #2196f320, #00bcd420)',
  'linear-gradient(135deg, #9c27b020, #e040fb20)',
  'linear-gradient(135deg, #ff980020, #ffc10720)',
];

const featureIconColors = ['#667eea', '#ff6b35', '#00c853', '#2196f3', '#9c27b0', '#ff9800'];

const features = [
  { title: '扫码点餐', desc: '顾客微信扫码即点，无需下载App。菜单实时更新，下单直达后厨打印机，减少服务员传菜环节。', icon: icons.scan },
  { title: '云打印自动分发', desc: '订单自动分发到对应厨房、吧台、前台打印机。后厨出单、前台小票全自动，不漏单不断单。', icon: icons.print },
  { title: '多店铺统一管理', desc: '一个后台管理多家门店。菜品、订单、打印机、数据报表一目了然，连锁餐饮高效管理。', icon: icons.multi },
  { title: '数据分析看板', desc: '实时销售数据、热门菜品排行、高峰时段分析、门店经营对比，数据驱动经营决策。', icon: icons.chart },
  { title: '租户隔离 · 安全可靠', desc: '高效多租户架构，数据独立安全存储。支持品牌定制域名，每个商户拥有独立空间。', icon: icons.shield },
  { title: '极速流畅体验', desc: '前后端分离架构 + CDN 加速。页面秒开，操作流畅不卡顿，顾客扫码3秒直达菜单。', icon: icons.bolt },
];

/* ===================== 页面组件 ===================== */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scanUrl = SCAN_ROUTES.routes.utils.buildScanUrl(
    SCAN_ROUTES.routes.TEST.TENANT.SLUG,
    SCAN_ROUTES.routes.TEST.STORE.SLUG,
    SCAN_ROUTES.routes.TEST.TABLE.CODE
  );

  return (
    <>
      {/* ─── 内联移动端响应式样式 ─── */}
      <style>{`
        @media (max-width: 640px) {
          .hp-hero, .hp-features, .hp-mockup, .hp-roles, .hp-pricing, .hp-cta, .hp-footer {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          .hp-hero {
            padding-top: 80px !important;
            padding-bottom: 40px !important;
          }
          .hp-nav {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          .hp-section-title {
            font-size: 22px !important;
          }
          .hp-card {
            padding: 20px 16px !important;
          }
          .hp-role-btn {
            width: 100% !important;
          }
        }
        /* iPad 等中等屏幕 */
        @media (min-width: 641px) and (max-width: 1024px) {
          .hp-hero, .hp-features, .hp-mockup, .hp-roles, .hp-pricing, .hp-cta, .hp-footer {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }
      `}</style>
    <div style={styles.page}>

      {/* ─────── Nav ─────── */}
      <nav className="hp-nav" style={{ ...styles.nav, boxShadow: scrolled ? '0 1px 6px rgba(0,0,0,0.06)' : 'none' }}>
        <a href="/" style={styles.navLogo}>
          {icons.qilin}
          <span>麒麟云点餐</span>
        </a>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>功能</a>
          <a href="#pricing" style={styles.navLink}>价格</a>
          <Link to="/auth/admin/login" style={styles.navLink}>登录</Link>
          <Link to="/auth/register" style={styles.navCta}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            免费使用
          </Link>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
      <section className="hp-hero" style={styles.hero}>
        <div style={styles.heroBg} />
        <div style={styles.heroBg2} />
        <div style={styles.heroContent}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #667eea20, #764ba220)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(102,126,234,0.12)',
            }}>
              <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 65 Q35 35 50 30 Q65 35 70 65 Q65 80 50 85 Q35 80 30 65Z" fill="url(#qilinHero)" stroke="#667eea" strokeWidth="1.2"/>
                <ellipse cx="50" cy="28" rx="12" ry="10" fill="url(#qilinHero)" stroke="#667eea" strokeWidth="1.2"/>
                <path d="M42 20 L38 8 L45 16" fill="#764ba2" opacity="0.8"/>
                <path d="M58 20 L62 8 L55 16" fill="#764ba2" opacity="0.8"/>
                <circle cx="46" cy="27" r="2" fill="#1a1a2e"/>
                <circle cx="54" cy="27" r="2" fill="#1a1a2e"/>
                <circle cx="46.5" cy="26.5" r="0.8" fill="#fff"/>
                <circle cx="54.5" cy="26.5" r="0.8" fill="#fff"/>
                <path d="M50 85 Q42 90 35 92 Q28 88 25 90" fill="none" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M25 90 Q22 82 18 86 Q14 78 12 82" fill="none" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                <ellipse cx="50" cy="88" rx="25" ry="3" fill="#667eea" opacity="0.1"/>
                <defs>
                  <linearGradient id="qilinHero" x1="30" y1="30" x2="70" y2="85">
                    <stop offset="0%" stopColor="#667eea"/>
                    <stop offset="100%" stopColor="#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div style={styles.heroBadge}>🚀 专为中小餐饮品牌打造的高效方案</div>
          <h1 style={styles.heroTitle}>
            扫码点餐<br />云打印 · 一键管理
          </h1>
          <p style={styles.heroSubtitle}>
            让每一家餐饮店拥有专业的数字化管理系统。<br />
            顾客扫码即点、后厨自动出单、管理者手机看数据 —— 就这么简单。
          </p>
          <div style={styles.heroActions}>
            <Link to="/auth/register"
              style={styles.heroBtnPrimary}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(102,126,234,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(102,126,234,0.3)'; }}>
              免费开始使用 →
            </Link>
            <a href={scanUrl}
              style={styles.heroBtnSecondary}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f7ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
              体验扫码点餐 →
            </a>
            <Link to="/scan-demo"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 20,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                color: 'white', fontSize: 13, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}>
              📖 场景介绍
            </Link>
          </div>
        </div>
      </section>

      {/* ─────── Stats ─────── */}
      <section style={styles.statsBar}>
        <div style={styles.statsGrid}>
          <div><div style={styles.statNumber}>500+</div><div style={styles.statLabel}>服务餐饮门店</div></div>
          <div><div style={styles.statNumber}>10万+</div><div style={styles.statLabel}>月处理订单</div></div>
          <div><div style={styles.statNumber}>99.9%</div><div style={styles.statLabel}>系统可用率</div></div>
          <div><div style={styles.statNumber}>3秒</div><div style={styles.statLabel}>扫码即点直达</div></div>
        </div>
      </section>

      {/* ─────── Features ─────── */}
      <section id="features" className="hp-features" style={styles.section}>
        <h2 style={styles.sectionTitle}>不止于点餐</h2>
        <p style={styles.sectionSubtitle}>从顾客扫码到经营管理，全链路数字化</p>
        <div style={styles.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} style={styles.featureCard}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ ...styles.featureIcon, background: featureIconBgs[i], color: featureIconColors[i] }}>
                {f.icon}
              </div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────── Mockup ─────── */}
      <section className="hp-mockup" style={styles.mockupSection}>
        <div style={styles.mockupContainer}>
          <h2 style={styles.sectionTitle}>看看它长什么样</h2>
          <p style={{ ...styles.sectionSubtitle, marginBottom: 0 }}>简洁、高效、适合餐饮行业的管理界面</p>

          <div style={{
            ...styles.mockupImage,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            padding: 24,
            minHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            gap: 16,
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span style={{ fontSize: 18, opacity: 0.9 }}>店长管理后台 · 数据看板</span>
            <span style={{ fontSize: 13, opacity: 0.7 }}>（实际界面预览加载中）</span>
          </div>
        </div>
      </section>

      {/* ─────── Role Entry ─────── */}
      <section className="hp-roles" style={{ ...styles.section, paddingTop: 60, paddingBottom: 60 }}>
        <h2 style={styles.sectionTitle}>选择你的角色</h2>
        <p style={styles.sectionSubtitle}>根据身份进入对应的管理后台</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          maxWidth: 960,
          margin: '0 auto',
        }}>
          {[
            { icon: '🔐', name: '超级管理员', desc: '平台管理 · 用户管理', path: '/auth/admin/login', color: '#667eea' },
            { icon: '🏢', name: '商户登录', desc: '店铺管理 · 数据分析', path: '/auth/tenant/login', color: '#ff6b35' },
            { icon: '👨‍🍳', name: '店长登录', desc: '订单 · 菜单 · 设备', path: '/store-admin/login', color: '#00c853' },
            { icon: '🚪', name: '通用登录', desc: '所有用户通用入口', path: '/auth/login', color: '#888' },
            { icon: '📱', name: '扫码点餐', desc: '模拟顾客体验', path: scanUrl, color: '#2196f3' },
          ].map((r, i) => (
            <Link key={i} to={r.path}
              style={{
                display: 'block',
                padding: '24px 20px',
                borderRadius: 14,
                background: '#fff',
                border: '1px solid #f0f0f5',
                textDecoration: 'none',
                color: 'inherit',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{r.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────── Pricing ─────── */}
      <section id="pricing" className="hp-pricing" style={{ ...styles.section, paddingTop: 40 }}>
        <h2 style={styles.sectionTitle}>简单透明的定价</h2>
        <p style={styles.sectionSubtitle}>从小店到连锁，总有适合你的方案</p>
        <div style={styles.pricingGrid}>
          {[
            {
              name: '免费版',
              price: '¥0',
              period: '/月',
              desc: '初创小店，14天全功能免费试用',
              badge: '免费试用',
              features: ['1家门店', '扫码点餐基础功能', '1台云打印机', '30天数据留存', '基础数据看板'],
              popular: false,
            },
            {
              name: '单店版',
              price: '¥38',
              period: '/月',
              desc: '单店起步，亲民价格',
              badge: '亲民价',
              features: ['1家门店', '2台云打印机', '90天数据留存', '完整数据看板', '快速客服支持'],
              popular: false,
            },
            {
              name: '专业版',
              price: '¥199',
              period: '/月',
              desc: '成长型餐饮品牌，功能全面',
              badge: '推荐',
              features: ['最多5家门店', '不限打印机数量', '扫码点餐 + 云打印', '数据看板 + 报表', '90天数据留存', '多店统一管理'],
              popular: true,
            },
            {
              name: '企业版',
              price: '¥499',
              period: '/月',
              desc: '连锁品牌，定制化需求',
              badge: '连锁首选',
              features: ['不限门店数量', '全部功能', '品牌定制域名', 'API 接口对接', '专属客户成功经理', '永久数据留存'],
              popular: false,
            },
          ].map((plan, i) => (
            <div key={i} style={{
              ...styles.pricingCard,
              ...(plan.popular ? styles.pricingPopular : {}),
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
              {plan.popular && <div style={styles.popularBadge}>推荐</div>}
              <div style={styles.pricingName}>{plan.name}</div>
              <div style={styles.pricingPrice}>{plan.price}<span style={styles.pricingPeriod}>{plan.period}</span></div>
              <div style={styles.pricingDesc}>{plan.desc}</div>
              <ul style={styles.pricingFeatures}>
                {plan.features.map((f, j) => (
                  <li key={j} style={styles.pricingFeature}>
                    <span style={{ color: '#00c853' }}>{icons.check}</span> {f}
                  </li>
                ))}
              </ul>
              <Link to={plan.popular ? '/auth/register' : '/auth/register'}
                style={{
                  ...styles.pricingBtn,
                  ...(plan.popular ? styles.pricingBtnPrimary : {}),
                }}>
                {plan.price === '¥0' ? '免费使用' : '立即开通'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ─────── CTA ─────── */}
      <section className="hp-cta" style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>准备好数字化升级了吗？</h2>
        <p style={styles.ctaSubtitle}>免费注册，3分钟完成店铺配置，立刻开始接单。</p>
        <div style={styles.heroActions}>
          <Link to="/auth/register"
            style={styles.heroBtnPrimary}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
            免费注册 →
          </Link>
          <Link to="/auth/admin/login"
            style={styles.heroBtnSecondary}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f7ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
            管理员登录
          </Link>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="hp-footer" style={styles.footer}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icons.qilin}
            <span style={{ fontWeight: 600 }}>麒麟云点餐</span>
          </div>
          <div style={{ fontSize: 12, color: '#bbb' }}>
            © 2026 麒麟云点餐 · 多店扫码点餐云打印高效平台
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#bbb' }}>
            <span>v0.2.6-alpha</span>
          </div>
        </div>
      </footer>

    </div>
    </>
  );
}
