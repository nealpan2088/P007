# 麒麟项目 - 开发者入门指南

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### 安装和启动
```bash
# 1. 克隆项目
git clone git@github.com:nealpan2088/P007.git
cd P007

# 2. 安装依赖
npm install

# 3. 设置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库等

# 4. 数据库迁移
npm run db:migrate

# 5. 启动开发服务器
npm run dev
```

### 访问地址
- **前端**: http://localhost:5177
- **后端API**: http://localhost:33037
- **API文档**: http://localhost:33037/api/health
- **数据库管理**: http://localhost:5555 (Prisma Studio)

---

## 📚 必读文档

### 核心规范（必须阅读！）
1. **[开发规范手册](./DEVELOPMENT-STANDARDS.md)** - 禁止硬编码，常量系统使用
2. **[速查表](./CHEATSHEET.md)** - 快速参考指南

### 技术架构
3. **[API设计规范](./docs/API-DESIGN.md)** - REST API设计原则
4. **[数据库设计](./docs/DATABASE.md)** - 数据模型和迁移
5. **[代码结构](./docs/ARCHITECTURE.md)** - 项目目录结构

---

## 🛠️ 开发工具

### 常用命令
```bash
# 开发服务器
npm run dev              # 同时启动前后端
npm run dev:backend     # 只启动后端
npm run dev:frontend    # 只启动前端

# 代码质量
npm run lint            # 代码规范检查
npm run check:standards # 规范检查（硬编码、配置、路由）
npm run test            # 运行测试

# 数据库
npm run db:migrate      # 数据库迁移
npm run db:studio       # 数据库管理界面

# 构建和部署
npm run build           # 构建项目
npm run start           # 启动生产服务器
```

### 规范检查（提交前必须运行！）
```bash
# 完整检查
npm run check:standards

# 只检查硬编码
npm run check:hardcoded

# CI/CD检查（包含测试）
npm run ci:check
```

---

## 🏗️ 项目结构

```
P007/
├── apps/
│   ├── backend/        # 后端服务
│   │   ├── src/
│   │   │   ├── config/         # 配置系统
│   │   │   ├── constants/      # 常量系统（禁止硬编码！）
│   │   │   ├── routes/         # API路由
│   │   │   ├── services/       # 业务逻辑
│   │   │   └── middleware/     # 中间件
│   │   └── prisma/            # 数据库模型
│   │
│   └── frontend/       # 前端应用
│       └── src/
│           ├── config/         # 前端配置
│           ├── constants/      # 前端常量
│           └── pages/          # 页面组件
│
├── scripts/            # 工具脚本
│   ├── check-hardcoded-simple.sh  # 硬编码检查
│   └── ...
│
├── docs/              # 项目文档
├── DEVELOPMENT-STANDARDS.md  # 开发规范
└── CHEATSHEET.md      # 速查表
```

---

## 🚨 重要规则

### 规则1：禁止硬编码！
**所有字符串字面量、数字字面量、路径都必须使用常量或配置**

```javascript
// ❌ 错误！不要这样写！
fastify.get('/api/v1/stores', ...)
if (role === 'ADMIN') ...
const port = 33037

// ✅ 正确！使用常量系统
import { STORE_ROUTES } from '../config/routes.js'
import { USER_ROLES } from '../constants/auth.constants.js'
import config from '../config/index.js'

fastify.get(STORE_ROUTES.LIST, ...)
if (role === USER_ROLES.ADMIN) ...
const port = config.server.port
```

### 规则2：使用常量目录
所有业务常量必须在 `src/constants/` 目录中定义：

```javascript
// 创建新常量
// 1. 在 src/constants/ 创建文件
// 2. 定义并导出常量
// 3. 在代码中导入使用

// 示例：src/constants/order.constants.js
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED'
};
```

### 规则3：使用配置系统
所有环境相关配置必须通过配置系统管理：

```javascript
// 使用配置，不要硬编码！
import config from '../config/index.js'

const port = config.server.port
const apiPrefix = config.server.apiPrefix
const jwtSecret = config.auth.jwtSecret
```

---

## 🔧 开发工作流

### 1. 开始新功能
```bash
# 检查是否有相关常量
grep -r "关键词" apps/backend/src/constants/

# 检查路由配置
grep -r "路径" apps/backend/src/config/routes.js
```

### 2. 编写代码
```javascript
// 第一步：导入所需常量
import { 相关常量 } from '../constants/对应文件.js'
import { 路由常量 } from '../config/routes.js'
import config from '../config/index.js'

// 第二步：使用常量而非硬编码
```

### 3. 提交前检查
```bash
# 运行规范检查
npm run check:standards

# 如果失败，查看具体问题
npm run check:hardcoded
```

### 4. 提交代码
```bash
git add .
npm run precommit  # 自动运行规范检查
git commit -m "feat: 描述功能"
```

---

## 🆘 常见问题

### Q1：检查脚本报错怎么办？
```bash
# 查看详细错误
npm run check:hardcoded -- --verbose

# 只检查特定文件
./scripts/check-hardcoded-simple.sh 文件路径
```

### Q2：找不到需要的常量怎么办？
```bash
# 1. 检查现有常量
ls -la apps/backend/src/constants/

# 2. 创建新常量文件
# 在 apps/backend/src/constants/ 创建新文件

# 3. 定义常量并导出
```

### Q3：API路径应该在哪里定义？
**所有API路径必须在 `apps/backend/src/config/routes.js` 中定义**

```javascript
// 在 routes.js 中添加
export const YOUR_ROUTES = {
  LIST: `${BASE_PATH}/your-path`,
  DETAIL: `${BASE_PATH}/your-path/:id`
};

// 在代码中使用
import { YOUR_ROUTES } from '../config/routes.js'
fastify.get(YOUR_ROUTES.LIST, ...)
```

### Q4：如何添加新的配置？
```javascript
// 1. 在 config/index.js 中添加配置
export const getYourConfig = () => ({
  yourKey: process.env.YOUR_KEY || 'default'
});

// 2. 在 .env 文件中设置环境变量
YOUR_KEY=your-value

// 3. 在代码中使用
import config from '../config/index.js'
const value = config.your.yourKey
```

---

## 📞 获取帮助

### 内部资源
1. **查看示例代码** - `apps/backend/src/constants/` 和 `apps/backend/src/config/`
2. **运行检查脚本** - `npm run check:hardcoded`
3. **阅读规范文档** - `DEVELOPMENT-STANDARDS.md`

### 紧急情况
如果必须临时硬编码：
```javascript
// 添加 TODO 注释，尽快修复
// TODO: 硬编码 - 需要提取到常量
const tempValue = '临时值';
```

### 寻求帮助
1. 在团队群组中提问
2. 查看GitHub Issues
3. 联系项目负责人

---

## 🎯 记住核心

**每一次遵守规范，都是对项目未来的投资！**

**规范化开发，快乐协作！** 🚀

---
*最后更新: 2026-04-22*
*版本: 1.0.0*