#!/usr/bin/env node
/**
 * 路由系统一致性检查工具
 * 检查路由常量与注册前缀是否一致
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🚀 开始检查路由系统一致性...\n');

// 加载配置
const config = require('./apps/backend/src/config/index.js').default;
const routes = require('./apps/backend/src/config/routes.js');

const API_PREFIX = config.server.apiPrefix;
const API_VERSION = config.server.apiVersion;
const BASE_PATH = `${API_PREFIX}/${API_VERSION}`;

console.log('📊 配置信息:');
console.log(`  API_PREFIX: ${API_PREFIX}`);
console.log(`  API_VERSION: ${API_VERSION}`);
console.log(`  BASE_PATH: ${BASE_PATH}\n`);

// 检查使用BASE_PATH的路由
console.log('🔍 检查使用BASE_PATH的路由:');
const basePathRoutes = [];

function findBasePathRoutes(obj, path = '') {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string' && value.includes(BASE_PATH)) {
      basePathRoutes.push({
        path: currentPath,
        value: value,
        type: 'BASE_PATH'
      });
    } else if (typeof value === 'object' && value !== null) {
      findBasePathRoutes(value, currentPath);
    }
  }
}

findBasePathRoutes(routes);

console.log(`  找到 ${basePathRoutes.length} 个使用BASE_PATH的路由\n`);

// 显示前10个示例
console.log('📋 示例路由 (前10个):');
basePathRoutes.slice(0, 10).forEach(route => {
  console.log(`  ${route.path}: ${route.value}`);
});

// 分析路由注册前缀
console.log('\n🔧 路由注册前缀分析:');
console.log('  根据index.js，路由注册前缀有:');
console.log('    - /api/public  (公共路由)');
console.log('    - /api/tenant  (租户路由)');
console.log('    - /api/store   (店铺路由)');
console.log('    - /api/admin   (管理路由)\n');

// 检查路径矛盾
console.log('⚠️ 路径矛盾分析:');
console.log('  问题: 路由常量使用BASE_PATH(/api/v1)，但注册使用不同前缀');
console.log('  示例矛盾:');
console.log('    路由常量: /api/v1/auth/login');
console.log('    注册前缀: /api/public');
console.log('    实际路径: /api/public/api/v1/auth/login (重复/api)\n');

// 建议修复方案
console.log('💡 建议修复方案:');
console.log('  方案1: 统一使用相对路径');
console.log('    路由常量: /auth/login');
console.log('    注册前缀: /api/public');
console.log('    实际路径: /api/public/auth/login ✅');
console.log('');
console.log('  方案2: 统一使用完整路径');
console.log('    路由常量: /api/public/auth/login');
console.log('    注册前缀: 无');
console.log('    实际路径: /api/public/auth/login ✅');
console.log('');
console.log('  方案3: 统一前缀系统');
console.log('    所有路由使用: /api/v1 前缀');
console.log('    路由常量: /auth/login');
console.log('    注册前缀: /api/v1');
console.log('    实际路径: /api/v1/auth/login ✅\n');

// 统计信息
console.log('📈 统计信息:');
const totalRoutes = Object.keys(routes).reduce((count, category) => {
  if (typeof routes[category] === 'object') {
    return count + Object.keys(routes[category]).length;
  }
  return count + 1;
}, 0);

console.log(`  总路由数: ${totalRoutes}`);
console.log(`  使用BASE_PATH的路由: ${basePathRoutes.length} (${Math.round(basePathRoutes.length/totalRoutes*100)}%)`);
console.log(`  需要修复的路由: ${basePathRoutes.length}`);

// 输出修复建议
console.log('\n🔧 立即修复建议:');
console.log('  1. 修改routes.js中的路由常量:');
console.log('     将 `${BASE_PATH}/xxx` 改为 `/xxx`');
console.log('  2. 确保注册前缀与路由常量匹配');
console.log('  3. 运行路由测试验证所有路径');

process.exit(basePathRoutes.length > 0 ? 1 : 0);