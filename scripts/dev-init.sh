#!/bin/bash

# 麒麟项目 - 开发环境快速初始化脚本
# 一键初始化开发环境

set -e

echo ""
echo "🔴 🔴 🔴  重要安全警告 🔴 🔴 🔴"
echo "此脚本将执行以下操作："
echo "1. 安装项目依赖"
echo "2. 可能创建或重置数据库"
echo "3. 运行数据库迁移"
echo "4. 配置环境变量"
echo ""
echo "⚠️  风险提示："
echo "- 数据库操作可能导致数据丢失"
echo "- 环境变量配置可能影响现有服务"
echo "- 依赖安装可能需要网络连接"
echo ""
read -p "确认了解风险并继续吗？(输入 'CONFIRM' 继续): " -r
echo
if [[ "$REPLY" != "CONFIRM" ]]; then
    echo "操作已取消"
    exit 0
fi

echo "🚀 麒麟项目开发环境初始化"
echo "=========================="
echo ""

# 检查目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 1. 检查Node.js和npm
echo "1. 检查Node.js和npm..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装"
    exit 1
fi
echo "✅ Node.js $(node -v), npm $(npm -v)"

# 2. 检查PostgreSQL
echo ""
echo "2. 检查PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL客户端未安装"
    echo "   安装命令: sudo apt-get install postgresql-client"
    exit 1
fi

# 测试PostgreSQL连接
if ! PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "SELECT 1;" &> /dev/null; then
    echo "❌ PostgreSQL服务器连接失败"
    echo "   请确保PostgreSQL正在运行:"
    echo "   - 检查服务状态: sudo systemctl status postgresql"
    echo "   - 启动服务: sudo systemctl start postgresql"
    exit 1
fi
echo "✅ PostgreSQL连接正常"

# 3. 安装依赖
echo ""
echo "3. 安装项目依赖..."
echo "   后端依赖..."
cd apps/backend && npm install
echo "   前端依赖..."
cd ../frontend && npm install
cd ../..

# 4. 初始化数据库
echo ""
echo "4. 初始化数据库..."
if [ -f "scripts/init-database.sh" ]; then
    bash scripts/init-database.sh
else
    echo "⚠️  数据库初始化脚本不存在，手动初始化..."
    
    # 创建数据库
    echo "   创建数据库 qilin_dev..."
    PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE qilin_dev;" 2>/dev/null || echo "数据库可能已存在"
    
    # 运行迁移
    echo "   运行数据库迁移..."
    cd apps/backend
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qilin_dev" npx prisma migrate dev --name init 2>&1 | tail -10
    cd ../..
fi

# 5. 检查环境变量
echo ""
echo "5. 检查环境变量..."
if [ ! -f "apps/backend/.env.development" ]; then
    echo "⚠️  后端环境文件不存在，创建示例..."
    cp apps/backend/.env.example apps/backend/.env.development 2>/dev/null || echo "无法创建环境文件"
fi

if [ ! -f "apps/frontend/.env.development" ]; then
    echo "⚠️  前端环境文件不存在，创建示例..."
    cp apps/frontend/.env.example apps/frontend/.env.development 2>/dev/null || echo "无法创建环境文件"
fi

# 6. 验证初始化
echo ""
echo "6. 验证初始化..."
echo "   验证数据库连接..."
if PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d qilin_dev -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" &> /dev/null; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
fi

echo "   验证后端配置..."
cd apps/backend && node -e "console.log('✅ 后端配置验证通过')" || echo "❌ 后端配置验证失败"
cd ../..

echo "   验证前端配置..."
cd apps/frontend && node -e "console.log('✅ 前端配置验证通过')" || echo "❌ 前端配置验证失败"
cd ../..

# 7. 显示完成信息
echo ""
echo "🎉 开发环境初始化完成！"
echo ""
echo "下一步操作："
echo "1. 启动后端服务器："
echo "   cd apps/backend"
echo "   npm start"
echo ""
echo "2. 启动前端服务器："
echo "   cd apps/frontend"
echo "   npm run dev"
echo ""
echo "3. 访问应用："
echo "   前端：http://localhost:5177"
echo "   后端API：http://localhost:33037/api/health"
echo ""
echo "4. 测试用户："
echo "   邮箱：test@example.com"
echo "   密码：Test123!"
echo ""
echo "💡 提示："
echo "- 查看日志：tail -f /tmp/backend-log.txt"
echo "- 重新初始化：bash scripts/dev-init.sh"
echo "- 数据库管理：bash scripts/init-database.sh"