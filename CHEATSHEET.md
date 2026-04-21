# 麒麟项目 - 开发规范速查表

## 🚫 禁止硬编码！禁止硬编码！禁止硬编码！

### 快速检查命令
```bash
# 检查硬编码
npm run check:hardcoded

# 检查所有规范
npm run check:standards

# 提交前检查
npm run precommit
```

---

## 📁 常量系统速查

### 常量文件位置
```
src/constants/
├── auth.constants.js      # 认证常量
├── store.constants.js     # 店铺常量
├── [业务].constants.js    # 其他业务常量
└── index.js              # 统一导出（可选）
```

### 如何使用常量
```javascript
// ❌ 错误！硬编码
'ADMIN'
'ACTIVE'
'/api/v1/stores'
33037

// ✅ 正确！使用常量
USER_ROLES.ADMIN
STORE_STATUS.ACTIVE
STORE_ROUTES.LIST
config.server.port
```

### 常用常量引用
```javascript
// 认证相关
import { USER_ROLES, AUTH_HEADERS } from '../constants/auth.constants.js'
USER_ROLES.ADMIN
AUTH_HEADERS.AUTHORIZATION

// 店铺相关
import { STORE_TYPES, STORE_STATUS } from '../constants/store.constants.js'
STORE_TYPES.RESTAURANT
STORE_STATUS.ACTIVE

// 路由相关
import { STORE_ROUTES } from '../config/routes.js'
STORE_ROUTES.LIST
STORE_ROUTES.DETAIL

// 配置相关
import config from '../config/index.js'
config.server.port
config.server.apiPrefix
```

---

## 🛠️ 开发工作流

### 1. 开始新功能前
```bash
# 检查是否有相关常量
grep -r "你的关键词" src/constants/

# 检查路由配置
grep -r "你的路径" src/config/routes.js
```

### 2. 编写代码时
```javascript
// 第一步：导入所需常量
import { 相关常量 } from '../constants/对应文件.js'
import { 路由常量 } from '../config/routes.js'
import config from '../config/index.js'

// 第二步：使用常量而非硬编码
fastify.get(路由常量.路径, ...)
if (role === 用户常量.角色) ...
const port = config.server.port
```

### 3. 提交代码前
```bash
# 运行规范检查
npm run precommit

# 如果失败，查看具体问题并修复
npm run check:hardcoded -- --verbose
```

---

## 🔍 常见硬编码模式及修复

### 模式1：API路径
```javascript
// ❌ 错误
'/api/v1/stores'
'/auth/login'
'/users/:userId'

// ✅ 修复
STORE_ROUTES.LIST
AUTH_ROUTES.LOGIN
USER_ROUTES.DETAIL
```

### 模式2：角色/状态
```javascript
// ❌ 错误
'ADMIN'
'ACTIVE'
'PENDING'

// ✅ 修复
USER_ROLES.ADMIN
ORDER_STATUS.ACTIVE
PAYMENT_STATUS.PENDING
```

### 模式3：数字
```javascript
// ❌ 错误
33037
5000
100

// ✅ 修复
config.server.port
config.request.timeout
PAGINATION.DEFAULT_LIMIT
```

### 模式4：字符串
```javascript
// ❌ 错误
'Bearer '
'x-tenant-id'
'未提供认证Token'

// ✅ 修复
AUTH_HEADERS.BEARER_PREFIX
AUTH_HEADERS.TENANT_ID
ERROR_MESSAGES.UNAUTHORIZED
```

---

## 🚨 紧急情况处理

### 如果必须临时硬编码
```javascript
// 1. 添加 TODO 注释
// TODO: 硬编码 - 需要提取到常量
const tempValue = '临时值';

// 2. 创建技术债务记录
// TECH_DEBT: 硬编码端口号，需要配置化
const port = 33037;

// 3. 尽快修复
// 在下一个提交中提取为常量
```

### 技术债务跟踪
```bash
# 查找所有技术债务
grep -r "TODO\|TECH_DEBT\|FIXME" src/

# 定期清理
# 每周五下午清理技术债务
```

---

## 📞 快速帮助

### 问题：找不到常量文件
```bash
# 查看所有常量文件
ls -la src/constants/

# 查看常量文件内容
cat src/constants/auth.constants.js
```

### 问题：检查脚本报错
```bash
# 查看详细错误
npm run check:hardcoded -- --verbose

# 只检查特定文件
./scripts/check-hardcoded.sh apps/backend/src/routes/store.routes.js
```

### 问题：需要新常量
```javascript
// 1. 创建或编辑常量文件
// src/constants/your-business.constants.js

// 2. 定义常量
export const YOUR_CONSTANTS = {
  VALUE1: 'value1',
  VALUE2: 'value2'
};

// 3. 在代码中使用
import { YOUR_CONSTANTS } from '../constants/your-business.constants.js'
```

---

## 💡 最佳实践提示

### 提示1：常量命名
```javascript
// 好的命名
USER_ROLES.ADMIN
STORE_STATUS.ACTIVE
API_ERRORS.NOT_FOUND

// 不好的命名
ADMIN
ACTIVE
NOT_FOUND
```

### 提示2：分组常量
```javascript
// 按业务分组
export const ORDER = {
  STATUS: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED'
  },
  PAYMENT: {
    METHODS: {
      CASH: 'CASH',
      CARD: 'CARD'
    }
  }
};
```

### 提示3：配置覆盖
```javascript
// 环境变量 > 配置文件 > 默认值
const value = process.env.XXX || config.xxx.default || 'fallback';
```

---

## 🎯 记住核心规则

1. **所有字符串字面量都要怀疑** - 可能是硬编码
2. **所有数字字面量都要检查** - 可能是魔法数字
3. **所有路径都要常量化** - API路径、文件路径
4. **所有业务值都要常量化** - 状态、类型、角色
5. **所有配置都要环境化** - 端口、密钥、URL

---

**规范化开发，快乐协作！** 🚀

---
*打印此速查表放在桌面，随时参考！*