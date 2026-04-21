#!/bin/bash

# 麒麟项目 - 规范化导入处理脚本
# 处理导入的文件，确保符合规范化要求

set -e

echo "🔄 开始规范化导入处理..."
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 参数检查
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ 错误: 请指定要处理的文件或目录${NC}"
    echo "用法: $0 <文件或目录>"
    echo "示例: $0 apps/backend/src/auth.js"
    echo "示例: $0 apps/frontend/src/components/"
    exit 1
fi

TARGET="$1"

# 检查目标是否存在
if [ ! -e "$TARGET" ]; then
    echo -e "${RED}❌ 错误: 目标不存在: $TARGET${NC}"
    exit 1
fi

# 处理单个文件
process_file() {
    local file="$1"
    
    echo -e "${BLUE}📄 处理文件: $file${NC}"
    
    # 1. 检查文件类型
    if [[ "$file" == *.js || "$file" == *.ts || "$file" == *.tsx || "$file" == *.jsx ]]; then
        echo "  🔍 检查代码文件..."
        
        # 备份原文件
        cp "$file" "${file}.backup"
        
        # 2. 检查并修复硬编码
        echo "  🔧 检查硬编码配置..."
        
        # 检查端口硬编码
        if grep -q "33037" "$file"; then
            echo -e "    ${YELLOW}⚠️  发现端口硬编码 33037${NC}"
            # 建议使用 config.server.port
        fi
        
        if grep -q "5177" "$file"; then
            echo -e "    ${YELLOW}⚠️  发现端口硬编码 5177${NC}"
            # 建议使用环境变量
        fi
        
        # 检查API URL硬编码
        if grep -q "http://localhost:33037" "$file"; then
            echo -e "    ${YELLOW}⚠️  发现API URL硬编码${NC}"
            # 建议使用 config.api.baseUrl
        fi
        
        # 检查数据库配置硬编码
        if grep -q "postgresql://" "$file"; then
            echo -e "    ${RED}❌ 发现数据库URL硬编码${NC}"
            # 必须使用 config.database.url
        fi
        
        # 检查JWT密钥硬编码
        if grep -q "jwtSecret.*=.*['\"]" "$file" || grep -q "secret.*=.*['\"]" "$file"; then
            echo -e "    ${RED}❌ 发现密钥硬编码${NC}"
            # 必须使用 config.auth.jwtSecret
        fi
        
        # 3. 检查配置导入
        echo "  📦 检查配置导入..."
        
        if [[ "$file" == *backend* ]] && ! grep -q "import config from" "$file" && ! grep -q "import.*config.*from" "$file"; then
            echo -e "    ${YELLOW}⚠️  未导入配置系统${NC}"
            
            # 添加配置导入
            if grep -q "import.*from" "$file"; then
                # 在现有导入后添加
                sed -i "/import.*from/a import config from './config/index.js'" "$file"
            else
                # 在文件开头添加
                sed -i "1i import config from './config/index.js'" "$file"
            fi
            echo -e "    ${GREEN}✅ 已添加配置导入${NC}"
        fi
        
        # 4. 检查路由常量使用
        echo "  🛣️  检查路由使用..."
        
        if [[ "$file" == *backend* ]] && (grep -q "'/api/" "$file" || grep -q '"/api/' "$file") && ! grep -q "routes\." "$file"; then
            echo -e "    ${YELLOW}⚠️  发现硬编码API路径${NC}"
            
            # 添加路由导入
            if ! grep -q "import routes from" "$file" && ! grep -q "import.*routes.*from" "$file"; then
                if grep -q "import config from" "$file"; then
                    sed -i "/import config from/a import routes from './config/routes.js'" "$file"
                else
                    sed -i "1i import routes from './config/routes.js'" "$file"
                fi
                echo -e "    ${GREEN}✅ 已添加路由导入${NC}"
            fi
        fi
        
        # 5. 检查环境变量使用（前端）
        if [[ "$file" == *frontend* ]] && ! grep -q "import\.meta\.env\." "$file" && ! grep -q "VITE_" "$file"; then
            echo -e "    ${YELLOW}⚠️  前端文件未使用环境变量${NC}"
        fi
        
        # 6. 生成修复报告
        echo "  📋 生成修复建议..."
        
        local report_file="${file}.normalize-report.txt"
        cat > "$report_file" << EOF
# 规范化导入处理报告
文件: $file
处理时间: $(date)

## 发现的问题
$(if grep -q "33037" "$file"; then echo "- 端口硬编码 33037"; fi)
$(if grep -q "5177" "$file"; then echo "- 端口硬编码 5177"; fi)
$(if grep -q "http://localhost:33037" "$file"; then echo "- API URL硬编码"; fi)
$(if grep -q "postgresql://" "$file"; then echo "- 数据库URL硬编码"; fi)
$(if grep -q "jwtSecret.*=.*['\"]" "$file" || grep -q "secret.*=.*['\"]" "$file"; then echo "- 密钥硬编码"; fi)

## 修复建议
1. 将硬编码值移动到环境变量:
   - 在对应的 .env.development 文件中添加配置
   - 更新 .env.example 文件

2. 使用配置系统:
   - 后端: 使用 config.server.port, config.database.url 等
   - 前端: 使用 import.meta.env.VITE_* 或 config.api.baseUrl

3. 使用路由常量:
   - 后端: 使用 routes.public.HEALTH, routes.public.AUTH.LOGIN 等
   - 避免硬编码 '/api/', '/health' 等路径

4. 重新运行检查:
   ./scripts/check-hardcoded.sh

## 已执行的修复
- 添加了配置系统导入
- 添加了路由常量导入（如需要）

## 需要手动修复的项目
$(if grep -q "33037" "$file"; then echo "- 替换 33037 为 config.server.port"; fi)
$(if grep -q "5177" "$file"; then echo "- 替换 5177 为环境变量"; fi)
$(if grep -q "http://localhost:33037" "$file"; then echo "- 替换 API URL 为 config.api.baseUrl"; fi)
$(if grep -q "postgresql://" "$file"; then echo "- 替换数据库URL为 config.database.url"; fi)
$(if grep -q "jwtSecret.*=.*['\"]" "$file" || grep -q "secret.*=.*['\"]" "$file"; then echo "- 替换密钥为 config.auth.jwtSecret"; fi)

## 参考文档
- CONFIGURATION-GUIDE.md
- INCREMENTAL-DEVELOPMENT.md
EOF
        
        echo -e "    ${GREEN}✅ 已生成修复报告: $report_file${NC}"
        
    elif [[ "$file" == *.json ]]; then
        echo "  📋 检查JSON配置文件..."
        
        # 检查package.json中的脚本
        if [[ "$file" == *package.json ]]; then
            echo "  📦 检查package.json脚本..."
            
            # 检查是否包含规范化检查脚本
            if ! grep -q "check-hardcoded" "$file"; then
                echo -e "    ${YELLOW}⚠️  未包含硬编码检查脚本${NC}"
            fi
            
            # 检查是否包含规范化脚本
            if ! grep -q "normalize" "$file"; then
                echo -e "    ${YELLOW}⚠️  未包含规范化脚本${NC}"
            fi
        fi
        
    elif [[ "$file" == *.md ]]; then
        echo "  📚 检查文档文件..."
        # 文档文件不需要特殊处理
        
    else
        echo "  ⚠️  不支持的文件类型，跳过处理"
    fi
    
    echo ""
}

# 处理目录
process_directory() {
    local dir="$1"
    
    echo -e "${BLUE}📁 处理目录: $dir${NC}"
    
    # 查找所有代码文件
    local files=$(find "$dir" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.json" \) | head -20)
    
    if [ -z "$files" ]; then
        echo "  未找到可处理的代码文件"
        return
    fi
    
    local file_count=0
    for file in $files; do
        process_file "$file"
        ((file_count++))
    done
    
    echo -e "${GREEN}✅ 处理完成: $file_count 个文件${NC}"
}

# 主处理逻辑
if [ -f "$TARGET" ]; then
    process_file "$TARGET"
elif [ -d "$TARGET" ]; then
    process_directory "$TARGET"
else
    echo -e "${RED}❌ 错误: 目标不是文件也不是目录${NC}"
    exit 1
fi

# 总结报告
echo ""
echo "📊 规范化导入处理完成"
echo "================================"
echo -e "${GREEN}✅ 处理完成${NC}"
echo ""
echo "🔧 下一步操作建议:"
echo "1. 查看生成的 .normalize-report.txt 文件"
echo "2. 根据报告手动修复硬编码问题"
echo "3. 运行硬编码检查脚本: ./scripts/check-hardcoded.sh"
echo "4. 测试修复后的代码是否正常工作"
echo ""
echo "📚 规范化原则:"
echo "- 所有配置必须通过环境变量管理"
echo "- 所有API路由必须使用路由常量"
echo "- 所有代码必须导入配置系统"
echo "- 定期运行检查脚本确保合规"
echo ""
echo "💡 提示: 规范化是持续的过程，不是一次性的任务！"