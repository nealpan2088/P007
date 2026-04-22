#!/bin/bash

# 切换到优化版后端服务器脚本
# 支持新架构规范：/t/{tenantSlug}/s/{storeSlug}/scan/{tableId}

set -e

echo "🚀 切换到优化版后端服务器（支持新架构规范）"
echo "=========================================="

# 检查当前运行的进程
echo "📊 检查当前运行状态..."
CURRENT_PID=$(pm2 list 2>/dev/null | grep "p007-backend" | awk '{print $8}' | head -1)
if [ -n "$CURRENT_PID" ] && [ "$CURRENT_PID" != "0" ]; then
    echo "✅ 当前运行: p007-backend (PID: $CURRENT_PID)"
else
    echo "⚠️  未找到运行的p007-backend进程"
fi

# 停止当前进程
echo ""
echo "🛑 停止当前进程..."
pm2 delete p007-backend 2>/dev/null || true
pm2 delete qilin-backend 2>/dev/null || true
sleep 2

# 检查优化版服务器文件
echo ""
echo "🔍 检查服务器文件..."
if [ -f "server-optimized.cjs" ]; then
    echo "✅ 找到优化版服务器: server-optimized.cjs"
    echo "   - 支持新规范API: /api/public/tenants/:tenantSlug"
    echo "   - 支持多店模式: /t/{tenantSlug}/s/{storeSlug}/scan/{tableId}"
    echo "   - 完整功能: 租户、店铺、菜单、订单管理"
else
    echo "❌ 未找到 server-optimized.cjs"
    exit 1
fi

# 启动优化版服务器
echo ""
echo "🚀 启动优化版服务器..."
pm2 start server-optimized.cjs --name "p007-backend-optimized" --interpreter node

# 等待启动
echo ""
echo "⏳ 等待服务器启动..."
sleep 3

# 验证启动
echo ""
echo "✅ 验证服务器状态..."
HEALTH_RESPONSE=$(curl -s http://localhost:33038/api/health 2>/dev/null || echo "{}")
STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null || echo "unknown")
SERVICE=$(echo "$HEALTH_RESPONSE" | jq -r '.service' 2>/dev/null || echo "unknown")

if [ "$STATUS" = "ok" ]; then
    echo "✅ 服务器健康状态: $STATUS"
    echo "✅ 服务名称: $SERVICE"
else
    echo "❌ 服务器启动失败"
    echo "响应: $HEALTH_RESPONSE"
    exit 1
fi

# 测试新规范API
echo ""
echo "🔧 测试新规范API端点..."
echo "1. 测试租户信息API:"
TENANT_RESPONSE=$(curl -s "http://localhost:33038/api/public/tenants/qilin-test" 2>/dev/null || echo "{}")
TENANT_SUCCESS=$(echo "$TENANT_RESPONSE" | jq -r '.success' 2>/dev/null || echo "false")

if [ "$TENANT_SUCCESS" = "true" ]; then
    echo "✅ 租户信息API正常"
else
    echo "⚠️  租户信息API可能未实现或需要数据"
    echo "响应: $TENANT_RESPONSE"
fi

echo ""
echo "2. 测试店铺菜单API:"
MENU_RESPONSE=$(curl -s "http://localhost:33038/api/public/tenants/qilin-test/stores/test-store/menu" 2>/dev/null || echo "{}")
MENU_SUCCESS=$(echo "$MENU_RESPONSE" | jq -r '.success' 2>/dev/null || echo "false")

if [ "$MENU_SUCCESS" = "true" ]; then
    echo "✅ 店铺菜单API正常"
else
    echo "⚠️  店铺菜单API可能未实现或需要数据"
    echo "响应: $MENU_RESPONSE"
fi

# 显示PM2状态
echo ""
echo "📋 PM2进程状态:"
pm2 list | grep -E "p007-backend|qilin-backend"

echo ""
echo "🎉 切换完成！"
echo ""
echo "📡 后端服务器地址: http://localhost:33038"
echo "📋 健康检查: http://localhost:33038/api/health"
echo "👥 租户列表: http://localhost:33038/api/test/tenants"
echo "🏪 新规范API: http://localhost:33038/api/public/tenants/{tenantSlug}"
echo "🍽️  扫码点餐: http://localhost:33038/api/public/tenants/{tenantSlug}/stores/{storeSlug}/menu"
echo ""
echo "⚠️  注意: 前端需要重新加载以使用新规范API"