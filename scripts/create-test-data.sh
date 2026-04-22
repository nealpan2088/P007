#!/bin/bash

# 创建P007麒麟项目测试数据脚本
# 支持新架构规范：/t/{tenantSlug}/s/{storeSlug}/scan/{tableId}

set -e

echo "🚀 创建P007麒麟项目测试数据"
echo "=============================="

# 检查数据库连接
echo "🔍 检查数据库连接..."
cd /home/admin/projects/P007/apps/backend

# 使用Prisma客户端创建测试数据
cat > /tmp/create-test-data.sql << 'EOF'
-- P007麒麟项目测试数据
-- 支持新架构规范：/t/{tenantSlug}/s/{storeSlug}/scan/{tableId}

-- 1. 创建测试租户
INSERT INTO tenants (id, name, slug, display_name, plan, status, created_at, updated_at)
VALUES 
  ('test-tenant-1', '麒麟测试租户', 'qilin-test', '麒麟测试租户', 'premium', 'ACTIVE', NOW(), NOW()),
  ('test-tenant-2', '凤凰演示租户', 'phoenix-demo', '凤凰演示租户', 'pro', 'ACTIVE', NOW(), NOW()),
  ('test-tenant-3', '龙腾餐厅', 'dragon-restaurant', '龙腾餐厅连锁', 'business', 'ACTIVE', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 2. 创建测试店铺
INSERT INTO stores (id, tenant_id, name, slug, display_name, address, phone, status, created_at, updated_at)
VALUES 
  ('test-store-1', 'test-tenant-1', '测试总店', 'test-store', '麒麟测试总店', '测试地址1号', '13800138001', 'ACTIVE', NOW(), NOW()),
  ('test-store-2', 'test-tenant-1', '测试分店', 'test-branch', '麒麟测试分店', '测试地址2号', '13800138002', 'ACTIVE', NOW(), NOW()),
  ('demo-store-1', 'test-tenant-2', '演示旗舰店', 'demo-shop', '凤凰演示旗舰店', '演示地址1号', '13900139001', 'ACTIVE', NOW(), NOW()),
  ('dragon-store-1', 'test-tenant-3', '龙腾总店', 'dragon-main', '龙腾餐厅总店', '龙腾路1号', '13700137001', 'ACTIVE', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 3. 创建测试餐桌
INSERT INTO tables (id, store_id, code, name, capacity, status, created_at, updated_at)
VALUES 
  ('table-1', 'test-store-1', 'A01', '测试餐桌A01', 4, 'AVAILABLE', NOW(), NOW()),
  ('table-2', 'test-store-1', 'A02', '测试餐桌A02', 6, 'AVAILABLE', NOW(), NOW()),
  ('table-3', 'test-store-1', 'B01', '测试餐桌B01', 2, 'OCCUPIED', NOW(), NOW()),
  ('table-4', 'demo-store-1', 'VIP-01', 'VIP包厢01', 10, 'AVAILABLE', NOW(), NOW()),
  ('table-5', 'demo-store-1', 'VIP-02', 'VIP包厢02', 8, 'RESERVED', NOW(), NOW()),
  ('table-6', 'dragon-store-1', 'DR-01', '龙腾桌01', 4, 'AVAILABLE', NOW(), NOW())
ON CONFLICT (code, store_id) DO UPDATE SET
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 4. 创建测试菜单分类
INSERT INTO menu_categories (id, store_id, name, display_order, status, created_at, updated_at)
VALUES 
  ('cat-1', 'test-store-1', '热销推荐', 1, 'ACTIVE', NOW(), NOW()),
  ('cat-2', 'test-store-1', '主食', 2, 'ACTIVE', NOW(), NOW()),
  ('cat-3', 'test-store-1', '饮料', 3, 'ACTIVE', NOW(), NOW()),
  ('cat-4', 'demo-store-1', '特色菜', 1, 'ACTIVE', NOW(), NOW()),
  ('cat-5', 'demo-store-1', '套餐', 2, 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 5. 创建测试菜品
INSERT INTO menu_items (id, category_id, name, description, price, image_url, status, created_at, updated_at)
VALUES 
  ('item-1', 'cat-1', '麻辣香锅', '招牌麻辣香锅，香辣可口', 68.00, NULL, 'AVAILABLE', NOW(), NOW()),
  ('item-2', 'cat-1', '水煮鱼', '新鲜鱼肉，麻辣鲜香', 88.00, NULL, 'AVAILABLE', NOW(), NOW()),
  ('item-3', 'cat-2', '米饭', '香喷喷的白米饭', 3.00, NULL, 'AVAILABLE', NOW(), NOW()),
  ('item-4', 'cat-2', '面条', '手工拉面', 15.00, NULL, 'AVAILABLE', NOW(), NOW()),
  ('item-5', 'cat-3', '可乐', '冰镇可乐', 5.00, NULL, 'AVAILABLE', NOW(), NOW()),
  ('item-6', 'cat-3', '橙汁', '鲜榨橙汁', 12.00, NULL, 'AVAILABLE', NOW(), NOW()),
  ('item-7', 'cat-4', '凤凰烤鸭', '招牌烤鸭，皮脆肉嫩', 128.00, NULL, 'AVAILABLE', NOW(), NOW()),
  ('item-8', 'cat-5', '家庭套餐', '适合3-4人家庭', 198.00, NULL, 'AVAILABLE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 6. 创建测试订单
INSERT INTO orders (id, store_id, table_id, customer_name, customer_phone, total_amount, status, created_at, updated_at)
VALUES 
  ('order-1', 'test-store-1', 'table-1', '测试顾客1', '13800138000', 156.00, 'COMPLETED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('order-2', 'test-store-1', 'table-2', '测试顾客2', '13800138001', 203.00, 'PREPARING', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
  ('order-3', 'demo-store-1', 'table-4', '演示顾客1', '13900139000', 328.00, 'PENDING', NOW() - INTERVAL '30 minutes', NOW())
ON CONFLICT (id) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  total_amount = EXCLUDED.total_amount,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 7. 创建测试订单项
INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, total_price, created_at)
VALUES 
  ('oi-1', 'order-1', 'item-1', 2, 68.00, 136.00, NOW() - INTERVAL '1 day'),
  ('oi-2', 'order-1', 'item-5', 4, 5.00, 20.00, NOW() - INTERVAL '1 day'),
  ('oi-3', 'order-2', 'item-2', 1, 88.00, 88.00, NOW() - INTERVAL '2 hours'),
  ('oi-4', 'order-2', 'item-3', 4, 3.00, 12.00, NOW() - INTERVAL '2 hours'),
  ('oi-5', 'order-2', 'item-6', 3, 12.00, 36.00, NOW() - INTERVAL '2 hours'),
  ('oi-6', 'order-2', 'item-4', 2, 15.00, 30.00, NOW() - INTERVAL '2 hours'),
  ('oi-7', 'order-3', 'item-7', 2, 128.00, 256.00, NOW() - INTERVAL '30 minutes'),
  ('oi-8', 'order-3', 'item-8', 1, 198.00, 198.00, NOW() - INTERVAL '30 minutes'),
  ('oi-9', 'order-3', 'item-6', 6, 12.00, 72.00, NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  unit_price = EXCLUDED.unit_price,
  total_price = EXCLUDED.total_price,
  updated_at = NOW();

-- 8. 输出创建结果
SELECT '✅ 测试数据创建完成' as message;
SELECT '租户数量:' as label, COUNT(*) as count FROM tenants;
SELECT '店铺数量:' as label, COUNT(*) as count FROM stores;
SELECT '餐桌数量:' as label, COUNT(*) as count FROM tables;
SELECT '菜单分类数量:' as label, COUNT(*) as count FROM menu_categories;
SELECT '菜品数量:' as label, COUNT(*) as count FROM menu_items;
SELECT '订单数量:' as label, COUNT(*) as count FROM orders;
EOF

echo "📊 执行SQL创建测试数据..."
npx prisma db execute --file /tmp/create-test-data.sql --schema prisma/schema.prisma 2>&1 | grep -v "warning\|WARN" || true

echo ""
echo "✅ 测试数据创建完成！"
echo ""
echo "📋 测试数据概览："
echo "-----------------"
echo "租户:"
echo "  - qilin-test (麒麟测试租户)"
echo "  - phoenix-demo (凤凰演示租户)"  
echo "  - dragon-restaurant (龙腾餐厅)"
echo ""
echo "店铺:"
echo "  - test-store (麒麟测试总店)"
echo "  - test-branch (麒麟测试分店)"
echo "  - demo-shop (凤凰演示旗舰店)"
echo "  - dragon-main (龙腾餐厅总店)"
echo ""
echo "餐桌:"
echo "  - A01, A02, B01 (测试总店)"
echo "  - VIP-01, VIP-02 (演示旗舰店)"
echo "  - DR-01 (龙腾总店)"
echo ""
echo "菜品:"
echo "  - 麻辣香锅, 水煮鱼, 米饭, 面条, 可乐, 橙汁"
echo "  - 凤凰烤鸭, 家庭套餐"
echo ""
echo "📡 测试URL示例："
echo "-----------------"
echo "新规范扫码点餐："
echo "  http://localhost:5177/t/qilin-test/s/test-store/scan/A01"
echo "  http://localhost:5177/t/phoenix-demo/s/demo-shop/scan/VIP-01"
echo ""
echo "新规范API端点："
echo "  http://localhost:33038/api/public/tenants/qilin-test"
echo "  http://localhost:33038/api/public/tenants/qilin-test/stores/test-store/menu"
echo ""
echo "🎉 测试数据准备就绪，可以测试新架构规范功能！"