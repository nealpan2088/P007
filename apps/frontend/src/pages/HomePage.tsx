import { Link } from 'react-router-dom';
import SCAN_ROUTES from '../config/scan-routes';

export default function HomePage() {
  // 扫码点餐测试链接 - 新规范
  const scanTestLinksNew = [
    { 
      tenantSlug: SCAN_ROUTES.routes.TEST.TENANT.SLUG,
      storeSlug: SCAN_ROUTES.routes.TEST.STORE.SLUG, 
      tableId: SCAN_ROUTES.routes.TEST.TABLE.CODE, 
      label: `${SCAN_ROUTES.routes.TEST.TENANT.NAME} - ${SCAN_ROUTES.routes.TEST.STORE.NAME} - ${SCAN_ROUTES.routes.TEST.TABLE.NAME}`,
      format: 'new',
    },
    { 
      tenantSlug: SCAN_ROUTES.routes.DEMO.TENANT.SLUG,
      storeSlug: SCAN_ROUTES.routes.DEMO.STORE.SLUG, 
      tableId: SCAN_ROUTES.routes.DEMO.TABLE.CODE, 
      label: `${SCAN_ROUTES.routes.DEMO.TENANT.NAME} - ${SCAN_ROUTES.routes.DEMO.STORE.NAME} - ${SCAN_ROUTES.routes.DEMO.TABLE.NAME}`,
      format: 'new',
    },
    { 
      tenantSlug: 'qilin',
      storeSlug: 'beijing-branch', 
      tableId: 'VIP-01', 
      label: '麒麟租户 - 北京分店 - VIP餐桌',
      format: 'new',
    },
  ];
  
  // 扫码点餐测试链接 - 旧规范 (兼容性)
  const scanTestLinksLegacy = [
    { 
      storeSlug: SCAN_ROUTES.routes.TEST.STORE.SLUG, 
      tableId: SCAN_ROUTES.routes.TEST.TABLE.CODE, 
      label: `${SCAN_ROUTES.routes.TEST.STORE.NAME} - ${SCAN_ROUTES.routes.TEST.TABLE.NAME}`,
      format: 'legacy',
    },
    { 
      storeSlug: SCAN_ROUTES.routes.DEMO.STORE.SLUG, 
      tableId: SCAN_ROUTES.routes.DEMO.TABLE.CODE, 
      label: `${SCAN_ROUTES.routes.DEMO.STORE.NAME} - ${SCAN_ROUTES.routes.DEMO.TABLE.NAME}`,
      format: 'legacy',
    },
  ];

  // 规范的API端点示例
  const apiEndpoints = [
    { method: 'GET', path: '/api/public/stores/:storeId', desc: '获取店铺信息' },
    { method: 'GET', path: '/api/public/stores/:storeId/menu', desc: '获取店铺菜单' },
    { method: 'GET', path: '/api/public/stores/:storeId/tables/:tableId', desc: '获取餐桌信息' },
    { method: 'POST', path: '/api/public/orders', desc: '创建订单' },
    { method: 'GET', path: '/api/public/orders/:orderId/status', desc: '获取订单状态' },
  ];

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>麒麟云点餐SaaS平台</h1>
        <p className="subtitle">多店铺扫码点餐云打印解决方案</p>
      </header>

      <section className="scan-demo-section">
        <h2>📱 扫码点餐演示</h2>
        <div className="format-tabs">
          <button className="format-tab active">新规范</button>
          <button className="format-tab">旧规范</button>
        </div>
        
        <p className="section-description">
          <strong>新规范路径格式:</strong> <code>{SCAN_ROUTES.routes.SCAN_ORDER}</code>
          <br />
          <small>完整表达租户→店铺→餐桌关系，符合SaaS多租户架构</small>
        </p>
        
        <h3>📱 新规范扫码点餐演示</h3>
        <div className="scan-links-grid">
          {scanTestLinksNew.map((link, index) => (
            <div key={`new-${index}`} className="scan-link-card new-format">
              <div className="format-badge">新规范</div>
              <h3>{link.label}</h3>
              <p className="path-info">
                <code>/t/{link.tenantSlug}/s/{link.storeSlug}/scan/{link.tableId}</code>
              </p>
              <Link 
                to={SCAN_ROUTES.routes.utils.buildScanUrl(link.tenantSlug, link.storeSlug, link.tableId)}
                className="scan-button"
              >
                体验新规范扫码点餐
              </Link>
              <div className="api-info">
                <small>对应API (新规范):</small>
                <div>
                  <code>GET /api/public/tenants/{link.tenantSlug}/stores/{link.storeSlug}</code>
                </div>
                <div>
                  <code>GET /api/public/tenants/{link.tenantSlug}/stores/{link.storeSlug}/menu</code>
                </div>
                <div>
                  <code>GET /api/public/tenants/{link.tenantSlug}/stores/{link.storeSlug}/tables/{link.tableId}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <h3>🔄 旧规范扫码点餐演示 (兼容性)</h3>
        <div className="scan-links-grid">
          {scanTestLinksLegacy.map((link, index) => (
            <div key={`legacy-${index}`} className="scan-link-card legacy-format">
              <div className="format-badge">旧规范</div>
              <h3>{link.label}</h3>
              <p className="path-info">
                <code>/scan/{link.storeSlug}/{link.tableId}</code>
              </p>
              <Link 
                to={SCAN_ROUTES.routes.utils.buildLegacyScanUrl(link.storeSlug, link.tableId)}
                className="scan-button legacy"
              >
                体验旧规范扫码点餐
              </Link>
              <div className="api-info">
                <small>对应API (旧规范):</small>
                <div>
                  <code>GET /api/public/stores/{link.storeSlug}</code>
                </div>
                <div>
                  <code>GET /api/public/stores/{link.storeSlug}/menu</code>
                </div>
                <div>
                  <code>GET /api/public/stores/{link.storeSlug}/tables/{link.tableId}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="api-docs-section">
        <h2>🔧 API端点规范</h2>
        <p className="section-description">
          所有扫码点餐相关API都遵循统一规范
        </p>
        
        <div className="api-table">
          <table>
            <thead>
              <tr>
                <th>方法</th>
                <th>路径</th>
                <th>描述</th>
                <th>示例</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((endpoint, index) => (
                <tr key={index}>
                  <td><span className={`method-badge method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span></td>
                  <td><code>{endpoint.path}</code></td>
                  <td>{endpoint.desc}</td>
                  <td>
                    {endpoint.method === 'GET' && endpoint.path.includes(':storeId') && (
                      <code>GET /api/public/stores/test-store{endpoint.path.replace(':storeId', '')}</code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="path-spec-section">
        <h2>📋 路径规范说明</h2>
        <div className="spec-grid">
          <div className="spec-card">
            <h3>新规范路由</h3>
            <pre><code>{`<Route path="${SCAN_ROUTES.routes.SCAN_ORDER}" element={<ScanOrderPage />} />
<Route path="${SCAN_ROUTES.routes.TENANT_STORE}" element={<ScanOrderPage />} />
<Route path="${SCAN_ROUTES.routes.TENANT_ONLY}" element={<ScanOrderPage />} />`}</code></pre>
            <div className="spec-note">
              <strong>优点:</strong> 完整表达租户→店铺→餐桌关系，符合SaaS多租户架构
            </div>
          </div>
          
          <div className="spec-card">
            <h3>旧规范路由 (兼容性)</h3>
            <pre><code>{`<Route path="${SCAN_ROUTES.routes.LEGACY.SCAN_ORDER}" element={<ScanOrderPage />} />
<Route path="${SCAN_ROUTES.routes.LEGACY.STORE_ONLY}" element={<ScanOrderPage />} />
<Route path="${SCAN_ROUTES.routes.LEGACY.BASE}" element={<ScanOrderPage />} />`}</code></pre>
            <div className="spec-note">
              <strong>状态:</strong> 兼容性支持，计划于2026-07-01下线
            </div>
          </div>
          
          <div className="spec-card">
            <h3>参数规范对比</h3>
            <table className="param-table">
              <thead>
                <tr>
                  <th>规范</th>
                  <th>参数</th>
                  <th>示例</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>新规范</strong></td>
                  <td>
                    <code>tenantSlug</code><br/>
                    <code>storeSlug</code><br/>
                    <code>tableId</code>
                  </td>
                  <td>
                    <code>qilin-test</code><br/>
                    <code>test-store</code><br/>
                    <code>A01</code>
                  </td>
                </tr>
                <tr>
                  <td><strong>旧规范</strong></td>
                  <td>
                    <code>storeId</code><br/>
                    <code>tableId</code>
                  </td>
                  <td>
                    <code>test-store</code><br/>
                    <code>A01</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="spec-card">
            <h3>使用场景</h3>
            <ul>
              <li>顾客扫描餐桌二维码 → 自动跳转到对应路径</li>
              <li>服务员分享链接 → 使用规范格式确保兼容性</li>
              <li>测试验证 → 使用标准参数测试功能</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="quick-start-section">
        <h2>🚀 快速开始</h2>
        <div className="quick-start-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>选择测试链接</h3>
              <p>点击上方的扫码点餐演示链接，体验完整流程</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>查看API响应</h3>
              <p>打开浏览器开发者工具，查看API调用和响应</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>验证规范</h3>
              <p>确认所有路径和API都符合上述规范</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <p>
          <strong>规范总结:</strong> 推荐使用新规范 <code>{SCAN_ROUTES.routes.SCAN_ORDER}</code>
        </p>
        <p className="footer-note">
          新规范完整表达租户→店铺→餐桌关系，符合SaaS多租户架构<br/>
          旧规范保持兼容性支持，计划于2026-07-01下线
        </p>
      </footer>
    </div>
  );
}
