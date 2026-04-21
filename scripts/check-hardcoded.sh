#!/bin/bash

# 麒麟项目 - 硬编码检查脚本
# 检查代码中的硬编码字符串、数字和路径

set -e

echo "🔍 麒麟项目硬编码检查"
echo "======================"
echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

ERROR_COUNT=0
WARNING_COUNT=0
CHECKED_FILES=0

# 检查目录
CHECK_DIRS=(
  "apps/backend/src"
  "apps/frontend/src"
)

# 硬编码模式定义
declare -A PATTERNS=(
  # API路径硬编码
  ["API路径"]="'/api/|/v1/|/v2/|/public/|/admin/|/tenant/"
  
  # 业务路径硬编码
  ["业务路径"]="'/stores/|'/auth/|'/users/|'/orders/|'/menu/'"
  
  # 认证相关硬编码
  ["认证头"]="'Bearer '|'x-tenant-id'|'authorization'"
  
  # 角色硬编码
  ["用户角色"]="'ADMIN'|'OWNER'|'USER'|'STAFF'|'MANAGER'"
  
  # 状态硬编码
  ["状态值"]="'ACTIVE'|'INACTIVE'|'DRAFT'|'PENDING'|'COMPLETED'"
  
  # 类型硬编码
  ["类型值"]="'RESTAURANT'|'CAFE'|'FAST_FOOD'|'BAKERY'"
  
  # 端口硬编码
  ["端口号"]="33037|5177|5432|3000|8080"
  
  # 主机硬编码
  ["主机地址"]="localhost|127.0.0.1|0.0.0.0"
  
  # 配置硬编码
  ["配置值"]="JWT_SECRET|DATABASE_URL|API_KEY|SECRET_KEY"
  
  # 错误消息硬编码（中文）
  ["中文错误"]="'未提供认证Token'|'Token已过期'|'权限不足'|'获取失败'"
  
  # 错误消息硬编码（英文）
  ["英文错误"]="'Unauthorized'|'Forbidden'|'Not Found'|'Internal Error'"
)

# 允许的硬编码（白名单）
declare -A WHITELIST=(
  ["测试文件"]=".*\.test\.(js|ts|jsx|tsx)$"
  ["配置文件"]=".*config.*\.(js|ts|json)$"
  ["常量文件"]=".*constants.*\.(js|ts)$"
  ["路由文件"]=".*routes.*\.(js|ts)$"
  ["脚本文件"]=".*\.sh$"
  ["日志消息"]="console\.log|console\.error|request\.log"
  ["导入语句"]="^import|^require|^export"
  ["注释内容"]="^//|^/\*|\*/"
)

# 检查单个文件
check_file() {
  local file="$1"
  local filename=$(basename "$file")
  
  # 跳过白名单文件类型
  for pattern in "${!WHITELIST[@]}"; do
    if [[ "$file" =~ ${WHITELIST[$pattern]} ]]; then
      return 0
    fi
  done
  
  ((CHECKED_FILES++))
  local file_errors=0
  local file_warnings=0
  
  echo "📄 检查文件: $file"
  
  # 检查每种硬编码模式
  for pattern_name in "${!PATTERNS[@]}"; do
    local pattern="${PATTERNS[$pattern_name]}"
    
    # 查找匹配行
    local matches=$(grep -n -E "$pattern" "$file" 2>/dev/null || true)
    
    if [ -n "$matches" ]; then
      # 过滤白名单内容
      local filtered_matches=""
      while IFS= read -r line; do
        local should_skip=0
        
        # 检查是否在白名单中
        for whitelist_pattern in "${!WHITELIST[@]}"; do
          if [[ "$line" =~ ${WHITELIST[$whitelist_pattern]} ]]; then
            should_skip=1
            break
          fi
        done
        
        if [ $should_skip -eq 0 ]; then
          filtered_matches+="$line"$'\n'
        fi
      done <<< "$matches"
      
      if [ -n "$filtered_matches" ]; then
        echo "  ⚠️  $pattern_name 硬编码:"
        echo "$filtered_matches" | while IFS= read -r match; do
          if [ -n "$match" ]; then
            echo "    - $match"
            ((file_warnings++))
          fi
        done
      fi
    fi
  done
  
  # 检查魔法数字（非0、1、100等常见数字）
  local magic_numbers=$(grep -n -E "[^a-zA-Z_]([2-9][0-9]{2,}|[2-9][0-9])([^0-9]|$)" "$file" 2>/dev/null || true)
  
  if [ -n "$magic_numbers" ]; then
    # 过滤常见数字和版本号
    local filtered_numbers=""
    while IFS= read -r line; do
      # 跳过版本号（如v1.0.0）、日期、常见状态码
      if ! [[ "$line" =~ (v[0-9]+\.[0-9]+\.[0-9]+|[0-9]{4}-[0-9]{2}-[0-9]{2}|200|404|500|1000) ]]; then
        filtered_numbers+="$line"$'\n'
      fi
    done <<< "$magic_numbers"
    
    if [ -n "$filtered_numbers" ]; then
      echo "  ⚠️  魔法数字:"
      echo "$filtered_numbers" | while IFS= read -r match; do
        if [ -n "$match" ]; then
          echo "    - $match"
          ((file_warnings++))
        fi
      done
    fi
  fi
  
  # 检查是否使用了常量系统
  if [[ "$filename" =~ \.(js|ts|jsx|tsx)$ ]] && ! [[ "$file" =~ constants|config ]]; then
    local has_constants_import=$(grep -E "import.*constants|from.*constants" "$file" 2>/dev/null || true)
    local has_config_import=$(grep -E "import.*config|from.*config" "$file" 2>/dev/null || true)
    
    if [ -z "$has_constants_import" ] && [ -z "$has_config_import" ]; then
      # 检查是否有应该使用常量的硬编码
      local should_have_constants=0
      
      for pattern_name in "${!PATTERNS[@]}"; do
        if [[ "$pattern_name" =~ (角色|状态|类型|路径) ]]; then
          local pattern="${PATTERNS[$pattern_name]}"
          if grep -q -E "$pattern" "$file" 2>/dev/null; then
            should_have_constants=1
            break
          fi
        fi
      done
      
      if [ $should_have_constants -eq 1 ]; then
        echo "  💡 建议: 考虑导入常量文件 (constants/) 或配置文件 (config/)"
        ((file_warnings++))
      fi
    fi
  fi
  
  if [ $file_warnings -gt 0 ]; then
    ((WARNING_COUNT+=file_warnings))
    echo "  📊 本文件发现 $file_warnings 个警告"
  else
    echo "  ✅ 本文件未发现硬编码问题"
  fi
  
  echo ""
}

# 主检查函数
run_check() {
  echo "开始扫描代码库..."
  echo ""
  
  for dir in "${CHECK_DIRS[@]}"; do
    if [ -d "$dir" ]; then
      echo "📁 检查目录: $dir"
      echo "----------------------------------------"
      
      # 查找所有JavaScript/TypeScript文件
      find "$dir" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) | while read -r file; do
        check_file "$file"
      done
      
      echo ""
    else
      echo "⚠️  目录不存在: $dir"
      echo ""
    fi
  done
  
  # 总结报告
  echo "📈 检查完成报告"
  echo "================"
  echo "📊 统计信息:"
  echo "  - 检查文件数: $CHECKED_FILES"
  echo "  - 警告数量: $WARNING_COUNT"
  echo "  - 错误数量: $ERROR_COUNT"
  echo ""
  
  if [ $WARNING_COUNT -eq 0 ] && [ $ERROR_COUNT -eq 0 ]; then
    echo "🎉 恭喜！未发现硬编码问题。"
    echo "   代码符合规范化标准。"
    return 0
  else
    echo "📋 发现的问题需要处理:"
    echo ""
    
    if [ $WARNING_COUNT -gt 0 ]; then
      echo "⚠️  警告 ($WARNING_COUNT 个):"
      echo "  这些是潜在的硬编码问题，建议修复："
      echo "  1. 将字符串字面量提取为常量"
      echo "  2. 将数字字面量提取为常量"
      echo "  3. 使用配置系统管理环境相关值"
      echo "  4. 使用路由常量管理系统API路径"
      echo ""
    fi
    
    if [ $ERROR_COUNT -gt 0 ]; then
      echo "❌ 错误 ($ERROR_COUNT 个):"
      echo "  这些是严重的硬编码问题，必须修复："
      echo "  1. 敏感信息硬编码（密钥、密码）"
      echo "  2. 生产环境配置硬编码"
      echo "  3. 严重的安全相关问题"
      echo ""
    fi
    
    echo "💡 修复建议:"
    echo "  1. 查看上面的具体警告信息"
    echo "  2. 将硬编码值移动到对应的常量文件"
    echo "  3. 重新运行检查脚本验证修复"
    echo ""
    echo "🔧 可用常量文件:"
    echo "  - apps/backend/src/constants/ (业务常量)"
    echo "  - apps/backend/src/config/ (配置系统)"
    echo "  - apps/backend/src/config/routes.js (路由常量)"
    
    return 1
  fi
}

# 快速检查模式（只检查关键文件）
quick_check() {
  echo "🚀 快速硬编码检查模式"
  echo "====================="
  
  local critical_files=(
    "apps/backend/src/index.js"
    "apps/backend/src/routes/store.routes.js"
    "apps/backend/src/middleware/index.js"
    "apps/backend/src/services/store.service.js"
  )
  
  for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
      check_file "$file"
    fi
  done
  
  echo "📊 快速检查完成"
  echo "发现 $WARNING_COUNT 个警告"
}

# 帮助信息
show_help() {
  echo "麒麟项目硬编码检查工具"
  echo ""
  echo "用法: $0 [选项]"
  echo ""
  echo "选项:"
  echo "  -h, --help     显示帮助信息"
  echo "  -q, --quick    快速检查模式（只检查关键文件）"
  echo "  -v, --verbose  详细模式（显示更多信息）"
  echo "  --strict       严格模式（警告视为错误）"
  echo ""
  echo "示例:"
  echo "  $0             完整检查所有代码"
  echo "  $0 -q          快速检查关键文件"
  echo "  $0 --strict    严格检查，任何警告都失败"
  echo ""
  echo "退出代码:"
  echo "  0 - 检查通过，无硬编码问题"
  echo "  1 - 发现硬编码问题"
  echo "  2 - 脚本执行错误"
}

# 解析参数
MODE="full"
VERBOSE=0
STRICT=0

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -q|--quick)
      MODE="quick"
      shift
      ;;
    -v|--verbose)
      VERBOSE=1
      shift
      ;;
    --strict)
      STRICT=1
      shift
      ;;
    *)
      echo "错误: 未知选项 $1"
      show_help
      exit 2
      ;;
  esac
done

# 执行检查
if [ "$MODE" = "quick" ]; then
  quick_check
else
  run_check
fi

# 根据严格模式决定退出代码
if [ $STRICT -eq 1 ] && [ $WARNING_COUNT -gt 0 ]; then
  exit 1
else
  exit 0
fi