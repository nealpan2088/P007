-- 创建正确的测试数据
-- 基于实际数据库结构

-- 1. 确保有slug字段的测试租户
INSERT INTO tenants (name, slug, display_name, plan, status, contact_email, contact_phone) 
VALUES 
  ('麒麟测试租户', 'qilin-test', '麒麟测试租户', 'premium', 'ACTIVE', 'test@qilin.com', '13800138001'),
  ('凤凰演示租户', 'phoenix-demo', '凤凰演示租户', 'pro', 'ACTIVE', 'demo@phoenix.com', '13900139001'),
  ('龙腾餐厅', 'dragon-restaurant', '龙腾餐厅连锁', 'business', 'ACTIVE', 'info@dragon.com', '13700137001')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  updated_at = NOW();

-- 2. 获取刚创建的租户ID
WITH tenant_ids AS (
  SELECT id, slug FROM tenants WHERE slug IN ('qilin-test', 'phoenix-demo', 'dragon-restaurant')
)
-- 3. 创建测试店铺
INSERT INTO stores (tenant_id, name, slug, display_name, address, phone, status) 
SELECT 
  ti.id,
  CASE ti.slug 
    WHEN 'qilin-test' THEN '测试总店'
    WHEN 'phoenix-demo' THEN '演示旗舰店' 
    WHEN 'dragon-restaurant' THEN '龙腾总店'
  END,
  CASE ti.slug 
    WHEN 'qilin-test' THEN 'test-store'
    WHEN 'phoenix-demo' THEN 'demo-shop' 
    WHEN 'dragon-restaurant' THEN 'dragon-main'
  END,
  CASE ti.slug 
    WHEN 'qilin-test' THEN '麒麟测试总店'
    WHEN 'phoenix-demo' THEN '凤凰演示旗舰店' 
    WHEN 'dragon-restaurant' THEN '龙腾餐厅总店'
  END,
  CASE ti.slug 
    WHEN 'qilin-test' THEN '测试地址1号'
    WHEN 'phoenix-demo' THEN '演示地址1号' 
    WHEN 'dragon-restaurant' THEN '龙腾路1号'
  END,
  CASE ti.slug 
    WHEN 'qilin-test' THEN '13800138001'
    WHEN 'phoenix-demo' THEN '13900139001' 
    WHEN 'dragon-restaurant' THEN '13700137001'
  END,
  'ACTIVE'
FROM tenant_ids ti
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 4. 输出结果
SELECT '✅ 测试数据创建完成' as message;
SELECT '租户:' as type, name, slug FROM tenants WHERE slug IN ('qilin-test', 'phoenix-demo', 'dragon-restaurant');
SELECT '店铺:' as type, s.name, s.slug, t.name as tenant_name 
FROM stores s 
JOIN tenants t ON s.tenant_id = t.id 
WHERE t.slug IN ('qilin-test', 'phoenix-demo', 'dragon-restaurant');