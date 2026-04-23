import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== 诊断启动问题 ===');

// 测试1: 环境变量加载
console.log('\n1. 测试环境变量加载...');
dotenv.config({ path: path.join(__dirname, '.env') });
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// 测试2: config加载
console.log('\n2. 测试config加载...');
try {
  const config = await import('./src/config/index.js');
  console.log('config导入成功');
  
  const serverConfig = config.getServerConfig();
  console.log('服务器配置:', serverConfig);
} catch (error) {
  console.log('config加载失败:', error.message);
}

// 测试3: Fastify监听
console.log('\n3. 测试Fastify监听...');
import Fastify from 'fastify';
const fastify = Fastify();

fastify.get('/test', async () => ({ ok: true }));

try {
  await fastify.listen({ port: 33038, host: '0.0.0.0' });
  console.log('✅ 监听成功');
} catch (error) {
  console.log('❌ 监听失败:', error.code);
  console.log('是否调用process.exit?');
  // 模拟原代码
  console.error('❌ 清洁版服务器启动失败:', error);
  process.exit(1);
}

console.log('这行不应该执行');
