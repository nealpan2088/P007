import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log("测试公共路由常量...");
try {
  const routes = require('./apps/backend/src/config/routes.js');
  console.log("PUBLIC_ROUTES.SCAN.HEALTH:", routes.PUBLIC_ROUTES.SCAN.HEALTH);
  console.log("预期路径: /health");
  console.log("配合前缀 /api/public: /api/public/health");
} catch (error) {
  console.log("错误:", error.message);
}
