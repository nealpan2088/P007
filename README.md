# P007 - 麒麟点餐SaaS平台

## 🚀 项目概述

麒麟点餐是一个现代化的多租户SaaS平台，专为餐厅和餐饮业务设计。平台提供完整的扫码点餐、订单管理、店铺管理和数据分析功能。

## 📊 当前版本状态

**版本**: v0.2.0 (2026年4月21日)
**状态**: ✅ **核心功能开发完成**

### ✅ 已完成功能
1. **用户认证系统** - 完整的注册/登录流程
2. **租户管理系统** - 多租户架构支持
3. **租户仪表板** - 租户级别的管理界面
4. **系统模式切换** - 单店版/多店版支持

### 🔧 技术架构
- **后端**: Node.js + Fastify + PostgreSQL + Prisma
- **前端**: React + TypeScript + Material-UI + Vite
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

### 租户管理
- `/tenants` - 租户列表
- `/tenants/create` - 创建租户
- `/tenants/:id/edit` - 编辑租户
- `/tenants/:id` - 租户仪表板

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

### v0.3.0 (计划中)
- [ ] 店铺管理功能
- [ ] 菜单管理系统
- [ ] 订单处理流程
- [ ] 扫码点餐界面

### v0.4.0 (规划中)
- [ ] 支付集成
- [ ] 打印机集成
- [ ] 报表系统
- [ ] 移动端应用

---

**最后更新**: 2026年4月21日
**当前版本**: v0.2.0
**项目状态**: 核心功能开发完成，可进行下一步开发