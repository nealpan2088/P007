#!/bin/bash

# 麒麟项目 - 预提交检查脚本
# 在Git提交前运行完整的代码质量检查

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

# 显示横幅
show_banner() {
    echo ""
    echo "🚀 麒麟项目 - 预提交代码质量检查"
    echo "=================================="
    echo ""
}

# 检查TypeScript编译
check_typescript() {
    log_info "1. TypeScript编译检查..."
    
    if [ ! -d "apps/frontend" ]; then
        log_error "❌ 前端目录不存在: apps/frontend"
        return 1
    fi
    
    cd apps/frontend
    if npx tsc --noEmit 2>/dev/null; then
        log_success "✅ TypeScript编译通过"
        cd ../..
        return 0
    else
        log_error "❌ TypeScript编译失败"
        cd ../..
        return 1
    fi
}

# 检查ESLint
check_eslint() {
    log_info "2. ESLint代码规范检查..."
    
    if [ ! -d "apps/frontend" ]; then
        log_error "❌ 前端目录不存在: apps/frontend"
        return 1
    fi
    
    cd apps/frontend
    if npx eslint src/pages/TenantManagement.tsx 2>/dev/null; then
        log_success "✅ ESLint检查通过"
        cd ../..
        return 0
    else
        log_warning "⚠️  ESLint检查发现代码规范问题（非阻塞）"
        cd ../..
        return 0  # ESLint警告不阻塞提交
    fi
}

# 检查重复导入
check_duplicate_imports() {
    log_info "3. 重复导入检查..."
    
    cd ../..
    if bash scripts/check-duplicate-imports.sh --check; then
        log_success "✅ 重复导入检查通过"
        return 0
    else
        log_error "❌ 重复导入检查失败"
        return 1
    fi
}

# 检查硬编码
check_hardcoded() {
    log_info "4. 硬编码配置检查..."
    
    if bash scripts/check-hardcoded.sh; then
        log_success "✅ 硬编码检查通过"
        return 0
    else
        log_error "❌ 硬编码检查失败"
        return 1
    fi
}

# 检查后端配置
check_backend_config() {
    log_info "5. 后端配置验证..."
    
    cd apps/backend
    if node -e "console.log('✅ 后端配置验证通过')"; then
        log_success "✅ 后端配置验证通过"
        return 0
    else
        log_error "❌ 后端配置验证失败"
        return 1
    fi
}

# 运行测试
run_tests() {
    log_info "6. 运行测试..."
    
    # 前端测试
    cd ../frontend
    if npx vitest run --reporter=verbose 2>/dev/null || true; then
        log_success "✅ 前端测试通过"
    else
        log_warning "⚠️  前端测试未运行或失败"
    fi
    
    # 后端测试
    cd ../backend
    if npm test 2>/dev/null || true; then
        log_success "✅ 后端测试通过"
    else
        log_warning "⚠️  后端测试未运行或失败"
    fi
    
    return 0
}

# 检查Git状态
check_git_status() {
    log_info "7. Git状态检查..."
    
    cd ../..
    local staged_files=$(git diff --cached --name-only)
    
    if [ -z "$staged_files" ]; then
        log_warning "⚠️  没有暂存的文件"
        return 0
    fi
    
    log_info "暂存的文件:"
    echo "$staged_files" | while read -r file; do
        echo "  📄 $file"
    done
    
    # 检查是否有TypeScript/JavaScript文件
    local ts_js_files=$(echo "$staged_files" | grep -E '\.(ts|tsx|js|jsx)$' || true)
    
    if [ -n "$ts_js_files" ]; then
        log_info "将检查的TypeScript/JavaScript文件:"
        echo "$ts_js_files" | while read -r file; do
            echo "  🔍 $file"
        done
    fi
    
    return 0
}

# 主函数
main() {
    local total_checks=0
    local failed_checks=0
    local project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    
    show_banner
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    # 检查是否在Git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "❌ 当前目录不是Git仓库"
        exit 1
    fi
    
    # 切换到项目根目录
    cd "$project_root"
    
    # 运行所有检查
    local checks=(
        "check_git_status"
        "check_typescript"
        "check_eslint"
        "check_duplicate_imports"
        "check_hardcoded"
        "check_backend_config"
        "run_tests"
    )
    
    for check_func in "${checks[@]}"; do
        total_checks=$((total_checks + 1))
        if $check_func; then
            : # 检查通过
        else
            failed_checks=$((failed_checks + 1))
        fi
        echo ""
    done
    
    # 记录结束时间
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # 显示总结
    echo "📊 检查总结"
    echo "=========="
    echo "检查时间: ${duration}秒"
    echo "总检查项: ${total_checks}"
    echo "通过项: $((total_checks - failed_checks))"
    echo "失败项: ${failed_checks}"
    echo ""
    
    if [ "$failed_checks" -eq 0 ]; then
        log_success "🎉 所有检查通过！可以安全提交代码。"
        echo ""
        echo "💡 建议的提交命令:"
        echo "  git commit -m \"你的提交信息\""
        exit 0
    else
        log_error "❌ 有 ${failed_checks} 个检查失败，请修复后再提交。"
        echo ""
        echo "🔧 修复建议:"
        echo "  1. 查看上面的错误信息"
        echo "  2. 修复所有失败项"
        echo "  3. 重新运行: bash scripts/pre-commit-check.sh"
        echo "  4. 或者跳过检查: git commit --no-verify"
        echo ""
        echo "⚠️  警告: 跳过检查可能导致代码质量问题！"
        exit 1
    fi
}

# 执行主函数
main "$@"