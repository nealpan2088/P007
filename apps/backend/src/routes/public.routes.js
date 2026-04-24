// 公开API路由
// 扫码点餐相关API，无需认证

import scanService from '../services/public/scan.service.js';
import { validate } from '../services/validation.service.js';
import { PUBLIC_ROUTES } from '../config/routes.js';

/**
 * 公开API路由注册
 * @param {FastifyInstance} fastify - Fastify实例
 */
async function publicRoutes(fastify) {
  // 健康检查（公开）
  fastify.get(PUBLIC_ROUTES.SCAN.HEALTH, async (request, reply) => {
    return {
      status: 'ok',
      service: 'qilin-public-api',
      timestamp: new Date().toISOString(),
      version: '0.2.3'
    };
  });

  // 获取店铺信息（公开）
  fastify.get(PUBLIC_ROUTES.SCAN.STORE.INFO, async (request, reply) => {
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

  // 获取店铺菜单（公开）
  fastify.get(PUBLIC_ROUTES.SCAN.STORE.MENU, async (request, reply) => {
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

  // 创建扫码点餐订单（公开）
  fastify.post(PUBLIC_ROUTES.SCAN.ORDER.CREATE, {
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
      
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  // 获取订单状态（公开）
  fastify.get(PUBLIC_ROUTES.SCAN.ORDER.STATUS, async (request, reply) => {
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

  // 获取餐桌信息（公开）
  fastify.get(PUBLIC_ROUTES.SCAN.STORE.TABLE_INFO, async (request, reply) => {
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