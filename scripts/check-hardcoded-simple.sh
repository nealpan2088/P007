#!/bin/bash

# 简化版硬编码检查脚本

echo "🔍 麒麟项目硬编码检查（简化版）"
echo "================================"

ERRORS=0

# 检查关键文件
check_file() {
    local file=$1
    echo "检查: $file"
    
    # 检查API路径硬编码（排除 Fastify register prefix 和 rate limiter middlelware）
    local api_hits=$(grep -n "'/api/\|'/v1/\|'/stores/\|'/auth/" "$file" 2>/dev/null | grep -v "prefix: '/api" | grep -v "url.startsWith('/api")
    if [ -n "$api_hits" ]; then
        echo "  ⚠️  发现API路径硬编码:"
        echo "$api_hits" | head -5
        ((ERRORS++))
    fi
    
    # 检查角色硬编码
    local role_hits=$(grep -n "'ADMIN'\|'OWNER'\|'USER'" "$file" 2>/dev/null)
    if [ -n "$role_hits" ]; then
        echo "  ⚠️  发现角色硬编码:"
        echo "$role_hits" | head -5
        ((ERRORS++))
    fi
    
    # 检查端口硬编码（排除常量定义和配置文件中的引用）
    local port_hits=$(grep -n "33037\|5177\|5432" "$file" 2>/dev/null)
    if [ -n "$port_hits" ]; then
        echo "  ⚠️  发现端口硬编码:"
        echo "$port_hits" | head -5
        ((ERRORS++))
    fi
}

# 检查关键文件
check_file "apps/backend/src/index.js"
check_file "apps/backend/src/routes/store.routes.js"
check_file "apps/backend/src/middleware/index.js"

echo ""
echo "📊 检查结果:"
if [ $ERRORS -eq 0 ]; then
    echo "✅ 恭喜！未发现硬编码问题。"
    exit 0
else
    echo "❌ 发现 $ERRORS 个硬编码问题需要修复。"
    echo ""
    echo "💡 修复建议:"
    echo "  1. 使用 src/constants/ 目录中的常量"
    echo "  2. 使用 src/config/routes.js 中的路由常量"
    echo "  3. 使用 config.server.port 等配置"
    exit 1
fi