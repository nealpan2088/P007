# P007麒麟项目 - API路由映射文档

**文档版本**: 1.0.0  
**更新日期**: 2026-04-23  
**最后验证**: 正在验证中

## 📋 文档目的

记录实际可用的API路由，识别路由系统设计问题，指导渐进式修复。

## 🎯 验证状态说明

- ✅ **已验证可用** - API路径正确，返回预期响应
- ⚠️ **需要修复** - API路径存在问题，需要修复
- 🔄 **待验证** - 尚未测试验证
- ❌ **不可用** - API路径错误或未实现

## 🔍 路由系统设计问题总结

### **发现的设计矛盾**:
1. **路由常量使用`BASE_PATH`** (`/api/v1`)
2. **但实际注册使用不同前缀** (`/api/public`, `/api/tenant`, `/api/store`, `/api/admin`)
3. **导致路径计算错误**: `/api/public` + `/api/v1/xxx` = `/api/public/api/v1/xxx` ❌

### **影响范围**:
- 总路由常量: 276个
- 实际注册的路由: 约20-30个
- 需要立即修复: 实际使用的路由

## 📊 实际可用的API路由映射

### **1. 公共API路由 (`/api/public`)**

| 路由常量 | 实际路径 | 状态 | 验证结果 | 备注 |
|---------|---------|------|----------|------|
| `PUBLIC_ROUTES.SCAN.HEALTH` | `/api/public/health` | ✅ **已验证** | HTTP 200 OK | 修复了重复前缀问题 |
| `PUBLIC_ROUTES.SCAN.STORE.INFO` | `/api/public/stores/:storeId` | 🔄 待验证 |  |  |
| `PUBLIC_ROUTES.SCAN.STORE.MENU` | `/api/public/stores/:storeId/menu` | 🔄 待验证 |  |  |
| `PUBLIC_ROUTES.SCAN.ORDER.CREATE` | `/api/public/orders` | 🔄 待验证 |  | 扫码点餐创建订单 |
| `PUBLIC_ROUTES.SCAN.ORDER.STATUS` | `/api/public/orders/:orderId/status` | 🔄 待验证 |  |  |
| `PUBLIC_ROUTES.PUBLIC.VERSION` | `/api/public/version` | ✅ **已验证** | HTTP 200 OK | 版本信息 |
| `PUBLIC_ROUTES.PUBLIC.FEATURES` | `/api/public/features` | 🔄 待验证 |  | 功能列表 |

### **2. 租户API路由 (`/api/tenant`)**

| 路由常量 | 实际路径 | 状态 | 验证结果 | 备注 |
|---------|---------|------|----------|------|
| `TENANT_ROUTES.TENANT.HEALTH` | `/api/tenant/health` | ✅ **已验证** | HTTP 200 OK | 工作正常 |
| `TENANT_ROUTES.TENANT.LIST` | `/api/tenant/list` | ⚠️ **需要修复** | HTTP 401 (路径正确) | 路径正确，需要有效Token |
| `TENANT_ROUTES.TENANT.REGISTER` | `/api/tenant/register` | 🔄 待验证 |  | 租户注册 |
| `TENANT_ROUTES.TENANT.CHECK_SUBDOMAIN` | `/api/tenant/check-subdomain` | 🔄 待验证 |  | 检查子域名 |
| `TENANT_ROUTES.TENANT.DETAIL` | `/api/tenant/:tenantId` | 🔄 待验证 |  | 租户详情 |
| `TENANT_ROUTES.TENANT.UPDATE` | `/api/tenant/:tenantId` | 🔄 待验证 |  | 租户更新 |
| `TENANT_ROUTES.TENANT.STATS` | `/api/tenant/:tenantId/stats` | 🔄 待验证 |  | 租户统计 |
| `TENANT_ROUTES.TENANT.ADD_USER` | `/api/tenant/:tenantId/users` | 🔄 待验证 |  | 添加用户 |

### **3. 系统API路由 (`/api/system` - 注释中)**

| 路由常量 | 实际路径 | 状态 | 验证结果 | 备注 |
|---------|---------|------|----------|------|
| `SYSTEM_ROUTES.SYSTEM.INFO` | (未注册) | ❌ **不可用** | 路由被注释 | `index.js`第144行注释 |
| `SYSTEM_ROUTES.SYSTEM.HEALTH` | (未注册) | ❌ **不可用** | 路由被注释 |  |
| `SYSTEM_ROUTES.SYSTEM.MODE` | (未注册) | ❌ **不可用** | 路由被注释 |  |
| `SYSTEM_ROUTES.SYSTEM.CONFIG` | (未注册) | ❌ **不可用** | 路由被注释 |  |

### **4. 认证API路由 (`/api/auth` - 注释中)**

| 路由常量 | 实际路径 | 状态 | 验证结果 | 备注 |
|---------|---------|------|----------|------|
| `AUTH.REGISTER` | (未注册) | ❌ **不可用** | 路由被注释 | `index.js`第148行注释 |
| `AUTH.LOGIN` | (未注册) | ❌ **不可用** | 路由被注释 |  |
| `AUTH.LOGOUT` | (未注册) | ❌ **不可用** | 路由被注释 |  |

## 🛠️ 立即修复计划

### **高优先级修复** (今天完成)

#### **1. 修复租户路由常量**
```javascript
// 修复前（在routes.js中）
TENANT.LIST: `${BASE_PATH}/tenant/list`  // /api/v1/tenant/list

// 修复后
TENANT.LIST: `/list`  // 相对路径
// 配合前缀 /api/tenant = /api/tenant/list ✅
```

**需要修复的租户路由**:
- [ ] `TENANT.LIST` → `/list`
- [ ] `TENANT.DETAIL` → `/:tenantId`
- [ ] `TENANT.UPDATE` → `/:tenantId`
- [ ] `TENANT.STATS` → `/:tenantId/stats`
- [ ] `TENANT.HEALTH` → `/health` (已正确)
- [ ] `TENANT.REGISTER` → `/register`
- [ ] `TENANT.CHECK_SUBDOMAIN` → `/check-subdomain`
- [ ] `TENANT.ADD_USER` → `/:tenantId/users`

#### **2. 修复公共路由常量**
```javascript
// 修复前
SCAN.HEALTH: `${BASE_PATH}/scan/health`  // /api/v1/scan/health

// 修复后  
SCAN.HEALTH: `/health`  // 相对路径
// 配合前缀 /api/public = /api/public/health ✅
```

### **中优先级修复** (本周内)

#### **1. 验证和修复店铺路由**
#### **2. 验证和修复管理路由**
#### **3. 创建路由测试套件**

### **低优先级** (按需修复)

#### **1. 系统路由** - 等需要时取消注释并修复
#### **2. 认证路由** - 等需要时取消注释并修复
#### **3. 其他未使用的路由**

## 🔧 修复验证步骤

### **步骤1：修复路由常量**
```bash
# 手动编辑routes.js文件
# 或使用选择性修复脚本
```

### **步骤2：重启服务器验证**
```bash
pm2 restart qilin-backend-dev-nightwolf
```

### **步骤3：测试API路径**
```bash
# 测试租户健康检查
curl http://localhost:33038/api/tenant/health

# 测试租户列表（需要Token）
curl -H "Authorization: Bearer valid-token" http://localhost:33038/api/tenant/list

# 测试公共API
curl http://localhost:33038/api/public/health
```

## 📝 路由开发规范

### **新路由开发流程**:
1. **定义路由常量** (使用相对路径):
   ```javascript
   // ✅ 正确：使用相对路径
   NEW_ROUTE: `/new-endpoint`
   
   // ❌ 错误：使用BASE_PATH
   NEW_ROUTE: `${BASE_PATH}/new-endpoint`
   ```

2. **实现路由处理函数**
3. **注册路由** (指定正确前缀):
   ```javascript
   fastify.register(newRoutes, { prefix: '/api/xxx' })
   ```

4. **验证路径计算**:
   ```
   路由常量: `/new-endpoint`
   注册前缀: `/api/xxx`
   实际路径: `/api/xxx/new-endpoint` ✅
   ```

### **路由修复检查清单**:
- [ ] 路由常量使用相对路径
- [ ] 注册前缀与路由类型匹配
- [ ] 实际路径计算正确
- [ ] 前端调用使用正确路径
- [ ] API响应正常

## 🚀 下一步行动

### **立即执行** (今天):
1. [ ] 修复租户路由常量
2. [ ] 修复公共路由常量  
3. [ ] 验证修复后的API
4. [ ] 更新前端API调用路径

### **短期计划** (本周):
1. [ ] 创建路由测试脚本
2. [ ] 修复店铺和管理路由
3. [ ] 建立路由开发规范
4. [ ] 创建API文档

### **长期优化**:
1. [ ] 自动化路由验证
2. [ ] 路由版本管理
3. [ ] API文档自动化生成
4. [ ] 路由监控和告警

## 📞 问题反馈

发现路由问题或需要添加新路由时：
1. 更新此文档
2. 按照路由开发规范实现
3. 验证路径计算正确性
4. 更新验证状态

---

**文档维护**:
- 每次路由变更后更新此文档
- 定期验证API可用性
- 记录路由修复历史