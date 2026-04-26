/**
 * 受保护的路由组件
 * 
 * 权限规则：
 * - `/admin/*` → 仅 SUPER_ADMIN
 * - `/t/{slug}/*` → 有该租户的 UserTenant 权限（OWNER/ADMIN/MANAGER/STAFF）
 * - 未登录 → 跳登录页
 */
import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../config/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** 允许的角色列表（User.role），不传表示只要登录即可 */
  allowedRoles?: string[];
  /** 是否检查租户归属（用于 /t/{slug}/* 路由） */
  checkTenant?: boolean;
  /** 未授权时跳转路径 */
  fallbackPath?: string;
}

interface StoredUser {
  id: string;
  email: string;
  role: string;
  userTenants?: Array<{
    id: string;
    name: string;
    subdomain: string;
    role: string;
    status: string;
  }>;
}

function getCurrentUser(): StoredUser | null {
  try {
    const stored = localStorage.getItem('qilin_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * 检查用户是否属于指定的租户 slug
 */
function hasTenantAccess(user: StoredUser, tenantSlug: string): boolean {
  if (!user.userTenants || !Array.isArray(user.userTenants)) return false;
  return user.userTenants.some(
    ut => ut.subdomain === tenantSlug
  );
}

export function ProtectedRoute({
  children,
  allowedRoles,
  checkTenant = false,
  fallbackPath = PUBLIC_ROUTES.AUTH.LOGIN,
}: ProtectedRouteProps) {
  const location = useLocation();
  const params = useParams();
  const user = getCurrentUser();

  // 未登录 → 跳登录页
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />;
  }

  // 检查角色（User.role 级别）
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // 非 SUPER_ADMIN 访问 /admin/* → 跳到第一个租户 Dashboard
      if (user.userTenants?.length && location.pathname.startsWith('/admin')) {
        const firstSlug = user.userTenants[0].subdomain;
        if (firstSlug) {
          return <Navigate to={`/t/${firstSlug}/dashboard`} replace />;
        }
      }
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // 检查租户归属（/t/:tenantSlug/* 页面）
  if (checkTenant) {
    // 超管通吃所有租户
    if (user.role === 'SUPER_ADMIN') {
      return <>{children}</>;
    }
    const tenantSlug = params.tenantSlug;
    console.debug('[ProtectedRoute] checkTenant:', { tenantSlug, userTenants: user.userTenants, pathname: location.pathname });
    if (tenantSlug && !hasTenantAccess(user, tenantSlug)) {
      console.debug('[ProtectedRoute] 没有租户权限，跳转到:', fallbackPath);
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
