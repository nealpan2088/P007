# API 与路由编码规范（基于麒麟项目规范）

## 核心原则
1. **零硬编码**：严禁在代码中直接写入 URL、路径、端口、密钥等
2. **统一配置**：所有配置必须从 config 系统读取
3. **路由常量**：所有路由必须使用常量定义

## 路由规范

### 后端路由
- 必须使用 `src/config/routes.js` 中的路由常量
- 4大类路由：公共、租户、顾客、管理
- 使用智能路由工具函数构建URL

✅ 正确示例：
```javascript
import { ROUTES, buildUrl } from '@/config/routes';
const url = buildUrl(ROUTES.TENANT.ORDERS.LIST, { tenantId: '123' });
❌ 错误示例：

javascript
const url = '/api/tenant/123/orders';  // 硬编码！
前端路由
必须使用 src/config/index.ts 中的路由配置

3大类路由：公共、租户、顾客

✅ 正确示例：

typescript
import { ROUTES } from '@/config';
router.push(ROUTES.TENANT.DASHBOARD);
配置规范
环境变量
所有配置从 config 系统读取

7大配置分类：服务器、数据库、认证、租户、业务、安全、监控

✅ 正确示例：

javascript
import { config } from '@/config';
const port = config.server.port;
const apiUrl = config.api.baseUrl;
❌ 错误示例：

javascript
const port = 3000;  // 硬编码！
const apiUrl = 'http://localhost:3000';  // 硬编码！
禁止事项
❌ 禁止硬编码端口、URL、路径

❌ 禁止硬编码数据库配置

❌ 禁止硬编码密钥和密码

❌ 禁止硬编码业务参数

❌ 禁止直接使用字符串路径
