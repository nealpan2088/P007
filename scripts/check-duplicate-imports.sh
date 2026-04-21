#!/bin/bash

# 麒麟项目 - 重复导入检查脚本
# 检查TypeScript/JavaScript文件中的重复导入问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查重复导入
check_duplicate_imports() {
    local file="$1"
    local has_errors=false
    
    log_info "检查文件: $file"
    
    # 提取所有导入语句
    local imports=$(grep -n "^import\|^import type" "$file" 2>/dev/null || true)
    
    if [ -z "$imports" ]; then
        return 0
    fi
    
    # 检查重复导入
    local duplicate_count=0
    local line_numbers=""
    
    # 使用awk检查重复的导入模块
    local duplicates=$(echo "$imports" | awk -F' from ' '
    {
        line = $0
        gsub(/^[0-9]+:/, "", line)  # 移除行号
        module = $2
        gsub(/[\047";]/, "", module)  # 移除引号和分号
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", module)  # 移除前后空格
        
        if (module != "") {
            count[module]++
            if (count[module] == 2) {
                duplicate_modules[module] = 1
            }
            module_lines[module] = module_lines[module] " " NR
        }
    }
    END {
        for (module in duplicate_modules) {
            print module ":" module_lines[module]
        }
    }')
    
    if [ -n "$duplicates" ]; then
        log_error "发现重复导入:"
        echo "$duplicates" | while IFS= read -r line; do
            local module=$(echo "$line" | cut -d':' -f1)
            local lines=$(echo "$line" | cut -d':' -f2)
            echo "  ❌ 模块: $module"
            echo "     重复行: $lines"
            duplicate_count=$((duplicate_count + 1))
        done
        has_errors=true
    fi
    
    # 检查重复的导入标识符
    local duplicate_identifiers=$(echo "$imports" | awk -F' from ' '
    {
        line = $0
        gsub(/^[0-9]+:/, "", line)  # 移除行号
        import_part = $1
        gsub(/^import[[:space:]]+/, "", import_part)  # 移除import关键字
        gsub(/[[:space:]]+as[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*/, "", import_part)  # 移除别名
        
        # 提取标识符
        if (import_part ~ /^{/) {
            # 命名导入: import { A, B } from 'module'
            gsub(/^{|}$/, "", import_part)
            split(import_part, identifiers, ",")
            for (i in identifiers) {
                id = identifiers[i]
                gsub(/^[[:space:]]+|[[:space:]]+$/, "", id)
                if (id != "") {
                    count[id]++
                    if (count[id] == 2) {
                        duplicate_ids[id] = 1
                    }
                    id_lines[id] = id_lines[id] " " NR
                }
            }
        } else if (import_part ~ /^[a-zA-Z_]/) {
            # 默认导入: import A from 'module'
            gsub(/[[:space:]]*$/, "", import_part)
            if (import_part != "") {
                count[import_part]++
                if (count[import_part] == 2) {
                    duplicate_ids[import_part] = 1
                }
                id_lines[import_part] = id_lines[import_part] " " NR
            }
        }
    }
    END {
        for (id in duplicate_ids) {
            print id ":" id_lines[id]
        }
    }')
    
    if [ -n "$duplicate_identifiers" ]; then
        log_error "发现重复导入标识符:"
        echo "$duplicate_identifiers" | while IFS= read -r line; do
            local identifier=$(echo "$line" | cut -d':' -f1)
            local lines=$(echo "$line" | cut -d':' -f2)
            echo "  ❌ 标识符: $identifier"
            echo "     重复行: $lines"
            duplicate_count=$((duplicate_count + 1))
        done
        has_errors=true
    fi
    
    if [ "$has_errors" = true ]; then
        return 1
    else
        log_success "✅ 无重复导入问题"
        return 0
    fi
}

# 检查所有TypeScript/JavaScript文件
check_all_files() {
    local root_dir="$1"
    local total_files=0
    local error_files=0
    
    log_info "=== 开始重复导入检查 ==="
    log_info "检查目录: $root_dir"
    echo ""
    
    # 查找所有TypeScript和JavaScript文件
    local files=$(find "$root_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.git/*")
    
    for file in $files; do
        total_files=$((total_files + 1))
        if check_duplicate_imports "$file"; then
            : # 无错误
        else
            error_files=$((error_files + 1))
            echo ""
        fi
    done
    
    echo ""
    log_info "=== 检查完成 ==="
    log_info "检查文件数: $total_files"
    
    if [ "$error_files" -eq 0 ]; then
        log_success "✅ 所有文件通过重复导入检查"
        return 0
    else
        log_error "❌ $error_files 个文件有重复导入问题"
        return 1
    fi
}

# 修复重复导入
fix_duplicate_imports() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    log_info "修复文件: $file"
    
    # 使用awk移除重复导入
    awk '
    BEGIN {
        in_import_section = 0
        imported_modules[""] = 0
        imported_identifiers[""] = 0
        delete_lines[""] = 0
    }
    
    /^import/ || /^import type/ {
        in_import_section = 1
        current_line = $0
        line_number = NR
        
        # 提取模块路径
        if (match(current_line, /from [\047"]([^\047"]+)[\047"]/, arr)) {
            module = arr[1]
            
            if (module in imported_modules) {
                # 重复模块，标记删除
                delete_lines[line_number] = 1
                print "  ⚠️  删除重复模块导入: " module " (行 " line_number ")" > "/dev/stderr"
            } else {
                imported_modules[module] = line_number
            }
        }
        
        # 提取标识符
        if (match(current_line, /import[[:space:]]+([^{]+)[[:space:]]+from/, arr)) {
            # 默认导入: import A from 'module'
            identifier = arr[1]
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", identifier)
            if (identifier in imported_identifiers) {
                delete_lines[line_number] = 1
                print "  ⚠️  删除重复标识符导入: " identifier " (行 " line_number ")" > "/dev/stderr"
            } else {
                imported_identifiers[identifier] = line_number
            }
        } else if (match(current_line, /import[[:space:]]+{([^}]+)}/, arr)) {
            # 命名导入: import { A, B } from 'module'
            identifiers = arr[1]
            split(identifiers, id_array, ",")
            for (i in id_array) {
                id = id_array[i]
                gsub(/^[[:space:]]+|[[:space:]]+$/, "", id)
                if (id in imported_identifiers) {
                    delete_lines[line_number] = 1
                    print "  ⚠️  删除重复标识符导入: " id " (行 " line_number ")" > "/dev/stderr"
                    break
                } else {
                    imported_identifiers[id] = line_number
                }
            }
        }
        
        if (!(line_number in delete_lines)) {
            print current_line
        }
        next
    }
    
    !/^import/ && !/^import type/ {
        if (in_import_section && $0 !~ /^[[:space:]]*$/) {
            in_import_section = 0
        }
        print $0
    }
    ' "$file" > "$temp_file"
    
    # 检查是否有更改
    if diff -q "$file" "$temp_file" > /dev/null; then
        log_info "✅ 文件无需修复"
        rm "$temp_file"
    else
        mv "$temp_file" "$file"
        log_success "✅ 文件修复完成"
    fi
}

# 主函数
main() {
    local action="check"
    local target_dir=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check)
                action="check"
                shift
                ;;
            --fix)
                action="fix"
                shift
                ;;
            --dir)
                target_dir="$2"
                shift 2
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  --check      检查重复导入（默认）"
                echo "  --fix        自动修复重复导入"
                echo "  --dir <目录> 指定检查目录（默认：项目根目录）"
                echo "  --help       显示帮助信息"
                exit 0
                ;;
            *)
                echo "未知选项: $1"
                exit 1
                ;;
        esac
    done
    
    # 设置默认目录
    if [ -z "$target_dir" ]; then
        target_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    fi
    
    case $action in
        check)
            check_all_files "$target_dir"
            ;;
        fix)
            log_info "=== 开始修复重复导入 ==="
            local files=$(find "$target_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.git/*")
            local fixed_count=0
            
            for file in $files; do
                if check_duplicate_imports "$file" > /dev/null 2>&1; then
                    : # 无错误，跳过
                else
                    fix_duplicate_imports "$file"
                    fixed_count=$((fixed_count + 1))
                fi
            done
            
            if [ "$fixed_count" -eq 0 ]; then
                log_success "✅ 无需修复，所有文件正常"
            else
                log_success "✅ 修复了 $fixed_count 个文件"
            fi
            ;;
    esac
}

# 执行主函数
main "$@"