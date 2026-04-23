#!/bin/bash
# 麒麟项目 - 版本提交脚本
# 版本: 0.2.5
# 功能: 自动化版本管理和Git提交

set -e  # 遇到错误立即退出

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

# 检查Git状态
check_git_status() {
    log_info "检查Git状态..."
    
    if ! git status &> /dev/null; then
        log_error "当前目录不是Git仓库"
        return 1
    fi
    
    # 检查是否有未提交的修改
    local changes=$(git status --porcelain)
    if [ -z "$changes" ]; then
        log_warning "没有需要提交的修改"
        return 2
    fi
    
    log_success "发现需要提交的修改"
    echo "修改文件列表:"
    git status --porcelain
    echo ""
    return 0
}

# 检查版本一致性
check_version_consistency() {
    log_info "检查版本一致性..."
    
    local root_version=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
    local backend_version=$(grep '"version"' apps/backend/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
    local frontend_version=$(grep '"version"' apps/frontend/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
    
    echo "当前版本:"
    echo "  项目根目录: $root_version"
    echo "  后端: $backend_version"
    echo "  前端: $frontend_version"
    echo ""
    
    if [ "$root_version" = "$backend_version" ] && [ "$root_version" = "$frontend_version" ]; then
        log_success "版本一致: $root_version"
        return 0
    else
        log_error "版本不一致"
        return 1
    fi
}

# 添加文件到Git
add_files_to_git() {
    log_info "添加文件到Git..."
    
    # 添加所有修改的文件
    git add .
    
    local added_count=$(git status --porcelain | wc -l)
    log_success "已添加 $added_count 个文件到暂存区"
    
    # 显示添加的文件摘要
    echo "添加的文件类型统计:"
    git status --porcelain | awk '{print $2}' | xargs -I {} sh -c 'echo {} | grep -o "\.[^.]*$"' | sort | uniq -c | sort -rn
    echo ""
}

# 创建提交信息
create_commit_message() {
    local version=$1
    local commit_type=$2
    
    case $commit_type in
        "feature")
            local type="✨ 功能"
            ;;
        "fix")
            local type="🐛 修复"
            ;;
        "docs")
            local type="📝 文档"
            ;;
        "refactor")
            local type="♻️ 重构"
            ;;
        "test")
            local type="✅ 测试"
            ;;
        "chore")
            local type="🔧 配置"
            ;;
        *)
            local type="📦 更新"
            ;;
    esac
    
    local date=$(date +%Y-%m-%d)
    local message="$type: 版本 $version - $date"
    
    # 添加详细的变更说明
    message+="\n\n### 主要变更\n"
    message+="- 端口配置管理工具链完整实现\n"
    message+="- 自动化监控系统集成Cron定时任务\n"
    message+="- 统一版本号为 $version\n"
    message+="- 修复所有端口配置不一致问题\n"
    message+="- 文档与配置完全同步\n"
    message+="\n### 技术特性\n"
    message+="- 100%环境变量管理，无硬编码端口\n"
    message+="- 每日自动检查，Cron定时任务\n"
    message+="- 完整工具链，6个专用管理脚本\n"
    message+="- 状态可视化，随时查看监控状态\n"
    message+="\n### 相关文件\n"
    message+="- CHANGELOG.md - 更新日志\n"
    message+="- port-config-guide.md - 端口配置指南\n"
    message+="- .gitignore - 更新忽略规则\n"
    
    echo -e "$message"
}

# 提交到Git
commit_to_git() {
    local version=$1
    
    log_info "创建Git提交..."
    
    # 创建提交信息
    local commit_message=$(create_commit_message "$version" "chore")
    
    # 提交
    echo -e "$commit_message" | git commit -F -
    
    if [ $? -eq 0 ]; then
        log_success "Git提交创建成功"
        
        # 显示提交信息
        echo "提交信息:"
        git log -1 --pretty=format:"%s" | head -1
        echo ""
    else
        log_error "Git提交失败"
        return 1
    fi
}

# 创建Git标签
create_git_tag() {
    local version=$1
    
    log_info "创建Git标签 v$version..."
    
    # 检查是否已存在该标签
    if git tag -l | grep -q "v$version"; then
        log_warning "标签 v$version 已存在，跳过创建"
        return 0
    fi
    
    # 创建带注释的标签
    git tag -a "v$version" -m "版本 $version - 麒麟项目端口配置管理工具链完整实现"
    
    if [ $? -eq 0 ]; then
        log_success "Git标签 v$version 创建成功"
    else
        log_error "Git标签创建失败"
        return 1
    fi
}

# 推送到远程仓库
push_to_remote() {
    log_info "推送到远程仓库..."
    
    # 推送提交
    git push origin main
    
    if [ $? -eq 0 ]; then
        log_success "代码推送成功"
    else
        log_error "代码推送失败"
        return 1
    fi
    
    # 推送标签
    git push origin --tags
    
    if [ $? -eq 0 ]; then
        log_success "标签推送成功"
    else
        log_error "标签推送失败"
        return 1
    fi
}

# 显示提交总结
show_commit_summary() {
    local version=$1
    
    echo ""
    echo "=== 版本提交总结 ==="
    echo "版本: $version"
    echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    echo "📊 提交统计:"
    echo "  提交哈希: $(git log -1 --pretty=format:'%h')"
    echo "  作者: $(git log -1 --pretty=format:'%an')"
    echo "  时间: $(git log -1 --pretty=format:'%ad' --date=format:'%Y-%m-%d %H:%M:%S')"
    echo ""
    
    echo "📁 文件变更:"
    git show --stat --name-only HEAD | tail -n +6
    echo ""
    
    echo "🔗 远程仓库:"
    git remote -v
    echo ""
    
    echo "🏷️  版本标签:"
    git tag -l | tail -5
    echo ""
}

# 主函数
main() {
    echo "=== 麒麟项目版本提交 ==="
    echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # 检查Git状态
    check_git_status
    local git_status=$?
    
    if [ $git_status -eq 1 ]; then
        log_error "Git仓库检查失败，退出"
        return 1
    elif [ $git_status -eq 2 ]; then
        log_warning "没有需要提交的修改，退出"
        return 0
    fi
    
    # 检查版本一致性
    check_version_consistency
    if [ $? -ne 0 ]; then
        log_error "版本不一致，请先统一版本号"
        return 1
    fi
    
    # 获取当前版本
    local current_version=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
    echo "当前版本: $current_version"
    echo ""
    
    # 添加文件
    add_files_to_git
    
    # 提交到Git
    commit_to_git "$current_version"
    if [ $? -ne 0 ]; then
        log_error "提交失败"
        return 1
    fi
    
    # 创建Git标签
    create_git_tag "$current_version"
    
    # 推送到远程仓库
    read -p "是否推送到远程仓库? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_to_remote
        if [ $? -ne 0 ]; then
            log_error "推送失败"
            return 1
        fi
    else
        log_warning "跳过推送到远程仓库"
    fi
    
    # 显示总结
    show_commit_summary "$current_version"
    
    log_success "✅ 版本提交完成"
    echo ""
    echo "🎉 版本 $current_version 已成功提交！"
    echo "📅 下次版本更新请更新 CHANGELOG.md 和版本号"
}

# 执行主函数
main "$@"