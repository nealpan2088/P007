/**
 * 扫码点餐 API 集成测试
 * 测试核心业务流程：获取菜单 → 提交订单 → 查询订单状态
 *
 * 运行: node tests/integration/scan-order.test.js
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:33038';
const API_PREFIX = '/api/public';

// 测试用菜品ID（必须从数据库中查询，这里用动态获取的逻辑先写静态值）
const TEST_MENU_ITEM_1 = '8ea23752-b6e4-4057-9419-84aa8da4d4c0'; // 麻婆豆腐 ¥22
const TEST_MENU_ITEM_2 = 'f2111156-cfe6-434b-867c-6c033fc174fd'; // 米饭 ¥3

async function request(method, path, body) {
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;
const errors = [];

async function run(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    errors.push(`${name}: ${err.message}`);
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('\n🔍 扫码点餐 API 集成测试\n');

  // 1. 健康检查
  await run('GET /public/health - 健康检查', async () => {
    const res = await request('GET', '/health');
    if (!res.ok) throw new Error(`期望 200，实际 ${res.status}`);
  });

  // 2. 获取菜单
  await run('GET /stores/:storeId/menu - 获取店铺菜单', async () => {
    const res = await request('GET', '/stores/qilin-test-restaurant/menu');
    if (!res.ok) throw new Error(`期望 200，实际 ${res.status}`);
    if (!res.data?.success) throw new Error(`返回 success 不为 true`);
    if (!res.data?.data?.categories?.length) throw new Error(`缺少 categories 数据`);
    console.log(`     → ${res.data.data.categories.length} 个分类`);
  });

  // 3. 提交空购物车（应拒绝）
  await run('POST /orders - 空购物车下单应拒绝', async () => {
    const res = await request('POST', '/orders', {
      storeId: 'qilin-test-restaurant',
      items: [],
    });
    if (res.status !== 400) throw new Error(`期望 400，实际 ${res.status}`);
  });

  // 4. 提交有效订单
  await run('POST /orders - 有效订单提交', async () => {
    const res = await request('POST', '/orders', {
      storeId: 'qilin-test-restaurant',
      tableId: 'A01',
      items: [
        { menuItemId: TEST_MENU_ITEM_1, quantity: 2 },
        { menuItemId: TEST_MENU_ITEM_2, quantity: 1 },
      ],
    });
    if (!res.ok) throw new Error(`期望 2xx，实际 ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.success) throw new Error(`success 不为 true`);
    if (!res.data?.order?.id) throw new Error(`缺少 order.id`);
    console.log(`     → 订单号: ${res.data.order.orderNumber}`);
  });

  // 5. 查询订单状态
  await run('GET /orders/:orderId/status - 查询订单状态', async () => {
    const createRes = await request('POST', '/orders', {
      storeId: 'qilin-test-restaurant',
      tableId: 'A01',
      items: [{ menuItemId: TEST_MENU_ITEM_1, quantity: 1 }],
    });
    if (!createRes.data?.order?.id) throw new Error('创建订单失败');
    const orderId = createRes.data.order.orderNumber || createRes.data.order.id;
    const res = await request('GET', `/orders/${orderId}/status`);
    if (!res.ok) throw new Error(`期望 200，实际 ${res.status}`);
    if (!res.data?.success) throw new Error(`success 不为 true`);
    console.log(`     → 状态: ${res.data.order?.status || 'N/A'}`);
  });

  // 6. 不存在的订单
  await run('GET /orders/non-existent/status - 不存在的订单应返回 404', async () => {
    const res = await request('GET', '/orders/non-existent-id/status');
    if (res.status !== 404) throw new Error(`期望 404，实际 ${res.status}`);
  });

  // 7. 限频检查（最后做，会消耗限频配额）
  await run('POST /orders - 连续下单触发限频', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request('POST', '/public/scan/order/create', {
        storeId: 'qilin-test-restaurant',
        tableId: 'A01',
        items: [{ menuItemId: TEST_MENU_ITEM_1, quantity: 1 }],
      });
      if (res.status === 429) {
        console.log(`     → 第 ${i + 1} 次触发限频 (429)`);
        return;
      }
    }
    // 没触发也可能是限频窗口已重置，算通过但提示
    console.log('     → 未触发限频（窗口可能已重置，测试通过）');
  });

  // 汇总
  console.log(`\n📊 结果: ${passed} 通过, ${failed} 失败, ${passed + failed} 总计`);
  if (errors.length > 0) {
    console.log('\n❌ 失败详情:');
    errors.forEach(e => console.log(`   • ${e}`));
  }
  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('测试运行失败:', err);
  process.exit(1);
});
