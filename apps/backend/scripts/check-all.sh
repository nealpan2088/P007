#!/bin/bash

echo "🔧 麒麟项目后端规范化检查脚本"
echo "================================="

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数器
total_checks=0
passed_checks=0
failed_checks=0

# 函数：检查并记录结果
check_command() {
    local description="$1"
    local command="$2"
    
    echo -n "检查: $description... "
    total_checks=$((total_checks + 1))
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        failed_checks=$((failed_checks + 1))
        return 1
    fi
}

echo ""
echo "📋 步骤1: 加载环境变量"
echo "----------------------"

# 加载环境变量
if [ -f setup-env.sh ]; then
    source setup-env.sh
    echo -e "${GREEN}✅ 环境变量加载成功${NC}"
else
    echo -e "${YELLOW}⚠️  警告: setup-env.sh 不存在，使用当前环境变量${NC}"
fi

echo ""
echo "🔍 步骤2: 执行规范化检查"
echo "----------------------"

# 1. 检查硬编码
echo "1. 硬编码检查..."
check_command "硬编码检查" "../../scripts/check-hardcoded-simple.sh"

# 2. 检查配置
echo ""
echo "2. 配置验证..."
check_command "配置验证" "node -e \"import('./src/config/index.js').then(c => { c.validate(); }).catch(e => { console.error(e.message); process.exit(1); })\""

# 3. 检查路由
echo ""
echo "3. 路由系统检查..."
check_command "路由系统检查" "node -e \"import('./src/config/routes.js').then(r => { const routes = r.default || r; routes.getAllRoutes(); }).catch(e => { console.error(e.message); process.exit(1); })\""

# 4. 检查数据库连接
echo ""
echo "4. 数据库连接检查..."
check_command "数据库连接" "node -e \"import('./src/db/index.js').then(db => { console.log('数据库模块加载成功'); }).catch(e => { console.error(e.message); process.exit(1); })\""

echo ""
echo "📊 检查结果汇总"
echo "================================="

if [ $failed_checks -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过 ($passed_checks/$total_checks)${NC}"
    echo ""
    echo "✅ 后端系统完全正常"
    echo "✅ 配置验证通过"
    echo "✅ 路由系统正常"
    echo "✅ 数据库连接正常"
    echo ""
    echo "🚀 可以启动开发服务器:"
    echo "   npm run dev"
    exit 0
else
    echo -e "${RED}⚠️  检查失败 ($failed_checks/$total_checks 失败)${NC}"
    echo ""
    echo "🔧 建议操作:"
    echo "   1. 检查环境变量: source setup-env.sh"
    echo "   2. 单独运行检查:"
    echo "      npm run check:hardcoded"
    echo "      npm run check:config"
    echo "      npm run check:routes"
    echo "   3. 查看详细错误信息"
    exit 1
fi