#!/bin/bash
# setup-env.sh - 麒麟项目后端环境变量设置脚本
# 用于规范化检查和开发环境

echo "🔧 设置麒麟项目后端环境变量..."
echo "================================="

# 开发环境配置
export NODE_ENV=development
export PORT=33037
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/p007_development"
export JWT_SECRET="qilin-development-jwt-secret-minimum-32-characters-here"
export API_PREFIX="/api"
export SYSTEM_MODE="multi"
export CORS_ORIGIN="http://localhost:5177"
export LOG_LEVEL="info"

# 可选配置（有默认值）
export API_VERSION="v1"
export BCRYPT_SALT_ROUNDS=10
export JWT_EXPIRES_IN="7d"
export REFRESH_TOKEN_EXPIRES_IN="30d"
export SESSION_EXPIRES_IN="24h"

echo "✅ 环境变量设置完成:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   DATABASE_URL: [已设置]"
echo "   JWT_SECRET: [已设置]"
echo "   API_PREFIX: $API_PREFIX"
echo "   SYSTEM_MODE: $SYSTEM_MODE"
echo ""
echo "📋 可用命令:"
echo "   npm run check:all      # 运行所有规范化检查"
echo "   npm run check:config   # 仅检查配置"
echo "   npm run check:routes   # 仅检查路由"
echo "   npm run check:db       # 仅检查数据库"
echo "   npm run check:hardcoded # 检查硬编码"
echo ""
echo "🚀 启动开发服务器:"
echo "   npm run dev"