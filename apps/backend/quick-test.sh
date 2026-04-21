#!/bin/bash

echo "🔧 快速测试麒麟项目后端API..."

# 启动服务器
node src/index.js &
SERVER_PID=$!

# 等待启动
sleep 2

echo ""
echo "1. 🔍 测试健康检查:"
curl -s http://localhost:33037/api/health | jq '.'

echo ""
echo "2. 🔍 测试API示例:"
curl -s http://localhost:33037/api/hello | jq '.'

echo ""
echo "3. 🔍 测试认证健康检查:"
curl -s http://localhost:33037/api/v1/auth/health | jq '.'

echo ""
echo "4. 🔍 测试版本信息:"
curl -s http://localhost:33037/api/v1/public/version | jq '.'

# 停止服务器
kill $SERVER_PID 2>/dev/null
echo ""
echo "✅ 快速测试完成!"