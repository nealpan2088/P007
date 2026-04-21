#!/bin/bash
# 麒麟项目 - 服务器启动脚本
# 使用PM2管理前后端服务器进程

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

# 检查PM2是否安装
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2未安装，请先安装: npm install -g pm2"
        exit 1
    fi
    log_success "PM2已安装"
}

# 检查端口是否被占用
check_ports() {
    local backend_port=33037
    local frontend_port=5177
    
    log_info "检查端口占用情况..."
    
    # 检查后端端口
    if lsof -i :$backend_port &> /dev/null; then
        log_warning "端口 $backend_port 已被占用，尝试释放..."
        # 尝试杀死占用进程
        lsof -ti :$backend_port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # 检查前端端口
    if lsof -i :$frontend_port &> /dev/null; then
        log_warning "端口 $frontend_port 已被占用，尝试释放..."
        # 尝试杀死占用进程
        lsof -ti :$frontend_port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    log_success "端口检查完成"
}

# 创建日志目录
create_logs_dir() {
    local logs_dir="./logs"
    
    if [ ! -d "$logs_dir" ]; then
        log_info "创建日志目录: $logs_dir"
        mkdir -p "$logs_dir"
    fi
    
    # 创建日志文件（如果不存在）
    touch "$logs_dir/backend-error.log"
    touch "$logs_dir/backend-out.log"
    touch "$logs_dir/backend-combined.log"
    touch "$logs_dir/frontend-error.log"
    touch "$logs_dir/frontend-out.log"
    touch "$logs_dir/frontend-combined.log"
    
    log_success "日志目录准备完成"
}

# 启动后端服务器
start_backend() {
    log_info "启动后端服务器..."
    
    # 检查后端依赖
    if [ ! -d "./apps/backend/node_modules" ]; then
        log_warning "后端依赖未安装，正在安装..."
        cd ./apps/backend
        npm install
        cd ../..
    fi
    
    # 使用PM2启动后端
    pm2 start pm2.config.js --only qilin-backend --env development
    
    # 等待后端启动
    log_info "等待后端服务器启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:33037/api/health > /dev/null 2>&1; then
            log_success "后端服务器启动成功 (端口: 33037)"
            return 0
        fi
        
        log_info "尝试 $attempt/$max_attempts: 后端服务器正在启动..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "后端服务器启动失败，请检查日志"
    return 1
}

# 启动前端服务器
start_frontend() {
    log_info "启动前端服务器..."
    
    # 检查前端依赖
    if [ ! -d "./apps/frontend/node_modules" ]; then
        log_warning "前端依赖未安装，正在安装..."
        cd ./apps/frontend
        npm install
        cd ../..
    fi
    
    # 使用PM2启动前端
    pm2 start pm2.config.js --only qilin-frontend --env development
    
    # 等待前端启动
    log_info "等待前端服务器启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:5177 > /dev/null 2>&1; then
            log_success "前端服务器启动成功 (端口: 5177)"
            return 0
        fi
        
        log_info "尝试 $attempt/$max_attempts: 前端服务器正在启动..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "前端服务器启动失败，请检查日志"
    return 1
}

# 显示状态
show_status() {
    echo ""
    echo "=========================================="
    echo "       麒麟项目 - 服务器状态"
    echo "=========================================="
    echo ""
    
    # PM2进程状态
    log_info "PM2进程状态:"
    pm2 list
    
    echo ""
    echo "------------------------------------------"
    echo ""
    
    # 后端健康检查
    log_info "后端服务器健康检查:"
    if curl -s http://localhost:33037/api/health > /dev/null 2>&1; then
        local backend_health=$(curl -s http://localhost:33037/api/health | jq -r '.status,.service,.version' 2>/dev/null || echo "无法解析响应")
        echo -e "${GREEN}✅ 运行正常${NC}"
        echo "状态: $(echo $backend_health | cut -d' ' -f1)"
        echo "服务: $(echo $backend_health | cut -d' ' -f2)"
        echo "版本: $(echo $backend_health | cut -d' ' -f3)"
    else
        echo -e "${RED}❌ 不可达${NC}"
    fi
    
    echo ""
    echo "------------------------------------------"
    echo ""
    
    # 前端健康检查
    log_info "前端服务器健康检查:"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5177 | grep -q "200"; then
        echo -e "${GREEN}✅ 运行正常 (HTTP 200)${NC}"
    else
        echo -e "${RED}❌ 不可达${NC}"
    fi
    
    echo ""
    echo "------------------------------------------"
    echo ""
    
    # 数据库连接检查
    log_info "数据库连接检查:"
    if PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d qilin_dev -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 连接正常${NC}"
        
        # 显示数据库统计
        echo "数据库统计:"
        PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d qilin_dev -c "
            SELECT '租户数' as 类型, COUNT(*) as 数量 FROM \"Tenant\"
            UNION ALL
            SELECT '用户数', COUNT(*) FROM \"User\"
            UNION ALL
            SELECT '店铺数', COUNT(*) FROM \"Store\"
            UNION ALL
            SELECT '订单数', COUNT(*) FROM \"Order\";
        " 2>/dev/null || echo "无法获取统计信息"
    else
        echo -e "${RED}❌ 连接失败${NC}"
    fi
    
    echo ""
    echo "=========================================="
}

# 停止所有服务器
stop_servers() {
    log_info "停止所有服务器..."
    
    pm2 stop all
    pm2 delete all
    
    log_success "所有服务器已停止"
}

# 重启所有服务器
restart_servers() {
    log_info "重启所有服务器..."
    
    pm2 restart all
    
    log_success "所有服务器已重启"
}

# 查看日志
view_logs() {
    local service=$1
    
    case $service in
        backend)
            log_info "查看后端日志..."
            pm2 logs qilin-backend --lines 50
            ;;
        frontend)
            log_info "查看前端日志..."
            pm2 logs qilin-frontend --lines 50
            ;;
        all)
            log_info "查看所有日志..."
            pm2 logs --lines 30
            ;;
        *)
            echo "用法: $0 logs [backend|frontend|all]"
            exit 1
            ;;
    esac
}

# 主函数
main() {
    local action=${1:-start}
    
    case $action in
        start)
            echo "🚀 启动麒麟项目服务器..."
            check_pm2
            check_ports
            create_logs_dir
            start_backend
            start_frontend
            show_status
            ;;
        stop)
            stop_servers
            ;;
        restart)
            restart_servers
            show_status
            ;;
        status)
            show_status
            ;;
        logs)
            view_logs "${2:-all}"
            ;;
        help|--help|-h)
            echo "麒麟项目服务器管理脚本"
            echo ""
            echo "用法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  start     启动所有服务器 (默认)"
            echo "  stop      停止所有服务器"
            echo "  restart   重启所有服务器"
            echo "  status    显示服务器状态"
            echo "  logs      查看日志 [backend|frontend|all]"
            echo "  help      显示帮助信息"
            echo ""
            ;;
        *)
            echo "未知命令: $action"
            echo "使用 '$0 help' 查看可用命令"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"