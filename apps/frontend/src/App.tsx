import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CustomRouter } from './components/CustomRouter'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import TenantManagement from './pages/TenantManagement'
import CreateTenant from './pages/CreateTenant'
import EditTenant from './pages/EditTenant'
import TenantDashboard from './pages/TenantDashboard'
import TestConsolePage from './pages/TestConsolePage'
import ScanOrderPage from './pages/scan-order'
import StoreListPage from './pages/store-management/StoreListPage'
import CreateStorePage from './pages/store-management/CreateStorePage'
import EditStorePage from './pages/store-management/EditStorePage'
import StoreDetailPage from './pages/store-management/StoreDetailPage'
import { PUBLIC_ROUTES, TENANT_ROUTES } from './config/routes'
import './styles/App.css'

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
              <li><Link to="/test-console">控制台测试</Link></li>
              <li><Link to="/scan/test-store/A01">扫码点餐测试</Link></li>
              <li><Link to="/stores">店铺管理</Link></li>
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
              <Route path="/test-console" element={<TestConsolePage />} />
              
              {/* 扫码点餐页面 */}
              <Route path="/scan/:storeId/:tableId" element={<ScanOrderPage />} />
              <Route path="/scan/:storeId" element={<ScanOrderPage />} />
              <Route path="/scan" element={<ScanOrderPage />} />
              
              {/* 店铺管理页面 */}
              <Route path="/stores" element={<StoreListPage />} />
              <Route path="/stores/create" element={<CreateStorePage />} />
              <Route path="/stores/:storeId" element={<StoreDetailPage />} />
              <Route path="/stores/:storeId/edit" element={<EditStorePage />} />
              
              {/* 默认重定向到首页 */}
              <Route path="*" element={<Navigate to={PUBLIC_ROUTES.HOME} replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </CustomRouter>
  )
}

export default App
