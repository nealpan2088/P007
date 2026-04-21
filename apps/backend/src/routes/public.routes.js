// 公开API路由
// 扫码点餐相关API，无需认证

import scanService from '../services/public/scan.service.js';
import { validate } from '../services/validation.service.js';

/**
 * 公开API路由注册
 * @param {FastifyInstance} fastify - Fastify实例
 */
async function publicRoutes(fastify) {
  // 健康检查（公开）
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      service: 'qilin-public-api',
      timestamp: new Date().toISOString(),
      version: '0.1.0'
    };
  });

  // 获取店铺菜单（公开）
  fastify.get('/stores/:storeId/menu', async (request, reply) => {
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
  fastify.post('/orders', {
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
  fastify.get('/orders/:orderId/status', async (request, reply) => {
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

  // 测试订单创建（开发用）
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/test/order', async (request, reply) => {
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