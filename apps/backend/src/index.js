import Fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const fastify = Fastify({
  logger: true
})

// 注册 CORS
await fastify.register(cors, {
  origin: ['http://localhost:5177'],
  credentials: true
})

// 健康检查端点
fastify.get('/health', async () => {
  return {
    status: 'ok',
    service: 'p007-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  }
})

// API 路由
fastify.get('/api/hello', async () => {
  return {
    message: 'Hello from P007 API!',
    timestamp: new Date().toISOString()
  }
})

// 启动服务器
const start = async () => {
  try {
    const port = process.env.PORT || 33037
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 P007 后端服务器启动成功: http://localhost:${port}`)
    console.log(`📊 健康检查: http://localhost:${port}/health`)
    console.log(`👋 API示例: http://localhost:${port}/api/hello`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
