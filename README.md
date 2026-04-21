# P007 - 麒麟点餐SaaS平台

## 🚀 项目概述

麒麟点餐是一个现代化的多租户SaaS平台，专为餐厅和餐饮业务设计。平台提供完整的扫码点餐、订单管理、店铺管理和数据分析功能。

## 📊 当前版本状态

**版本**: v0.2.0 (2026年4月21日)
**状态**: ✅ **店铺管理界面开发完成**

### ✅ 已完成功能
1. **用户认证系统** - 完整的注册/登录流程
2. **租户管理系统** - 多租户架构支持
3. **店铺管理界面** - 完整的店铺CRUD操作
4. **扫码点餐MVP** - 顾客端点餐界面
5. **打印机扩展架构** - 支持多种打印机类型
6. **Ant Design集成** - 现代化UI组件库

### 🔧 技术架构
- **后端**: Node.js + Fastify + PostgreSQL + Prisma
- **前端**: React + TypeScript + Ant Design + Vite
- **表单**: Formik + Yup 表单验证
- **认证**: JWT Token + 刷新令牌机制
- **部署**: 多环境配置支持

## 🏗️ 项目结构

```
P007/
├── apps/
│   ├── backend/                 # 后端API服务
│   │   ├── src/
│   │   │   ├── config/         # 配置管理
│   │   │   ├── db/            # 数据库客户端
│   │   │   ├── middleware/     # 中间件
│   │   │   ├── routes/        # API路由
│   │   │   ├── services/      # 业务逻辑
│   │   │   └── index.js       # 主入口
│   │   └── prisma/            # 数据库schema
│   └── frontend/              # 前端应用
│       └── src/
│           ├── api/           # API客户端
│           ├── contexts/      # React上下文
│           ├── hooks/         # 自定义钩子
│           ├── pages/         # 页面组件
│           └── config/        # 前端配置
├── CHANGELOG-2026-04-21.md    # 版本更新日志
└── README.md                  # 项目文档
```

## 🚀 快速开始

### 1. 环境准备
```bash
# 克隆项目
git clone https://github.com/nealpan2088/P007.git
cd P007

# 安装依赖
cd apps/backend && npm install
cd ../frontend && npm install
```

### 2. 数据库设置
```bash
# 启动PostgreSQL
sudo systemctl start postgresql

# 创建数据库
createdb p007_development

# 运行数据库迁移
cd apps/backend
npx prisma migrate dev --name init
```

### 3. 启动服务
```bash
# 启动后端服务 (端口33037)
cd apps/backend
SYSTEM_MODE=multi NODE_ENV=development PORT=33037 \
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/p007_development" \
JWT_SECRET="your-jwt-secret-minimum-32-characters" \
API_PREFIX=/api npm run dev

# 启动前端服务 (端口5177)
cd apps/frontend
npm run dev
```

## 📡 API文档

### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录

### 租户管理
- `POST /api/v1/tenant/register` - 租户注册
- `GET /api/v1/tenant/list` - 租户列表
- `PUT /api/v1/tenant/:id` - 租户更新
- `POST /api/v1/tenant/check-subdomain` - 子域名检查

### 健康检查
- `GET /api/health` - 服务健康状态

## 🖥️ 前端页面

### 公开页面
- `/` - 首页
- `/auth/login` - 用户登录
- `/auth/register` - 用户注册
- `/scan/:storeId/:tableId` - 扫码点餐页面

### 租户管理
- `/tenants` - 租户列表
- `/tenants/create` - 创建租户
- `/tenants/:id/edit` - 编辑租户
- `/tenants/:id` - 租户仪表板

### 店铺管理
- `/stores` - 店铺列表 (Ant Design表格)
- `/stores/create` - 创建店铺 (Formik表单)
- `/stores/:id` - 店铺详情页面
- `/stores/:id/edit` - 编辑店铺信息

## 🔧 开发指南

### 代码规范
- 使用ESLint + Prettier统一代码风格
- 遵循TypeScript严格模式
- 使用Conventional Commits提交规范

### 数据库开发
```bash
# 生成Prisma客户端
npx prisma generate

# 创建新迁移
npx prisma migrate dev --name feature-name

# 查看数据库
npx prisma studio
```

### 测试
```bash
# 运行API测试
cd apps/backend && npm test

# 运行前端测试
cd apps/frontend && npm test
```

## 🐛 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查PostgreSQL服务状态
   - 验证DATABASE_URL环境变量

2. **JWT认证失败**
   - 检查JWT_SECRET环境变量
   - 验证Token过期时间

3. **前端编译错误**
   - 检查TypeScript类型定义
   - 验证依赖版本兼容性

### 日志查看
```bash
# 查看后端日志
cd apps/backend && tail -f logs/development.log

# 查看前端控制台
# 浏览器开发者工具 -> Console
```

## 📈 部署指南

### 生产环境配置
```bash
# 环境变量配置
export NODE_ENV=production
export PORT=3000
export DATABASE_URL="postgresql://user:password@host:5432/database"
export JWT_SECRET="secure-jwt-secret-here"
export SYSTEM_MODE=multi
```

### 构建和启动
```bash
# 构建前端
cd apps/frontend && npm run build

# 启动后端
cd apps/backend && npm start
```

### 使用PM2管理
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js
```

## 🤝 贡献指南

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- **项目维护者**: 潘哥
- **AI助手**: 旺财
- **项目仓库**: https://github.com/nealpan2088/P007

## 🎯 开发路线图

### v0.2.0 (已完成 ✅)
- [x] 店铺管理界面开发
- [x] Ant Design + Formik集成
- [x] 扫码点餐MVP前端
- [x] 打印机扩展架构设计

### v0.3.0 (进行中 🚀)
- [ ] 菜单管理系统
- [ ] 餐桌管理界面
- [ ] 订单处理流程
- [ ] 后端店铺API实现

### v0.4.0 (规划中 📅)
- [ ] 支付集成
- [ ] 打印机集成
- [ ] 报表系统
- [ ] 移动端应用

---

**最后更新**: 2026年4月21日
**当前版本**: v0.2.0
**项目状态**: 核心功能开发完成，可进行下一步开发
## 🗄️ 数据库管理

### 初始化脚本
项目提供了完整的数据库初始化脚本，解决"数据库一开始为什么没初始化"的问题：

```bash
# 1. 完整的数据库初始化（推荐）
bash scripts/init-database.sh

# 2. 开发环境快速初始化
bash scripts/dev-init.sh
```

### 脚本功能
1. ✅ **自动检查环境** - 验证Node.js、PostgreSQL等依赖
2. ✅ **智能创建数据库** - 自动创建 `qilin_dev` 数据库
3. ✅ **运行迁移** - 自动执行Prisma数据库迁移
4. ✅ **验证结构** - 检查关键表是否存在
5. ✅ **创建测试数据** - 可选创建测试用户和租户

### 为什么需要初始化？
- **项目依赖数据库**：后端API需要数据库存储用户、租户、订单等数据
- **环境变量配置**：`DATABASE_URL` 必须指向存在的数据库
- **表结构同步**：Prisma迁移确保数据库表结构与代码定义一致

### 故障排除
如果遇到数据库相关问题：

```bash
# 检查数据库状态
bash scripts/init-database.sh --check

# 重置开发数据库
bash scripts/init-database.sh --reset

# 仅运行迁移
cd apps/backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qilin_dev" npx prisma migrate dev
```

### 自动化集成
初始化脚本可以集成到：
- **开发环境设置**：新开发者一键初始化
- **CI/CD流水线**：自动化测试环境搭建
- **部署脚本**：生产环境数据库初始化

## 🔧 运维脚本
项目根目录的 `scripts/` 文件夹包含多个运维脚本：

| 脚本文件 | 功能 | 使用场景 |
|----------|------|----------|
| `init-database.sh` | 完整的数据库初始化 | 首次部署、环境重置 |
| `dev-init.sh` | 开发环境快速初始化 | 新开发者上手 |
| `check-servers.sh` | 服务器状态检查 | 日常运维、监控 |
| `规范化检查.sh` | 代码规范化检查 | 代码审查、质量保证 |

## 📝 经验教训
从"数据库一开始为什么没初始化"问题中学到：

1. **自动化是关键**：手动操作容易出错，自动化脚本确保一致性
2. **文档要详细**：清晰的步骤和故障排除指南
3. **验证很重要**：初始化后验证数据库连接和结构
4. **错误处理**：友好的错误信息和恢复建议

通过完善的初始化系统，确保项目在任何环境都能快速、可靠地启动！

## ⚠️ 安全操作指南

### 关键操作需要用户确认
所有自动化脚本都包含安全确认步骤，执行前需要用户明确同意：

```bash
# 运行脚本时会显示警告并要求确认
bash scripts/init-database.sh

# 输出示例：
# 🔴 🔴 🔴  重要安全警告 🔴 🔴 🔴
# 此脚本将执行数据库操作，包括：
# 1. 可能删除现有数据库
# 2. 创建新数据库
# 3. 运行数据库迁移
# 4. 可能丢失所有现有数据
# 
# 确认了解风险并继续吗？(输入 'CONFIRM' 继续):
```

### 需要确认的操作类型
1. **数据库删除/创建** - 需要输入 'CONFIRM' 和 'DELETE' 双重确认
2. **环境变量配置** - 需要确认了解风险
3. **依赖安装** - 需要确认网络连接和权限

### 安全设计原则
1. **双重确认**: 危险操作需要多重确认
2. **明确警告**: 清晰说明操作的风险和影响
3. **随时取消**: 任何步骤都可以安全取消
4. **详细日志**: 记录所有操作，便于审计

### 手动操作替代方案
如果你不信任自动化脚本，可以手动执行：

```bash
# 1. 手动创建数据库
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE qilin_dev;"

# 2. 手动运行迁移
cd apps/backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qilin_dev" npx prisma migrate dev

# 3. 手动配置环境
cp .env.example .env.development
# 编辑 .env.development 文件
```

### 责任划分
- **AI助手责任**: 提供工具和指导，但关键操作需要用户确认
- **用户责任**: 确认理解操作风险，决定是否执行
- **共同责任**: 确保系统安全和数据完整性

## 🔐 安全最佳实践

### 开发环境
1. **备份重要数据** - 在执行任何数据库操作前备份
2. **测试环境优先** - 先在测试环境验证脚本
3. **逐步执行** - 不要一次性运行所有脚本

### 生产环境
1. **禁用自动化脚本** - 生产环境应该手动操作
2. **备份验证** - 确保备份可用且完整
3. **变更窗口** - 在低流量时段执行操作
4. **回滚计划** - 准备失败时的恢复方案

### 团队协作
1. **操作记录** - 记录所有关键操作的执行者和时间
2. **代码审查** - 自动化脚本需要团队审查
3. **权限控制** - 限制关键操作的执行权限

## 🎯 我们的协作约定（更新）

### 潘哥的责任
- 业务需求决策
- 功能优先级排序  
- **关键操作最终确认** - 所有危险操作需要潘哥明确同意
- 资源分配决策

### 旺财的责任
- 技术方案设计
- 代码质量把关
- 风险预警提醒
- 最佳实践指导
- **提供安全确认机制** - 所有自动化工具必须有确认步骤
- **明确说明风险** - 清晰解释操作的影响和风险
- **随时准备取消** - 提供安全的取消选项

### 沟通原则更新
1. **风险透明**: 及时告知技术风险，特别是数据丢失风险
2. **方案具体**: 提供可执行的解决方案，包含安全确认
3. **工作量明确**: 告知需要的时间和资源，包含确认时间
4. **安全第一**: 所有操作以安全为前提，宁可慢不可错
5. **用户确认**: 关键操作必须得到用户明确同意

## 📞 紧急情况处理

如果自动化脚本出现问题：

1. **立即停止**: 按 Ctrl+C 停止脚本
2. **检查状态**: 查看脚本输出和日志
3. **手动恢复**: 根据错误信息手动修复
4. **寻求帮助**: 如果无法解决，寻求技术支持

记住：**自动化是为了提高效率，但安全永远是第一位的。**
