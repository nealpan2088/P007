// 公开API路由
// 扫码点餐相关API，无需认证

import scanService from '../services/public/scan.service.js';
import { validate } from '../services/validation.service.js';
import { PUBLIC_ROUTES } from '../config/routes.js';

/**
 * 公开API路由注册
 * @param {FastifyInstance} fastify - Fastify实例
 */

// 限频配置
const rateLimits = new Map();
const RATE_WINDOW_MS = 60 * 1000; // 1分钟窗口

function checkRateLimit(key, maxCount) {
  const now = Date.now();
  const record = rateLimits.get(key);
  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    rateLimits.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }
  if (record.count >= maxCount) {
    return { allowed: false, remainingMs: RATE_WINDOW_MS - (now - record.windowStart) };
  }
  record.count++;
  return { allowed: true };
}

// 通用限频中间件：检查IP级别的访问频率
function rateLimit(maxRequests, name = '') {
  return (request, reply, done) => {
    const ip = request.ip;
    const key = name ? `ip:${name}:${ip}` : `ip:${ip}`;
    const result = checkRateLimit(key, maxRequests);
    if (!result.allowed) {
      reply.code(429).send({
        success: false,
        error: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMITED'
      });
      return;
    }
    done();
  };
}

// 定期清理过期记录（每5分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimits.entries()) {
    if (now - record.windowStart > RATE_WINDOW_MS) rateLimits.delete(key);
  }
}, 5 * 60 * 1000);

async function publicRoutes(fastify) {
  // 健康检查（公开，不限频）
  fastify.get(PUBLIC_ROUTES.SCAN.HEALTH, async (request, reply) => {
    return {
      status: 'ok',
      service: 'qilin-public-api',
      timestamp: new Date().toISOString(),
      version: '0.2.3'
    };
  });

  // 获取店铺信息（公开）— 限频：每分钟600次/IP
  fastify.get(PUBLIC_ROUTES.SCAN.STORE.INFO, {
    preHandler: rateLimit(600, 'store-info')
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      
      const result = await scanService.getStoreInfo(storeId);
      return reply.code(200).send(result);
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  // 获取店铺菜单（公开）— 限频：每分钟600次/IP
  fastify.get(PUBLIC_ROUTES.SCAN.STORE.MENU, {
    preHandler: rateLimit(600, 'store-menu')
  }, async (request, reply) => {
    try {
      const { storeId } = request.params;
      const { tableId } = request.query;
      
      const result = await scanService.getStoreMenu(storeId, tableId);
      return reply.code(200).send(result);
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  // 创建扫码点餐订单（公开）— 限频：每分钟3次/IP，同一手机号每分钟2次
  fastify.post(PUBLIC_ROUTES.SCAN.ORDER.CREATE, {
    preHandler: (request, reply, done) => {
      const ipCheck = checkRateLimit('create-order:ip:' + request.ip, 3);
      if (!ipCheck.allowed) {
        return reply.code(429).send({
          success: false,
          error: '操作过于频繁，请稍后再试',
          code: 'RATE_LIMITED'
        });
      }
      if (request.body?.customerPhone) {
        const phoneCheck = checkRateLimit('create-order:phone:' + request.body.customerPhone, 2);
        if (!phoneCheck.allowed) {
          return reply.code(429).send({
            success: false,
            error: '该手机号下单过于频繁，请稍后再试',
            code: 'RATE_LIMITED'
          });
        }
      }
      done();
    },
    schema: {
      body: {
        type: 'object',
        required: ['storeId', 'items'],
        properties: {
          storeId: { type: 'string' },
          tableId: { type: 'string' },
          customerName: { type: 'string', maxLength: 50 },
          customerPhone: { type: 'string', maxLength: 20 },
          customerNotes: { type: 'string', maxLength: 500 },
          orderType: { 
            type: 'string', 
            enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
            default: 'DINE_IN'
          },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['menuItemId'],
              properties: {
                menuItemId: { type: 'string' },
                quantity: { type: 'integer', minimum: 1, default: 1 },
                specialInstructions: { type: 'string', maxLength: 200 },
                options: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 验证请求数据
      const validation = validate(request.body, {
        storeId: 'required|string',
        tableId: 'string',
        customerName: 'string|max:50',
        customerPhone: 'string|max:20',
        customerNotes: 'string|max:500',
        orderType: 'string|in:DINE_IN,TAKEAWAY,DELIVERY',
        items: 'required|array|min:1'
      });

      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          error: '数据验证失败',
          details: validation.errors
        });
      }

      const result = await scanService.createScanOrder(request.body);
      
      // 异步触发打印（不阻塞下单）
      if (result?.success && result?.order?.id) {
        import('../services/printer/print-dispatcher.js').then(({ dispatchPrintJob }) => {
          dispatchPrintJob(result.order, result.order.storeId || request.body.storeId);
        }).catch(err => {
          console.error('[打印] 调度加载失败:', err.message);
        });
      }

      // 异步触发夜狼业务流程（不阻塞下单）
      if (result?.success && result?.order) {
        const storeId = result.order.storeId || request.body.storeId;
        const order = result.order;

        setImmediate(async () => {
          try {
            const nightwolf = fastify.nightwolf;
            if (!nightwolf || !nightwolf.triggerFlow) return;

            const orderItems = (order.items || request.body.items || []).map(item => ({
              name: item.name || item.menuItem?.name || '未知菜品',
              quantity: item.quantity || 1,
              price: item.price || item.unitPrice || 0,
            }));
            const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

            await nightwolf.triggerFlow(storeId, 'order_placed', {
              orderId: order.id || order.orderNumber,
              orderNumber: order.orderNumber || '',
              storeName: order.store?.name || '',
              tableNo: order.table?.tableNumber || order.tableId || '',
              items: orderItems,
              total,
              createdAt: order.createdAt || new Date().toISOString(),
            });
          } catch (e) {
            // 夜狼异常不阻塞主流程
          }
        });
      }
      
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  // 获取订单状态（公开）— 限频：每分钟120次/IP（前端轮询10s一次，够了）
  fastify.get(PUBLIC_ROUTES.SCAN.ORDER.STATUS, {
    preHandler: rateLimit(120, 'order-status')
  }, async (request, reply) => {
    try {
      const { orderId } = request.params;
      
      const result = await scanService.getOrderStatus(orderId);
      return reply.code(200).send({
        success: true,
        order: result
      });
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  // 获取餐桌信息（公开）— 限频：每分钟600次/IP
  fastify.get(PUBLIC_ROUTES.SCAN.STORE.TABLE_INFO, {
    preHandler: rateLimit(600, 'table-info')
  }, async (request, reply) => {
    try {
      const { storeId, tableId } = request.params;
      
      const result = await scanService.getTableInfo(storeId, tableId);
      return reply.code(200).send(result);
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  // API版本信息（公开）
  fastify.get(PUBLIC_ROUTES.PUBLIC.VERSION, async (request, reply) => {
    console.log('✅ VERSION端点被调用');
    return {
      success: true,
      data: {
        version: '1.0.0',
        service: 'qilin-saas-api',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      },
      message: '麒麟SaaS平台API版本信息'
    };
  });

  // API功能列表（公开）
  fastify.get(PUBLIC_ROUTES.PUBLIC.FEATURES, async (request, reply) => {
    console.log('✅ FEATURES端点被调用');
    return {
      success: true,
      data: {
        features: [
          '扫码点餐',
          '租户管理', 
          '店铺管理',
          '菜单管理',
          '订单管理',
          '云打印集成',
          '多租户SaaS架构',
          'API访问'
        ],
        enabled: [
          '扫码点餐',
          '租户管理',
          'API访问'
        ],
        comingSoon: [
          '云打印集成',
          '高级分析'
        ]
      },
      message: '麒麟SaaS平台功能列表'
    };
  });

  // 测试订单创建（开发用）
  if (process.env.NODE_ENV === 'development') {
    fastify.post(PUBLIC_ROUTES.SCAN.TEST.ORDER, async (request, reply) => {
      try {
        // 创建一个测试订单
        const testOrder = {
          storeId: request.body.storeId || 'test-store-id',
          tableId: request.body.tableId || null,
          customerName: '测试顾客',
          customerPhone: '13800138000',
          customerNotes: '测试订单，请尽快处理',
          orderType: 'DINE_IN',
          items: [
            {
              menuItemId: 'test-item-1',
              quantity: 2,
              specialInstructions: '不要香菜'
            },
            {
              menuItemId: 'test-item-2',
              quantity: 1
            }
          ]
        };

        const result = await scanService.createScanOrder(testOrder);
        return reply.code(201).send({
          success: true,
          message: '测试订单创建成功',
          order: result.order
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error.message
        });
      }
    });
  }
}

export default publicRoutes;