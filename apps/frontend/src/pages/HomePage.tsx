import { Link, useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../config/routes';
import SCAN_ROUTES from '../config/scan-routes';

export default function HomePage() {
  const navigate = useNavigate();

  const handleGoToAdmin = () => {
    navigate(PUBLIC_ROUTES.AUTH.ADMIN_LOGIN);
  };

  return (
    <div className="home-page">
      {/* 品牌宣传区 */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-brand">
            <span className="home-hero-icon">🦄</span>
            <h1>麒麟云点餐</h1>
          </div>
          <p className="home-hero-subtitle">多店铺扫码点餐 · 云打印 · 餐饮数字化管理平台</p>
          <p className="home-hero-desc">
            为连锁餐饮品牌提供一站式数字化解决方案，<br />
            顾客扫码点餐、后厨自动打印、经营管理一目了然。
          </p>
          <div className="home-hero-actions">
            <button className="home-btn-primary" onClick={handleGoToAdmin}>
              进入管理后台 →
            </button>
            <Link
              to={SCAN_ROUTES.routes.utils.buildScanUrl(
                SCAN_ROUTES.routes.TEST.TENANT.SLUG,
                SCAN_ROUTES.routes.TEST.STORE.SLUG,
                SCAN_ROUTES.routes.TEST.TABLE.CODE
              )}
              className="home-btn-secondary"
            >
              体验扫码点餐 →
            </Link>
          </div>
        </div>
      </section>

      {/* 功能特色 */}
      <section className="home-features">
        <h2 className="home-section-title">核心功能</h2>
        <div className="home-features-grid">
          <div className="home-feature-card">
            <div className="home-feature-icon">📱</div>
            <h3>扫码点餐</h3>
            <p>顾客扫码即点，无需下载App，菜单实时更新，下单直达后厨。</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🖨️</div>
            <h3>云打印</h3>
            <p>订单自动分发到对应厨房打印机，后厨出单、前台小票全自动。</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🏪</div>
            <h3>多店管理</h3>
            <p>统一后台管理多家门店，菜品、订单、数据一目了然。</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">📊</div>
            <h3>数据看板</h3>
            <p>实时销售数据、热门菜品分析，经营决策有据可依。</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🔐</div>
            <h3>租户隔离</h3>
            <p>SaaS多租户架构，数据独立安全，支持品牌定制。</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">⚡</div>
            <h3>极速体验</h3>
            <p>前后端分离架构，页面秒开，操作流畅不卡顿。</p>
          </div>
        </div>
      </section>

      {/* 入口卡片 */}
      <section className="home-entry-section">
        <h2 className="home-section-title">快速开始</h2>
        <div className="home-entry-cards">
          <div className="entry-card admin-entry" onClick={handleGoToAdmin}>
            <div className="entry-icon">🔐</div>
            <h2>管理员登录</h2>
            <p>店铺管理 · 菜单管理 · 订单管理 · 设备管理</p>
            <span className="entry-btn">进入管理后台 →</span>
          </div>
          <div className="entry-card customer-entry">
            <div className="entry-icon">📱</div>
            <h2>扫码点餐体验</h2>
            <p>模拟顾客扫码点餐，无需登录</p>
            <Link
              to={SCAN_ROUTES.routes.utils.buildScanUrl(
                SCAN_ROUTES.routes.TEST.TENANT.SLUG,
                SCAN_ROUTES.routes.TEST.STORE.SLUG,
                SCAN_ROUTES.routes.TEST.TABLE.CODE
              )}
              className="entry-btn"
            >
              立即体验 →
            </Link>
          </div>
        </div>
      </section>

      {/* 测试入口 */}
      <section className="home-test-section">
        <h2 className="home-section-title">🔗 快速入口（测试用）</h2>
        <div className="home-test-links">
          <Link to="/auth/admin/login" className="test-link">
            <span className="test-link-icon">🔐</span>
            <span className="test-link-label">超管登录</span>
            <span className="test-link-path">/auth/admin/login</span>
          </Link>
          <Link to="/auth/tenant/login" className="test-link">
            <span className="test-link-icon">👥</span>
            <span className="test-link-label">租户登录</span>
            <span className="test-link-path">/auth/tenant/login</span>
          </Link>
          <Link to="/auth/login" className="test-link">
            <span className="test-link-icon">🚪</span>
            <span className="test-link-label">通用登录</span>
            <span className="test-link-path">/auth/login</span>
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <p>麒麟云点餐SaaS v0.2.6-alpha</p>
      </footer>
    </div>
  );
}
