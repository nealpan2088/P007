#!/bin/bash
# 麒麟项目 - 系统服务配置脚本
# 配置systemd服务，让服务器在系统启动时自动运行

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

# 检查是否以root运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用sudo运行此脚本"
        exit 1
    fi
}

# 创建PM2 systemd服务
create_pm2_service() {
    local service_file="/etc/systemd/system/qilin-pm2.service"
    local project_path="/home/admin/projects/P007"
    local user="admin"
    
    log_info "创建PM2 systemd服务..."
    
    cat > "$service_file" << EOF
[Unit]
Description=Qilin Project PM2 Service
Documentation=https://github.com/nealpan2088/P007
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=forking
User=$user
Group=$user
WorkingDirectory=$project_path
Environment=PATH=/usr/bin:/usr/local/bin:/home/$user/.nvm/versions/node/v24.14.1/bin
Environment=NODE_ENV=production
ExecStart=/usr/bin/pm2 start $project_path/pm2.config.js --env production
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=$project_path/logs

# 资源限制
LimitNOFILE=65536
LimitNPROC=512
LimitMEMLOCK=infinity
LimitCORE=infinity

[Install]
WantedBy=multi-user.target
EOF
    
    log_success "PM2服务文件已创建: $service_file"
}

# 创建数据库服务依赖
create_postgresql_service() {
    log_info "检查PostgreSQL服务..."
    
    if systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL服务正在运行"
    else
        log_warning "PostgreSQL服务未运行，尝试启动..."
        systemctl start postgresql
        systemctl enable postgresql
        log_success "PostgreSQL服务已启动并启用"
    fi
}

# 创建日志轮转配置
create_logrotate_config() {
    local logrotate_file="/etc/logrotate.d/qilin"
    
    log_info "创建日志轮转配置..."
    
    cat > "$logrotate_file" << EOF
/home/admin/projects/P007/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 admin admin
    sharedscripts
    postrotate
        /usr/bin/pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
EOF
    
    log_success "日志轮转配置已创建: $logrotate_file"
}

# 创建监控脚本
create_monitor_script() {
    local monitor_script="/home/admin/projects/P007/scripts/monitor-servers.sh"
    
    log_info "创建服务器监控脚本..."
    
    cat > "$monitor_script" << 'EOF'
#!/bin/bash
# 麒麟项目 - 服务器监控脚本
# 定期检查服务器状态，自动重启失败的服务

set -e

# 配置
LOG_FILE="/home/admin/projects/P007/logs/monitor.log"
MAX_RETRIES=3
CHECK_INTERVAL=60  # 检查间隔（秒）

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查服务状态
check_service() {
    local name=$1
    local url=$2
    local timeout=5
    
    if curl -s -f --max-time "$timeout" "$url" > /dev/null 2>&1; then
        log "✅ $name 运行正常 ($url)"
        return 0
    else
        log "❌ $name 不可达 ($url)"
        return 1
    fi
}

# 重启服务
restart_service() {
    local name=$1
    
    log "尝试重启 $name..."
    
    case $name in
        backend)
            pm2 restart qilin-backend
            ;;
        frontend)
            pm2 restart qilin-frontend
            ;;
        *)
            pm2 restart all
            ;;
    esac
    
    # 等待服务启动
    sleep 10
}

# 主监控循环
main() {
    log "🚀 启动麒麟项目服务器监控..."
    log "检查间隔: ${CHECK_INTERVAL}秒"
    log "最大重试次数: ${MAX_RETRIES}"
    
    declare -A retry_counts=([backend]=0 [frontend]=0)
    
    while true; do
        log "--- 开始检查 ---"
        
        # 检查后端
        if ! check_service "后端服务器" "http://localhost:33037/api/health"; then
            retry_counts[backend]=$((retry_counts[backend] + 1))
            log "后端重试次数: ${retry_counts[backend]}/${MAX_RETRIES}"
            
            if [ ${retry_counts[backend]} -ge $MAX_RETRIES ]; then
                log "达到最大重试次数，重启后端服务..."
                restart_service "backend"
                retry_counts[backend]=0
            fi
        else
            retry_counts[backend]=0
        fi
        
        # 检查前端
        if ! check_service "前端服务器" "http://localhost:5177"; then
            retry_counts[frontend]=$((retry_counts[frontend] + 1))
            log "前端重试次数: ${retry_counts[frontend]}/${MAX_RETRIES}"
            
            if [ ${retry_counts[frontend]} -ge $MAX_RETRIES ]; then
                log "达到最大重试次数，重启前端服务..."
                restart_service "frontend"
                retry_counts[frontend]=0
            fi
        else
            retry_counts[frontend]=0
        fi
        
        # 检查数据库
        if ! PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d qilin_dev -c "SELECT 1" > /dev/null 2>&1; then
            log "⚠️  数据库连接异常，尝试重启PostgreSQL..."
            sudo systemctl restart postgresql
            sleep 5
        fi
        
        log "--- 检查完成，等待 ${CHECK_INTERVAL}秒 ---"
        sleep $CHECK_INTERVAL
    done
}

# 捕获退出信号
trap 'log "监控脚本停止"; exit 0' SIGINT SIGTERM

# 运行主函数
main
EOF
    
    chmod +x "$monitor_script"
    log_success "监控脚本已创建: $monitor_script"
}

# 创建监控systemd服务
create_monitor_service() {
    local service_file="/etc/systemd/system/qilin-monitor.service"
    
    log_info "创建监控systemd服务..."
    
    cat > "$service_file" << EOF
[Unit]
Description=Qilin Project Monitor Service
After=qilin-pm2.service
Requires=qilin-pm2.service

[Service]
Type=simple
User=admin
Group=admin
WorkingDirectory=/home/admin/projects/P007
ExecStart=/home/admin/projects/P007/scripts/monitor-servers.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

# 资源限制
LimitNOFILE=65536
LimitNPROC=512

[Install]
WantedBy=multi-user.target
EOF
    
    log_success "监控服务文件已创建: $service_file"
}

# 创建备份脚本
create_backup_script() {
    local backup_script="/home/admin/projects/P007/scripts/backup-database.sh"
    
    log_info "创建数据库备份脚本..."
    
    cat > "$backup_script" << 'EOF'
#!/bin/bash
# 麒麟项目 - 数据库备份脚本
# 定期备份数据库到指定目录

set -e

# 配置
BACKUP_DIR="/home/admin/backups/qilin"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/qilin_db_$DATE.sql.gz"
LOG_FILE="/home/admin/projects/P007/logs/backup.log"
RETENTION_DAYS=30

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "创建备份目录: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# 备份数据库
backup_database() {
    log "开始备份数据库..."
    
    # 备份命令
    PGPASSWORD=postgres pg_dump -h localhost -p 5432 -U postgres -d qilin_dev \
        --clean --if-exists --no-owner --no-privileges \
        | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
        log "✅ 数据库备份成功: $BACKUP_FILE ($file_size)"
        return 0
    else
        log "❌ 数据库备份失败"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log "清理超过 ${RETENTION_DAYS} 天的旧备份..."
    
    find "$BACKUP_DIR" -name "qilin_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    log "旧备份清理完成"
}

# 验证备份文件
verify_backup() {
    log "验证备份文件..."
    
    if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
        log "✅ 备份文件验证通过"
        return 0
    else
        log "❌ 备份文件损坏"
        return 1
    fi
}

# 发送通知（可选）
send_notification() {
    local status=$1
    local message=$2
    
    # 这里可以添加邮件、Slack、钉钉等通知
    # 示例：发送到系统日志
    logger -t "qilin-backup" "$message"
    
    log "通知已发送: $message"
}

# 主函数
main() {
    log "🚀 开始麒麟项目数据库备份流程"
    
    create_backup_dir
    
    if backup_database; then
        if verify_backup; then
            cleanup_old_backups
            send_notification "success" "数据库备份成功: $BACKUP_FILE"
            log "✅ 备份流程完成"
        else
            send_notification "error" "数据库备份验证失败"
            log "❌ 备份验证失败"
            exit 1
        fi
    else
        send_notification "error" "数据库备份失败"
        log "❌ 备份失败"
        exit 1
    fi
}

# 运行主函数
main
EOF
    
    chmod +x "$backup_script"
    log_success "备份脚本已创建: $backup_script"
}

# 创建备份systemd定时任务
create_backup_timer() {
    local service_file="/etc/systemd/system/qilin-backup.service"
    local timer_file="/etc/systemd/system/qilin-backup.timer"
    
    log_info "创建备份systemd定时任务..."
    
    # 创建服务文件
    cat > "$service_file" << EOF
[Unit]
Description=Qilin Project Database Backup Service
After=postgresql.service

[Service]
Type=oneshot
User=admin
Group=admin
WorkingDirectory=/home/admin/projects/P007
ExecStart=/home/admin/projects/P007/scripts/backup-database.sh
StandardOutput=journal
StandardError=journal

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
EOF
    
    # 创建定时器文件
    cat > "$timer_file" << EOF
[Unit]
Description=Daily backup of Qilin database
Requires=qilin-backup.service

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=3600

[Install]
WantedBy=timers.target
EOF
    
    log_success "备份定时任务已创建"
}

# 启用所有服务
enable_services() {
    log_info "启用所有服务..."
    
    # 重新加载systemd配置
    systemctl daemon-reload
    
    # 启用PM2服务
    systemctl enable qilin-pm2.service
    systemctl start qilin-pm2.service
    
    # 启用监控服务
    systemctl enable qilin-monitor.service
    systemctl start qilin-monitor.service
    
    # 启用备份定时器
    systemctl enable qilin-backup.timer
    systemctl start qilin-backup.timer
    
    log_success "所有服务已启用并启动"
}

# 显示状态
show_status() {
    echo ""
    echo "=========================================="
    echo "       麒麟项目 - 系统服务状态"
    echo "=========================================="
    echo ""
    
    # PM2服务状态
    log_info "PM2服务状态:"
    systemctl status qilin-pm2.service --no-pager | head -20
    
    echo ""
    echo "------------------------------------------"
    echo ""
    
    # 监控服务状态
    log_info "监控服务状态:"
    systemctl status qilin-monitor.service --no-pager | head -20
    
    echo ""
    echo "------------------------------------------"
    echo ""
    
    # 备份定时器状态
    log_info "备份定时器状态:"
    systemctl status qilin-backup.timer --no-pager | head -20
    
    echo ""
    echo "------------------------------------------"
    echo ""
    
    # 查看定时器下次运行时间
    log_info "备份下次运行时间:"
    systemctl list-timers qilin-backup.timer --no-pager
    
    echo ""
    echo "=========================================="
}

# 主函数
main() {
    local action=${1:-setup}
    
    case $action in
        setup)
            echo "🛠️  设置麒麟项目系统服务..."
            check_root
            create_postgresql_service
            create_pm2_service
            create_logrotate_config
            create_monitor_script
            create_monitor_service
            create_backup_script
            create_backup_timer
            enable_services
            show_status
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            echo "麒麟项目系统服务配置脚本"
            echo ""
            echo "用法: sudo $0 [命令]"
            echo ""
            echo "命令:"
            echo "  setup     设置所有系统服务 (默认)"
            echo "  status    显示服务状态"
            echo "  help      显示帮助信息"
            echo ""
            ;;
        *)
            echo "未知命令: $action"
            echo "使用 'sudo $0 help' 查看可用命令"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"