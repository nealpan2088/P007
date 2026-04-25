// 夜狼 - 业务流程执行引擎
// 触发事件 → 查配置 → 执行动作
// 轻量级，不依赖复杂规则引擎

const { publicDb } = require('../../../db/index.js');

// 注册的动作处理器
const actionHandlers = {
  print: handlePrint,
  voice: handleVoice,
  display: handleDisplay,
  alert: handleAlert,
  notify: handleNotify
};

/**
 * 触发业务流程
 * @param {string} storeId - 店铺ID
 * @param {string} eventType - 事件类型（order_placed, order_ready, timeout 等）
 * @param {object} eventData - 事件数据（订单信息等）
 * @param {object} options - 可选参数
 */
async function triggerFlow(storeId, eventType, eventData, options = {}) {
  try {
    // 1. 获取店铺的完整配置
    const rules = await getStoreRules(storeId);
    if (!rules || rules.length === 0) {
      return { triggered: false, reason: 'no_rules' };
    }

    // 2. 匹配触发事件
    const matchedRules = rules.filter(r => r.trigger === eventType);
    if (matchedRules.length === 0) {
      return { triggered: false, reason: 'no_matching_trigger' };
    }

    // 3. 执行匹配规则
    const results = [];
    for (const rule of matchedRules) {
      // 检查条件（可选）
      if (rule.conditions && !checkConditions(rule.conditions, eventData)) {
        continue;
      }

      // 执行动作
      const actionResults = await runActions(rule.actions, eventData, storeId);
      results.push({ rule: rule.name, actions: actionResults });

      // 设置超时（可选）
      if (rule.timeout) {
        scheduleTimeout(rule.timeout, eventType, eventData, storeId);
      }
    }

    return { triggered: true, results };
  } catch (err) {
    console.error('[夜狼] 流程执行出错:', err.message);
    return { triggered: false, error: err.message };
  }
}

/**
 * 获取店铺的合并规则
 */
async function getStoreRules(storeId) {
  const store = await publicDb.store.findUnique({
    where: { id: storeId },
    select: { type: true }
  });
  if (!store) return null;

  const defaultConfig = await publicDb.storeFlowConfig.findUnique({
    where: { storeType: store.type }
  });

  const override = await publicDb.storeFlowOverride.findUnique({
    where: { storeId }
  });

  let rules = defaultConfig?.rules || [];
  if (override?.overrides?.rules) {
    rules = mergeRules(rules, override.overrides.rules);
  }

  return rules;
}

function mergeRules(defaults, overrides) {
  const map = new Map();
  for (const r of defaults) map.set(r.name, r);
  for (const r of overrides) map.set(r.name, r);
  return Array.from(map.values());
}

/**
 * 检查条件
 */
function checkConditions(conditions, eventData) {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, expected] of Object.entries(conditions)) {
    const actual = eventData[key];
    if (typeof expected === 'object' && expected !== null) {
      if (expected.gt !== undefined && !(actual > expected.gt)) return false;
      if (expected.lt !== undefined && !(actual < expected.lt)) return false;
      if (expected.in !== undefined && !expected.in.includes(actual)) return false;
      if (expected.eq !== undefined && actual !== expected.eq) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

/**
 * 执行动作列表
 */
async function runActions(actions, eventData, storeId) {
  if (!actions || actions.length === 0) return [];

  const results = [];
  for (const action of actions) {
    const handler = actionHandlers[action.type];
    if (handler) {
      try {
        const result = await handler(action.params || {}, eventData, storeId);
        results.push({ type: action.type, success: true, result });
      } catch (err) {
        console.error(`[夜狼] 动作 ${action.type} 执行失败:`, err.message);
        results.push({ type: action.type, success: false, error: err.message });
      }
    } else {
      console.warn(`[夜狼] 未知动作类型: ${action.type}`);
      results.push({ type: action.type, success: false, error: 'unknown_action_type' });
    }
  }
  return results;
}

/**
 * 设置超时
 */
async function scheduleTimeout(timeout, eventType, eventData, storeId) {
  if (!timeout || !timeout.after_ms) return;

  const timerId = `nightwolf_${storeId}_${eventData.orderId || Date.now()}`;

  // 使用 setTimeout，生产环境应改用任务队列
  setTimeout(async () => {
    try {
      console.log(`[夜狼] 超时触发: ${timerId} (${timeout.after_ms}ms 后)`);
      await runActions(timeout.action ? [timeout.action] : [], eventData, storeId);
    } catch (err) {
      console.error('[夜狼] 超时动作执行失败:', err.message);
    }
  }, timeout.after_ms);

  return { timerId, delayMs: timeout.after_ms };
}

// ========== 动作处理器（占位，后续实现具体业务逻辑） ==========

async function handlePrint(params, eventData, storeId) {
  console.log(`[夜狼] 🖨️ 打印:`, JSON.stringify(params));
  // TODO: 调用打印机API打印订单
  return { message: '打印队列已提交（占位）' };
}

async function handleVoice(params, eventData, storeId) {
  console.log(`[夜狼] 🔊 语音播报:`, params.message || '新订单');
  // TODO: 调用语音播报硬件/API
  return { message: '语音播报已触发（占位）' };
}

async function handleDisplay(params, eventData, storeId) {
  console.log(`[夜狼] 🖥️ 叫号大屏:`, JSON.stringify(params));
  // TODO: 更新叫号大屏数据
  return { message: '大屏更新已触发（占位）' };
}

async function handleAlert(params, eventData, storeId) {
  console.log(`[夜狼] ⚠️ 告警:`, params.target || 'manager');
  // TODO: 发送告警通知（短信、APP推送等）
  return { message: '告警已触发（占位）' };
}

async function handleNotify(params, eventData, storeId) {
  console.log(`[夜狼] 📱 通知:`, JSON.stringify(params));
  // TODO: 发送终端/APP推送
  return { message: '通知已发送（占位）' };
}

module.exports = {
  triggerFlow,
  getStoreRules,
  registerAction: (type, handler) => { actionHandlers[type] = handler; }
};
