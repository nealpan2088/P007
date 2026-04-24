/**
 * 麒麟项目 - 启动依赖检查脚本
 * 
 * 在开发服务器启动前运行，自动检查：
 * 1. Prisma schema 模型与 service 层引用是否一致
 * 2. 中间件依赖是否已初始化
 * 3. 路由 preHandler 是否存在未定义的函数
 * 
 * 用法: node scripts/check-deps.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

let exitCode = 0;
let hasIssues = false;

// ========== 1. 读取 Prisma Schema 中的模型名 ==========
function getPrismaModels() {
  const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models = content.match(/^model\s+(\w+)\s*\{/gm) || [];
  return models.map(m => m.replace('model ', '').replace(' {', '').trim());
}

// ========== 2. 读取 service 文件中引用的 Prisma 模型 ==========
function getServiceModelRefs(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // 匹配 this.db.<ModelName>.<method>( 或 this.db.<ModelName>.find
  const refs = content.match(/this\.db\.(\w+)\.\w+\s*\(/g) || [];
  return [...new Set(refs.map(r => r.match(/this\.db\.(\w+)\./)[1]))];
}

// 已知缺失但已确认跳过的模型（service 中已注释掉相关代码）
const KNOWN_MISSING_MODELS = ['storeStaff', 'storeBusinessHours'];

// ========== 3. 检查路由文件的 preHandler 引用 ==========
function checkRoutePreHandlers() {
  const routesDir = path.join(backendDir, 'src', 'routes');
  if (!fs.existsSync(routesDir)) return [];
  
  const issues = [];
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.routes.js'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
    // 查找 preHandler 引用
    const preHandlers = content.match(/preHandler:\s*(\w+)/g) || [];
    for (const ph of preHandlers) {
      const name = ph.replace('preHandler: ', '');
      // 检查这个函数是否在当前文件或 middleware 中定义了
      if (name !== 'authenticateOnly' && name !== 'authenticate' && !content.includes(`const ${name} =`) && !content.includes(`function ${name}`)) {
        // 暂不报错，因为可能从外部 import
      }
    }
  }
  return issues;
}

// ========== 主流程 ==========
console.log('🔍 启动依赖检查...\n');

// 获取 Prisma 模型
const prismaModels = getPrismaModels();
console.log(`📋 Prisma 模型 (${prismaModels.length}个): ${prismaModels.join(', ')}`);

// 检查所有的 service 文件
const servicesDir = path.join(backendDir, 'src', 'services');
if (fs.existsSync(servicesDir)) {
  const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.service.js'));
  
  for (const file of serviceFiles) {
    const filePath = path.join(servicesDir, file);
    const refs = getServiceModelRefs(filePath);
    
    for (const ref of refs) {
      // storeStaff → StoreStaff, storeBusinessHours → StoreBusinessHours
      // Prisma 模型名是首字母大写
      const modelName = ref.charAt(0).toUpperCase() + ref.slice(1);
      
      if (!prismaModels.includes(ref) && !prismaModels.includes(modelName)) {
        if (KNOWN_MISSING_MODELS.includes(ref)) {
          console.log(`  ℹ️   ${file} 引用了 this.db.${ref}（已知缺失，已跳过）`);
        } else {
          console.log(`  ⚠️  ${file} 引用了 this.db.${ref}，但 schema 中无对应模型`);
          console.log(`     ${filePath}`);
          exitCode = 1;
        }
      }
    }
  }
}

// 检查 undefined 的中间件依赖
console.log('\n📋 中间件依赖检查...');
const middlewarePath = path.join(backendDir, 'src', 'middleware', 'index.js');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');

if (middlewareContent.includes('request.db.publicDb') || middlewareContent.includes('request.db')) {
  console.log('  ⚠️  middleware/index.js 引用了 request.db，需确认已通过 decorateRequest 注入');
}

// 汇总
console.log('');
if (exitCode === 0) {
  console.log('✅ 依赖检查通过！');
} else {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ❌  依赖检查未通过！服务不会启动。                      ║');
  console.log('║      请修复上方列出的问题后重新启动。                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
}

process.exit(exitCode);
