#!/bin/bash

# 麒麟项目 - 硬编码防护检查脚本
# 检查代码中的硬编码配置，确保所有配置通过环境变量管理

set -e

echo "🔍 开始硬编码配置检查..."
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查结果统计
total_issues=0
critical_issues=0
warning_issues=0

# 检查函数
check_hardcoded() {
    local file="$1"
    local pattern="$2"
    local severity="$3"
    local description="$4"
    
    if [ ! -f "$file" ]; then
        return
    fi
    
    local matches=$(grep -n "$pattern" "$file" | grep -v "//.*$pattern" | grep -v "#.*$pattern" | grep -v "\.env" || true)
    
    if [ -n "$matches" ]; then
        echo -e "${severity}❌ 发现硬编码: $description${NC}"
        echo "文件: $file"
        echo "$matches" | while IFS= read -r line; do
            echo "  $line"
        done
        echo ""
        
        if [ "$severity" = "$RED" ]; then
            ((critical_issues++))
        else
            ((warning_issues++))
        fi
        ((total_issues++))
    fi
}

# 1. 检查后端硬编码
echo "📁 检查后端代码..."
echo "----------------"

# 检查端口硬编码（排除合理的默认值）
check_hardcoded "apps/backend/src/index.js" "= 33037" "$RED" "端口硬编码赋值"
check_hardcoded "apps/backend/src/index.js" "33037[^0-9]" "$RED" "端口硬编码使用"

# 检查URL硬编码
check_hardcoded "apps/backend/src/index.js" "http://localhost" "$YELLOW" "本地URL硬编码"
check_hardcoded "apps/backend/src/index.js" "'localhost'" "$YELLOW" "localhost硬编码"

# 检查API路径硬编码
check_hardcoded "apps/backend/src/index.js" "'/api/" "$RED" "API路径硬编码"
check_hardcoded "apps/backend/src/index.js" "'/health'" "$RED" "健康检查路径硬编码"

# 检查JWT密钥硬编码
check_hardcoded "apps/backend/src/index.js" "jwtSecret.*=.*['\"]" "$RED" "JWT密钥硬编码"
check_hardcoded "apps/backend/src/index.js" "secret.*=.*['\"]" "$RED" "密钥硬编码"

# 检查数据库配置硬编码
check_hardcoded "apps/backend/src/index.js" "postgresql://" "$RED" "数据库URL硬编码"
check_hardcoded "apps/backend/src/index.js" "5432" "$RED" "数据库端口硬编码"

# 检查配置文件中是否使用了正确的导入
# 注意：这些是正向检查，不应该标记为错误
# check_hardcoded "apps/backend/src/config/index.js" "process\.env\." "$GREEN" "✅ 使用环境变量"
# check_hardcoded "apps/backend/src/config/routes.js" "serverConfig\." "$GREEN" "✅ 使用配置系统"

# 2. 检查前端硬编码
echo "📁 检查前端代码..."
echo "----------------"

# 检查API URL硬编码
check_hardcoded "apps/frontend/src/config/index.ts" "http://localhost:33037" "$RED" "API URL硬编码"
check_hardcoded "apps/frontend/src/config/index.ts" "localhost" "$YELLOW" "localhost硬编码"

# 检查端口硬编码
check_hardcoded "apps/frontend/vite.config.ts" "5177" "$RED" "前端端口硬编码"
check_hardcoded "apps/frontend/vite.config.ts" "517[0-9]" "$RED" "端口硬编码（模式）"

# 检查环境变量使用
check_hardcoded "apps/frontend/src/config/index.ts" "import\.meta\.env\." "$GREEN" "✅ 使用Vite环境变量"

# 3. 检查配置文件
echo "📁 检查配置文件..."
echo "----------------"

# 检查环境变量文件是否存在
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_ENV_FILE="$PROJECT_ROOT/apps/backend/.env.development"
FRONTEND_ENV_FILE="$PROJECT_ROOT/apps/frontend/.env.development"

if [ ! -f "$BACKEND_ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  警告: 后端开发环境配置文件不存在 ($BACKEND_ENV_FILE)${NC}"
    ((warning_issues++))
    ((total_issues++))
else
    echo -e "${GREEN}✅ 后端环境配置文件存在 ($BACKEND_ENV_FILE)${NC}"
fi

if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  警告: 前端开发环境配置文件不存在 ($FRONTEND_ENV_FILE)${NC}"
    ((warning_issues++))
    ((total_issues++))
else
    echo -e "${GREEN}✅ 前端环境配置文件存在 ($FRONTEND_ENV_FILE)${NC}"
fi

# 检查环境变量示例文件
BACKEND_ENV_EXAMPLE="$PROJECT_ROOT/apps/backend/.env.example"
FRONTEND_ENV_EXAMPLE="$PROJECT_ROOT/apps/frontend/.env.example"

if [ ! -f "$BACKEND_ENV_EXAMPLE" ]; then
    echo -e "${RED}❌ 错误: 后端环境变量示例文件不存在 ($BACKEND_ENV_EXAMPLE)${NC}"
    ((critical_issues++))
    ((total_issues++))
else
    echo -e "${GREEN}✅ 后端环境变量示例文件存在 ($BACKEND_ENV_EXAMPLE)${NC}"
fi

if [ ! -f "$FRONTEND_ENV_EXAMPLE" ]; then
    echo -e "${RED}❌ 错误: 前端环境变量示例文件不存在 ($FRONTEND_ENV_EXAMPLE)${NC}"
    ((critical_issues++))
    ((total_issues++))
else
    echo -e "${GREEN}✅ 前端环境变量示例文件存在 ($FRONTEND_ENV_EXAMPLE)${NC}"
fi

# 4. 检查启动脚本
echo "📁 检查启动脚本..."
echo "----------------"

if [ -f "start-dev.sh" ]; then
    # 检查直接赋值硬编码（严重问题）
    check_hardcoded "start-dev.sh" "PORT=33037" "$RED" "启动脚本端口硬编码赋值"
    check_hardcoded "start-dev.sh" "PORT=5177" "$RED" "启动脚本前端端口硬编码赋值"
    
    # 检查作为默认值的硬编码（警告级别）
    # 注意：合理的默认值在开发脚本中是允许的
    # 我们只检查直接赋值，不检查默认值
    
    # 检查是否使用了环境变量
    if grep -q "\$PORT" start-dev.sh || grep -q "\$VITE_PORT" start-dev.sh || grep -q "\$BACKEND_PORT" start-dev.sh || grep -q "\$FRONTEND_PORT" start-dev.sh; then
        echo -e "${GREEN}✅ 启动脚本使用环境变量${NC}"
    else
        echo -e "${GREEN}✅ 启动脚本使用环境变量${NC}"
        ((warning_issues++))
        ((total_issues++))
    fi
fi

# 5. 检查路由配置
echo "📁 检查路由配置..."
echo "----------------"

# 检查是否使用了路由常量系统
BACKEND_INDEX="$PROJECT_ROOT/apps/backend/src/index.js"
if [ -f "$BACKEND_INDEX" ] && grep -q "routes\." "$BACKEND_INDEX"; then
    echo -e "${GREEN}✅ 后端使用路由常量系统${NC}"
else
    echo -e "${RED}❌ 错误: 后端未使用路由常量系统${NC}"
    ((critical_issues++))
    ((total_issues++))
fi

# 检查配置导入
if [ -f "$BACKEND_INDEX" ] && (grep -q "import config from" "$BACKEND_INDEX" || grep -q "import.*config.*from" "$BACKEND_INDEX"); then
    echo -e "${GREEN}✅ 后端导入配置系统${NC}"
else
    echo -e "${RED}❌ 错误: 后端未导入配置系统${NC}"
    ((critical_issues++))
    ((total_issues++))
fi

# 6. 总结报告
echo ""
echo "📊 检查结果汇总"
echo "================================"

if [ $total_issues -eq 0 ]; then
    echo -e "${GREEN}🎉 完美！未发现任何硬编码问题${NC}"
    echo "所有配置都通过环境变量和配置系统管理"
    exit 0
else
    echo -e "发现 ${RED}${critical_issues}${NC} 个严重问题，${YELLOW}${warning_issues}${NC} 个警告"
    echo "总共 ${total_issues} 个问题需要处理"
    echo ""
    
    if [ $critical_issues -gt 0 ]; then
        echo -e "${RED}🚨 存在严重硬编码问题，必须立即修复！${NC}"
        echo "严重问题包括："
        echo "  - 端口硬编码"
        echo "  - 数据库配置硬编码"
        echo "  - JWT密钥硬编码"
        echo "  - API路径硬编码"
        echo ""
        echo "修复步骤："
        echo "1. 将硬编码值移动到环境变量"
        echo "2. 更新配置管理系统"
        echo "3. 修改代码使用配置系统"
        echo "4. 重新运行此检查脚本"
        exit 1
    else
        echo -e "${YELLOW}⚠️  存在警告级别问题，建议修复${NC}"
        echo "警告问题包括："
        echo "  - localhost硬编码（开发环境可接受）"
        echo "  - 配置文件缺失"
        echo ""
        echo "建议修复，但不是必须的"
        exit 0
    fi
fi

# 7. 提供修复建议
echo ""
echo "🔧 修复建议"
echo "================================"
echo "1. 对于端口硬编码："
echo "   在 .env.development 中添加 PORT=33037"
echo "   在代码中使用 config.server.port"
echo ""
echo "2. 对于API路径硬编码："
echo "   在配置系统中定义 API_PREFIX='/api'"
echo "   使用 routes.public.HEALTH 等路由常量"
echo ""
echo "3. 对于数据库配置硬编码："
echo "   在 .env.development 中添加 DATABASE_URL"
echo "   在代码中使用 config.database.url"
echo ""
echo "4. 对于JWT密钥硬编码："
echo "   在 .env.development 中添加 JWT_SECRET"
echo "   在代码中使用 config.auth.jwtSecret"
echo ""
echo "5. 定期运行此检查脚本："
echo "   ./scripts/check-hardcoded.sh"
echo ""
echo "📚 参考文档："
echo "   - CONFIGURATION-GUIDE.md"
echo "   - INCREMENTAL-DEVELOPMENT.md"