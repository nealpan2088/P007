// 麒麟项目 - 夜狼模块集成服务器
// 使用新的模块化架构，集成夜狼策略配置系统

// 修复BigInt序列化问题
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// 加载环境变量
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量文件
// 优先加载 .env.development（开发环境），否则加载 .env（生产环境）
const devEnvPath = path.join(__dirname, '.env.development');
const prodEnvPath = path.join(__dirname, '.env');
const envPath = fs.existsSync(devEnvPath) ? devEnvPath : prodEnvPath;
console.log(`🔧 加载环境变量文件: ${envPath}`);
dotenv.config({ path: envPath, override: true });

// 导入新的主应用入口
import { fastify } from './src/index.js';

// 服务器启动
async function startServer() {
  try {
    // 服务器已经在index.js中启动，这里只需要等待
    console.log('🚀 夜狼集成服务器已启动');
    console.log(`📊 健康检查: http://localhost:${process.env.PORT || 33038}/api/health`);
    console.log(`🌙 夜狼模块: http://localhost:${process.env.PORT || 33038}/api/nightwolf/v1/health`);
    
    // 保持进程运行
    process.on('SIGINT', () => {
      console.log('\n👋 收到关闭信号，优雅退出');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n👋 收到终止信号，优雅退出');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();