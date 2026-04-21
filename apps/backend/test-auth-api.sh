#!/bin/bash

# 麒麟项目 - 认证API测试脚本

echo "🔧 测试麒麟项目认证API..."
echo "=============================="

# 设置环境变量
source ./setup-env.sh

# 启动后端服务器（后台运行）
echo "🚀 启动后端服务器..."
node src/index.js &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 3

# 测试健康检查
echo ""
echo "1. 🔍 测试健康检查..."
curl -s http://localhost:33037/api/health | jq '.'

# 测试API示例
echo ""
echo "2. 🔍 测试API示例..."
curl -s http://localhost:33037/api/hello | jq '.'

# 测试用户注册
echo ""
echo "3. 🔍 测试用户注册..."
curl -s -X POST http://localhost:33037/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@2026",
    "username": "testuser",
    "fullName": "测试用户"
  }' | jq '.'

# 测试用户登录
echo ""
echo "4. 🔍 测试用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:33037/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@2026"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# 提取Token（如果登录成功）
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken // empty')

if [ -n "$ACCESS_TOKEN" ]; then
  echo ""
  echo "5. 🔍 测试获取用户信息..."
  curl -s http://localhost:33037/api/v1/auth/profile \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
  
  echo ""
  echo "6. 🔍 测试获取用户会话..."
  curl -s http://localhost:33037/api/v1/auth/sessions \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
fi

# 测试认证健康检查
echo ""
echo "7. 🔍 测试认证健康检查..."
curl -s http://localhost:33037/api/v1/auth/health | jq '.'

# 停止服务器
echo ""
echo "🛑 停止服务器..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "✅ 认证API测试完成!"