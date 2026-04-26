import React from 'react';

/**
 * 系统设置页面
 * 
 * 当前为占位页面，仅展示菜单项说明。
 * 后续将添加上线：
 * - 系统全局配置管理
 * - 操作日志查看
 * - 系统监控面板
 * - 数据维护工具
 */
export default function SystemSettingsPage() {
  return (
    <div className="system-settings-page" style={{ padding: '24px' }}>
      <h1>⚙️ 系统管理</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        系统全局配置与管理工具。功能开发中，敬请期待。
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        <FeatureCard
          icon="📋"
          title="操作日志"
          description="查看系统所有操作审计日志，追踪用户行为和系统变更记录。"
          status="开发中"
        />
        <FeatureCard
          icon="🔧"
          title="全局配置"
          description="管理系统全局参数，包括安全策略、会话超时、密码强度规则等。"
          status="开发中"
        />
        <FeatureCard
          icon="📊"
          title="系统监控"
          description="实时监控服务器资源、API 响应时间、错误率等运行指标。"
          status="开发中"
        />
        <FeatureCard
          icon="🗄️"
          title="数据维护"
          description="数据库备份、数据清理、索引优化等数据维护操作。"
          status="开发中"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  status,
}: {
  icon: string;
  title: string;
  description: string;
  status: string;
}) {
  const statusColors: Record<string, string> = {
    '开发中': '#f59e0b',
    '已完成': '#10b981',
    '待规划': '#9ca3af',
  };
  const color = statusColors[status] || '#9ca3af';

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      background: '#fff',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{title}</h3>
      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
        {description}
      </p>
      <span style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        color: '#fff',
        background: color,
      }}>
        {status}
      </span>
    </div>
  );
}
