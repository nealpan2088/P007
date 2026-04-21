#!/bin/bash

echo "🚀 启动 P007 开发环境..."

# 设置环境变量
export NODE_ENV=development

# 检查环境变量文件
if [ ! -f "apps/backend/.env.development" ]; then
    echo "⚠️  警告: 后端开发环境配置文件不存在，使用示例配置..."
    cp apps/backend/.env.example apps/backend/.env.development 2>/dev/null || echo "无法复制示例配置"
fi

if [ ! -f "apps/frontend/.env.development" ]; then
    echo "⚠️  警告: 前端开发环境配置文件不存在，使用示例配置..."
    cp apps/frontend/.env.example apps/frontend/.env.development 2>/dev/null || echo "无法复制示例配置"
fi

# 加载后端环境变量
if [ -f "apps/backend/.env.development" ]; then
    echo "📋 加载后端环境变量..."
    # 使用source加载环境变量
    set -a
    source apps/backend/.env.development
    set +a
fi

# 启动后端服务器
BACKEND_PORT=${BACKEND_PORT:-${PORT:-33037}}
echo "🔧 启动后端服务器 (端口: ${BACKEND_PORT})..."
cd apps/backend
npm install 2>/dev/null || echo "后端依赖安装中..."

# 使用env传递环境变量
env NODE_ENV=development \
    PORT=${BACKEND_PORT} \
    DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/p007_development"} \
    JWT_SECRET=${JWT_SECRET:-"qilin-development-jwt-secret-minimum-32-characters-here"} \
    API_PREFIX=${API_PREFIX:-"/api"} \
    node src/index.js &
BACKEND_PID=$!
cd ../..

# 等待后端启动
echo "⏳ 等待后端启动..."
for i in {1..10}; do
    if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
        echo "✅ 后端服务器启动成功"
        break
    fi
    echo -n "."
    sleep 1
done

# 启动前端开发服务器
echo "🎨 启动前端开发服务器 (端口: 5177)..."
cd apps/frontend
npm install 2>/dev/null || echo "前端依赖安装中..."
npm run dev &
FRONTEND_PID=$!
cd ../..

# 等待前端启动
echo "⏳ 等待前端启动..."
for i in {1..10}; do
    if curl -s http://localhost:5177 > /dev/null 2>&1; then
        echo "✅ 前端服务器启动成功"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "✅ 开发环境启动完成!"
FRONTEND_PORT=${FRONTEND_PORT:-${VITE_PORT:-5177}}
echo "🌐 前端: http://localhost:${FRONTEND_PORT}"
echo "🔧 后端: http://localhost:${BACKEND_PORT}"
echo "📊 健康检查: http://localhost:${BACKEND_PORT}/api/health"
echo "📚 API文档: http://localhost:${BACKEND_PORT}/api/v1/public/version"
echo "🎯 功能列表: http://localhost:${BACKEND_PORT}/api/v1/public/features"
echo ""
echo "🛠️  可用命令:"
echo "  cd apps/backend && npm run check:all    # 检查后端规范化"
echo "  cd apps/frontend && npm run check:all   # 检查前端规范化"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; wait $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 服务已停止'; exit 0" INT TERM

# 显示日志
echo ""
echo "📋 服务日志 (Ctrl+C 停止):"
echo "================================"

# 等待
wait $BACKEND_PID $FRONTEND_PID
