# P007-项目麒麟 - 架构设计文档

## 📋 项目概述

### 项目目标
构建一个现代化的多店铺扫码点餐SaaS平台，支持云打印集成，为中小型餐厅提供完整的数字化解决方案。

### 核心价值
1. **降低技术门槛** - 餐厅无需自建技术团队
2. **提高运营效率** - 扫码点餐减少人工成本
3. **统一管理** - 多店铺集中管理，数据统一分析
4. **灵活扩展** - 支持店铺数量弹性扩展

## 🏗️ 技术架构

### 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                        前端应用层                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  顾客扫码端  │  │  店铺管理端  │  │  平台管理端  │        │
│  │  (React PWA) │  │  (React Web) │  │  (React Web) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        API网关层                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │             身份认证 + 租户路由 + 限流                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       业务服务层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  店铺服务    │  │  订单服务    │  │  打印服务    │        │
│  │ (Fastify)   │  │ (Fastify)   │  │ (Fastify)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据存储层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PostgreSQL  │  │   Redis     │  │   MinIO     │        │
│  │ (主数据库)   │  │ (缓存/会话)  │  │ (文件存储)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 多租户架构设计

#### 方案选择：Schema隔离模式
```sql
-- 每个租户一个独立的schema
-- 公共schema: p007_public (存储租户信息、配置等)
-- 租户schema: tenant_<id> (每个租户独立的数据空间)

-- 优点：
-- 1. 数据完全隔离，安全性高
-- 2. 备份恢复简单
-- 3. 性能可预测
-- 4. 适合中小规模SaaS
```

#### 租户识别机制
1. **子域名识别**: `{tenant}.cloud-dining.com`
2. **请求头识别**: `X-Tenant-ID: {tenant_id}`
3. **JWT Token携带**: Token中包含租户信息

### 数据库设计

#### 公共表 (p007_public schema)
```sql
-- 租户表
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户表 (平台用户)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff', -- admin, manager, staff
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 租户表 (tenant_<id> schema)
```sql
-- 店铺信息 (每个租户可以有多个店铺)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 餐桌表
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  table_number VARCHAR(50) NOT NULL,
  qr_code_url VARCHAR(500),
  capacity INTEGER DEFAULT 4,
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 菜单分类
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 菜品
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES menu_categories(id),
  store_id UUID REFERENCES stores(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 订单
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  table_id UUID REFERENCES tables(id),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_info JSONB, -- {name, phone, guestCount, notes}
  items JSONB NOT NULL, -- [{menuItemId, name, price, quantity, total}]
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid, refunded
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 打印机配置
CREATE TABLE printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- shangpeng, local_network, usb
  config JSONB NOT NULL, -- 品牌特定配置
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 服务设计

### 1. 认证服务 (Auth Service)
- 用户注册/登录
- JWT Token生成/验证
- 租户上下文管理
- 权限控制 (RBAC)

### 2. 店铺服务 (Store Service)
- 店铺基本信息管理
- 餐桌管理 (CRUD)
- 菜单管理 (分类、菜品)
- 店铺配置

### 3. 订单服务 (Order Service)
- 扫码点餐订单创建
- 订单状态管理
- 订单查询和统计
- 支付集成 (预留)

### 4. 打印服务 (Print Service)
- 多品牌打印机支持
- 订单自动打印
- 打印机状态监控
- 打印任务队列

### 5. 统计服务 (Analytics Service)
- 销售数据统计
- 顾客行为分析
- 库存预警
- 财务报表

## 🚀 开发计划

### 第一阶段：基础架构 (第1周)
1. 多租户数据库设计
2. 认证和租户路由系统
3. 基础店铺管理API
4. 前端项目结构搭建

### 第二阶段：核心功能 (第2-3周)
1. 扫码点餐功能
2. 菜单管理功能
3. 订单管理系统
4. 云打印集成

### 第三阶段：高级功能 (第4-5周)
1. 统计分析功能
2. 多店铺管理
3. 支付集成
4. 移动端优化

### 第四阶段：优化和部署 (第6周)
1. 性能优化
2. 安全加固
3. 生产环境部署
4. 监控和告警

## 📊 技术栈选择

### 后端技术栈
- **运行时**: Node.js 20+
- **框架**: Fastify 5.x (高性能)
- **数据库**: PostgreSQL 15+ (多租户)
- **ORM**: Prisma 7.x (类型安全)
- **缓存**: Redis (会话/缓存)
- **文件存储**: MinIO/S3 (图片存储)
- **消息队列**: Bull (打印任务队列)

### 前端技术栈
- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7.3.2 (稳定版)
- **状态管理**: Zustand (轻量级)
- **UI组件库**: Ant Design 5.x
- **路由**: React Router v6
- **HTTP客户端**: Axios + 拦截器

### 开发工具
- **代码规范**: ESLint + Prettier
- **测试**: Vitest + React Testing Library
- **类型检查**: TypeScript 5.x
- **容器化**: Docker + Docker Compose
- **部署**: PM2 / Docker Swarm

## 🔐 安全设计

### 数据安全
1. **租户数据隔离**: Schema级别隔离
2. **数据加密**: 敏感字段加密存储
3. **备份策略**: 每日自动备份，保留30天

### 应用安全
1. **认证授权**: JWT + RBAC权限控制
2. **API安全**: 输入验证、输出编码、速率限制
3. **HTTPS**: 全站HTTPS加密

### 运维安全
1. **访问控制**: 最小权限原则
2. **日志审计**: 完整操作日志
3. **监控告警**: 异常行为检测

## 📈 扩展性设计

### 水平扩展
1. **无状态服务**: 服务节点无状态，方便扩展
2. **数据库分片**: 按租户ID分片
3. **缓存层**: Redis缓存热点数据

### 功能扩展
1. **插件架构**: 支持功能插件
2. **Webhook**: 支持第三方集成
3. **API版本**: 支持API版本管理

## 🎯 成功指标

### 技术指标
- API响应时间 < 200ms (P95)
- 系统可用性 > 99.9%
- 并发用户支持 > 1000
- 数据备份恢复时间 < 1小时

### 业务指标
- 店铺注册转化率 > 30%
- 用户留存率 > 80% (30天)
- 订单处理效率提升 > 50%
- 客户满意度 > 4.5/5

---

**文档版本**: v1.0.0  
**最后更新**: 2026-04-21  
**负责人**: 旺财 (技术架构师)