#!/bin/bash

# ============================================
# P007麒麟项目 - 服务器状态一键检查脚本
# 版本: v1.0.0
# 创建时间: 2026-04-21
# 作者: 旺财 (AI助手)
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${PURPLE}============================================${NC}"
}

# 函数：检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "命令 '$1' 未安装，请先安装"
        return 1
    fi
    return 0
}

# 函数：检查端口是否监听
check_port() {
    local port=$1
    local service=$2
    
    # 尝试使用 ss 命令
    if command -v ss &> /dev/null; then
        if ss -tuln | grep -q ":$port "; then
            print_success "$service 端口 $port 正在监听"
            return 0
        else
            print_error "$service 端口 $port 未监听"
            return 1
        fi
    # 回退到 netstat 命令
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_success "$service 端口 $port 正在监听"
            return 0
        else
            print_error "$service 端口 $port 未监听"
            return 1
        fi
    else
        print_warning "无法检查端口 (ss/netstat 命令未安装)"
        return 1
    fi
}

# 函数：检查进程是否存在
check_process() {
    local process_name=$1
    local service=$2
    
    if pgrep -f "$process_name" > /dev/null; then
        print_success "$service 进程正在运行"
        return 0
    else
        print_error "$service 进程未运行"
        return 1
    fi
}

# 函数：检查HTTP服务
check_http_service() {
    local url=$1
    local service=$2
    local timeout=${3:-5}
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null)
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $timeout "$url" 2>/dev/null 2>/dev/null || echo "0")
    
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]] || [[ "$status_code" =~ ^3[0-9][0-9]$ ]]; then
        print_success "$service HTTP状态: $status_code, 响应时间: ${response_time}s"
        return 0
    elif [[ -n "$status_code" ]]; then
        print_warning "$service HTTP状态: $status_code (非2xx/3xx)"
        return 1
    else
        print_error "$service 无法访问"
        return 1
    fi
}

# 函数：检查后端API
check_backend_api() {
    print_info "检查后端API服务..."
    
    # 检查健康端点
    local health_response=$(curl -s --max-time 5 "http://localhost:33037/api/health" 2>/dev/null)
    
    if [[ -n "$health_response" ]]; then
        local status=$(echo "$health_response" | jq -r '.status' 2>/dev/null || echo "unknown")
        local service=$(echo "$health_response" | jq -r '.service' 2>/dev/null || echo "unknown")
        local version=$(echo "$health_response" | jq -r '.version' 2>/dev/null || echo "unknown")
        local timestamp=$(echo "$health_response" | jq -r '.timestamp' 2>/dev/null || echo "unknown")
        
        if [[ "$status" == "ok" ]]; then
            print_success "后端API健康检查: $status"
            echo "  服务名称: $service"
            echo "  版本: $version"
            echo "  时间: $timestamp"
        else
            print_warning "后端API健康检查: $status"
        fi
    else
        print_error "后端API健康检查无响应"
    fi
    
    # 检查公开API
    check_http_service "http://localhost:33037/api/public/health" "后端公开API"
    
    # 检查店铺API（如果存在）
    local store_response=$(curl -s --max-time 3 "http://localhost:33037/api/v1/stores" 2>/dev/null)
    if [[ -n "$store_response" ]]; then
        local store_count=$(echo "$store_response" | jq '.data | length' 2>/dev/null || echo "0")
        print_info "店铺API返回数据: $store_count 条记录"
    fi
}

# 函数：检查前端页面
check_frontend_pages() {
    print_info "检查前端页面..."
    
    local pages=(
        "http://localhost:5177/ 首页"
        "http://localhost:5177/stores 店铺列表"
        "http://localhost:5177/stores/create 创建店铺"
        "http://localhost:5177/scan/test-store/A01 扫码点餐测试"
        "http://localhost:5177/auth/login 登录页面"
        "http://localhost:5177/tenants 租户管理"
    )
    
    for page_info in "${pages[@]}"; do
        local url=$(echo "$page_info" | cut -d' ' -f1)
        local name=$(echo "$page_info" | cut -d' ' -f2-)
        check_http_service "$url" "$name" 3
    done
}

# 函数：检查数据库连接
check_database() {
    print_info "检查数据库连接..."
    
    # 检查PostgreSQL服务
    if systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL服务正在运行"
    else
        print_error "PostgreSQL服务未运行"
        return 1
    fi
    
    # 尝试连接数据库
    if PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "\q" postgres 2>/dev/null; then
        print_success "数据库连接正常"
        
        # 检查项目数据库
        if PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "\q" qilin_dev 2>/dev/null; then
            print_success "项目数据库 'qilin_dev' 存在"
            
            # 检查关键表
            local tables=$(PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d qilin_dev -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
            local table_count=$(echo "$tables" | wc -l)
            print_info "数据库表数量: $table_count"
            
            # 检查关键表是否存在
            local key_tables=("users" "tenants" "stores" "menus" "orders")
            for table in "${key_tables[@]}"; do
                if echo "$tables" | grep -q -i "$table"; then
                    print_success "关键表 '$table' 存在"
                else
                    print_warning "关键表 '$table' 不存在"
                fi
            done
        else
            print_error "项目数据库 'qilin_dev' 不存在"
        fi
    else
        print_error "无法连接到PostgreSQL"
    fi
}

# 函数：检查系统资源
check_system_resources() {
    print_info "检查系统资源..."
    
    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    print_info "CPU使用率: ${cpu_usage}%"
    
    # 内存使用
    local mem_total=$(free -m | awk '/Mem:/ {print $2}')
    local mem_used=$(free -m | awk '/Mem:/ {print $3}')
    local mem_percent=$((mem_used * 100 / mem_total))
    print_info "内存使用: ${mem_used}MB / ${mem_total}MB (${mem_percent}%)"
    
    # 磁盘空间
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}')
    print_info "根目录磁盘使用: $disk_usage"
}

# 函数：检查项目版本
check_project_version() {
    print_info "检查项目版本..."
    
    # 检查前端版本
    if [[ -f "apps/frontend/package.json" ]]; then
        local frontend_version=$(grep '"version"' apps/frontend/package.json | head -1 | cut -d'"' -f4)
        print_info "前端版本: $frontend_version"
    else
        print_warning "前端 package.json 未找到"
    fi
    
    # 检查后端版本
    if [[ -f "apps/backend/package.json" ]]; then
        local backend_version=$(grep '"version"' apps/backend/package.json | head -1 | cut -d'"' -f4)
        print_info "后端版本: $backend_version"
    else
        print_warning "后端 package.json 未找到"
    fi
    
    # 检查Git版本
    if [[ -d ".git" ]]; then
        local git_version=$(git describe --tags --abbrev=0 2>/dev/null || echo "无标签")
        local git_commit=$(git log --oneline -1 --pretty=format:"%h" 2>/dev/null || echo "未知")
        print_info "Git最新标签: $git_version"
        print_info "Git最新提交: $git_commit"
    fi
}

# 函数：生成状态报告
generate_status_report() {
    local backend_ok=$1
    local frontend_ok=$2
    local database_ok=$3
    
    print_header "📊 系统状态报告"
    
    if [[ $backend_ok -eq 0 ]] && [[ $frontend_ok -eq 0 ]] && [[ $database_ok -eq 0 ]]; then
        echo -e "${GREEN}✅ 系统状态: 优秀${NC}"
        echo "所有服务运行正常，系统完全可用"
    elif [[ $backend_ok -eq 0 ]] && [[ $frontend_ok -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  系统状态: 良好${NC}"
        echo "前后端服务正常，数据库可能有小问题"
    elif [[ $backend_ok -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  系统状态: 一般${NC}"
        echo "后端服务正常，前端或数据库有问题"
    else
        echo -e "${RED}❌ 系统状态: 异常${NC}"
        echo "后端服务异常，系统可能无法正常工作"
    fi
    
    echo ""
    echo "📋 访问地址:"
    echo "  前端首页: http://localhost:5177/"
    echo "  店铺管理: http://localhost:5177/stores"
    echo "  扫码点餐: http://localhost:5177/scan/test-store/A01"
    echo "  后端API: http://localhost:33037/api/health"
    echo ""
    echo "🛠️  重启命令:"
    echo "  后端: cd apps/backend && npm run dev"
    echo "  前端: cd apps/frontend && npm run dev"
    echo ""
    echo "📅 检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
}

# 主函数
main() {
    print_header "🚀 P007麒麟项目 - 服务器状态检查"
    echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # 检查必要命令
    check_command curl || exit 1
    check_command jq || print_warning "jq命令未安装，部分JSON解析功能受限"
    check_command ss || print_warning "ss命令未安装，使用netstat替代"
    
    # 初始化状态变量
    local backend_status=1
    local frontend_status=1
    local database_status=1
    
    # 1. 检查系统资源
    check_system_resources
    echo ""
    
    # 2. 检查后端服务
    print_header "🔧 后端服务检查 (端口: 33037)"
    check_port 33037 "后端服务器"
    check_process "node.*src/index.js" "后端进程"
    check_backend_api
    if [[ $? -eq 0 ]]; then
        backend_status=0
    fi
    echo ""
    
    # 3. 检查前端服务
    print_header "🎨 前端服务检查 (端口: 5177)"
    check_port 5177 "前端服务器"
    check_process "vite" "前端进程"
    check_frontend_pages
    if [[ $? -eq 0 ]]; then
        frontend_status=0
    fi
    echo ""
    
    # 4. 检查数据库
    print_header "🗄️  数据库检查 (PostgreSQL)"
    check_database
    if [[ $? -eq 0 ]]; then
        database_status=0
    fi
    echo ""
    
    # 5. 检查项目版本
    print_header "📦 项目版本信息"
    check_project_version
    echo ""
    
    # 6. 生成状态报告
    generate_status_report $backend_status $frontend_status $database_status
    
    print_header "✅ 检查完成"
}

# 执行主函数
main "$@"