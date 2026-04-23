// 夜狼模块 - 简化ES模块版本
// 用于快速验证架构

export async function initialize(fastify, options) {
  console.log("🎉 夜狼模块初始化 (简化版)");
  
  // 注册健康检查路由
  fastify.get('/api/nightwolf/v1/health', async (request, reply) => {
    return {
      module: {
        name: 'nightwolf',
        version: '0.1.0-simple',
        displayName: '夜狼策略配置系统 (简化版)'
      },
      state: {
        initialized: true,
        healthy: true,
        startTime: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  });
  
  // 注册模板API
  fastify.get('/api/nightwolf/v1/templates', async (request, reply) => {
    return {
      success: true,
      data: {
        templates: [
          {
            id: 'template_fast_food',
            name: '快餐店模板',
            type: 'fast_food',
            description: '适用于快餐店，简单快速的状态流程',
            isDefault: true
          },
          {
            id: 'template_casual_dining',
            name: '正餐餐厅模板',
            type: 'casual_dining',
            description: '适用于正餐餐厅，完整的服务流程',
            isDefault: true
          }
        ],
        total: 2,
        limit: 20,
        offset: 0
      }
    };
  });
  
  return {
    success: true,
    module: {
      name: 'nightwolf',
      version: '0.1.0-simple'
    },
    state: {
      initialized: true
    }
  };
}

export async function healthCheck() {
  return {
    healthy: true,
    checks: [
      { name: 'module', healthy: true },
      { name: 'api', healthy: true }
    ]
  };
}

export async function cleanup() {
  console.log("🧹 夜狼模块清理完成");
  return { success: true };
}
