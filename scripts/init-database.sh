#!/bin/bash

# 麒麟项目 - 数据库初始化脚本
# 自动创建数据库、运行迁移、验证连接

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

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "命令 '$1' 未安装"
        return 1
    fi
    return 0
}

# 加载环境变量
load_env() {
    local env_file="$1"
    
    if [ -f "$env_file" ]; then
        log_info "加载环境变量: $env_file"
        # 安全地加载环境变量，忽略注释行
        export $(grep -v '^#' "$env_file" | xargs)
    else
        log_warning "环境文件不存在: $env_file"
    fi
}

# 解析DATABASE_URL
parse_database_url() {
    local url="$1"
    
    if [[ "$url" =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        export DB_USER="${BASH_REMATCH[1]}"
        export DB_PASSWORD="${BASH_REMATCH[2]}"
        export DB_HOST="${BASH_REMATCH[3]}"
        export DB_PORT="${BASH_REMATCH[4]}"
        export DB_NAME="${BASH_REMATCH[5]}"
        
        log_info "数据库配置:"
        log_info "  用户: $DB_USER"
        log_info "  主机: $DB_HOST:$DB_PORT"
        log_info "  数据库: $DB_NAME"
    else
        log_error "无法解析DATABASE_URL: $url"
        return 1
    fi
}

# 检查数据库连接
check_database_connection() {
    local db_url="$1"
    
    log_info "检查数据库连接..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" &> /dev/null; then
        log_success "数据库服务器连接成功"
        return 0
    else
        log_error "数据库服务器连接失败"
        return 1
    fi
}

# 检查数据库是否存在
check_database_exists() {
    local db_name="$1"
    
    log_info "检查数据库 '$db_name' 是否存在..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname = '$db_name';" | grep -q 1; then
        log_success "数据库 '$db_name' 已存在"
        return 0
    else
        log_warning "数据库 '$db_name' 不存在"
        return 1
    fi
}

# 创建数据库
create_database() {
    local db_name="$1"
    
    log_info "创建数据库 '$db_name'..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $db_name;" &> /dev/null; then
        log_success "数据库 '$db_name' 创建成功"
        return 0
    else
        log_error "数据库 '$db_name' 创建失败"
        return 1
    fi
}

# 运行数据库迁移
run_migrations() {
    local backend_dir="$1"
    
    log_info "运行数据库迁移..."
    
    cd "$backend_dir"
    
    # 设置环境变量
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    
    if npx prisma migrate dev --name init 2>&1 | tail -20; then
        log_success "数据库迁移成功"
        return 0
    else
        log_error "数据库迁移失败"
        return 1
    fi
}

# 验证数据库结构
validate_database() {
    local db_name="$1"
    
    log_info "验证数据库结构..."
    
    # 检查关键表是否存在
    local tables=("User" "Tenant" "Store" "Order" "MenuItem")
    local missing_tables=()
    
    for table in "${tables[@]}"; do
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = LOWER('$table'));" | grep -q t; then
            log_info "✅ 表 '$table' 存在"
        else
            log_warning "❌ 表 '$table' 不存在"
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        log_success "数据库结构验证通过"
        return 0
    else
        log_error "数据库结构不完整，缺失表: ${missing_tables[*]}"
        return 1
    fi
}

# 创建测试数据（可选）
create_test_data() {
    local db_name="$1"
    
    log_info "创建测试数据..."
    
    # 这里可以添加创建测试数据的SQL
    # 例如：创建测试用户、租户等
    
    log_success "测试数据创建完成（当前为空实现）"
    return 0
}

# 主函数
main() {
    echo ""
    echo "🔴 🔴 🔴  重要安全警告 🔴 🔴 🔴"
    echo "此脚本将执行数据库操作，包括："
    echo "1. 可能删除现有数据库"
    echo "2. 创建新数据库"
    echo "3. 运行数据库迁移"
    echo "4. 可能丢失所有现有数据"
    echo ""
    echo "⚠️  请在执行前："
    echo "1. 确认已备份重要数据"
    echo "2. 确认没有其他服务在使用数据库"
    echo "3. 确认你了解操作的风险"
    echo ""
    read -p "确认了解风险并继续吗？(输入 'CONFIRM' 继续): " -r
    echo
    if [[ "$REPLY" != "CONFIRM" ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    log_info "=== 麒麟项目数据库初始化 ==="
    log_info "开始时间: $(date)"
    echo ""
    
    # 检查必需命令
    check_command psql || exit 1
    check_command node || exit 1
    check_command npx || exit 1
    
    # 加载环境变量
    local backend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../apps/backend" && pwd)"
    load_env "$backend_dir/.env.development"
    
    # 检查DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL 环境变量未设置"
        exit 1
    fi
    
    # 解析DATABASE_URL
    parse_database_url "$DATABASE_URL" || exit 1
    
    # 检查数据库连接
    check_database_connection "$DATABASE_URL" || exit 1
    
    # 检查数据库是否存在
    if check_database_exists "$DB_NAME"; then
        log_warning "数据库 '$DB_NAME' 已存在"
        echo ""
        echo "⚠️  ⚠️  ⚠️  重要安全提示 ⚠️  ⚠️  ⚠️"
        echo "数据库 '$DB_NAME' 已存在。继续操作可能会："
        echo "1. 删除现有数据库（如果选择重新创建）"
        echo "2. 丢失所有现有数据"
        echo "3. 影响正在运行的服务"
        echo ""
        echo "请选择操作："
        echo "1) 跳过数据库创建，只运行迁移"
        echo "2) 删除并重新创建数据库（⚠️ 危险！会丢失所有数据）"
        echo "3) 退出脚本，手动处理"
        echo ""
        read -p "请选择 (1/2/3): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                log_info "跳过数据库创建，只运行迁移..."
                ;;
            2)
                log_error "⚠️  ⚠️  ⚠️  即将删除数据库 '$DB_NAME'！"
                read -p "确认要删除数据库 '$DB_NAME' 吗？输入 'DELETE' 确认: " -r
                echo
                if [[ "$REPLY" != "DELETE" ]]; then
                    log_error "操作已取消"
                    exit 1
                fi
                
                log_info "删除现有数据库..."
                PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "DROP DATABASE IF EXISTS $DB_NAME;" || {
                    log_error "删除数据库失败"
                    exit 1
                }
                create_database "$DB_NAME" || exit 1
                ;;
            3|*)
                log_info "操作已取消"
                exit 0
                ;;
        esac
    else
        log_info "数据库 '$DB_NAME' 不存在，将创建新数据库"
        read -p "确认创建数据库 '$DB_NAME' 吗？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "操作已取消"
            exit 0
        fi
        create_database "$DB_NAME" || exit 1
    fi
    
    # 运行迁移
    run_migrations "$backend_dir" || exit 1
    
    # 验证数据库结构
    validate_database "$DB_NAME" || exit 1
    
    # 创建测试数据（可选）
    read -p "是否创建测试数据？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_test_data "$DB_NAME"
    fi
    
    echo ""
    log_success "=== 数据库初始化完成 ==="
    log_info "数据库: $DB_NAME"
    log_info "主机: $DB_HOST:$DB_PORT"
    log_info "完成时间: $(date)"
    
    # 显示连接信息
    echo ""
    log_info "连接字符串:"
    echo "  postgresql://$DB_USER:******@$DB_HOST:$DB_PORT/$DB_NAME"
    
    # 显示下一步操作
    echo ""
    log_info "下一步操作:"
    echo "  1. 启动后端服务器: cd apps/backend && npm start"
    echo "  2. 启动前端服务器: cd apps/frontend && npm run dev"
    echo "  3. 访问前端: http://localhost:5177"
}

# 执行主函数
main "$@"