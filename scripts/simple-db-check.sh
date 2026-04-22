#!/bin/bash

# 简单的数据库检查脚本
# 直接使用SQL查询数据库结构

set -e

echo "🔍 检查P007麒麟项目数据库结构"
echo "================================"

cd /home/admin/projects/P007/apps/backend

echo ""
echo "📊 数据库连接测试..."
# 测试数据库连接
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT '数据库连接正常' as status, current_timestamp as time;" 2>&1 | grep -v "Executing" || true

echo ""
echo "📋 表结构检查..."
# 检查所有表
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT table_name, COUNT(*) as column_count FROM information_schema.columns WHERE table_schema = 'public' GROUP BY table_name ORDER BY table_name;" 2>&1 | grep -v "Executing" || true

echo ""
echo "🏢 tenants表详细结构:"
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'tenants' ORDER BY ordinal_position;" 2>&1 | grep -v "Executing" || true

echo ""
echo "🏪 stores表详细结构:"
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'stores' ORDER BY ordinal_position;" 2>&1 | grep -v "Executing" || true

echo ""
echo "📊 数据统计:"
# 租户数量
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT '租户数量:' as label, COUNT(*) as count FROM tenants WHERE deleted_at IS NULL;" 2>&1 | grep -v "Executing" || true

# 店铺数量
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT '店铺数量:' as label, COUNT(*) as count FROM stores WHERE deleted_at IS NULL;" 2>&1 | grep -v "Executing" || true

# 菜单分类数量
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT '菜单分类数量:' as label, COUNT(*) as count FROM menu_categories WHERE deleted_at IS NULL;" 2>&1 | grep -v "Executing" || true

# 菜品数量
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT '菜品数量:' as label, COUNT(*) as count FROM menu_items WHERE deleted_at IS NULL;" 2>&1 | grep -v "Executing" || true

# 餐桌数量
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT '餐桌数量:' as label, COUNT(*) as count FROM tables WHERE deleted_at IS NULL;" 2>&1 | grep -v "Executing" || true

echo ""
echo "✅ 数据库检查完成"
echo ""
echo "📡 测试数据验证:"
echo "租户测试: qilin-test (麒麟测试租户)"
echo "店铺测试: test-store (测试店铺)"
echo "API测试: http://localhost:33038/api/public/tenants/qilin-test"
echo "菜单API: http://localhost:33038/api/public/tenants/qilin-test/stores/test-store/menu"