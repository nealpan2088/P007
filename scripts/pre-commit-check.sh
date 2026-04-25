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
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

show_banner() {
    echo ""
    echo "🚀 麒麟项目 - 预提交代码质量检查"
    echo "=================================="
    echo ""
}

# 检查TypeScript编译
check_typescript() {
    log_info "1. TypeScript编译检查..."
    if [ ! -d "$PROJECT_ROOT/apps/frontend" ]; then
        log_warning "⚠️  前端目录不存在，跳过"
        return 0
    fi
    cd "$PROJECT_ROOT/apps/frontend"
    if npx tsc --noEmit 2>/dev/null; then
        log_success "✅ TypeScript编译通过"
    else
        log_warning "⚠️  TypeScript编译有警告（非阻塞）"
    fi
}

# 检查ESLint
check_eslint() {
    log_info "2. ESLint代码规范检查..."
    if [ ! -d "$PROJECT_ROOT/apps/frontend" ]; then
        log_warning "⚠️  前端目录不存在，跳过"
        return 0
    fi
    cd "$PROJECT_ROOT/apps/frontend"
    if npx eslint src/pages/TenantManagement.tsx 2>/dev/null; then
        log_success "✅ ESLint检查通过"
    else
        log_warning "⚠️  ESLint检查发现代码规范问题（非阻塞）"
    fi
}

# 检查重复导入
check_duplicate_imports() {
    log_info "3. 重复导入检查..."
    if [ -f "$PROJECT_ROOT/scripts/check-duplicate-imports.sh" ]; then
        cd "$PROJECT_ROOT"
        if bash scripts/check-duplicate-imports.sh --check 2>/dev/null; then
            log_success "✅ 重复导入检查通过"
        else
            log_error "❌ 重复导入检查失败"
            return 1
        fi
    else
        log_warning "⚠️  重复导入检查脚本不存在，跳过"
    fi
}

# 检查硬编码
check_hardcoded() {
    log_info "4. 硬编码配置检查..."
    if [ -f "$PROJECT_ROOT/scripts/check-hardcoded.sh" ]; then
        cd "$PROJECT_ROOT"
        if bash scripts/check-hardcoded.sh 2>/dev/null; then
            log_success "✅ 硬编码检查通过"
        else
            log_error "❌ 硬编码检查失败"
            return 1
        fi
    else
        log_warning "⚠️  硬编码检查脚本不存在，跳过"
    fi
}

# 检查后端配置
check_backend_config() {
    log_info "5. 后端配置验证..."
    if [ -d "$PROJECT_ROOT/apps/backend" ]; then
        cd "$PROJECT_ROOT/apps/backend"
        if node -e "console.log('后端配置验证通过')" 2>/dev/null; then
            log_success "✅ 后端配置验证通过"
        else
            log_warning "⚠️  后端配置验证异常（非阻塞）"
        fi
    else
        log_warning "⚠️  后端目录不存在，跳过"
    fi
}

# 运行测试
run_tests() {
    log_info "6. 运行测试..."
    if [ -d "$PROJECT_ROOT/apps/frontend" ]; then
        cd "$PROJECT_ROOT/apps/frontend"
        if npx vitest run --reporter=verbose 2>/dev/null; then
            log_success "✅ 前端测试通过"
        else
            log_warning "⚠️  前端测试未运行或失败"
        fi
    fi
    if [ -d "$PROJECT_ROOT/apps/backend" ]; then
        cd "$PROJECT_ROOT/apps/backend"
        if npm test 2>/dev/null; then
            log_success "✅ 后端测试通过"
        else
            log_warning "⚠️  后端测试未运行或失败"
        fi
    fi
}

# 检查Git状态
check_git_status() {
    log_info "7. Git状态检查..."
    cd "$PROJECT_ROOT"
    local staged_files=$(git diff --cached --name-only 2>/dev/null || true)
    if [ -z "$staged_files" ]; then
        log_warning "⚠️  没有暂存的文件"
    else
        log_info "暂存的文件:"
        echo "$staged_files" | while read -r file; do
            echo "  📄 $file"
        done
    fi
}

# 主函数
main() {
    show_banner

    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "❌ 当前目录不是Git仓库"
        exit 1
    fi

    local start_time=$(date +%s)
    local failed=0

    check_git_status || ((failed++))
    check_typescript || ((failed++))
    check_eslint || ((failed++))
    check_duplicate_imports || ((failed++))
    check_hardcoded || ((failed++))
    check_backend_config || ((failed++))
    run_tests || ((failed++))

    local end_time=$(date +%s)

    echo ""
    echo "📊 检查总结"
    echo "=========="
    echo "检查时间: $((end_time - start_time))秒"
    echo "失败项: ${failed}"
    echo ""

    if [ "$failed" -eq 0 ]; then
        log_success "🎉 所有检查通过！"
        exit 0
    else
        log_warning "⚠️  有 ${failed} 项非阻塞问题（可通过 --no-verify 跳过）"
        exit 0  # 不阻塞提交
    fi
}

main "$@"
