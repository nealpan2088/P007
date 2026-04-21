# 麒麟项目 - 版本管理

## 版本号规范

采用语义化版本控制 (Semantic Versioning)：
- **主版本号 (MAJOR)**: 不兼容的API修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

## 当前版本

**v0.1.0** - 基础认证系统 & 系统模式框架

### 版本历史

#### v0.1.0 (2026-04-21) - 基础认证系统 & 系统模式框架
**里程碑**: 阶段1完成，系统模式功能实现

**新增功能**:
- ✅ 多租户数据库架构设计
- ✅ 用户认证系统 (注册/登录/JWT)
- ✅ 动态配置管理系统
- ✅ 统一路由常量系统
- ✅ 系统模式切换功能 (单店版/多店版)
- ✅ 完整规范化检查体系
- ✅ PostgreSQL数据库迁移
- ✅ 前后端开发环境配置

**技术特性**:
- **架构**: 多租户SaaS架构，支持单店/多店模式切换
- **后端**: Fastify + Prisma + PostgreSQL
- **前端**: React 19 + TypeScript + Vite
- **数据库**: PostgreSQL 13，Schema隔离
- **认证**: JWT + bcrypt，完整会话管理
- **配置**: 环境变量驱动，零硬编码
- **路由**: 统一路由常量管理
- **检查**: 自动化规范化检查脚本

**系统模式**:
- **单店版**: `SYSTEM_MODE=single` - 简化架构，固定店铺
- **多店版**: `SYSTEM_MODE=multi` - 完整SaaS，多租户多店铺

**已验证功能**:
1. 数据库迁移成功 (`001_init_public_schema`)
2. 后端API服务器运行正常 (端口33037)
3. 健康检查API可用 (`/api/health`)
4. 认证API可用 (`/api/v1/auth/*`)
5. 系统模式API可用 (`/api/v1/system/*`)
6. 前端TypeScript编译通过
7. 所有规范化检查通过

**项目状态**: ✅ **阶段1完成，可进入阶段2开发**

## 发布流程

### 1. 版本发布前检查
```bash
# 运行完整检查
cd ~/projects/P007
./scripts/check-hardcoded.sh
cd apps/backend && npm run check:all
cd apps/frontend && npm run check:all

# 测试核心功能
cd apps/backend
source setup-env.sh
npm run dev
# 在另一个终端测试API
curl http://localhost:33037/api/health
```

### 2. 更新版本号
```bash
# 更新package.json版本号
cd apps/backend
npm version patch  # 或 minor, major

cd ../frontend
npm version patch  # 保持版本同步
```

### 3. 更新版本文档
- 更新本文件 (VERSION.md)
- 更新CHANGELOG.md
- 更新README.md中的版本信息

### 4. 创建Git标签
```bash
git tag -a v0.1.0 -m "版本v0.1.0: 基础认证系统 & 系统模式框架"
git push origin v0.1.0
```

### 5. 发布到远程仓库
```bash
git push origin main
git push --tags
```

## 分支策略

- **main**: 生产就绪代码，每个提交都是可发布的
- **develop**: 开发分支，集成功能分支
- **feature/**: 功能开发分支
- **hotfix/**: 紧急修复分支
- **release/**: 发布准备分支

## 开发工作流

1. **从develop创建功能分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/新功能名称
   ```

2. **开发完成后合并**
   ```bash
   git checkout develop
   git merge --no-ff feature/新功能名称
   git branch -d feature/新功能名称
   git push origin develop
   ```

3. **发布版本**
   ```bash
   git checkout main
   git merge --no-ff develop
   git tag -a vx.y.z -m "版本描述"
   git push origin main --tags
   ```

## 依赖管理

### 后端依赖
```json
{
  "dependencies": {
    "@fastify/cors": "^11.2.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^6.0.0",
    "dotenv": "^16.0.0",
    "fastify": "^5.0.0",
    "jsonwebtoken": "^9.0.3"
  }
}
```

### 前端依赖
```json
{
  "dependencies": {
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^6.26.0"
  }
}
```

## 数据库迁移

当前迁移版本: `001_init_public_schema`

```bash
# 应用迁移
cd apps/backend
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status

# 创建新迁移
npx prisma migrate dev --name 迁移描述
```

## 部署信息

### 开发环境
- **后端端口**: 33037
- **前端端口**: 5177
- **数据库**: PostgreSQL @ localhost:5432
- **数据库名**: p007_development

### 启动命令
```bash
# 完整开发环境
cd ~/projects/P007
./start-dev.sh

# 单独启动
cd apps/backend && npm run dev
cd apps/frontend && npm run dev
```

## 下一步版本计划

### v0.2.0 - 前端认证界面 & 租户管理
- 前端登录/注册页面
- 租户注册和管理API
- 店铺管理功能
- 完整的用户流程测试

### v0.3.0 - 扫码点餐核心功能
- 菜单管理
- 餐桌管理
- 订单系统
- 打印集成

### v1.0.0 - 生产就绪版本
- 完整的多租户SaaS功能
- 生产环境部署配置
- 性能优化和安全加固
- 用户文档和培训材料

---

**记录时间**: 2026-04-21 10:09  
**记录人**: 旺财  
**项目状态**: 阶段1完成，版本v0.1.0就绪