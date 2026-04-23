# 麒麟项目 - 环境配置指南
版本: 0.2.5

## 📋 环境配置文件结构

### 后端环境配置 (`apps/backend/.env`)
```env
# ==================== 基础配置 ====================
NODE_ENV=development
PORT=33038

# ==================== 数据库配置 ====================
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/p007_simple

# ==================== 安全配置 ====================
JWT_SECRET=your-jwt-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5177

# ==================== 日志配置 ====================
LOG_LEVEL=info
LOG_FORMAT=json

# ==================== 功能开关 ====================
FEATURE_MULTI_TENANT=true
FEATURE_SCAN_ORDER=true
FEATURE_CLOUD_PRINT=false
```

### 前端环境配置 (`apps/frontend/.env`)
```env
# ==================== 基础配置 ====================
VITE_NODE_ENV=development
VITE_PORT=5177

# ==================== API配置 ====================
VITE_API_BASE_URL=http://localhost:33038
VITE_API_TIMEOUT=10000
VITE_API_VERSION=v1

# ==================== 应用信息 ====================
VITE_APP_NAME=麒麟云点餐SaaS
VITE_APP_VERSION=0.2.5
VITE_APP_DESCRIPTION=多店铺扫码点餐云打印SaaS平台

# ==================== 功能开关 ====================
VITE_FEATURE_AUTH=true
VITE_FEATURE_MULTI_TENANT=true
VITE_FEATURE_PRINTING=false
VITE_FEATURE_ANALYTICS=true
```

## 🔧 配置验证

### 1. 运行环境验证脚本
```bash
./check-env-config.sh
```

### 2. 检查项目状态
```bash
./start-qilin.sh status
```

### 3. 验证API端点
```bash
# 健康检查
curl http://localhost:33038/api/health

# 版本信息
curl http://localhost:33038/api/public/version
```

## 🚀 快速启动

### 开发模式
```bash
# 一键启动
./start-qilin.sh dev

# 或分别启动
./start-qilin.sh backend
./start-qilin.sh frontend
```

### 生产模式
```bash
# 使用PM2管理
pm2 start pm2-qilin.config.js
```

## 📊 监控与维护

### 查看日志
```bash
# 后端日志
tail -f apps/backend/logs/backend-combined.log

# 前端日志
tail -f apps/frontend/logs/frontend-combined.log
```

### 健康检查
```bash
# 自动健康检查
./check-env-config.sh

# 手动检查
curl -s http://localhost:33038/api/health | jq '.status'
```

## 🔄 版本管理

### 更新版本号
1. 更新所有package.json文件中的版本号
2. 运行环境验证确保一致性
3. 更新CHANGELOG.md

### 版本一致性检查
```bash
# 检查所有组件的版本
grep '"version"' package.json apps/*/package.json
```

## ⚠️ 常见问题

### 端口冲突
如果端口被占用，修改对应环境文件中的端口配置：
```bash
# 后端端口
sed -i 's/PORT=33038/PORT=33039/' apps/backend/.env

# 前端端口
sed -i 's/VITE_PORT=5177/VITE_PORT=5178/' apps/frontend/.env
```

### API地址不匹配
确保前端配置的API地址与后端实际运行地址一致：
```bash
# 检查当前配置
grep "VITE_API_BASE_URL" apps/frontend/.env
grep "PORT" apps/backend/.env
```

### 数据库连接失败
检查数据库配置：
```bash
# 验证数据库连接
psql "$(grep DATABASE_URL apps/backend/.env | cut -d'=' -f2)" -c "SELECT 1"
```

## 📝 最佳实践

1. **版本控制**: 所有环境配置文件都应加入版本控制
2. **敏感信息**: 敏感信息（如密码、密钥）使用环境变量，不硬编码
3. **配置验证**: 部署前运行配置验证脚本
4. **文档更新**: 环境配置变更时更新此文档
5. **备份配置**: 定期备份环境配置文件

## 🔗 相关文件

- `start-qilin.sh` - 一键启动脚本
- `check-env-config.sh` - 环境配置验证脚本
- `pm2-qilin.config.js` - PM2配置文件
- `env-config-report-*.txt` - 环境配置报告

---

**最后更新**: 2026-04-23
**版本**: 0.2.5