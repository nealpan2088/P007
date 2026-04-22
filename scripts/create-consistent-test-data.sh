#!/bin/bash

# 基于现有数据创建一致的测试环境
# 使用实际存在的phoenix-main店铺作为基础

set -e

echo "🚀 创建一致的测试数据环境"
echo "============================"

cd /home/admin/projects/P007/apps/backend

echo "🔍 检查现有数据..."
# 查询现有的店铺
cat > /tmp/check-existing.sql << 'EOF'
-- 检查现有店铺
SELECT 
  s.id as store_id,
  s.name as store_name, 
  s.slug as store_slug,
  t.id as tenant_id,
  t.name as tenant_name,
  t.slug as tenant_slug,
  t.subdomain as tenant_subdomain
FROM stores s
JOIN tenants t ON s.tenant_id = t.id
WHERE s.deleted_at IS NULL
LIMIT 5;
EOF

echo "📊 现有店铺数据:"
npx prisma db execute --file /tmp/check-existing.sql --schema prisma/schema.prisma 2>&1 | grep -v "Executing\|store_id" | tail -10

echo ""
echo "🎯 基于phoenix-main创建测试租户..."
# 如果phoenix-main存在，以其租户为基础
cat > /tmp/create-consistent-data.sql << 'EOF'
-- 基于现有数据创建一致的测试环境

-- 1. 查找phoenix-main店铺的租户
WITH phoenix_tenant AS (
  SELECT t.id, t.name, t.slug, t.subdomain
  FROM stores s
  JOIN tenants t ON s.tenant_id = t.id
  WHERE s.slug = 'phoenix-main' AND s.deleted_at IS NULL
  LIMIT 1
)
-- 2. 如果找到，使用该租户创建测试数据
SELECT 
  '现有租户:' as label,
  id, name, slug, subdomain
FROM phoenix_tenant;

-- 3. 如果没有phoenix-main，创建测试租户和店铺
INSERT INTO tenants (name, slug, subdomain, display_name, plan, status, contact_email)
SELECT 
  '麒麟测试租户',
  'qilin-test',
  'qilin-test',
  '麒麟测试租户',
  'premium',
  'ACTIVE',
  'test@qilin.com'
WHERE NOT EXISTS (
  SELECT 1 FROM tenants WHERE slug = 'qilin-test' OR subdomain = 'qilin-test'
)
RETURNING '创建租户:' as label, id, name, slug;

-- 4. 创建测试店铺
INSERT INTO stores (tenant_id, name, slug, display_name, status)
SELECT 
  t.id,
  '测试店铺',
  'test-store',
  '麒麟测试店铺',
  'ACTIVE'
FROM tenants t 
WHERE t.slug = 'qilin-test'
  AND NOT EXISTS (
    SELECT 1 FROM stores WHERE slug = 'test-store'
  )
RETURNING '创建店铺:' as label, id, name, slug;

-- 5. 创建测试餐桌
INSERT INTO tables (store_id, code, name, capacity, status)
SELECT 
  s.id,
  'A01',
  '测试餐桌A01',
  4,
  'AVAILABLE'
FROM stores s 
WHERE s.slug = 'test-store'
  AND NOT EXISTS (
    SELECT 1 FROM tables WHERE store_id = s.id AND code = 'A01'
  )
RETURNING '创建餐桌:' as label, code, name, status;
EOF

echo ""
echo "📝 执行数据创建..."
npx prisma db execute --file /tmp/create-consistent-data.sql --schema prisma/schema.prisma 2>&1 | grep -v "Executing" | tail -20

echo ""
echo "✅ 测试数据环境准备完成！"
echo ""
echo "📡 测试URL："
echo "------------"
echo "新规范扫码点餐："
echo "  http://localhost:5177/t/qilin-test/s/test-store/scan/A01"
echo ""
echo "新规范API端点："
echo "  http://localhost:33038/api/public/tenants/qilin-test"
echo "  http://localhost:33038/api/public/tenants/qilin-test/stores/test-store/menu"
echo ""
echo "旧规范API端点："
echo "  http://localhost:33038/api/public/stores/test-store"
echo "  http://localhost:33038/api/public/stores/test-store/menu"
echo ""
echo "🎉 现在可以测试完整的新架构规范流程！"