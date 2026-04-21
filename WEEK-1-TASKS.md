# P007 云点餐SaaS平台 - 第1周开发任务

## 🎯 本周目标
建立多租户基础架构，完成认证和租户路由系统，搭建基础开发环境。

## 📅 每日任务分解

### 第1天 (2026-04-21)：项目初始化和数据库设计 ✅

#### 已完成任务：
1. ✅ 创建项目基础结构
   - 创建 `/home/admin/projects/P007/` 目录
   - 创建标准化的项目结构
   - 配置前端和后端基础框架

2. ✅ 设计多租户数据库架构
   - 设计公共schema (p007_public)
   - 设计租户schema (tenant_{tenant_id})
   - 创建完整的数据库设计文档

3. ✅ 创建Prisma schema文件
   - 定义所有数据模型
   - 配置多租户关系
   - 设置索引和约束

4. ✅ 配置开发环境
   - 前端: React 19 + TypeScript + Vite 7.3.2
   - 后端: Fastify 5.x + Node.js 20+
   - 数据库: PostgreSQL 15+
   - 端口分配: 前端5177, 后端33037

#### 今日成果：
- ✅ 项目基础结构完整
- ✅ 数据库设计文档完善
- ✅ Prisma schema文件创建完成
- ✅ 开发环境配置就绪

### 第2天 (2026-04-22)：认证服务开发

#### 任务列表：
1. **数据库迁移和初始化**
   - 创建数据库迁移脚本
   - 初始化公共schema表结构
   - 创建测试租户和用户数据

2. **用户认证API开发**
   - 用户注册API (`POST /api/auth/register`)
   - 用户登录API (`POST /api/auth/login`)
   - 用户信息获取API (`GET /api/auth/me`)
   - 用户登出API (`POST /api/auth/logout`)

3. **密码管理功能**
   - 密码重置请求API (`POST /api/auth/forgot-password`)
   - 密码重置确认API (`POST /api/auth/reset-password`)
   - 密码修改API (`POST /api/auth/change-password`)

4. **JWT Token管理**
   - Token生成和验证中间件
   - Token刷新机制
   - Token黑名单管理

5. **会话管理**
   - 会话创建和验证
   - 设备信息记录
   - 会话过期处理

#### 技术要点：
- 使用bcrypt进行密码哈希
- 使用JWT进行身份认证
- 实现完整的错误处理
- 添加请求验证和输入清理

#### 验收标准：
- ✅ 用户注册/登录功能正常
- ✅ JWT Token生成和验证正常
- ✅ 密码重置流程完整
- ✅ 会话管理功能完善

### 第3天 (2026-04-23)：租户路由系统

#### 任务列表：
1. **子域名路由中间件**
   - 解析请求子域名
   - 验证租户存在性和状态
   - 设置租户上下文

2. **动态数据库连接**
   - 根据租户ID动态切换数据库连接
   - 连接池管理
   - 连接错误处理

3. **租户schema管理**
   - 租户创建时自动创建schema
   - schema迁移和更新
   - schema备份和恢复

4. **租户配置API**
   - 租户信息获取API (`GET /api/tenants/:id`)
   - 租户配置更新API (`PUT /api/tenants/:id`)
   - 租户状态管理API (`POST /api/tenants/:id/status`)

5. **多租户测试**
   - 创建多个测试租户
   - 测试数据隔离性
   - 测试性能影响

#### 技术要点：
- 使用Fastify插件系统
- 实现数据库连接池
- 添加请求日志记录
- 实现租户级缓存

#### 验收标准：
- ✅ 子域名路由正常工作
- ✅ 租户数据完全隔离
- ✅ 动态数据库连接稳定
- ✅ 租户管理API完整

### 第4天 (2026-04-24)：基础店铺管理API

#### 任务列表：
1. **店铺CRUD API**
   - 创建店铺API (`POST /api/stores`)
   - 获取店铺列表API (`GET /api/stores`)
   - 获取单个店铺API (`GET /api/stores/:id`)
   - 更新店铺API (`PUT /api/stores/:id`)
   - 删除店铺API (`DELETE /api/stores/:id`)

2. **员工管理API**
   - 添加员工API (`POST /api/stores/:storeId/staff`)
   - 获取员工列表API (`GET /api/stores/:storeId/staff`)
   - 更新员工权限API (`PUT /api/stores/:storeId/staff/:userId`)
   - 移除员工API (`DELETE /api/stores/:storeId/staff/:userId`)

3. **权限控制 (RBAC)**
   - 角色定义 (owner, manager, staff)
   - 权限检查中间件
   - 操作日志记录

4. **店铺配置API**
   - 获取配置API (`GET /api/stores/:id/settings`)
   - 更新配置API (`PUT /api/stores/:id/settings`)
   - 配置验证和默认值

5. **API文档生成**
   - 使用Swagger/OpenAPI
   - 自动生成API文档
   - 添加示例和说明

#### 技术要点：
- 实现完整的CRUD操作
- 添加数据验证和清理
- 实现软删除机制
- 添加分页和筛选

#### 验收标准：
- ✅ 店铺管理API完整
- ✅ 员工管理功能正常
- ✅ 权限控制有效
- ✅ API文档完整

### 第5天 (2026-04-25)：前端项目结构

#### 任务列表：
1. **React项目初始化**
   - 创建React TypeScript项目
   - 配置路由系统 (React Router v6)
   - 配置状态管理 (Zustand)
   - 配置HTTP客户端 (Axios)

2. **认证界面开发**
   - 登录页面
   - 注册页面
   - 密码重置页面
   - 用户信息页面

3. **布局组件开发**
   - 主布局组件
   - 导航菜单组件
   - 页头页脚组件
   - 加载状态组件

4. **API客户端集成**
   - 创建API客户端实例
   - 添加请求拦截器 (Token注入)
   - 添加响应拦截器 (错误处理)
   - 实现自动重试机制

5. **开发工具配置**
   - 配置热重载
   - 配置代码规范检查
   - 配置类型检查
   - 配置构建优化

#### 技术要点：
- 使用React函数组件和Hooks
- 实现响应式设计
- 添加国际化支持基础
- 实现主题切换基础

#### 验收标准：
- ✅ 前端项目结构完整
- ✅ 认证界面功能正常
- ✅ API客户端集成稳定
- ✅ 开发工具配置完善

## 🔧 技术实施细节

### 数据库迁移脚本
```bash
# 创建数据库
createdb p007_saas

# 运行Prisma迁移
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate

# 创建测试数据
npx tsx scripts/seed.ts
```

### 认证服务API设计
```typescript
// 用户注册请求
interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  tenantName: string; // 租户名称
  subdomain: string; // 子域名
}

// 用户登录请求
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// 登录响应
interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  message?: string;
}
```

### 租户路由中间件
```typescript
// 租户识别中间件
async function tenantMiddleware(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    // 从子域名提取租户ID
    const hostname = request.hostname;
    const subdomain = extractSubdomain(hostname);
    
    if (!subdomain || subdomain === 'www' || subdomain === 'app') {
      // 主域名访问，使用默认租户或重定向
      return;
    }
    
    // 查询租户信息
    const tenant = await findTenantBySubdomain(subdomain);
    if (!tenant || tenant.status !== 'active') {
      throw new Error('Tenant not found or inactive');
    }
    
    // 设置租户上下文
    request.tenant = tenant;
    
    // 设置数据库连接
    await setTenantDatabaseConnection(tenant.id);
  });
}
```

### 前端路由配置
```typescript
// 路由配置
const ROUTES = {
  // 公共路由
  PUBLIC: {
    HOME: '/',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // 认证后路由
  AUTH: {
    DASHBOARD: '/dashboard',
    STORES: '/stores',
    ORDERS: '/orders',
    MENU: '/menu',
    SETTINGS: '/settings',
  },
  
  // 工具函数
  utils: {
    buildStoreRoute: (storeId: string) => `/stores/${storeId}`,
    buildOrderRoute: (orderId: string) => `/orders/${orderId}`,
  }
};
```

## 📊 质量检查清单

### 第1天检查清单 ✅
- [x] 项目目录结构完整
- [x] 数据库设计文档完善
- [x] Prisma schema文件创建
- [x] 开发环境配置完成
- [x] 项目文档更新

### 第2天检查清单
- [ ] 数据库迁移脚本完成
- [ ] 用户认证API开发完成
- [ ] JWT Token管理实现
- [ ] 密码管理功能完整
- [ ] 单元测试编写

### 第3天检查清单
- [ ] 子域名路由中间件完成
- [ ] 动态数据库连接稳定
- [ ] 租户schema管理功能
- [ ] 租户配置API完整
- [ ] 多租户测试通过

### 第4天检查清单
- [ ] 店铺管理API完整
- [ ] 员工管理功能正常
- [ ] 权限控制有效
- [ ] API文档生成
- [ ] 集成测试通过

### 第5天检查清单
- [ ] React项目初始化完成
- [ ] 认证界面开发完成
- [ ] 布局组件开发完成
- [ ] API客户端集成稳定
- [ ] 开发工具配置完善

## 🚀 本周交付物

### 代码交付物
1. **完整的后端API服务**
   - 认证服务API
   - 租户管理API
   - 店铺管理API
   - 完整的API文档

2. **前端基础框架**
   - React项目结构
   - 认证界面
   - 基础布局组件
   - API客户端集成

3. **数据库结构**
   - 公共schema表结构
   - 租户schema表结构
   - 测试数据
   - 迁移脚本

### 文档交付物
1. **技术文档**
   - API接口文档
   - 数据库设计文档
   - 部署配置文档
   - 开发环境配置指南

2. **用户文档**
   - 快速开始指南
   - 用户手册大纲
   - 常见问题解答

### 测试交付物
1. **单元测试套件**
   - 认证服务测试
   - 租户管理测试
   - 店铺管理测试

2. **集成测试套件**
   - API端点测试
   - 数据库操作测试
   - 多租户隔离测试

## 📞 沟通计划

### 每日站会 (09:00)
- 昨日完成情况
- 今日计划任务
- 遇到的问题和风险
- 需要协助的事项

### 代码审查 (每日下班前)
- 提交代码审查请求
- 审查反馈和修改
- 代码合并和部署

### 周度评审 (周五16:00)
- 本周成果展示
- 下周计划确认
- 问题讨论和解决
- 技术决策确认

---

**文档版本**: v1.0.0  
**最后更新**: 2026-04-21  
**负责人**: 旺财 (技术负责人)