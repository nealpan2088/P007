# 零硬编码规范

## 绝对禁止
❌ 硬编码端口: `const PORT = 3000`
❌ 硬编码URL: `fetch('http://localhost:3000/api')`
❌ 硬编码路径: `router.push('/dashboard')`
❌ 硬编码密钥: `const secret = 'mysecret'`
❌ 硬编码数据库: `host: 'localhost'`

## 必须遵守
✅ 从环境变量读取: `process.env.PORT`
✅ 使用配置系统: `config.api.baseUrl`
✅ 使用路由常量: `ROUTES.DASHBOARD`
✅ 使用密钥管理: `process.env.JWT_SECRET`
✅ 从配置读取: `config.db.host`

## 检查方法
```bash
# 搜索硬编码
grep -r "localhost" src/
grep -r ":\d\{4\}" src/ --include="*.js"
grep -r "http://" src/
