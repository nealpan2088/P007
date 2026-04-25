// 夜狼 - 业务流程配置路由
// 管理 StoreFlowConfig（类别级）和 StoreFlowOverride（店铺级）

import { publicDb } from '../../../db/index.js';
import { ADMIN_ROUTES } from '../../../config/routes.js';

const API_PREFIX = process.env.API_PREFIX || '/api';

// 夜狼路由常量（基于 routes.js 的 ADMIN_ROUTES.NIGHTWOLF + API 前缀拼接）
const NW = {};
for (const [key, val] of Object.entries(ADMIN_ROUTES.NIGHTWOLF)) {
  NW[key] = `${API_PREFIX}${val}`;
}

// 简化的认证辅助函数（不带 done 参数，兼容 Fastify 4.x+）
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../../../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const jwtSecret = envContent.split('\n')
  .find(l => l.startsWith('JWT_SECRET='))
  ?.split('=')[1]?.trim() || 'default-dev-secret';
const JWT_SECRET = jwtSecret;

async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ code: 401, error: '未提供认证Token' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (err) {
    return reply.status(401).send({ code: 401, error: 'Token无效' });
  }
}

function authorize(...allowedRoles) {
  return async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ code: 401, error: '未认证' });
    }
    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({ code: 403, error: '无权限' });
    }
  };
}

const VALID_STORE_TYPES = ['RESTAURANT', 'CAFE', 'FAST_FOOD', 'BAKERY', 'BAR', 'FOOD_TRUCK', 'CATERING', 'OTHER'];

function validStoreType(type) {
  return VALID_STORE_TYPES.includes(type);
}

/**
 * 路由注册函数
 */
export default async function configRoutes(fastify) {

  // ========== 类别级默认配置 ==========

  fastify.get(NW.CONFIGS, async (request, reply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    await authorize('SUPER_ADMIN', 'TENANT_ADMIN')(request, reply);
    if (reply.sent) return;

    const configs = await publicDb.storeFlowConfig.findMany({
      orderBy: { storeType: 'asc' }
    });
    return reply.send({ code: 200, message: 'success', data: configs });
  });

  fastify.get(NW.CONFIG_BY_TYPE, async (request, reply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    await authorize('SUPER_ADMIN', 'TENANT_ADMIN')(request, reply);
    if (reply.sent) return;

    const { storeType } = request.params;
    if (!validStoreType(storeType)) {
      return reply.status(400).send({ code: 400, error: `无效的店铺类别: ${storeType}，有效值: ${VALID_STORE_TYPES.join(', ')}` });
    }

    const config = await publicDb.storeFlowConfig.findUnique({
      where: { storeType }
    });
    if (!config) {
      return reply.status(404).send({ code: 404, error: '该类别暂无流程配置' });
    }
    return reply.send({ code: 200, message: 'success', data: config });
  });

  fastify.put(NW.CONFIG_BY_TYPE, async (request, reply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    await authorize('SUPER_ADMIN')(request, reply);
    if (reply.sent) return;

    const { storeType } = request.params;
    if (!validStoreType(storeType)) {
      return reply.status(400).send({ code: 400, error: `无效的店铺类别: ${storeType}，有效值: ${VALID_STORE_TYPES.join(', ')}` });
    }
    const { name, rules } = request.body;

    if (!name || !rules) {
      return reply.status(400).send({ code: 400, error: 'name 和 rules 必填' });
    }

    const config = await publicDb.storeFlowConfig.upsert({
      where: { storeType },
      create: { storeType, name, rules },
      update: { name, rules }
    });

    return reply.send({ code: 200, message: 'success', data: config });
  });

  fastify.delete(NW.CONFIG_BY_TYPE, async (request, reply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    await authorize('SUPER_ADMIN')(request, reply);
    if (reply.sent) return;

    const { storeType } = request.params;
    if (!validStoreType(storeType)) {
      return reply.status(400).send({ code: 400, error: `无效的店铺类别: ${storeType}，有效值: ${VALID_STORE_TYPES.join(', ')}` });
    }
    await publicDb.storeFlowConfig.delete({ where: { storeType } }).catch(() => {});
    return reply.send({ code: 200, message: 'success' });
  });

  // ========== 店铺级覆盖 ==========

  fastify.get(NW.STORE_CONFIG, async (request, reply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const { storeId } = request.params;

    const store = await publicDb.store.findUnique({
      where: { id: storeId },
      select: { type: true }
    });
    if (!store) {
      return reply.status(404).send({ code: 404, error: '店铺不存在' });
    }

    const defaultConfig = await publicDb.storeFlowConfig.findUnique({
      where: { storeType: store.type }
    });

    const override = await publicDb.storeFlowOverride.findUnique({
      where: { storeId }
    });

    let mergedRules = defaultConfig?.rules || [];
    if (override?.overrides?.rules) {
      mergedRules = mergeRules(mergedRules, override.overrides.rules);
    }

    return reply.send({
      code: 200, message: 'success',
      data: {
        storeType: store.type,
        defaultConfig: defaultConfig || null,
        override: override || null,
        mergedRules
      }
    });
  });

  fastify.put(NW.STORE_OVERRIDE, async (request, reply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const { storeId } = request.params;
    const { rules } = request.body;

    const store = await publicDb.store.findUnique({
      where: { id: storeId },
      select: { type: true }
    });
    if (!store) {
      return reply.status(404).send({ code: 404, error: '店铺不存在' });
    }

    const defaultConfig = await publicDb.storeFlowConfig.findUnique({
      where: { storeType: store.type }
    });
    if (!defaultConfig) {
      return reply.status(400).send({ code: 400, error: '该类别尚未配置流程规则' });
    }

    const record = await publicDb.storeFlowOverride.upsert({
      where: { storeId },
      create: { storeId, configId: defaultConfig.id, overrides: { rules: rules || [] } },
      update: { overrides: { rules: rules || [] } }
    });

    return reply.send({ code: 200, message: 'success', data: record });
  });

  fastify.delete(NW.STORE_OVERRIDE, async (request, reply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const { storeId } = request.params;
    await publicDb.storeFlowOverride.delete({ where: { storeId } }).catch(() => {});
    return reply.send({ code: 200, message: 'success' });
  });

  // 健康检查（无需认证）
  fastify.get(NW.HEALTH, async (request, reply) => {
    return reply.send({
      code: 200, message: 'success',
      data: {
        name: 'nightwolf',
        version: '0.2.0',
        status: 'running',
        initialized: true
      }
    });
  });

  // 触发流程测试端点（模拟事件）
  fastify.post(NW.TRIGGER, async (request, reply) => {
    const { event, context } = request.body;
    if (!event) {
      return reply.status(400).send({ code: 400, error: '缺少 event 参数' });
    }

    // 从 executor 导入 triggerFlow
    const { triggerFlow } = await import('../engine/executor.cjs');

    try {
      const results = await triggerFlow(request.params.storeId, event, context || {});
      return reply.send({ code: 200, message: 'success', data: results });
    } catch (err) {
      return reply.send({ code: 200, message: 'success', data: { triggered: true, warning: err.message } });
    }
  });
}

function mergeRules(defaults, overrides) {
  const map = new Map();
  for (const r of defaults) map.set(r.name, r);
  for (const r of overrides) map.set(r.name, r);
  return Array.from(map.values());
}
