import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * 从后端 routes.js 提取所有常量路径
 */
function extractBackendPaths() {
  const routesFile = path.join(projectRoot, 'config', 'routes.js');
  if (!fs.existsSync(routesFile)) return [];

  const content = fs.readFileSync(routesFile, 'utf-8');
  const paths = [];

  // 匹配单引号/反引号路径，排除模板占位和源码结构
  const matches = content.matchAll(/(['"`])(\/[^'"`]*)\1/g);
  for (const m of matches) {
    const p = m[2];
    if (p.startsWith('/') && !p.includes('node_modules') && p.length > 1) {
      paths.push(p.replace(/\/$/, ''));
    }
  }

  return [...new Set(paths)];
}

/**
 * 从后端 printRoutes 输出提取所有已注册路由
 * @param {Object} fastify
 */
function extractRegisteredRoutes(fastify) {
  try {
    const printed = fastify.printRoutes({ commonPrefix: false });
    const lines = printed.split('\n');
    const routes = [];

    for (const line of lines) {
      // 格式: ├── /api/nightwolf/health (GET, HEAD)
      const match = line.match(/──\s+(\/[^\s(]+)/);
      if (match) {
        routes.push(match[1].replace(/\/$/, ''));
      }
    }

    return [...new Set(routes)];
  } catch (e) {
    console.warn('⚠️  无法从 printRoutes 提取路由:', e.message);
    return [];
  }
}

/**
 * 从前端 api-routes.ts 提取所有 API 路径
 */
function extractFrontendPaths() {
  const feRoot = path.resolve(projectRoot, '../../apps/frontend');
  const apiRoutesFile = path.join(feRoot, 'src', 'config', 'api-routes.ts');

  // 也尝试相对项目根的路径
  let content = null;
  if (fs.existsSync(apiRoutesFile)) {
    content = fs.readFileSync(apiRoutesFile, 'utf-8');
  } else {
    // 从项目根找
    const alt = path.resolve(projectRoot, '../../../apps/frontend/src/config/api-routes.ts');
    if (fs.existsSync(alt)) {
      content = fs.readFileSync(alt, 'utf-8');
    } else {
      const p007alt = '/home/admin/projects/P007/apps/frontend/src/config/api-routes.ts';
      if (fs.existsSync(p007alt)) {
        content = fs.readFileSync(p007alt, 'utf-8');
      } else {
        console.warn('⚠️  前端 api-routes.ts 未找到，跳过检查');
        return [];
      }
    }
  }
  const paths = [];

  // 匹配所有字符串中的路径（以 / 开头，排除注释和模板字符串中的占位符）
  const matches = content.matchAll(/['"`](\/[^'"`]+)['"`]/g);
  for (const m of matches) {
    const p = m[1];
    // 只匹配看起来像 API 路径的
    if (
      p.startsWith('/') &&
      p.length > 1 &&
      !p.startsWith('//') &&
      !p.includes(':') && // 跳过模板参数
      !p.includes('*') &&
      !p.startsWith('/admin/') && // 前端路由，不是 API
      !p.includes('node_modules')
    ) {
      paths.push(p.replace(/\/$/, ''));
    }
  }

  return [...new Set(paths)];
}

/**
 * 规范化路径方便比对（去掉 /api 前缀）
 */
function normalizeForCompare(p) {
  let clean = p.replace(/^\/(api\/v\d+\/)?/, '/').replace(/^\/(api\/)?/, '/');
  // 如果去掉 /api 后为空，保留原始
  if (clean === '') clean = p;
  return clean.replace(/\/$/, '');
}

/**
 * 执行前后端路由同步检查
 * @param {Object} fastify
 */
export function checkApiRouteSync(fastify) {
  console.log('\n🔍 前后端 API 路径一致性检查...');

  const backendRegistered = extractRegisteredRoutes(fastify);
  const frontendRoutes = extractFrontendPaths();

  if (backendRegistered.length === 0 && frontendRoutes.length === 0) {
    console.log('  ⚠️  无法获取路由信息，跳过检查');
    return;
  }

  // 规范化后端路由，方便匹配
  const backendSet = new Set(backendRegistered.map(normalizeForCompare));

  // 检查前端每个路径是否能在后端找到匹配
  const unmatched = [];
  const matched = [];

  // 从后端路由构建查找表：路径静态部分 → 实际路由
  const backendLookup = new Map();
  for (const br of backendRegistered) {
    const staticPart = br.replace(/\/:[^/]+/g, '').replace(/\/$/, '');
    backendLookup.set(staticPart, br);
  }

  for (const fePath of frontendRoutes) {
    // 跳过非 API 的系统路径和占位符系统路径
    if (fePath.includes('${') || fePath.startsWith('/api/') === false && !fePath.startsWith('/nightwolf/')) continue;

    const feStatic = fePath.replace(/\/:\w+/g, '').replace(/\/\$\{[^}]+\}/g, '').replace(/\/$/, '');
    let found = false;

    for (const [backendStatic, backendFull] of backendLookup) {
      if (backendStatic === feStatic || backendStatic.endsWith(feStatic) || feStatic.endsWith(backendStatic.replace('/api', ''))) {
        found = true;
        break;
      }
    }

    if (found) {
      matched.push(fePath);
    } else {
      // 再次尝试：检查是否有任何后端路由包含这个路径的 /api 去除后部分
      const feWithoutApi = fePath.replace(/^\/api/, '');
      for (const br of backendRegistered) {
        if (br.includes(feWithoutApi) || br.replace('/api', '') === feWithoutApi) {
          found = true;
          break;
        }
      }
      if (!found) unmatched.push(fePath);
      else matched.push(fePath);
    }
  }

  if (unmatched.length === 0) {
    console.log(`  ✅ 前端 ${matched.length} 条 API 路径与后端路由一致`);
  } else {
    console.log(`  ⚠️  发现 ${unmatched.length} 条前端路径在后端未找到匹配：`);
    for (const p of unmatched) {
      console.log(`    ❌ ${p}`);
    }
    console.log('  注意：部分可能是旧版兼容路由或待清理路径，人工确认即可');
  }

  // 反向检查：后端已注册但前端没定义的路径
  const notInFrontend = [];
  for (const br of backendRegistered) {
    if (br.includes('/api/') && !frontendRoutes.includes(br)) {
      // 检查是否有任何前端路径能匹配上
      const brNorm = normalizeForCompare(br);
      const hasFrontend = frontendRoutes.some(fe => normalizeForCompare(fe) === brNorm);
      if (!hasFrontend) {
        notInFrontend.push(br);
      }
    }
  }

  if (notInFrontend.length > 0) {
    console.log(`  ℹ️  后端 ${notInFrontend.length} 条已注册路由在前端常量中未定义（可能仅内部使用）：`);
    for (const p of notInFrontend.slice(0, 5)) {
      console.log(`    📡 ${p}`);
    }
    if (notInFrontend.length > 5) {
      console.log(`    ... 还有 ${notInFrontend.length - 5} 条未显示`);
    }
  }

  return { matched, unmatched, notInFrontend };
}

export default { checkApiRouteSync };
