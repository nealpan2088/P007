import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { CustomRouter } from './components/CustomRouter';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import TenantManagement from './pages/TenantManagement';
import CreateTenant from './pages/CreateTenant';
import EditTenant from './pages/EditTenant';
import TenantDashboard from './pages/TenantDashboard';
import TestConsolePage from './pages/TestConsolePage';
import ScanOrderPage from './pages/scan-order';
import StoreManagement from './pages/StoreManagement';
import CreateStore from './pages/CreateStore';
import EditStorePage from './pages/store-management/EditStorePage';
import StoreDetailPage from './pages/store-management/StoreDetailPage';
import StoreOrdersPage from './pages/order-management/StoreOrdersPage';
import TestTenants from './pages/TestTenants';
import LinkValidationTest from './pages/LinkValidationTest';
import MenuTemplateManager from './pages/menu-management/MenuTemplateManager';
import PrinterManagement from './pages/printer/PrinterManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStoresPage from './pages/admin/AdminStoresPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import NightwolfConfigPage from './pages/admin/NightwolfConfigPage';
import FoodTemplateLibrary from './pages/admin/FoodTemplateLibrary';
import { PUBLIC_ROUTES, ADMIN_ROUTES, TENANT_ROUTES } from './config/routes';
import SCAN_ROUTES from './config/scan-routes';
import './styles/App.css';

/** 导航栏用户状态 — 用户名 + 退出 */
function NavUserStatus() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    window.location.href = PUBLIC_ROUTES.AUTH.LOGIN;
  };

  if (isAuthenticated()) {
    return (
      <>
        <span className="nav-user-info">
          {user?.username || user?.email}
          {user?.role === 'SUPER_ADMIN' && <span className="nav-role-badge">管理员</span>}
        </span>
        <a href="#" onClick={handleLogout} className="nav-logout" title="退出登录">退出</a>
      </>
    );
  }

  return <Link to={PUBLIC_ROUTES.AUTH.LOGIN}>👤 登录</Link>;
}

/** 导航栏管理菜单 — 按角色和上下文动态显示 */
function AdminNavLinks() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated()) return null;

  const role = user?.role;

  // SUPER_ADMIN — 平台管理菜单
  if (role === 'SUPER_ADMIN') {
    return (
      <>
        <li><Link to={ADMIN_ROUTES.ADMIN}>🏠 工作台</Link></li>
        <li><Link to={ADMIN_ROUTES.TENANTS.LIST}>🏢 租户管理</Link></li>
        <li><Link to={ADMIN_ROUTES.STORES.LIST}>🏪 店铺管理</Link></li>
        <li><Link to={ADMIN_ROUTES.USERS.LIST}>👥 用户管理</Link></li>
        <li><Link to={ADMIN_ROUTES.NIGHTWOLF.LIST}>🌙 业务配置</Link></li>
        <li><Link to={ADMIN_ROUTES.SYSTEM.SETTINGS}>⚙️ 系统管理</Link></li>
      </>
    );
  }

  // TENANT_ADMIN — 租户上下文菜单
  const userTenants = (user as any)?.userTenants || [];
  if (userTenants.length > 0) {
    const slug = userTenants[0]?.subdomain;
    return (
      <>
        <li><Link to={`/t/${slug}/dashboard`}>🏠 工作台</Link></li>
        <li><Link to={`/t/${slug}/stores`}>📋 店铺列表</Link></li>
      </>
    );
  }

  // USER（无租户）— 最少菜单
  return (
    <>
      <li><Link to={PUBLIC_ROUTES.HOME}>🏠 首页</Link></li>
    </>
  );
}

/** 应用主体（在 AuthProvider 内） */
function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const key = user?.id || 'guest';
  const path = window.location.pathname;

  // 首页、登录页、注册页、扫码页 → 不显示管理后台导航栏
  const isPublicLanding =
    path === '/' ||
    path === PUBLIC_ROUTES.AUTH.LOGIN ||
    path === PUBLIC_ROUTES.AUTH.REGISTER ||
    path.includes('/scan');
  const showNav = !isPublicLanding && isAuthenticated();

  return (
    <div className="app">
      {showNav && (
        <nav className="admin-nav">
          <ul>
            <li className="nav-brand"><Link to={PUBLIC_ROUTES.HOME}>麒麟管理后台</Link></li>
            <AdminNavLinks key={`links-${key}`} />
            <li className="nav-right"><NavUserStatus key={`status-${key}`} /></li>
          </ul>
        </nav>
      )}
      <main className={path.includes('/scan') ? 'scan-main' : ''}>
        <Routes>
          {/* ===== 扫码点餐页面 ===== */}
          <Route path={SCAN_ROUTES.routes.SCAN_ORDER} element={<div className="scan-layout"><ScanOrderPage /></div>} />
          <Route path={SCAN_ROUTES.routes.TENANT_STORE} element={<div className="scan-layout"><ScanOrderPage /></div>} />
          <Route path={SCAN_ROUTES.routes.LEGACY.SCAN_ORDER} element={<div className="scan-layout"><ScanOrderPage /></div>} />
          <Route path={SCAN_ROUTES.routes.LEGACY.STORE_ONLY} element={<div className="scan-layout"><ScanOrderPage /></div>} />
          <Route path={SCAN_ROUTES.routes.LEGACY.BASE} element={<div className="scan-layout"><ScanOrderPage /></div>} />

          {/* ===== 公共路由 ===== */}
          <Route path={PUBLIC_ROUTES.HOME} element={<HomePage />} />
          <Route path={PUBLIC_ROUTES.PUBLIC.ABOUT} element={<AboutPage />} />

          {/* ===== 认证路由 ===== */}
          <Route path={PUBLIC_ROUTES.AUTH.LOGIN} element={<LoginPage />} />
          <Route path={PUBLIC_ROUTES.AUTH.REGISTER} element={<RegisterPage />} />

          {/* ===== 超级管理员后台（/admin/*） ===== */}
          <Route path={ADMIN_ROUTES.ADMIN} element={<AdminDashboard />} />
          <Route path={ADMIN_ROUTES.TENANTS.LIST} element={<TenantManagement />} />
          <Route path={ADMIN_ROUTES.TENANTS.CREATE} element={<CreateTenant />} />
          <Route path={ADMIN_ROUTES.TENANTS.EDIT} element={<EditTenant />} />
          <Route path={ADMIN_ROUTES.TENANTS.DETAIL} element={<TenantDashboard />} />
          <Route path={ADMIN_ROUTES.USERS.LIST} element={<UserManagementPage />} />
          <Route path={ADMIN_ROUTES.NIGHTWOLF.LIST} element={<NightwolfConfigPage />} />
          <Route path={ADMIN_ROUTES.NIGHTWOLF.EDIT} element={<NightwolfConfigPage />} />
          <Route path={ADMIN_ROUTES.SYSTEM.SETTINGS} element={<AdminDashboard />} />
          <Route path={ADMIN_ROUTES.STORES.LIST} element={<AdminStoresPage />} />
          <Route path={ADMIN_ROUTES.MENU_TEMPLATES.LIST} element={<FoodTemplateLibrary />} />

          {/* ===== 租户管理后台（/t/:tenantSlug/*） ===== */}
          <Route path={TENANT_ROUTES.TENANT_CTX.DASHBOARD} element={<TenantDashboard />} />
          <Route path={TENANT_ROUTES.TENANT_CTX.STORES.LIST} element={<StoreManagement />} />
          <Route path={TENANT_ROUTES.TENANT_CTX.STORES.CREATE} element={<CreateStore />} />
          <Route path={TENANT_ROUTES.TENANT_CTX.STORES.DETAIL} element={<StoreDetailPage />} />
          <Route path={TENANT_ROUTES.TENANT_CTX.STORES.EDIT} element={<EditStorePage />} />
          <Route path={TENANT_ROUTES.TENANT_CTX.STORE_MENU.ITEMS} element={<MenuTemplateManager />} />
          <Route path={TENANT_ROUTES.TENANT_CTX.STORE_PRINTERS.LIST} element={<PrinterManagement />} />
          <Route path={ADMIN_ROUTES.ORDERS.LIST} element={<StoreOrdersPage />} />
          <Route path={ADMIN_ROUTES.ORDERS.DETAIL} element={<StoreOrdersPage />} />

          {/* ===== 测试页面 ===== */}
          <Route path={PUBLIC_ROUTES.PUBLIC.TEST_CONSOLE} element={<TestConsolePage />} />
          <Route path={PUBLIC_ROUTES.PUBLIC.TEST_TENANTS} element={<TestTenants />} />
          <Route path={PUBLIC_ROUTES.PUBLIC.LINK_VALIDATION} element={<LinkValidationTest />} />

          {/* ===== 默认重定向 ===== */}
          <Route path="*" element={<Navigate to={PUBLIC_ROUTES.HOME} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <CustomRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </CustomRouter>
  );
}

export default App;
