import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 加载配置
const config = require('./apps/backend/src/config/index.js').default;

console.log("配置信息:");
console.log("API_PREFIX:", config.server.apiPrefix);
console.log("API_VERSION:", config.server.apiVersion);
console.log("BASE_PATH:", `${config.server.apiPrefix}/${config.server.apiVersion}`);

// 加载路由常量
const routes = require('./apps/backend/src/config/routes.js');
console.log("\nTENANT_ROUTES.TENANT.LIST:", routes.TENANT_ROUTES.TENANT.LIST);
console.log("TENANT_ROUTES.TENANT.HEALTH:", routes.TENANT_ROUTES.TENANT.HEALTH);

// 计算实际路径
const BASE_PATH = `${config.server.apiPrefix}/${config.server.apiVersion}`;
const expectedList = `${BASE_PATH}/tenant/list`;
console.log("\n预期路径 (基于BASE_PATH):", expectedList);
console.log("但注册前缀是: /api/tenant");
console.log("所以完整路径应该是: /api/tenant/list");
console.log("但路由常量是:", routes.TENANT_ROUTES.TENANT.LIST);
console.log("这会导致路径: /api/tenant" + routes.TENANT_ROUTES.TENANT.LIST);
