#!/bin/bash
# 麒麟项目 - 一键启动脚本
# 版本: 0.2.5
# 功能: 一键启动前后端服务器，支持开发和生产模式

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

# 显示帮助
show_help() {
    echo "麒麟项目一键启动脚本"
    echo "版本: 0.2.5"
    echo ""
    echo "用法: ./start-qilin.sh [选项]"
    echo ""
    echo "选项:"
    echo "  dev      启动开发模式 (默认)"
    echo "  prod     启动生产模式"
    echo "  backend  仅启动后端"
    echo "  frontend 仅启动前端"
    echo "  status   检查服务器状态"
    echo "  stop     停止所有服务器"
    echo "  restart  重启所有服务器"
    echo "  help     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start-qilin.sh dev      # 启动开发模式"
    echo "  ./start-qilin.sh status   # 检查服务器状态"
    echo "  ./start-qilin.sh stop     # 停止所有服务器"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    log_info "Node.js 版本: $(node --version)"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    log_info "npm 版本: $(npm --version)"
    
    # 检查PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 未安装，将使用npm直接启动"
        PM2_AVAILABLE=false
    else
        PM2_AVAILABLE=true
        log_info "PM2 版本: $(pm2 --version 2>/dev/null || echo '未知')"
    fi
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        log_warning "curl 未安装，健康检查功能受限"
    fi
    
    log_success "依赖检查完成"
}

# 检查端口占用
check_port() {
    local port=$1
    local service=$2
    
    if lsof -ti:$port &> /dev/null; then
        log_warning "端口 $port 已被占用 ($service)"
        return 1
    fi
    return 0
}

# 启动后端服务器
start_backend() {
    log_info "启动后端服务器..."
    
    cd apps/backend || {
        log_error "无法进入后端目录"
        exit 1
    }
    
    # 检查端口
    check_port 33038 "后端API"
    
    # 启动后端
    if [ "$PM2_AVAILABLE" = true ]; then
        log_info "使用PM2启动后端..."
        pm2 start npm --name "qilin-backend" -- start
    else
        log_info "使用npm启动后端..."
        npm start &
        BACKEND_PID=$!
        echo $BACKEND_PID > /tmp/qilin-backend.pid
    fi
    
    # 等待后端启动
    log_info "等待后端服务器启动..."
    sleep 5
    
    # 健康检查
    if command -v curl &> /dev/null; then
        if curl -s http://localhost:33038/api/health > /dev/null; then
            log_success "后端服务器启动成功 (http://localhost:33038)"
        else
            log_error "后端服务器健康检查失败"
            return 1
        fi
    else
        log_warning "跳过健康检查 (curl未安装)"
    fi
    
    cd - > /dev/null
    return 0
}

# 启动前端服务器
start_frontend() {
    log_info "启动前端服务器..."
    
    cd apps/frontend || {
        log_error "无法进入前端目录"
        exit 1
    }
    
    # 检查端口
    check_port 5177 "前端开发服务器"
    
    # 启动前端
    if [ "$PM2_AVAILABLE" = true ]; then
        log_info "使用PM2启动前端..."
        
        # 先停止并删除已有的同名进程
        pm2 delete qilin-frontend 2>/dev/null || true
        sleep 1
        
        # 启动新进程
        pm2 start npm --name "qilin-frontend" -- run dev
    else
        log_info "使用npm启动前端..."
        npm run dev &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > /tmp/qilin-frontend.pid
    fi
    
    # 等待前端启动
    log_info "等待前端服务器启动..."
    sleep 3
    
    # 健康检查
    if command -v curl &> /dev/null; then
        if curl -s http://localhost:5177 > /dev/null; then
            log_success "前端服务器启动成功 (http://localhost:5177)"
        else
            log_error "前端服务器健康检查失败"
            return 1
        fi
    else
        log_warning "跳过健康检查 (curl未安装)"
    fi
    
    cd - > /dev/null
    return 0
}

# 检查服务器状态
check_status() {
    log_info "检查服务器状态..."
    
    echo ""
    echo "=== 后端服务器状态 ==="
    if command -v curl &> /dev/null; then
        if curl -s http://localhost:33038/api/health > /dev/null; then
            echo -e "${GREEN}✅ 运行正常${NC}"
            curl -s http://localhost:33038/api/health | jq -r '. | "  版本: \(.version)\n  服务: \(.service)\n  状态: \(.status)\n  数据库: \(.database)"' 2>/dev/null || curl -s http://localhost:33038/api/health
        else
            echo -e "${RED}❌ 未运行${NC}"
        fi
    else
        echo "  需要curl进行健康检查"
    fi
    
    echo ""
    echo "=== 前端服务器状态 ==="
    if command -v curl &> /dev/null; then
        if curl -s http://localhost:5177 > /dev/null; then
            echo -e "${GREEN}✅ 运行正常${NC}"
            echo "  地址: http://localhost:5177"
        else
            echo -e "${RED}❌ 未运行${NC}"
        fi
    else
        echo "  需要curl进行健康检查"
    fi
    
    echo ""
    echo "=== 进程状态 ==="
    if [ "$PM2_AVAILABLE" = true ]; then
        pm2 status | grep -A20 "qilin-"
    else
        echo "后端PID: $(cat /tmp/qilin-backend.pid 2>/dev/null || echo '未记录')"
        echo "前端PID: $(cat /tmp/qilin-frontend.pid 2>/dev/null || echo '未记录')"
    fi
}

# 停止服务器
stop_servers() {
    log_info "停止服务器..."
    
    if [ "$PM2_AVAILABLE" = true ]; then
        pm2 delete qilin-backend 2>/dev/null || true
        pm2 delete qilin-frontend 2>/dev/null || true
        log_success "PM2进程已停止"
    else
        # 停止后端
        if [ -f /tmp/qilin-backend.pid ]; then
            BACKEND_PID=$(cat /tmp/qilin-backend.pid)
            kill $BACKEND_PID 2>/dev/null || true
            rm /tmp/qilin-backend.pid
        fi
        
        # 停止前端
        if [ -f /tmp/qilin-frontend.pid ]; then
            FRONTEND_PID=$(cat /tmp/qilin-frontend.pid)
            kill $FRONTEND_PID 2>/dev/null || true
            rm /tmp/qilin-frontend.pid
        fi
        
        log_success "服务器进程已停止"
    fi
}

# 重启服务器
restart_servers() {
    log_info "重启服务器..."
    stop_servers
    sleep 2
    start_backend
    sleep 2
    start_frontend
}

# 主函数
main() {
    MODE=${1:-"dev"}
    
    case $MODE in
        "dev")
            log_info "启动开发模式..."
            check_dependencies
            start_backend
            start_frontend
            check_status
            ;;
        "prod")
            log_info "启动生产模式..."
            log_warning "生产模式暂未实现，使用开发模式"
            check_dependencies
            start_backend
            start_frontend
            check_status
            ;;
        "backend")
            log_info "仅启动后端..."
            check_dependencies
            start_backend
            ;;
        "frontend")
            log_info "仅启动前端..."
            check_dependencies
            start_frontend
            ;;
        "status")
            check_status
            ;;
        "stop")
            stop_servers
            ;;
        "restart")
            restart_servers
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知选项: $MODE"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"