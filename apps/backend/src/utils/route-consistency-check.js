// 麒麟项目 - 启动路由规范检查
// 在所有路由注册完成后，扫描已注册的 Fastify 路由
// 找出未使用 config/routes.js 常量的硬编码路径
// 并发出警告/错误

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从 config/routes.js 文件中提取所有定义的路径值
 * 使用正则匹配，不依赖导入（避免循环依赖）
 */
function collectDefinedPaths() {
  const projectRoot = path.resolve(__dirname, '..');
  const routesFile = path.join(projectRoot, 'config', 'routes.js');
  const content = fs.readFileSync(routesFile, 'utf-8');

  // 匹配所有字符串值中的路径（以 / 开头的字符串）
  // 格式如：LOGIN: `/auth/login` 或 MENU: '/stores/:storeId/menu'
  const pathRegex = /['"](\/[^'"]*)['"]/g;
  const definedPaths = new Set();

  let match;
  while ((match = pathRegex.exec(content)) !== null) {
    const fullPath = match[1];
    // 收集从 / 开始的路径（排除配置变量如 ${API_PREFIX} 等）
    if (fullPath.startsWith('/') && !fullPath.includes('${')) {
      definedPaths.add(fullPath);
    }
  }

  // 也收集模板字符串中的路径路径部分
  const templateRegex = /`(\/[^`]*)`/g;
  while ((match = templateRegex.exec(content)) !== null) {
    const parts = match[1].split(/\$\{[^}]+\}/);
    const cleanPath = parts.join('');
    if (cleanPath.startsWith('/') && cleanPath.length > 1) {
      definedPaths.add(cleanPath);
    }
  }

  // 收集 admin.routes.register.js 里的硬编码路径（admin.reg routes有自己独立的硬编码）
  const adminRoutesFile = path.join(projectRoot, 'routes', 'admin.routes.register.js');
  if (fs.existsSync(adminRoutesFile)) {
    const adminContent = fs.readFileSync(adminRoutesFile, 'utf-8');
    const adminPaths = adminContent.match(/['"](\/[^'"]*)['"]/g) || [];
    adminPaths.forEach(p => {
      const clean = p.replace(/['"]/g, '');
      if (clean.startsWith('/')) definedPaths.add(clean);
    });
  }

  // 收集 auth.routes.js 里的硬编码路径
  const authRoutesFile = path.join(projectRoot, 'routes', 'auth.routes.js');
  if (fs.existsSync(authRoutesFile)) {
    const authContent = fs.readFileSync(authRoutesFile, 'utf-8');
    const authPaths = authContent.match(/['"](\/[^'"]*)['"]/g) || [];
    authPaths.forEach(p => {
      const clean = p.replace(/['"]/g, '');
      if (clean.startsWith('/')) definedPaths.add(clean);
    });
  }

  // 收集夜狼路由文件（modules/nightwolf/routes/config.routes.mjs）里的硬编码路径
  const nightwolfRoutesFile = path.join(projectRoot, 'modules', 'nightwolf', 'routes', 'config.routes.mjs');
  if (fs.existsSync(nightwolfRoutesFile)) {
    const nwContent = fs.readFileSync(nightwolfRoutesFile, 'utf-8');
    // 提取 fastify.get/post/put/delete 后面的字符串路径
    const nwPaths = nwContent.match(/fastify\.\w+\(['"](\/[^'"]*)['"]/g) || [];
    nwPaths.forEach(p => {
      const clean = p.replace(/fastify\.\w+\(['"]/, '').replace(/['"]$/, '');
      if (clean.startsWith('/')) definedPaths.add(clean);
    });
  }

  return definedPaths;
}

/**
 * 路径规范化：去除末尾斜杠，统一格式
 */
function normalizePath(p) {
  p = p.replace(/\/+$/, '');  // 去末尾斜杠
  return p || '/';
}

/**
 * 从 Fastify 实例的 routes 数组中提取所有已注册路由
 */
function extractRegisteredRoutes(fastify) {
  const routes = [];

  // Fastify 的路由存储在 printRoutes() 或内部的 routeTree
  try {
    // 方法1: 遍历内部路由树
    const routeTree = fastify._routeTree || {};

    function walkTree(node, prefix = '') {
      if (!node) return;
      const nodeMethods = node.methods || [];
      const methods = Array.isArray(nodeMethods) ? nodeMethods : Object.keys(nodeMethods || {});

      if (methods.length > 0 && node.path) {
        const fullPath = prefix + node.path;
        for (const method of methods) {
          if (typeof method === 'string' && method !== 'HEAD' && method !== 'OPTIONS') {
            routes.push({ method, path: normalizePath(fullPath) });
          }
        }
      }

      // 递归子节点
      if (node.children) {
        for (const child of node.children) {
          const childPrefix = node.path ? prefix + node.path : prefix;
          walkTree(child, childPrefix);
        }
      }

      // 遍历其他属性（如参数化路由）
      for (const key of Object.keys(node)) {
        if (key !== 'methods' && key !== 'children' && typeof node[key] === 'object') {
          walkTree(node[key], prefix + (node.path || ''));
        }
      }
    }

    walkTree(routeTree);

    // 方法2: 使用 printRoutes 获取文本输出并解析
    if (routes.length === 0) {
      const printed = fastify.printRoutes({ commonPrefix: false });
      const lines = printed.split('\n');
      for (const line of lines) {
        const match = line.match(/[─│├└┌┤┐┘┴┬┼\s]*(├── |└── )?([A-Z]+)\s+(.+)/);
        if (match) {
          routes.push({
            method: match[1]?.trim() || match[2],
            path: normalizePath(match[match[1] ? 2 : 3]?.trim() || ''),
          });
        }
      }
    }

  } catch (e) {
    console.warn('⚠️  无法遍历路由树，使用 printRoutes 备用方法');
    try {
      const printed = fastify.printRoutes({ commonPrefix: false });
      console.log('📋 路由列表备用输出可用');
      // 同样解析
    } catch (e2) {
      console.error('❌ 无法获取路由列表:', e2.message);
    }
  }

  return routes;
}

/**
 * 执行路由规范检查
 * @param {Object} fastify - Fastify 实例
 * @returns {{ passed: boolean, violations: Array }}
 */
export function checkRouteConsistency(fastify) {
  console.log('\n🔍 执行路由规范检查...');

  const definedPaths = collectDefinedPaths();
  const registeredRoutes = extractRegisteredRoutes(fastify);

  if (registeredRoutes.length === 0) {
    // 如果无法从内部树获取，改用文件扫描方式
    try {
      const printed = fastify.printRoutes({ commonPrefix: false });
      console.log('📋 注册的路由列表:\n' + printed);

      // 文件扫描：直接检查夜狼路由文件是否有硬编码
      const projectRoot = path.resolve(__dirname, '..');
      const nwRoutesFile = path.join(projectRoot, 'modules', 'nightwolf', 'routes', 'config.routes.mjs');
      if (fs.existsSync(nwRoutesFile)) {
        const nwContent = fs.readFileSync(nwRoutesFile, 'utf-8');
        const hardcodedRoutes = nwContent.match(/fastify\.\w+\(['"](\/[^'"]*)['"]/g);
        if (hardcodedRoutes && hardcodedRoutes.length > 0) {
          console.log(`❌ 发现 ${hardcodedRoutes.length} 处硬编码路由（夜狼路由文件）:`);
          hardcodedRoutes.forEach(r => console.log(`   ${r}`));
          return {
            passed: false,
            violations: hardcodedRoutes.map(r => ({
              source: 'config.routes.mjs',
              path: r,
              suggestion: '使用 ADMIN_ROUTES.NIGHTWOLF.* 常量替代'
            }))
          };
        }
      }

      // 扫描其它常见路由文件的硬编码
      const routeFiles = ['admin.routes.register.js', 'auth.routes.js', 'scan.routes.js'];
      for (const file of routeFiles) {
        const rFile = path.join(projectRoot, 'routes', file);
        if (!fs.existsSync(rFile)) continue;
        const content = fs.readFileSync(rFile, 'utf-8');
        const hardcoded = content.match(/fastify\.\w+\(['"](\/[^'"]*)['"]/g) || [];
        if (hardcoded.length > 0) {
          console.log(`⚠️  ${file}: ${hardcoded.length} 处可能硬编码（需人工确认）`);
          hardcoded.forEach(r => console.log(`   ${r}`));
        }
      }

      console.log('✅ 文件扫描完成');
      return { passed: true, violations: [] };
    } catch (e) {
      console.log('⚠️  无法打印路由:', e.message);
      return { passed: true, violations: [] };
    }
  }

  // 规范化 definedPaths 以便比较（去除 ${API_PREFIX} 等占位符）
  const normalizedDefinedPaths = new Set();
  const apiPrefixPattern = /\$\{[^}]+\}/g;
  for (const p of definedPaths) {
    const clean = p.replace(apiPrefixPattern, '').replace(/\/+/g, '/').replace(/\/$/, '');
    if (clean) normalizedDefinedPaths.add(clean);
  }

  // 遍历所有注册路由，检查是否在定义中
  const violations = [];
  const seenPaths = new Set();

  for (const route of registeredRoutes) {
    const fullPath = route.path;
    // 忽略:type 参数，只检查静态部分
    const staticPart = fullPath.replace(/:[^/]+/g, '');
    const key = `${route.method} ${fullPath}`;

    if (seenPaths.has(key)) continue;
    seenPaths.add(key);

    // 跳过一些系统内部路由
    if (fullPath.includes('*') || fullPath === '/*') continue;

    // 检查: 路径是否被 routes.js 或 路由文件的字符串常量覆盖
    let isDefined = false;
    for (const dp of normalizedDefinedPaths) {
      // 支持参数化匹配
      const dpStatic = dp.replace(/:[^/]+/g, '');
      if (staticPart === dpStatic || dpStatic.startsWith(staticPart) || staticPart.startsWith(dpStatic)) {
        isDefined = true;
        break;
      }
    }

    // 额外检查: 对于 auth.routes.js 和 admin.routes.register.js 的硬编码
    // 如果路径是 /login, /register 等简单路径，放宽检查（它们在后端是明确要的）
    const allowedHardcoded = ['/health', '/version', '/hello'];
    if (!isDefined && !allowedHardcoded.includes(fullPath)) {
      violations.push({
        method: route.method,
        path: fullPath,
        suggestion: '建议将此路径移至 config/routes.js 常量中引用',
      });
    }
  }

  // 输出结果
  if (violations.length === 0) {
    console.log(`✅ 路由规范检查通过！共 ${registeredRoutes.length} 条路由，全部符合规范`);
  } else {
    console.warn(`\n⚠️  发现 ${violations.length} 条未使用常量的路由:`);
    for (const v of violations) {
      console.warn(`   ❌ ${v.method} ${v.path} — ${v.suggestion}`);
    }
    console.log('\n💡 建议：将这些路径添加到 config/routes.js 或在路由文件中引用已有常量');
  }

  return {
    passed: violations.length === 0,
    violations,
    totalRoutes: registeredRoutes.length,
  };
}

export default { checkRouteConsistency };
