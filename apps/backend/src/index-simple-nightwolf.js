// 简化版夜狼集成 - 用于快速测试

// 原有的导入和配置保持不变...
// 只修改夜狼模块初始化部分

async function initializeNightWolfModule() {
  try {
    console.log('🌙 开始初始化夜狼模块 (简化版)...');
    
    // 导入简化版ES模块
    const nightWolf = await import('./modules/nightwolf/index-simple.mjs');
    
    // 初始化夜狼模块
    const initResult = await nightWolf.initialize(fastify, {
      logLevel: process.env.NIGHTWOLF_LOG_LEVEL || 'info',
    });
    
    if (initResult.success) {
      nightWolfModule = nightWolf;
      nightWolfInitialized = true;
      console.log('🎉 夜狼模块初始化成功 (简化版)');
    } else {
      console.warn('⚠️  夜狼模块初始化失败');
    }
    
  } catch (error) {
    console.error('❌ 夜狼模块加载失败:', error.message);
  }
}
