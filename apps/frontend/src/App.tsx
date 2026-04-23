import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
// 兼容旧导入
import StoreListPage from './pages/store-management/StoreListPage';

import EditStorePage from './pages/store-management/EditStorePage';
import StoreDetailPage from './pages/store-management/StoreDetailPage';
import TestPage from './pages/TestPage';
import TestTenants from './pages/TestTenants';
import LinkValidationTest from './pages/LinkValidationTest';
import MenuTemplateManager from './pages/menu-management/MenuTemplateManager';
import { PUBLIC_ROUTES, TENANT_ROUTES } from './config/routes';
import SCAN_ROUTES from './config/scan-routes';
import './styles/App.css';

function App() {
  return (
    <CustomRouter>
      <AuthProvider>
        <div className="app">
          <nav>
            <ul>
              <li><Link to={PUBLIC_ROUTES.HOME}>首页</Link></li>
              <li><Link to={PUBLIC_ROUTES.AUTH.LOGIN}>登录</Link></li>
              <li><Link to={PUBLIC_ROUTES.AUTH.REGISTER}>注册</Link></li>
              <li><Link to={TENANT_ROUTES.TENANTS.LIST}>租户管理</Link></li>
              <li><Link to={PUBLIC_ROUTES.PUBLIC.ABOUT}>关于</Link></li>
              <li><Link to={PUBLIC_ROUTES.PUBLIC.TEST_CONSOLE}>控制台测试</Link></li>
              <li><Link to={SCAN_ROUTES.getTestScanUrl()}>扫码点餐</Link></li>
              <li><Link to={TENANT_ROUTES.STORES.LIST}>店铺管理</Link></li>
              <li><Link to={TENANT_ROUTES.MENU.ITEMS}>菜品管理</Link></li>
            </ul>
          </nav>
          <main>
            <Routes>
              {/* 公共路由 */}
              <Route path={PUBLIC_ROUTES.HOME} element={<HomePage />} />
              <Route path={PUBLIC_ROUTES.PUBLIC.ABOUT} element={<AboutPage />} />
              
              {/* 认证路由 */}
              <Route path={PUBLIC_ROUTES.AUTH.LOGIN} element={<LoginPage />} />
              <Route path={PUBLIC_ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
              
              {/* 租户管理路由 */}
              <Route path={TENANT_ROUTES.TENANTS.LIST} element={<TenantManagement />} />
              <Route path={TENANT_ROUTES.TENANTS.CREATE} element={<CreateTenant />} />
              <Route path={TENANT_ROUTES.TENANTS.EDIT} element={<EditTenant />} />
              <Route path={TENANT_ROUTES.TENANTS.DETAIL} element={<TenantDashboard />} />
              
              {/* 测试页面 */}
              <Route path={PUBLIC_ROUTES.PUBLIC.TEST_CONSOLE} element={<TestConsolePage />} />
              <Route path={PUBLIC_ROUTES.PUBLIC.TEST_TENANTS} element={<TestTenants />} />
              <Route path={PUBLIC_ROUTES.PUBLIC.LINK_VALIDATION} element={<LinkValidationTest />} />
              
              {/* 扫码点餐页面 - 新规范路由 */}
              <Route path={SCAN_ROUTES.routes.SCAN_ORDER} element={<ScanOrderPage />} />
              <Route path={SCAN_ROUTES.routes.TENANT_STORE} element={<ScanOrderPage />} />
              <Route path={SCAN_ROUTES.routes.TENANT_ONLY} element={<ScanOrderPage />} />
              
              {/* 扫码点餐页面 - 旧规范路由 (弃用，仍保留渲染) */}
              <Route path={SCAN_ROUTES.routes.LEGACY.SCAN_ORDER} element={<ScanOrderPage />} />
              <Route path={SCAN_ROUTES.routes.LEGACY.STORE_ONLY} element={<ScanOrderPage />} />
              <Route path={SCAN_ROUTES.routes.LEGACY.BASE} element={<ScanOrderPage />} />
              
              {/* 店铺管理页面 - 多店模式新页面 */}
              <Route path={TENANT_ROUTES.STORES.CREATE} element={<CreateStore />} />
              <Route path={TENANT_ROUTES.STORES.EDIT} element={<EditStorePage />} />
              <Route path={TENANT_ROUTES.STORES.DETAIL} element={<StoreDetailPage />} />
              <Route path={TENANT_ROUTES.STORES.LIST} element={<StoreManagement />} />
              
              {/* 兼容旧路由 */}
              <Route path={TENANT_ROUTES.STORES_OLD} element={<StoreListPage />} />
              
              {/* 菜品管理页面 */}
              <Route path={TENANT_ROUTES.MENU.ITEMS} element={<MenuTemplateManager />} />
              <Route path={TENANT_ROUTES.MENU.CATEGORIES} element={<MenuTemplateManager />} />
              
              {/* 默认重定向到首页 */}
              <Route path="*" element={<Navigate to={PUBLIC_ROUTES.HOME} replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </CustomRouter>
  );
}

export default App;
