import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log("测试租户路由导入...");
try {
  const tenantRoutes = require('./apps/backend/src/routes/tenant.routes.js');
  console.log("✅ 租户路由导入成功");
  console.log("导出函数:", Object.keys(tenantRoutes));
} catch (error) {
  console.log("❌ 租户路由导入失败:", error.message);
}
