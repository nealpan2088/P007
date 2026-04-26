#!/bin/bash
# 语法检查脚本：括号匹配、引号检查
# 用于 pre-commit 钩子

set -e

errors=0

check_file() {
    local file="$1"
    local src
    src=$(cat "$file" 2>/dev/null) || return 0
    
    # 括号匹配
    local open_paren closed_paren open_brace closed_brace open_bracket closed_bracket
    open_paren=$(echo "$src" | tr -cd '(' | wc -c)
    closed_paren=$(echo "$src" | tr -cd ')' | wc -c)
    open_brace=$(echo "$src" | tr -cd '{' | wc -c)
    closed_brace=$(echo "$src" | tr -cd '}' | wc -c)
    open_bracket=$(echo "$src" | tr -cd '[' | wc -c)
    closed_bracket=$(echo "$src" | tr -cd ']' | wc -c)
    
    local problems=""
    [ "$open_paren" -ne "$closed_paren" ] && problems="$problems ()($open_paren/$closed_paren)"
    [ "$open_brace" -ne "$closed_brace" ] && problems="$problems {}=($open_brace/$closed_brace)"
    [ "$open_bracket" -ne "$closed_bracket" ] && problems="$problems []=($open_bracket/$closed_bracket)"
    
    # 模板字符串（反引号）
    local backticks
    backticks=$(echo "$src" | tr -cd '`' | wc -c)
    [ $((backticks % 2)) -ne 0 ] && problems="$problems 反引号不成对($backticks)"
    
    if [ -n "$problems" ]; then
        echo "  ❌ $file:$problems"
        return 1
    fi
    return 0
}

echo "---- 前端语法检查 ----"

while IFS= read -r -d '' f; do
    check_file "$f" || errors=$((errors + 1))
done < <(find src -name "*.ts" -o -name "*.tsx" -print0 2>/dev/null)

if [ "$errors" -gt 0 ]; then
    echo "❌ $errors 个文件有语法问题，请修复后重新提交"
    exit 1
fi

echo "✅ 前端语法检查通过（$(find src -name "*.ts" -o -name "*.tsx" | wc -l) 个文件）"
exit 0
