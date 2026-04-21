# API 与路由编码规范

## 核心原则
1. **禁止硬编码 (No Hardcoding)**：严禁在代码中直接写入 URL 地址、API 路径或"魔法字符串"。
2. **统一 API 客户端**：所有后端 API 请求**必须**使用项目预设的 `src/lib/api-client` 模块，禁止直接调用 `fetch` 或 `axios`。
3. **路由集中管理**：页面路由跳转**必须**使用 `src/constants/routes.ts` 中导出的常量，禁止在代码中直接写 `/login`、`/dashboard` 等路径。

## 正确与错误示例

### API 调用
- ❌ **错误 (禁止)**
  ```javascript
  // 错误示例1：硬编码完整URL
  const res = await fetch('http://localhost:3000/api/v1/users');
  
  // 错误示例2：在组件内直接调用axios
  await axios.post('/api/v1/orders', orderData);
✅ 正确 (必须)

javascript
// 正确示例：从项目预设模块导入并使用
import { apiClient } from '@/lib/api-client';
const res = await apiClient.getUsers();
页面路由
❌ 错误 (禁止)

javascript
// 错误示例：硬编码路由路径
router.push('/settings/profile');
<Link href="/login">Login</Link>
✅ 正确 (必须)

javascript
// 正确示例：从路由常量文件中导入
import { ROUTES } from '@/constants/routes';
router.push(ROUTES.SETTINGS.PROFILE);
<Link href={ROUTES.AUTH.LOGIN}>Login</Link>
