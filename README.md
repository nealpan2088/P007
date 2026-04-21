# P007-项目麒麟 (麒麟云点餐SaaS)

**版本**: v0.1.0 | **状态**: 阶段1完成 ✅ | **最后更新**: 2026-04-21

多店铺扫码点餐云打印的SaaS平台，支持单店版和多店版灵活切换。

## 🎯 项目状态

### ✅ 已完成 (阶段1)
- **多租户数据库架构**设计完成
- **用户认证系统** (注册/登录/JWT) 实现
- **动态配置管理**系统 (零硬编码)
- **系统模式切换** (单店版/多店版)
- **完整规范化检查**体系
- **PostgreSQL数据库**迁移完成
- **前后端开发环境**配置就绪

### 🚀 核心特性
- **灵活部署**: 通过环境变量切换单店版/多店版
- **多租户架构**: Schema级数据隔离，高安全性
- **现代化技术栈**: React 19 + TypeScript + Fastify
- **完整认证**: JWT + bcrypt，完整会话管理
- **配置驱动**: 环境变量管理，禁止硬编码
- **自动化检查**: Git提交前自动验证

## 📦 技术栈

### 后端
- **运行时**: Node.js v24.14.1
- **框架**: Fastify 5.8.5 (高性能HTTP服务器)
- **数据库**: PostgreSQL 13 + Prisma 5.22.0
- **认证**: JWT + bcrypt + 会话管理
- **配置**: 动态环境变量配置系统

### 前端
- **框架**: React 19.2.5 + TypeScript
- **构建**: Vite 7.3.2
- **路由**: React Router 6
- **样式**: (待定)
- **状态管理**: (待定)

### 开发工具
- **代码检查**: ESLint + TypeScript
- **规范化检查**: 自定义检查脚本
- **Git钩子**: Husky预提交检查
- **数据库GUI**: Prisma Studio

## 🏗️ 系统架构

### 多租户设计
```
公共Schema (p007_public)
├── User (平台用户)
├── Tenant (SaaS租户)
├── UserTenant (用户-租户关联)
└── Session (用户会话)

租户Schema (tenant_{tenant_id})
├── Store (店铺)
├── Menu (菜单)
├── Order (订单)
└── ... (其他业务表)
```

### 系统模式
通过环境变量 `SYSTEM_MODE` 控制：
- **单店版** (`SYSTEM_MODE=single`): 简化架构，固定店铺
- **多店版** (`SYSTEM_MODE=multi`): 完整SaaS，多租户多店铺

## 🚀 快速开始

### 1. 环境准备
```bash
# 克隆项目
git clone <仓库地址> P007
cd P007

# 安装依赖
cd apps/backend && npm install
cd ../frontend && npm install
```

### 2. 数据库设置
```bash
# 设置环境变量
cd apps/backend
source setup-env.sh

# 运行数据库迁移
npx prisma migrate deploy
```

### 3. 启动开发环境
```bash
# 方法1: 使用项目启动脚本
cd ~/projects/P007
./start-dev.sh

# 方法2: 分别启动
cd apps/backend && npm run dev
cd apps/frontend && npm run dev
```

### 4. 访问应用
- **后端API**: http://localhost:33037
- **前端应用**: http://localhost:5177
- **健康检查**: http://localhost:33037/api/health
- **数据库GUI**: http://localhost:5555 (运行 `npx prisma studio`)

## 📖 API文档

### 核心API端点
```
GET    /api/health                    # 健康检查
GET    /api/hello                     # API示例
POST   /api/v1/auth/register          # 用户注册
POST   /api/v1/auth/login             # 用户登录
GET    /api/v1/auth/health            # 认证健康检查
GET    /api/v1/system/info            # 系统信息
GET    /api/v1/system/stores          # 店铺列表
GET    /api/v1/public/version         # 版本信息
GET    /api/v1/public/features        # 功能列表
```

### 测试API
```bash
# 健康检查
curl http://localhost:33037/api/health

# 用户注册
curl -X POST http://localhost:33037/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test@2026"}'
```

## 🔧 开发命令

### 规范化检查
```bash
# 检查硬编码
./scripts/check-hardcoded.sh

# 后端检查
cd apps/backend
npm run check:all  # 检查配置、路由、硬编码

# 前端检查
cd apps/frontend
npm run check:all  # 检查配置、TypeScript编译
```

### 数据库管理
```bash
cd apps/backend

# 创建新迁移
npx prisma migrate dev --name 迁移描述

# 查看数据库
npx prisma studio

# 重置数据库 (开发环境)
npx prisma migrate reset
```

### 系统模式切换
```bash
# 切换到单店版
export SYSTEM_MODE=single
export DEFAULT_STORE_ID="my_store"

# 切换到多店版
export SYSTEM_MODE=multi

# 重新加载配置
source setup-env.sh
```

## 📁 项目结构

```
P007/
├── apps/                          # 应用目录
│   ├── backend/                   # 后端应用
│   │   ├── src/                   # 源代码
│   │   │   ├── config/           # 配置系统
│   │   │   ├── db/               # 数据库层
│   │   │   ├── routes/           # API路由
│   │   │   ├── services/         # 业务服务
│   │   │   └── utils/            # 工具函数
│   │   ├── prisma/               # 数据库Schema
│   │   └── package.json          # 后端依赖
│   └── frontend/                  # 前端应用
│       ├── src/                   # 源代码
│       │   ├── config/           # 前端配置
│       │   └── (其他目录待创建)
│       └── package.json          # 前端依赖
├── scripts/                       # 项目脚本
│   ├── check-hardcoded.sh        # 硬编码检查
│   └── normalize-import.sh       # 导入规范化
├── docs/                          # 项目文档
├── .husky/                        # Git钩子
└── (配置文件)
```

## 📚 文档

- [ARCHITECTURE.md](ARCHITECTURE.md) - 系统架构设计
- [DATABASE.md](DATABASE.md) - 数据库设计
- [DEVELOPMENT-PLAN.md](DEVELOPMENT-PLAN.md) - 开发计划
- [VERSION.md](VERSION.md) - 版本管理
- [CHANGELOG.md](CHANGELOG.md) - 更新日志
- [CONFIGURATION-GUIDE.md](CONFIGURATION-GUIDE.md) - 配置指南
- [INCREMENTAL-DEVELOPMENT.md](INCREMENTAL-DEVELOPMENT.md) - 增量开发

## 🗺️ 开发路线

### 阶段1: 基础认证系统 ✅
- 多租户数据库架构
- 用户认证系统
- 配置管理系统
- 系统模式框架

### 阶段2: 前端界面 & 租户管理
- 前端登录/注册页面
- 租户注册和管理
- 店铺管理功能

### 阶段3: 扫码点餐核心功能
- 菜单管理
- 餐桌管理
- 订单系统
- 打印集成

### 阶段4: 高级功能
- 分析统计
- 报表系统
- 支付集成
- 移动端优化

## 🤝 贡献指南

1. **分支策略**: 从 `develop` 创建功能分支
2. **代码规范**: 遵循项目规范化检查
3. **提交信息**: 使用清晰的提交信息
4. **测试验证**: 提交前运行所有检查
5. **文档更新**: 更新相关文档

## 📄 许可证

(待定)

## 👥 贡献者

- **潘哥** - 项目发起人，业务需求
- **旺财** - 技术实现，架构设计

## 📞 支持

如有问题或建议，请通过项目issue跟踪系统提交。

---

**最后更新**: 2026-04-21  
**当前版本**: v0.1.0  
**项目状态**: 阶段1完成，可进入阶段2开发