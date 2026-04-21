#!/bin/bash

# 麒麟项目前端 - 环境变量设置脚本
# 用于开发和测试环境

echo "🔧 设置麒麟项目前端环境变量..."

# 必需的环境变量
export VITE_APP_NAME="麒麟云点餐SaaS"
export VITE_API_BASE_URL="http://localhost:33037"

# 可选的环境变量（有默认值）
export VITE_APP_VERSION="0.1.0"
export VITE_APP_DESCRIPTION="多店铺扫码点餐云打印SaaS平台"
export VITE_API_TIMEOUT="30000"
export VITE_API_VERSION="v1"
export VITE_FEATURE_AUTH="true"
export VITE_FEATURE_MULTI_TENANT="true"
export VITE_FEATURE_PRINTING="true"
export VITE_FEATURE_ANALYTICS="true"
export VITE_FEATURE_PAYMENT="false"
export VITE_DEFAULT_LANGUAGE="zh-CN"
export VITE_DEFAULT_CURRENCY="CNY"
export VITE_DEFAULT_TIMEZONE="Asia/Shanghai"
export VITE_SUPPORT_EMAIL="support@qilin-dining.com"
export VITE_DEV_PROXY_TARGET="http://localhost:33037"
export VITE_DEV_OPEN_BROWSER="true"

echo "✅ 前端环境变量设置完成"
echo ""
echo "📋 配置摘要:"
echo "   应用名称: $VITE_APP_NAME"
echo "   API基础URL: $VITE_API_BASE_URL"
echo "   应用版本: $VITE_APP_VERSION"
echo "   API版本: $VITE_API_VERSION"
echo ""
echo "🚀 现在可以运行:"
echo "   npm run check:config    # 验证配置"
echo "   npm run check:hardcoded # 检查硬编码"
echo "   npm run dev             # 启动开发服务器"