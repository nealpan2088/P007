# 麒麟项目 - 配置规范化指南

## 🎯 核心原则

**所有配置必须通过环境变量管理，禁止在代码中硬编码任何配置值！**

## 📁 配置文件结构

### 后端配置 (`apps/backend/`)
```
src/config/
├── index.js          # 统一配置管理系统
├── routes.js         # API路由常量管理
└── (未来扩展)
```

### 前端配置 (`apps/frontend/`)
```
src/config/
├── index.ts          # 统一配置管理系统
└── (未来扩展)
```

### 环境变量文件
```
# 后端
apps/backend/
├── .env.example      # 环境变量示例
├── .env.development  # 开发环境配置
├── .env.production   # 生产环境配置
└── .env.local        # 本地覆盖配置（不提交）

# 前端  
apps/frontend/
├── .env.example      # 环境变量示例
├── .env.development  # 开发环境配置
├── .env.production   # 生产环境配置
└── .env.local        # 本地覆盖配置（不提交）
```

## 🔧 配置管理系统

### 后端配置系统 (`src/config/index.js`)

#### 配置分类：
1. **服务器配置** (`serverConfig`)
   - 环境、端口、API前缀、CORS等
   
2. **数据库配置** (`databaseConfig`)
   - 连接URL、连接池、多租户schema等
   
3. **认证配置** (`authConfig`)
   - JWT、密码策略、会话管理等
   
4. **租户配置** (`tenantConfig`)
   - 子域名、套餐计划、试用期、计费等
   
5. **业务配置** (`businessConfig`)
   - 店铺设置、订单配置、打印配置等
   
6. **安全配置** (`securityConfig`)
   - 速率限制、安全头、审计日志等
   
7. **监控配置** (`monitoringConfig`)
   - 健康检查、指标、告警等

#### 使用方式：
```javascript
// 导入配置
import config from './config/index.js'

// 使用配置
const port = config.server.port
const dbUrl = config.database.url
const jwtSecret = config.auth.jwtSecret

// 验证配置
config.validate()
```

### API路由管理系统 (`src/config/routes.js`)

#### 路由分类：
1. **公共路由** (`PUBLIC_ROUTES`)
   - 无需认证的API，如健康检查、认证、公共信息
   
2. **租户路由** (`TENANT_ROUTES`)
   - 需要租户上下文的API，如店铺、菜单、订单管理
   
3. **顾客路由** (`CUSTOMER_ROUTES`)
   - 扫码点餐相关API
   
4. **管理路由** (`ADMIN_ROUTES`)
   - 平台管理API，需要管理员权限

#### 使用方式：
```javascript
// 导入路由
import routes from './config/routes.js'

// 使用路由常量
fastify.get(routes.public.HEALTH, handler)
fastify.post(routes.public.AUTH.REGISTER, handler)
fastify.get(routes.tenant.STORES.LIST, handler)

// 使用工具函数
const url = routes.utils.buildUrl(routes.tenant.STORES.DETAIL, { storeId: '123' })
```

### 前端配置系统 (`src/config/index.ts`)

#### 配置分类：
1. **应用配置** (`appConfig`)
   - 应用名称、版本、元数据等
   
2. **API配置** (`apiConfig`)
   - API端点、超时、请求配置等
   
3. **功能配置** (`featureConfig`)
   - 功能开关、可用功能检查
   
4. **业务配置** (`businessConfig`)
   - 本地化、店铺、订单、打印配置
   
5. **第三方配置** (`thirdPartyConfig`)
   - 分析、监控、支付服务集成
   
6. **开发配置** (`devConfig`)
   - 开发服务器、工具、模拟数据
   
7. **路由配置** (`routeConfig`)
   - 前端路由管理

#### 使用方式：
```typescript
// 导入配置
import config from './config'

// 使用配置
const appName = config.app.name
const apiUrl = config.api.baseUrl
const features = config.feature.getAvailableFeatures()

// 构建API URL
const storeUrl = config.api.utils.buildApiUrl(
  config.api.endpoints.stores.detail,
  { id: '123' },
  { include: 'staff,menu' }
)

// 构建路由URL
const storeRoute = config.route.utils.buildRoute(
  config.route.tenant.stores.detail,
  { id: '123' }
)
```

## 🚫 禁止的做法

### ❌ 硬编码配置（绝对禁止！）
```javascript
// ❌ 错误！硬编码端口
const port = 33037

// ❌ 错误！硬编码API路径
app.get('/api/v1/auth/login', handler)

// ❌ 错误！硬编码数据库配置
const dbUrl = 'postgresql://user:pass@localhost:5432/db'

// ❌ 错误！硬编码密钥
const jwtSecret = 'my-secret-key'
```

### ✅ 正确的做法
```javascript
// ✅ 正确！使用环境变量
import config from './config'
const port = config.server.port

// ✅ 正确！使用路由常量
import routes from './config/routes'
app.get(routes.public.AUTH.LOGIN, handler)

// ✅ 正确！使用配置系统
const dbUrl = config.database.url
const jwtSecret = config.auth.jwtSecret
```

## 🔄 环境管理

### 环境变量命名规范
- **后端**: 无前缀，如 `PORT`, `DATABASE_URL`, `JWT_SECRET`
- **前端**: `VITE_` 前缀，如 `VITE_API_BASE_URL`, `VITE_APP_NAME`

### 环境文件优先级
1. `.env.local` (最高优先级，不提交到版本控制)
2. `.env.development` 或 `.env.production` (根据NODE_ENV)
3. `.env` (通用配置)
4. `.env.example` (示例配置，最低优先级)

### 环境切换
```bash
# 开发环境
NODE_ENV=development npm run dev

# 生产环境  
NODE_ENV=production npm start

# 测试环境
NODE_ENV=test npm test
```

## 📊 配置验证

### 后端配置验证
```javascript
// 自动验证必需的环境变量
const requiredEnvVars = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET']

// 配置验证函数
config.validate() // 验证所有配置
```

### 前端配置验证
```typescript
// 环境变量验证
const requiredEnvVars = ['VITE_APP_NAME', 'VITE_API_BASE_URL']

// 配置验证
config.validate() // 验证配置完整性
```

## 🛡️ 安全最佳实践

### 敏感信息管理
1. **绝不硬编码**：密码、密钥、API令牌等必须通过环境变量管理
2. **环境隔离**：开发、测试、生产环境使用不同的配置
3. **密钥轮换**：定期轮换JWT密钥、数据库密码等
4. **访问控制**：限制配置文件的访问权限

### 安全配置示例
```bash
# 生产环境必须设置
JWT_SECRET="64位随机字符串，定期轮换"
DATABASE_URL="使用强密码，限制IP访问"
CORS_ORIGIN="严格限制允许的域名"
```

## 📈 配置监控

### 配置变更跟踪
1. **版本控制**：所有配置文件必须提交到Git
2. **变更日志**：记录重要的配置变更
3. **审计日志**：记录配置访问和修改

### 健康检查
```bash
# 检查配置状态
curl http://localhost:33037/health

# 查看配置摘要
curl http://localhost:33037/api/version
```

## 🚀 快速开始

### 1. 初始化配置
```bash
# 复制环境变量示例
cp apps/backend/.env.example apps/backend/.env.development
cp apps/frontend/.env.example apps/frontend/.env.development

# 编辑配置
vim apps/backend/.env.development
vim apps/frontend/.env.development
```

### 2. 验证配置
```bash
# 启动后端（会自动验证配置）
cd apps/backend && npm run dev

# 启动前端
cd apps/frontend && npm run dev
```

### 3. 检查配置
```bash
# 访问健康检查
curl http://localhost:33037/health

# 查看版本信息
curl http://localhost:33037/api/v1/public/version

# 查看功能列表
curl http://localhost:33037/api/v1/public/features
```

## 🔧 故障排除

### 常见问题

#### 1. 环境变量未加载
```bash
# 检查环境变量
echo $NODE_ENV
echo $DATABASE_URL

# 重新加载环境
source .env.development
```

#### 2. 配置验证失败
```javascript
// 查看错误信息
try {
  config.validate()
} catch (error) {
  console.error('验证失败:', error.message)
}
```

#### 3. 路由未找到
```javascript
// 检查路由常量
console.log(routes.public.HEALTH)
console.log(routes.public.AUTH.REGISTER)

// 使用工具函数构建URL
const url = routes.utils.buildUrl(routes.tenant.STORES.DETAIL, { storeId: '123' })
```

## 📚 扩展配置

### 添加新配置
1. 在 `.env.example` 中添加环境变量
2. 在配置管理系统中添加对应的配置项
3. 添加验证规则（如必需性、格式验证）
4. 更新文档

### 配置分组
- **服务器配置**: 端口、主机、环境等
- **数据库配置**: 连接、池、迁移等
- **业务配置**: 店铺、订单、打印等
- **集成配置**: 第三方服务、API密钥等
- **监控配置**: 指标、告警、日志等

## 🎯 总结

### 核心优势
1. **零硬编码**：所有配置通过环境变量管理
2. **统一管理**：集中式配置管理系统
3. **类型安全**：完整的TypeScript类型定义
4. **环境隔离**：开发、测试、生产环境分离
5. **安全可靠**：敏感信息安全管理
6. **易于维护**：配置变更跟踪和验证

### 强制规范
1. ✅ 所有配置必须通过环境变量
2. ✅ 所有API路由必须使用路由常量
3. ✅ 所有环境变量必须有默认值
4. ✅ 所有配置必须经过验证
5. ✅ 所有配置文件必须版本控制

**记住：配置规范化是项目可维护性的基础！** 🚀