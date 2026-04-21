# P007 云点餐SaaS平台 - 数据库设计文档

## 📋 设计原则

### 多租户架构
采用 **Schema隔离模式**，每个租户拥有独立的数据库schema，确保数据完全隔离和安全。

### 命名规范
- **公共schema**: `p007_public` (存储租户、用户等公共信息)
- **租户schema**: `tenant_{tenant_id}` (每个租户独立的数据空间)
- **表名**: 小写蛇形命名，如 `menu_items`
- **字段名**: 小写蛇形命名，如 `created_at`

### 数据类型
- **主键**: UUID (使用 `gen_random_uuid()`)
- **时间戳**: TIMESTAMP WITH TIME ZONE
- **金额**: DECIMAL(10, 2) (精确到分)
- **状态字段**: VARCHAR(50) 或 ENUM类型
- **JSON数据**: JSONB (支持索引和查询)

## 🏗️ 数据库Schema设计

### 公共Schema (p007_public)

#### 1. 租户表 (tenants)
存储平台所有租户（餐厅）的基本信息。

```sql
CREATE TABLE p007_public.tenants (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  
  -- 联系信息
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_person VARCHAR(100),
  
  -- 业务信息
  plan VARCHAR(50) NOT NULL DEFAULT 'free', -- free, basic, premium, enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, cancelled
  trial_ends_at TIMESTAMP,
  billing_cycle VARCHAR(50) DEFAULT 'monthly', -- monthly, yearly
  
  -- 配置
  settings JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_tenants_subdomain ON p007_public.tenants(subdomain);
CREATE INDEX idx_tenants_status ON p007_public.tenants(status);
CREATE INDEX idx_tenants_plan ON p007_public.tenants(plan);
```

#### 2. 用户表 (users)
存储平台用户信息，支持多租户用户管理。

```sql
CREATE TABLE p007_public.users (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES p007_public.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  
  -- 认证信息
  password_hash VARCHAR(255) NOT NULL,
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMP,
  
  -- 个人信息
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  phone VARCHAR(50),
  
  -- 权限和角色
  role VARCHAR(50) NOT NULL DEFAULT 'staff', -- super_admin, admin, manager, staff
  permissions JSONB DEFAULT '[]',
  
  -- 状态
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE UNIQUE INDEX idx_users_email ON p007_public.users(email);
CREATE INDEX idx_users_tenant_id ON p007_public.users(tenant_id);
CREATE INDEX idx_users_role ON p007_public.users(role);
CREATE INDEX idx_users_is_active ON p007_public.users(is_active);
```

#### 3. 会话表 (sessions)
存储用户会话信息，支持JWT Token管理。

```sql
CREATE TABLE p007_public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES p007_public.users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- 会话有效期
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_sessions_user_id ON p007_public.sessions(user_id);
CREATE INDEX idx_sessions_token ON p007_public.sessions(token);
CREATE INDEX idx_sessions_expires_at ON p007_public.sessions(expires_at);
```

### 租户Schema (tenant_{tenant_id})

每个租户创建独立的schema，包含以下表：

#### 1. 店铺表 (stores)
一个租户可以有多个店铺（分店）。

```sql
CREATE TABLE tenant_{tenant_id}.stores (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- 店铺代码，如 "ST001"
  
  -- 联系信息
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- 位置信息
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
  
  -- 营业信息
  opening_hours JSONB DEFAULT '{}', -- {monday: {open: "09:00", close: "22:00"}, ...}
  is_24_hours BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- 配置
  settings JSONB DEFAULT '{
    "tax_rate": 0.06,
    "service_charge": 0.10,
    "currency": "CNY",
    "language": "zh-CN"
  }',
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_stores_code ON tenant_{tenant_id}.stores(code);
CREATE INDEX idx_stores_is_active ON tenant_{tenant_id}.stores(is_active);
```

#### 2. 餐桌表 (tables)
每个店铺的餐桌信息。

```sql
CREATE TABLE tenant_{tenant_id}.tables (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES tenant_{tenant_id}.stores(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  display_name VARCHAR(100),
  
  -- 餐桌属性
  capacity INTEGER NOT NULL DEFAULT 4,
  min_capacity INTEGER DEFAULT 1,
  max_capacity INTEGER DEFAULT 10,
  area VARCHAR(100), -- 区域，如 "大厅", "包间", "露台"
  
  -- 状态
  status VARCHAR(50) DEFAULT 'available', -- available, occupied, reserved, cleaning, maintenance
  current_order_id UUID, -- 当前订单ID
  
  -- 二维码
  qr_code_url VARCHAR(500),
  qr_code_data TEXT, -- 二维码数据
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tables_store_id ON tenant_{tenant_id}.tables(store_id);
CREATE INDEX idx_tables_table_number ON tenant_{tenant_id}.tables(table_number);
CREATE INDEX idx_tables_status ON tenant_{tenant_id}.tables(status);
CREATE UNIQUE INDEX idx_tables_store_table ON tenant_{tenant_id}.tables(store_id, table_number);
```

#### 3. 菜单分类表 (menu_categories)
菜品分类管理。

```sql
CREATE TABLE tenant_{tenant_id}.menu_categories (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES tenant_{tenant_id}.stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- 显示属性
  icon VARCHAR(100),
  color VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  
  -- 状态
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_menu_categories_store_id ON tenant_{tenant_id}.menu_categories(store_id);
CREATE INDEX idx_menu_categories_sort_order ON tenant_{tenant_id}.menu_categories(sort_order);
CREATE INDEX idx_menu_categories_is_active ON tenant_{tenant_id}.menu_categories(is_active);
```

#### 4. 菜品表 (menu_items)
菜品详细信息。

```sql
CREATE TABLE tenant_{tenant_id}.menu_items (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES tenant_{tenant_id}.menu_categories(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES tenant_{tenant_id}.stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- 价格信息
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  
  -- 属性
  unit VARCHAR(50) DEFAULT '份',
  preparation_time INTEGER, -- 准备时间（分钟）
  spice_level INTEGER DEFAULT 0, -- 辣度等级 0-5
  tags JSONB DEFAULT '[]', -- ["推荐", "招牌", "辣", "素食"]
  
  -- 图片和展示
  image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  
  -- 库存和状态
  stock_quantity INTEGER, -- null表示无限库存
  is_available BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  
  -- 营养成分（可选）
  nutrition JSONB DEFAULT '{}',
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_menu_items_category_id ON tenant_{tenant_id}.menu_items(category_id);
CREATE INDEX idx_menu_items_store_id ON tenant_{tenant_id}.menu_items(store_id);
CREATE INDEX idx_menu_items_price ON tenant_{tenant_id}.menu_items(price);
CREATE INDEX idx_menu_items_is_available ON tenant_{tenant_id}.menu_items(is_available);
CREATE INDEX idx_menu_items_sort_order ON tenant_{tenant_id}.menu_items(sort_order);
```

#### 5. 订单表 (orders)
顾客订单信息。

```sql
CREATE TABLE tenant_{tenant_id}.orders (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES tenant_{tenant_id}.stores(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tenant_{tenant_id}.tables(id),
  order_number VARCHAR(100) UNIQUE NOT NULL, -- 格式: ORD{日期}{序号}
  
  -- 顾客信息
  customer_info JSONB DEFAULT '{
    "name": "",
    "phone": "",
    "guest_count": 1,
    "notes": ""
  }',
  
  -- 订单内容
  items JSONB NOT NULL, -- [{id, name, price, quantity, total, notes}]
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  service_charge DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- 订单状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, ready, served, completed, cancelled
  status_history JSONB DEFAULT '[]', -- [{status, timestamp, notes}]
  
  -- 支付信息
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid, refunded, partially_refunded
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  paid_at TIMESTAMP,
  
  -- 打印信息
  print_status VARCHAR(50) DEFAULT 'pending', -- pending, printed, failed
  print_job_id VARCHAR(255),
  print_attempts INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_orders_store_id ON tenant_{tenant_id}.orders(store_id);
CREATE INDEX idx_orders_table_id ON tenant_{tenant_id}.orders(table_id);
CREATE INDEX idx_orders_order_number ON tenant_{tenant_id}.orders(order_number);
CREATE INDEX idx_orders_status ON tenant_{tenant_id}.orders(status);
CREATE INDEX idx_orders_payment_status ON tenant_{tenant_id}.orders(payment_status);
CREATE INDEX idx_orders_created_at ON tenant_{tenant_id}.orders(created_at);
```

#### 6. 打印机表 (printers)
打印机配置信息。

```sql
CREATE TABLE tenant_{tenant_id}.printers (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES tenant_{tenant_id}.stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL, -- 打印机代码，如 "KITCHEN", "BAR", "CASHIER"
  
  -- 打印机类型
  type VARCHAR(50) NOT NULL, -- shangpeng, local_network, usb, bluetooth
  brand VARCHAR(100), -- 品牌，如 "商鹏云", "佳博", "芯烨"
  model VARCHAR(100), -- 型号
  
  -- 配置信息
  config JSONB NOT NULL, -- 品牌特定配置
  paper_width INTEGER DEFAULT 80, -- 纸张宽度(mm)
  paper_type VARCHAR(50) DEFAULT 'thermal', -- thermal, normal
  
  -- 连接状态
  connection_status VARCHAR(50) DEFAULT 'disconnected', -- connected, disconnected, error
  last_connected_at TIMESTAMP,
  last_error TEXT,
  
  -- 打印统计
  total_prints INTEGER DEFAULT 0,
  successful_prints INTEGER DEFAULT 0,
  failed_prints INTEGER DEFAULT 0,
  
  -- 状态
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- 默认打印机
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_printers_store_id ON tenant_{tenant_id}.printers(store_id);
CREATE INDEX idx_printers_type ON tenant_{tenant_id}.printers(type);
CREATE INDEX idx_printers_is_active ON tenant_{tenant_id}.printers(is_active);
CREATE UNIQUE INDEX idx_printers_store_code ON tenant_{tenant_id}.printers(store_id, code);
```

#### 7. 打印任务表 (print_jobs)
打印任务队列管理。

```sql
CREATE TABLE tenant_{tenant_id}.print_jobs (
  -- 主键和标识
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES tenant_{tenant_id}.printers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES tenant_{tenant_id}.orders(id),
  
  -- 任务信息
  job_type VARCHAR(50) NOT NULL, -- order, receipt, test, report
  content TEXT NOT NULL, -- 打印内容
  content_type VARCHAR(50) DEFAULT 'text', -- text, html, image
  
  -- 任务状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- 执行信息
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  
  -- 结果
  external_job_id VARCHAR(255), -- 外部打印任务ID
  print_result JSONB, -- 打印结果
  
  -- 优先级
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=urgent
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_print_jobs_printer_id ON tenant_{tenant_id}.print_jobs(printer_id);
CREATE INDEX idx_print_jobs_order_id ON tenant_{tenant_id}.print_jobs(order_id);
CREATE INDEX idx_print_jobs_status ON tenant_{tenant_id}.print_jobs(status);
CREATE INDEX idx_print_jobs_created_at ON tenant_{tenant_id}.print_jobs(created_at);
CREATE INDEX idx_print_jobs_priority ON tenant_{tenant_id}.print_jobs(priority);
```

## 🔄 数据库迁移策略

### 初始迁移
```sql
-- 1. 创建公共schema
CREATE SCHEMA IF NOT EXISTS p007_public;

-- 2. 创建公共表
-- (执行上面的CREATE TABLE语句)

-- 3. 为每个租户创建独立schema
CREATE SCHEMA tenant_{tenant_id};

-- 4. 在租户schema中创建表
-- (执行上面的CREATE TABLE语句)
```

### 租户创建流程
1. 在 `tenants` 表中插入新租户记录
2. 动态创建租户schema: `CREATE SCHEMA tenant_{new_tenant_id}`
3. 在租户schema中创建所有表结构
4. 插入默认数据（默认店铺、默认打印机配置等）

### 数据备份策略
1. **公共数据**: 每日备份 `p007_public` schema
2. **租户数据**: 每个租户独立备份
3. **