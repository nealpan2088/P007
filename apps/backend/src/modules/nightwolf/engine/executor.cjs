// 夜狼 - 业务流程执行引擎
// 触发事件 → 查配置 → 执行动作
// 轻量级，不依赖复杂规则引擎

const { publicDb } = require('../../../db/index.js');
const path = require('path');
const { fileURLToPath } = require('url');

// 注册的动作处理器
const actionHandlers = {
  print: handlePrint,
  voice: handleVoice,
  display: handleDisplay,
  alert: handleAlert,
  notify: handleNotify,
  updateOrderStatus: handleUpdateOrderStatus
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
  try {
    const { default: PrinterService } = await import('../../../services/printer/printer.service.js');
    const printerService = new PrinterService();

    // 判断打印类型：params 有 message 字段说明是超时催单
    const printType = params.message === '超时提醒' ? 'timeout_reminder' : 'order';

    console.log(`[夜狼] 🖨️ 尝试打印店铺 ${storeId} 订单 ${eventData.orderId || '未知'} (${printType})`);

    const result = await printerService.printStoreOrder(storeId, {
      orderNumber: eventData.orderId || 'N/A',
      storeName: eventData.storeName || '',
      tableName: eventData.tableNo || eventData.tableName || '',
      items: (eventData.items || []).map(item => ({
        name: typeof item === 'string' ? item : (item.name || '未知菜品'),
        quantity: item.quantity || 1,
        price: item.price || 0,
        specialInstructions: item.remark || '',
      })),
      totalAmount: eventData.total || eventData.totalAmount || 0,
      createdAt: new Date().toISOString(),
    }, printType);

    if (result.success) {
      console.log(`[夜狼] 🖨️ ✅ 打印成功: ${eventData.orderId}`);
    } else {
      console.warn(`[夜狼] 🖨️ ⚠️ 打印未完成: ${result.message}`);
    }

    return { message: result.message || '打印完成', success: result.success };
  } catch (err) {
    console.error(`[夜狼] 🖨️ ❌ 打印失败:`, err.message);
    return { message: `打印失败: ${err.message}`, success: false, error: err.message };
  }
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

/**
 * 更新订单状态动作处理器
 * params.status — 目标状态（PREPARING, READY, COMPLETED 等）
 * params.delay_after_ms — 可选，延迟执行（毫秒）
 */
async function handleUpdateOrderStatus(params, eventData, storeId) {
  const { status } = params;
  if (!status) {
    return { success: false, error: '缺少 status 参数' };
  }

  const orderId = eventData.orderId || eventData.id;
  if (!orderId) {
    return { success: false, error: '缺少订单ID' };
  }

  try {
    // eventData.orderId 可能是 orderNumber（字符串），也可能是数据库ID
    // 先尝试用 id 查，失败再用 orderNumber 查
    let order;
    try {
      order = await publicDb.order.update({
        where: { id: orderId },
        data: { status },
        select: { id: true, orderNumber: true, status: true },
      });
    } catch (_e) {
      // 用 orderNumber 再试一次
      order = await publicDb.order.update({
        where: { orderNumber: orderId },
        data: { status },
        select: { id: true, orderNumber: true, status: true },
      });
    }

    console.log(`[夜狼] 📋 订单 ${order.orderNumber} 状态已更新为 ${order.status}`);
    return { success: true, orderId: order.id, orderNumber: order.orderNumber, status: order.status, storeId };
  } catch (err) {
    console.error(`[夜狼] 📋 ❌ 订单 ${orderId} 状态更新失败:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  triggerFlow,
  getStoreRules,
  registerAction: (type, handler) => { actionHandlers[type] = handler; }
};
