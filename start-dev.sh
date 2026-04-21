#!/bin/bash

echo "🚀 启动 P007 开发环境..."

# 启动后端服务器
echo "🔧 启动后端服务器 (端口: 33037)..."
cd apps/backend
npm install 2>/dev/null || echo "后端依赖安装中..."
node src/index.js &
BACKEND_PID=$!
cd ../..

# 等待后端启动
sleep 3

# 启动前端开发服务器
echo "🎨 启动前端开发服务器 (端口: 5177)..."
cd apps/frontend
npm install 2>/dev/null || echo "前端依赖安装中..."
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ 开发环境启动完成!"
echo "🌐 前端: http://localhost:5177"
echo "🔧 后端: http://localhost:33037"
echo "📊 健康检查: http://localhost:33037/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# 等待
wait
