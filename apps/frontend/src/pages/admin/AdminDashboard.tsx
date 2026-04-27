import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  { label: '一键演示店铺', icon: '🚀', path: '/admin/demo', color: '#10b981' },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '营业中',
  DRAFT: '未发布',
  INACTIVE: '已关闭',
  MAINTENANCE: '维护中',
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromLegacy = location.state?.fromLegacyAdmin;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({ shopName: '', contactPhone: '' });

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
    <>
    <div className="admin-dashboard">
      {/* 旧链接重定向提示 */}
      {fromLegacy && (
        <div className="redirect-notice" style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#92400e',
        }}>
          🔄 <strong>/admin</strong> 已迁移至 <strong>/admin/dashboard</strong>，当前已自动跳转。
        </div>
      )}

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
              onClick={() => {
                if (action.label === '一键演示店铺') {
                  setShowDemoModal(true);
                } else {
                  navigate(action.path);
                }
              }}
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

      {showDemoModal && <DemoShopModal
        onClose={() => setShowDemoModal(false)}
        onDone={() => setShowDemoModal(false)}
      />}
    </>
  );
};

export default AdminDashboard;

// ====== 一键演示店铺弹窗 ======
function DemoShopModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [shopName, setShopName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }} onClick={() => !creating && !result && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 28, maxWidth: 460, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <button style={{
          position: 'absolute', top: 12, right: 12, border: 'none', background: '#f3f4f6',
          width: 28, height: 28, borderRadius: 14, cursor: 'pointer', fontSize: 16, color: '#666',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { onClose(); setResult(null); setError(''); }}>×</button>

        {!result ? (
<>
<h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#1a1a2e' }}>🚀 一键创建演示店铺</h3>
<p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>
  自动新建用户、租户、菜单、10张餐桌，直接发给朋友体验
</p>

{error && (
  <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
    ⚠️ {error}
  </div>
)}

<div style={{ marginBottom: 14 }}>
  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 4 }}>店铺名称 *</label>
  <input value={shopName} onChange={e => setShopName(e.target.value)}
    placeholder="例如：张三川菜馆" disabled={creating}
    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
</div>
<div style={{ marginBottom: 20 }}>
  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 4 }}>联系人手机</label>
  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
    placeholder="选填" disabled={creating}
    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
</div>

<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
  <button onClick={onClose} disabled={creating}
    style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#666', cursor: creating ? 'not-allowed' : 'pointer', fontSize: 14, opacity: creating ? 0.6 : 1 }}>
    取消</button>
  <button onClick={async () => {
    if (!shopName.trim()) { setError('请输入店铺名称'); return; }
    setError(''); setCreating(true);
    try {
      const token = localStorage.getItem('qilin_access_token');
      const res = await fetch('/api/admin/demo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopName: shopName.trim(), contactPhone }),
      });
      const json = await res.json();
      if (json.code === 200) setResult(json.data);
      else setError(json.error || '创建失败');
    } catch (e: any) { setError(e.message || '网络错误'); }
    finally { setCreating(false); }
  }}
    disabled={creating || !shopName.trim()}
    style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: creating ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: (creating || !shopName.trim()) ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
    {creating ? '创建中...' : '🚀 立即创建'}</button>
</div>
</>
) : (
<>
<div style={{ textAlign: 'center', marginBottom: 20 }}>
  <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
  <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#1a1a2e' }}>演示店铺创建成功！</h3>
  <p style={{ margin: 0, fontSize: 13, color: '#888' }}>推荐用店长账号登录（界面更清爽）</p>
</div>

<div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 14, marginBottom: 8 }}>
  <div style={{ fontSize: 11, color: '#666', marginBottom: 4, fontWeight: 600 }}>店长账号（推荐）→ 直接管理店铺</div>
  <div style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: '#666', fontWeight: 600 }}>账号：</span><span style={{ color: '#059669', fontFamily: 'monospace', userSelect: 'all' }}>{result.storeAdminEmail}</span></div>
  <div style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: '#666', fontWeight: 600 }}>密码：</span><span style={{ color: '#059669', fontFamily: 'monospace', userSelect: 'all' }}>{result.storeAdminPassword}</span></div>
  <div style={{ fontSize: 13 }}><span style={{ color: '#666', fontWeight: 600 }}>登录：</span><a href={result.storeAdminUrl} target="_blank" rel="noreferrer" style={{ color: '#667eea', fontFamily: 'monospace', fontSize: 12 }}>{result.storeAdminUrl}</a></div>
</div>

<div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12, color: '#666' }}>
  <div style={{ marginBottom: 4, fontWeight: 600, color: '#666' }}>老板账号（进阶）→ 管理多家店</div>
  <div style={{ marginBottom: 2 }}><span style={{ color: '#666' }}>账号：</span><span style={{ fontFamily: 'monospace' }}>{result.ownerEmail}</span> <span style={{ color: '#666' }}>密码：</span><span style={{ fontFamily: 'monospace' }}>{result.ownerPassword}</span></div>
  <div style={{}}>店铺试用期至 {new Date(result.trialEndsAt).toLocaleDateString('zh-CN')}（30天）</div>
</div>

<div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: '#92400e' }}>
  💡 把店长账号发给店家，直接用店长端登录管理店铺
</div>

<div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
  <button onClick={() => {
    const text = `🎉 体验账号已开通！\n\n店铺：${result.shopName}\n\n【店长账号】\n登录：${result.storeAdminUrl}\n账号：${result.storeAdminEmail}\n密码：${result.storeAdminPassword}\n\n【老板账号】\n账号：${result.ownerEmail}\n密码：${result.ownerPassword}\n\n试用期：30天`;
    navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板！'));
  }}
    style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#333', cursor: 'pointer', fontSize: 14 }}>
  📋 复制全部</button>
  <button onClick={() => { setResult(null); setShopName(''); setContactPhone(''); }}
    style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
  继续创建</button>
</div>
</>
)}
      </div>
    </div>
  );
}
