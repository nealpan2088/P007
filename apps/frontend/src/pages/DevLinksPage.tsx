import React from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES, ADMIN_ROUTES, TENANT_ROUTES } from '../config/routes';

/** 开发测试入口 - 规范链接导航页 */
const DevLinksPage: React.FC = () => {
  const sections = [
    {
      title: '🏠 首页 & 公共页面',
      links: [
        { name: '官方网站首页', to: PUBLIC_ROUTES.HOME, desc: '推广落地页' },
        { name: '场景介绍', to: PUBLIC_ROUTES.PUBLIC.SCAN_DEMO, desc: '扫码点餐引导页' },
        { name: '升级套餐', to: PUBLIC_ROUTES.UPGRADE_PLAN, desc: '套餐升级申请' },
        { name: '服务条款', to: PUBLIC_ROUTES.PUBLIC.TERMS, desc: '法律条款页' },
        { name: '隐私政策', to: PUBLIC_ROUTES.PUBLIC.PRIVACY, desc: '隐私说明页' },
      ],
    },
    {
      title: '🔐 登录 & 注册',
      links: [
        { name: '通用登录', to: PUBLIC_ROUTES.AUTH.LOGIN, desc: '邮箱/用户名登录' },
        { name: '超管登录', to: PUBLIC_ROUTES.AUTH.ADMIN_LOGIN, desc: '管理员入口' },
        { name: '商户登录', to: PUBLIC_ROUTES.AUTH.TENANT_LOGIN, desc: '租户管理员入口' },
        { name: '店长登录', to: '/store-admin/login', desc: '店长独立入口' },
        { name: '忘记密码', to: PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD, desc: '邮箱重置' },
        { name: '用户注册', to: PUBLIC_ROUTES.AUTH.REGISTER, desc: '已关闭-邀请制' },
      ],
    },
    {
      title: '📱 扫码点餐（测试路径）',
      links: [
        { name: '扫码点餐A01桌', to: '/t/qilin-test/s/qilin-test-restaurant/scan/A01', desc: '麒麟测试餐厅-23道菜' },
        { name: '扫码点餐B01桌', to: '/t/qilin-test/s/qilin-test-restaurant/scan/B01', desc: '麒麟测试餐厅-B区' },
        { name: '旧规范扫码', to: '/scan/cmob7gm2s0005l7pzkio01udf/A01', desc: '老路径兼容' },
      ],
    },
    {
      title: '🏢 租户后台（需登录）',
      links: [
        { name: '租户店铺管理', to: '/t/t_evk2mbjx/stores', desc: 'phj112@163.com体验账户', loginNote: true },
        { name: '租户仪表板', to: '/t/t_evk2mbjx/dashboard', desc: '数据看板', loginNote: true },
        { name: '租户菜单管理', to: `/t/t_evk2mbjx/stores/cmob7gm2s0005l7pzkio01udf/menu`, desc: '管理菜品', loginNote: true },
        { name: '租户打印管理', to: `/t/t_evk2mbjx/stores/cmob7gm2s0005l7pzkio01udf/printers`, desc: '云打印配置', loginNote: true },
        { name: '租户订单管理', to: `/t/t_evk2mbjx/stores/cmob7gm2s0005l7pzkio01udf/orders`, desc: '查看订单', loginNote: true },
        { name: '租户餐桌管理', to: `/t/t_evk2mbjx/stores/cmob7gm2s0005l7pzkio01udf/tables`, desc: '管理桌台', loginNote: true },
      ],
    },
    {
      title: '👔 超管后台（admin@qilin.test）',
      links: [
        { name: '超管工作台', to: ADMIN_ROUTES.ADMIN, desc: '仪表板', loginNote: true },
        { name: '租户管理', to: ADMIN_ROUTES.TENANTS.LIST, desc: '管理所有租户', loginNote: true },
        { name: '店铺管理', to: ADMIN_ROUTES.STORES.LIST, desc: '管理所有店铺', loginNote: true },
        { name: '用户管理', to: ADMIN_ROUTES.USERS.LIST, desc: '管理所有用户', loginNote: true },
        { name: '菜品模板库', to: ADMIN_ROUTES.MENU_TEMPLATES.LIST, desc: '菜品素材管理', loginNote: true },
        { name: '夜狼配置', to: ADMIN_ROUTES.NIGHTWOLF.LIST, desc: '云打印业务配置', loginNote: true },
        { name: '系统设置', to: ADMIN_ROUTES.SYSTEM.SETTINGS, desc: '全局系统配置', loginNote: true },
      ],
    },
    {
      title: '👤 店长端（独立入口）',
      links: [
        { name: '店长首页', to: '/store-admin/', desc: '店铺卡片概览', loginNote: true },
        { name: '店长登录页', to: '/store-admin/login', desc: '紫色渐变页' },
      ],
    },
    {
      title: '🔧 测试工具 & 调试',
      links: [
        { name: '测试控制台', to: PUBLIC_ROUTES.PUBLIC.TEST_CONSOLE, desc: 'React路由验证' },
        { name: '测试租户', to: PUBLIC_ROUTES.PUBLIC.TEST_TENANTS, desc: '测试数据管理' },
        { name: '链接验证', to: PUBLIC_ROUTES.PUBLIC.LINK_VALIDATION, desc: 'URL链接检查' },
      ],
    },
    {
      title: '💡 快速参考',
      items: [
        { label: '超管账号', value: 'admin@qilin.test' },
        { label: '体验用户', value: 'phj112@163.com（OWNER / 租户 t_evk2mbjx）' },
        { label: '店长测试', value: 'storeadmin@test.com（需重置密码）' },
        { label: '业务微信', value: 'cattlesoft' },
        { label: 'API地址', value: 'https://saas.openyun.xin/api' },
        { label: '后端端口', value: '33038（PM2 cluster*2）' },
        { label: '前端端口', value: '5177（Vite dev）' },
        { label: '扫码测试', value: 'https://saas.openyun.xin/t/qilin-test/s/qilin-test-restaurant/scan/A01' },
      ],
    },
  ];

  const style: Record<string, React.CSSProperties> = {
    container: {
      maxWidth: 900,
      margin: '20px auto',
      padding: '0 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    header: {
      textAlign: 'center',
      padding: '24px 0 12px',
    },
    title: {
      fontSize: 22,
      fontWeight: 700,
      color: '#1a1a2e',
      margin: 0,
    },
    subtitle: {
      fontSize: 13,
      color: '#888',
      margin: '4px 0 0',
    },
    section: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: '#4338ca',
      marginBottom: 8,
      paddingBottom: 4,
      borderBottom: '2px solid #e0d6ff',
    },
    linkItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 10px',
      borderRadius: 6,
      marginBottom: 4,
      textDecoration: 'none',
      transition: 'background 0.15s',
    },
    linkName: {
      fontWeight: 600,
      fontSize: 13,
      color: '#1a1a2e',
    },
    linkDesc: {
      fontSize: 12,
      color: '#888',
      marginLeft: 8,
    },
    linkUrl: {
      fontSize: 11,
      color: '#7c3aed',
      fontFamily: 'monospace',
    },
    refCard: {
      background: '#f8f9ff',
      borderRadius: 8,
      padding: 16,
      marginTop: 12,
      fontSize: 13,
      lineHeight: 2,
    },
    refItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #eee',
      padding: '2px 0',
    },
    refLabel: {
      color: '#666',
      fontWeight: 600,
      minWidth: 80,
    },
    refValue: {
      color: '#1a1a2e',
      fontFamily: 'monospace',
      fontSize: 12,
      textAlign: 'right' as const,
    },
  };

  return (
    <div style={style.container}>
      <div style={style.header}>
        <h1 style={style.title}>🔗 麒麟管理后台 · 规范链接导航</h1>
        <p style={style.subtitle}>开发测试用 - 按角色和功能分类的所有入口</p>
      </div>

      {sections.map((section, i) => (
        <div key={i} style={style.section}>
          <div style={style.sectionTitle}>{section.title}</div>
          {'links' in section && section.links ? (
            section.links.map((link, j) => (
              <Link
                key={j}
                to={link.to}
                style={{
                  ...style.linkItem,
                  background: link.loginNote ? '#fafafe' : '#fff',
                  ...(link.name === '用户注册' ? { opacity: 0.6 } : {}),
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f0ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = link.loginNote ? '#fafafe' : '#fff'; }}
              >
                <div>
                  <span style={style.linkName}>{link.name}</span>
                  <span style={style.linkDesc}>{link.desc}</span>
                </div>
                <div style={style.linkUrl}>{link.to}</div>
              </Link>
            ))
          ) : (
            <div style={style.refCard}>
              {section.items?.map((item, j) => (
                <div key={j} style={style.refItem}>
                  <span style={style.refLabel}>{item.label}</span>
                  <span style={style.refValue}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ textAlign: 'center', margin: '30px 0', fontSize: 12, color: '#bbb' }}>
        麒麟云点餐 v0.4.0 · 开发测试页（仅供内部使用）
      </div>
    </div>
  );
};

export default DevLinksPage;
