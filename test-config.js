// 测试配置验证
require('dotenv').config({ path: 'apps/backend/.env.development' });

try {
  const config = require('./apps/backend/src/config/dynamic-config.js');
  console.log('✅ 配置模块加载成功');
  
  // 检查validate函数
  if (typeof config.validate === 'function') {
    console.log('✅ validate函数存在');
    
    try {
      const result = config.validate();
      console.log('✅ 配置验证通过:', result);
    } catch (error) {
      console.error('❌ 配置验证失败:', error.message);
      console.error('错误详情:', error);
    }
  } else {
    console.error('❌ validate不是函数:', typeof config.validate);
  }
  
  // 检查配置属性
  console.log('\n📋 配置检查:');
  console.log('server:', config.server);
  console.log('database.url:', config.database.url ? '✅ 已设置' : '❌ 未设置');
  console.log('auth.jwtSecret:', config.auth.jwtSecret ? '✅ 已设置' : '❌ 未设置');
  console.log('system.mode:', config.system.mode);
  
} catch (error) {
  console.error('❌ 配置模块加载失败:', error.message);
  console.error('错误堆栈:', error.stack);
}