# 麒麟项目 - 端口配置管理指南
版本: 0.2.5

## 📋 端口配置规范

### 标准端口分配
| 服务 | 端口 | 环境变量 | 默认值 | 说明 |
|------|------|----------|--------|------|
| **后端API服务器** | 33038 | `PORT` | 33038 | 主API服务端口 |
| **前端开发服务器** | 5177 | `VITE_PORT` | 5177 | Vite开发服务器端口 |
| **前端API地址** | 33038 | `VITE_API_BASE_URL` | `http://localhost:33038` | 前端调用后端的地址 |
| **监控指标端口** | 9090 | `METRICS_PORT` | 9090 | 监控指标收集端口 |

## 🔧 环境变量配置

### 后端环境配置 (`apps/backend/.env`)
```env
# ==================== 端口配置 ====================
PORT=33038
METRICS_PORT=9090

# ==================== 数据库配置 ====================
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/p007_simple

# ==================== 安全配置 ====================
JWT_SECRET=your-jwt-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5177
```

### 前端环境配置 (`apps/frontend/.env`)
```env
# ==================== 端口配置 ====================
VITE_PORT=5177
VITE_API_BASE_URL=http://localhost:33038

# ==================== 应用配置 ====================
VITE_APP_NAME=麒麟云点餐SaaS
VITE_APP_VERSION=0.2.5
VITE_NODE_ENV=development
```

## 🚀 代码中的环境变量使用

### 后端代码示例
```javascript
// 正确：使用环境变量
const port = process.env.PORT || 33038;

// 正确：带类型转换和验证
const port = parseInt(process.env.PORT, 10);
if (isNaN(port) || port < 1 || port > 65535) {
  throw new Error(`端口号无效: ${process.env.PORT}`);
}

// 错误：硬编码端口（避免使用）
const port = 33038; // ❌ 不要这样写
```

### 前端代码示例
```typescript
// 正确：使用Vite环境变量
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const port = import.meta.env.VITE_PORT;

// 正确：构建API请求
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/health`);

// 错误：硬编码API地址（避免使用）
const apiBaseUrl = 'http://localhost:33038'; // ❌ 不要这样写
```

## 📊 配置一致性检查

### 自动化检查脚本
```bash
# 运行端口配置检查
./check-port-config.sh

# 或使用完整的环境配置检查
./check-env-config.sh
```

### 手动检查命令
```bash
# 检查后端端口配置
grep -r "process.env.PORT" apps/backend/src

# 检查前端端口配置
grep -r "import.meta.env.VITE" apps/frontend/src

# 检查硬编码端口
grep -r "33038\|33038\|5177" apps/ | grep -v node_modules | grep -v ".log" | grep -v ".backup"
```

## 🔄 端口变更流程

### 步骤1: 更新环境变量
```bash
# 更新后端端口
sed -i 's/PORT=33038/PORT=33039/' apps/backend/.env

# 更新前端API地址
sed -i 's|VITE_API_BASE_URL=http://localhost:33038|VITE_API_BASE_URL=http://localhost:33039|' apps/frontend/.env
```

### 步骤2: 更新示例文件
```bash
# 更新.env.example
sed -i 's/PORT=33038/PORT=33039/' apps/backend/.env.example
sed -i 's|VITE_API_BASE_URL=http://localhost:33038|VITE_API_BASE_URL=http://localhost:33039|' apps/frontend/.env.example
```

### 步骤3: 验证配置
```bash
# 运行配置检查
./check-env-config.sh

# 重启服务验证
./start-qilin.sh restart
```

### 步骤4: 更新文档
```bash
# 更新此文档中的端口号
sed -i 's/33038/33039/g' port-config-guide.md
```

## 🛡️ 最佳实践

### 1. 环境变量优先
- 所有端口配置必须通过环境变量管理
- 代码中只使用环境变量，不硬编码端口
- 提供合理的默认值作为后备

### 2. 统一默认值
- 所有环境文件中的默认值必须一致
- 代码中的默认值必须与环境文件一致
- 示例文件必须反映当前规范

### 3. 验证机制
- 部署前必须运行配置检查
- 定期检查配置一致性
- 建立自动化验证流程

### 4. 文档同步
- 端口变更必须更新所有相关文档
- 维护配置变更记录
- 提供清晰的迁移指南

## 📝 配置检查清单

### 部署前检查
- [ ] 所有环境文件中的端口配置一致
- [ ] 代码中无硬编码端口
- [ ] 示例文件反映当前配置
- [ ] 文档已更新

### 定期检查（每周）
- [ ] 运行 `./check-env-config.sh`
- [ ] 检查硬编码端口
- [ ] 验证服务健康状态
- [ ] 更新配置报告

### 变更后检查
- [ ] 配置验证通过
- [ ] 服务重启成功
- [ ] 功能测试正常
- [ ] 文档更新完成

## 🔗 相关文件

- `check-env-config.sh` - 环境配置验证脚本
- `start-qilin.sh` - 服务启动脚本
- `.env.example` - 环境配置示例
- `port-config-guide.md` - 此文档

## ⚠️ 常见问题

### 端口冲突
```bash
# 检查端口占用
lsof -ti:33038
lsof -ti:5177

# 查找可用端口
for port in {33039..33049}; do
  if ! lsof -ti:$port &> /dev/null; then
    echo "可用端口: $port"
    break
  fi
done
```

### 环境变量未加载
```bash
# 检查环境变量加载
node -e "console.log('PORT:', process.env.PORT)"

# 强制加载环境变量
export $(grep -v '^#' .env | xargs)
```

### 配置不一致
```bash
# 快速检查配置一致性
diff <(grep PORT apps/backend/.env) <(grep PORT apps/backend/.env.example)
diff <(grep VITE_API_BASE_URL apps/frontend/.env) <(grep VITE_API_BASE_URL apps/frontend/.env.example)
```

---

**最后更新**: 2026-04-23  
**版本**: 0.2.5  
**维护者**: 麒麟项目团队