#!/bin/bash

# 麒麟项目 - 环境变量设置脚本
# 用于开发和测试环境

echo "🔧 设置麒麟项目环境变量..."

# 必需的环境变量
export NODE_ENV=development
export PORT=33037
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/p007_development"
export JWT_SECRET="qilin-development-jwt-secret-minimum-32-characters-long"
export API_PREFIX="/api"

# 可选的环境变量（有默认值）
export API_VERSION="v1"
export LOG_LEVEL="info"
export LOG_FORMAT="json"
export BODY_LIMIT="1048576"
export CORS_ORIGIN="http://localhost:5177"
export BCRYPT_ROUNDS="12"
export JWT_EXPIRES_IN="7d"
export JWT_REFRESH_EXPIRES_IN="30d"
export PASSWORD_MIN_LENGTH="8"
export PASSWORD_REQUIRE_UPPERCASE="true"
export PASSWORD_REQUIRE_LOWERCASE="true"
export PASSWORD_REQUIRE_NUMBERS="true"
export PASSWORD_REQUIRE_SYMBOLS="true"

# 系统模式配置
export SYSTEM_MODE="multi"  # single (单店版) | multi (多店版/SaaS)

# 单店版配置（当 SYSTEM_MODE=single 时生效）
export DEFAULT_STORE_ID="store_001"
export DEFAULT_STORE_NAME="默认店铺"
export DEFAULT_STORE_SUBDOMAIN="default"

echo "✅ 环境变量设置完成"
echo ""
echo "📋 配置摘要:"
echo "   环境: $NODE_ENV"
echo "   端口: $PORT"
echo "   API前缀: $API_PREFIX"
echo "   API版本: $API_VERSION"
echo "   JWT密钥长度: ${#JWT_SECRET}"
echo "   CORS来源: $CORS_ORIGIN"
echo "   系统模式: $SYSTEM_MODE ($([ "$SYSTEM_MODE" = "single" ] && echo "单店版" || echo "多店版/SaaS"))"
echo ""
echo "🚀 现在可以运行:"
echo "   npm run check:config    # 验证配置"
echo "   npm run check:hardcoded # 检查硬编码"
echo "   npm run dev             # 启动开发服务器"