import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ADMIN_ROUTES } from '../../config/routes';

export default function AdminDashboard() {
  const { user } = useAuth();

  const cards = [
    {
      title: '🏢 租户管理',
      desc: '管理所有注册租户、查看详情、编辑配置',
      link: ADMIN_ROUTES.TENANTS.LIST,
      roles: ['SUPER_ADMIN'],
    },
    {
      title: '📋 店铺管理',
      desc: '管理各租户下的店铺信息、装修和打印机',
      link: ADMIN_ROUTES.STORES.LIST,
      roles: ['SUPER_ADMIN'],
    },
    {
      title: '📦 菜单模板',
      desc: '管理菜品分类、菜单模板和定价',
      link: ADMIN_ROUTES.MENU_TEMPLATES.LIST,
      roles: ['SUPER_ADMIN'],
    },
    {
      title: '🖨️ 设备管理',
      desc: '统一管理云打印机、测试连接、查看状态',
      link: ADMIN_ROUTES.PRINTERS.LIST,
      roles: ['SUPER_ADMIN'],
    },
  ];

  const userData = user as any;
  const userTenants = userData.userTenants || [];

  return (
    <div className="admin-dashboard">
      <header className="dash-header">
        <h1>管理员控制台</h1>
        <p className="dash-user">
          {user?.username || user?.email}
          {user?.role === 'SUPER_ADMIN' && <span className="role-tag">超级管理员</span>}
        </p>
      </header>

      {/* 功能卡片 */}
      <section className="dash-section">
        <h2>系统管理</h2>
        <div className="dash-cards">
          {cards.map((card) => (
            <Link to={card.link} key={card.title} className="dash-card">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 关联的租户 */}
      {userTenants.length > 0 && (
        <section className="dash-section">
          <h2>我的租户</h2>
          <div className="dash-tenant-list">
            {userTenants.map((ut: any) => (
              <div className="dash-tenant-card" key={ut.id}>
                <div className="tenant-info">
                  <span className="tenant-name">{ut.name || ut.subdomain}</span>
                  <span className="tenant-role">{ut.role}</span>
                </div>
                <Link
                  to={`/t/${ut.subdomain}/dashboard`}
                  className="tenant-btn"
                >
                  进入管理 →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dash-section">
        <p className="dash-tip">
          💡 你还可以从上方导航栏直接访问各管理页面
        </p>
      </section>
    </div>
  );
}
