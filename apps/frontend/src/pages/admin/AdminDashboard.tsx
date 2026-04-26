import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES } from '../../config/routes';
import './AdminDashboard.css';

interface DashboardStats {
  tenants: { total: number };
  stores: { total: number; active: number };
  users: { total: number };
  recentStores: Array<{
    id: string; name: string; slug: string; status: string; createdAt: string;
    tenant: { id: string; name: string; subdomain: string };
  }>;
}

interface QuickAction {
  label: string;
  icon: string;
  path: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: '租户管理', icon: '🏢', path: ADMIN_ROUTES.TENANTS.LIST, color: '#667eea' },
  { label: '店铺管理', icon: '🏪', path: ADMIN_ROUTES.STORES.LIST, color: '#ff6b35' },
  { label: '用户管理', icon: '👥', path: ADMIN_ROUTES.USERS.LIST, color: '#22c55e' },
  { label: '业务配置', icon: '🌙', path: ADMIN_ROUTES.NIGHTWOLF.LIST, color: '#8b5cf6' },
  { label: '打印机', icon: '🖨️', path: '/admin/printers', color: '#06b6d4' },
  { label: '菜品素材库', icon: '🍽️', path: ADMIN_ROUTES.MENU_TEMPLATES.LIST, color: '#f59e0b' },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '营业中',
  DRAFT: '未发布',
  INACTIVE: '已关闭',
  MAINTENANCE: '维护中',
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('qilin_access_token');
        const res = await fetch('/api/admin/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        } else {
          setError('获取数据失败');
        }
      } catch {
        setError('网络错误，请检查后端是否运行');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* 页头 */}
      <div className="dashboard-header">
        <h1>管理后台</h1>
        <p className="dashboard-subtitle">欢迎回来，今天想做什么？</p>
      </div>

      {/* 统计卡片 */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon tenants">🏢</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.tenants.total ?? 0}</span>
            <span className="stat-label">租户总数</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stores">🏪</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.stores.total ?? 0}</span>
            <span className="stat-label">店铺总数</span>
          </div>
          <div className="stat-badge">
            {stats?.stores.active ?? 0} 家营业中
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon users">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.users.total ?? 0}</span>
            <span className="stat-label">用户总数</span>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="dashboard-section">
        <h2>快捷操作</h2>
        <div className="quick-actions">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.path}
              className="quick-action-btn"
              style={{ '--accent': action.color } as React.CSSProperties}
              onClick={() => navigate(action.path)}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 最近店铺 */}
      <div className="dashboard-section">
        <h2>最新店铺</h2>
        {stats?.recentStores && stats.recentStores.length > 0 ? (
          <div className="recent-stores">
            <table className="stores-table">
              <thead>
                <tr>
                  <th>店铺名称</th>
                  <th>所属租户</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentStores.map((store) => (
                  <tr key={store.id}>
                    <td>
                      <span className="store-name">{store.name}</span>
                      <span className="store-slug">{store.slug}</span>
                    </td>
                    <td>{store.tenant?.name || '-'}</td>
                    <td>
                      <span className={`status-tag ${store.status}`}>
                        {STATUS_LABELS[store.status] || store.status}
                      </span>
                    </td>
                    <td className="time-cell">
                      {new Date(store.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td>
                      <button
                        className="table-action-btn"
                        onClick={() => navigate(`/admin/stores`)}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-hint">暂无店铺数据</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
