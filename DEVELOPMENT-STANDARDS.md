# 麒麟项目 - 开发规范手册

## 🎯 核心原则：禁止硬编码

**硬编码是项目技术债务的主要来源，必须严格禁止！**

### 什么是硬编码？
将应该可配置的值直接写在代码中，而不是通过配置、常量或环境变量管理。

### 硬编码的危害：
1. **难以维护** - 修改需要搜索整个代码库
2. **环境适配困难** - 不同环境需要不同值
3. **安全风险** - 敏感信息泄露
4. **代码重复** - 相同值在多处定义
5. **测试困难** - 无法模拟不同场景

---

## 📋 规范化检查清单

### 开发前检查
在编写新代码前，问自己这些问题：

- [ ] **是否有新的API路径？** → 添加到 `src/config/routes.js`
- [ ] **是否有新的枚举值？** → 添加到 `src/constants/` 目录
- [ ] **是否有魔法数字/字符串？** → 提取为常量
- [ ] **是否有环境特定值？** → 添加到配置系统
- [ ] **是否有业务逻辑值？** → 使用常量管理

### 代码审查要点
审查代码时，重点关注：

1. **字符串字面量检查**
   - API路径 (`'/api/'`, `'/v1/'`, `'/stores/'`)
   - 角色字符串 (`'ADMIN'`, `'OWNER'`, `'USER'`)
   - 状态值 (`'ACTIVE'`, `'INACTIVE'`, `'DRAFT'`)
   - 类型值 (`'RESTAURANT'`, `'CAFE'`, `'FAST_FOOD'`)
   - 错误消息 (`'未提供认证Token'`, `'权限不足'`)

2. **数字字面量检查**
   - 端口号 (`33037`, `5177`, `5432`)
   - 超时时间 (`5000`, `30000`)
   - 限制值 (`10`, `100`, `1000`)
   - 状态码 (`200`, `404`, `500`)

3. **配置值检查**
   - 主机地址 (`localhost`, `127.0.0.1`)
   - 数据库连接字符串
   - API密钥、密钥、密码
   - 第三方服务配置

---

## 🏗️ 常量管理系统

### 常量目录结构
```
src/constants/
├── auth.constants.js      # 认证相关常量
├── store.constants.js     # 店铺相关常量
├── order.constants.js     # 订单相关常量
├── user.constants.js      # 用户相关常量
└── index.js              # 统一导出
```

### 如何使用常量

#### ❌ 错误示例（硬编码）：
```javascript
// 错误！不要这样写！
fastify.get('/api/v1/stores', ...)
if (role === 'ADMIN') ...
const status = 'ACTIVE'
```

#### ✅ 正确示例（使用常量）：
```javascript
// 正确！使用常量系统
import { STORE_ROUTES } from '../config/routes.js'
import { USER_ROLES } from '../constants/auth.constants.js'
import { STORE_STATUS } from '../constants/store.constants.js'

fastify.get(STORE_ROUTES.LIST, ...)
if (role === USER_ROLES.ADMIN) ...
const status = STORE_STATUS.ACTIVE
```

### 创建新常量
当需要新的常量时：

1. **检查现有常量文件** - 是否已有相关常量
2. **创建或更新常量文件** - 在 `src/constants/` 目录
3. **导出常量** - 使用命名导出
4. **更新索引文件** - 如果需要统一导出

示例：创建菜单常量
```javascript
// src/constants/menu.constants.js
export const MENU_CATEGORIES = {
  APPETIZER: 'APPETIZER',
  MAIN_COURSE: 'MAIN_COURSE',
  DESSERT: 'DESSERT',
  BEVERAGE: 'BEVERAGE'
};

export const MENU_STATUS = {
  AVAILABLE: 'AVAILABLE',
  SOLD_OUT: 'SOLD_OUT',
  SEASONAL: 'SEASONAL'
};
```

---

## 🔧 配置管理系统

### 配置目录结构
```
src/config/
├── index.js              # 主配置（环境变量 + 默认值）
├── routes.js             # API路由常量
├── database.js           # 数据库配置
├── auth.js              # 认证配置
└── security.js          # 安全配置
```

### 配置优先级
1. **环境变量** (最高优先级) - `process.env.XXX`
2. **配置文件默认值** - `src/config/*.js`
3. **代码硬编码** (禁止！)

### 环境变量配置
```bash
# .env 文件示例
PORT=33037
API_PREFIX=/api
API_VERSION=v1
JWT_SECRET=your-super-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/qilin_dev
```

### 配置验证
每次启动时自动验证配置：
```bash
npm run check:config
```

---

## 🛣️ 路由管理系统

### 路由常量定义
所有API路径必须在 `src/config/routes.js` 中定义：

```javascript
// src/config/routes.js
export const STORE_ROUTES = {
  LIST: `${BASE_PATH}/stores`,
  CREATE: `${BASE_PATH}/stores`,
  DETAIL: `${BASE_PATH}/stores/:storeId`,
  UPDATE: `${BASE_PATH}/stores/:storeId`,
  DELETE: `${BASE_PATH}/stores/:storeId`
};
```

### 路由使用规范
```javascript
// ❌ 错误 - 硬编码路径
fastify.get('/api/v1/stores', ...)

// ✅ 正确 - 使用路由常量
import { STORE_ROUTES } from '../config/routes.js'
fastify.get(STORE_ROUTES.LIST, ...)
```

### 路由检查命令
```bash
npm run check:routes
```

---

## 🧪 自动化检查工具

### 硬编码检查脚本
```bash
# 完整检查
npm run check:hardcoded

# 快速检查（只检查关键文件）
npm run check:hardcoded -- --quick

# 严格模式（警告视为错误）
npm run check:hardcoded -- --strict
```

### 综合检查命令
```bash
# 检查所有规范
npm run check:standards

# CI/CD 完整检查（包含测试）
npm run ci:check

# 预提交检查（Git钩子）
npm run precommit
```

### 检查脚本输出示例
```
🔍 麒麟项目硬编码检查
======================

📄 检查文件: apps/backend/src/index.js
  ✅ 本文件未发现硬编码问题

📄 检查文件: apps/backend/src/routes/store.routes.js
  ⚠️  API路径硬编码:
    - 45: fastify.get('/stores', ...
  ⚠️  角色硬编码:
    - 89: if (role === 'ADMIN') ...

📈 检查完成报告
================
📊 统计信息:
  - 检查文件数: 15
  - 警告数量: 2
  - 错误数量: 0
```

---

## 🔄 开发工作流

### 1. 新功能开发流程
```
需求分析 → 常量设计 → 配置设计 → 代码实现 → 规范检查 → 测试验证
```

### 2. 代码提交流程
```bash
# 1. 开发完成
git add .

# 2. 运行规范检查
npm run precommit

# 3. 如果检查通过，提交代码
git commit -m "feat: 添加店铺管理功能"

# 4. 如果检查失败，修复问题后重新提交
```

### 3. CI/CD 集成
在 `.github/workflows/ci.yml` 或 GitLab CI 中：
```yaml
jobs:
  check-standards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run ci:check
```

---

## 🚨 常见违规及修复

### 违规1：API路径硬编码
```javascript
// ❌ 违规代码
fastify.get('/api/v1/stores', handler)

// ✅ 修复方法
import { STORE_ROUTES } from '../config/routes.js'
fastify.get(STORE_ROUTES.LIST, handler)
```

### 违规2：角色字符串硬编码
```javascript
// ❌ 违规代码
if (user.role === 'ADMIN') { ... }

// ✅ 修复方法
import { USER_ROLES } from '../constants/auth.constants.js'
if (user.role === USER_ROLES.ADMIN) { ... }
```

### 违规3：状态值硬编码
```javascript
// ❌ 违规代码
const status = 'ACTIVE'

// ✅ 修复方法
import { STORE_STATUS } from '../constants/store.constants.js'
const status = STORE_STATUS.ACTIVE
```

### 违规4：端口号硬编码
```javascript
// ❌ 违规代码
const port = 33037

// ✅ 修复方法
import config from '../config/index.js'
const port = config.server.port
```

---

## 📚 学习资源

### 内部文档
- [代码结构说明](./docs/ARCHITECTURE.md)
- [API设计规范](./docs/API-DESIGN.md)
- [数据库设计](./docs/DATABASE.md)

### 外部资源
- [12-Factor App 方法论](https://12factor.net/)
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [REST API 设计指南](https://restfulapi.net/)

---

## 🏆 优秀实践示例

### 优秀代码示例
```javascript
// 优秀的后端路由文件
import { STORE_ROUTES } from '../config/routes.js'
import { STORE_TYPES, STORE_STATUS } from '../constants/store.constants.js'
import { requireTenantAccess } from '../middleware/index.js'
import storeService from '../services/store.service.js'

async function storeRoutes(fastify) {
  const authWithTenant = requireTenantAccess('header')
  
  fastify.get(STORE_ROUTES.LIST, {
    preHandler: authWithTenant,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: Object.values(STORE_STATUS) },
          type: { type: 'string', enum: Object.values(STORE_TYPES) }
        }
      }
    }
  }, async (request, reply) => {
    // 业务逻辑
  })
}
```

### 优秀常量文件示例
```javascript
// 优秀的常量文件
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const ORDER_PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  MOBILE: 'MOBILE',
  WECHAT: 'WECHAT',
  ALIPAY: 'ALIPAY'
};

export const ORDER_VALIDATION = {
  MIN_ITEMS: 1,
  MAX_ITEMS: 50,
  MAX_NOTES_LENGTH: 500
};
```

---

## 📞 支持与反馈

### 遇到问题？
1. **检查开发规范手册** - 本文档
2. **查看示例代码** - `src/constants/` 和 `src/config/` 目录
3. **运行检查脚本** - `npm run check:hardcoded`
4. **寻求帮助** - 项目团队群组

### 建议改进？
如果您有改进规范的建议：
1. 在团队中讨论
2. 更新本文档
3. 更新检查脚本
4. 通知所有开发者

---

**记住：规范化不是限制，而是为了更好的协作和长期维护！**

**每一次遵守规范，都是对项目未来的投资。** 🚀

---
*最后更新: 2026-04-22*
*版本: 1.0.0*