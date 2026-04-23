#!/usr/bin/env node
/**
 * 创建测试用户和租户数据
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🚀 开始创建测试数据...\n');

  try {
    // 1. 创建测试租户
    console.log('1. 创建测试租户...');
    const tenant = await prisma.tenants.create({
      data: {
        name: '测试餐厅',
        subdomain: 'test-restaurant',
        plan: 'BASIC',
        status: 'ACTIVE',
        settings: {
          currency: 'CNY',
          timezone: 'Asia/Shanghai',
          language: 'zh-CN'
        }
      }
    });
    console.log(`✅ 创建租户: ${tenant.name} (ID: ${tenant.id})`);

    // 2. 创建测试用户
    console.log('\n2. 创建测试用户...');
    const user = await prisma.users.create({
      data: {
        email: 'test@example.com',
        username: 'test-admin',
        passwordHash: 'hashed_password_placeholder', // 实际应用中应该使用bcrypt
        role: 'ADMIN',
        emailVerified: true,
        status: 'ACTIVE',
        settings: {
          notifications: true,
          language: 'zh-CN'
        }
      }
    });
    console.log(`✅ 创建用户: ${user.username} (ID: ${user.id})`);

    // 3. 关联用户和租户
    console.log('\n3. 关联用户和租户...');
    const userTenant = await prisma.userTenants.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'OWNER',
        status: 'ACTIVE'
      }
    });
    console.log(`✅ 创建用户租户关联: 用户 ${user.id} -> 租户 ${tenant.id}`);

    // 4. 创建测试店铺
    console.log('\n4. 创建测试店铺...');
    const store = await prisma.stores.create({
      data: {
        tenantId: tenant.id,
        name: '测试店铺 - 总店',
        slug: 'test-store',
        address: '测试地址 123号',
        phone: '13800138000',
        status: 'ACTIVE',
        settings: {
          openingHours: {
            monday: { open: '09:00', close: '22:00' },
            tuesday: { open: '09:00', close: '22:00' },
            wednesday: { open: '09:00', close: '22:00' },
            thursday: { open: '09:00', close: '22:00' },
            friday: { open: '09:00', close: '23:00' },
            saturday: { open: '10:00', close: '23:00' },
            sunday: { open: '10:00', close: '22:00' }
          },
          paymentMethods: ['cash', 'wechat', 'alipay']
        }
      }
    });
    console.log(`✅ 创建店铺: ${store.name} (ID: ${store.id}, Slug: ${store.slug})`);

    // 5. 创建测试餐桌
    console.log('\n5. 创建测试餐桌...');
    const table = await prisma.tables.create({
      data: {
        storeId: store.id,
        tableNumber: 'A01',
        name: '靠窗雅座',
        capacity: 4,
        status: 'AVAILABLE',
        qrCode: `table-${store.id}-A01`
      }
    });
    console.log(`✅ 创建餐桌: ${table.name} (编号: ${table.tableNumber})`);

    // 6. 创建测试菜单
    console.log('\n6. 创建测试菜单...');
    
    // 先创建菜单分类
    const category = await prisma.menuCategories.create({
      data: {
        tenantId: tenant.id,
        name: '招牌推荐',
        description: '本店招牌菜品',
        sortOrder: 1,
        status: 'ACTIVE'
      }
    });
    console.log(`✅ 创建菜单分类: ${category.name}`);

    // 创建菜单项
    const menuItems = await Promise.all([
      prisma.menuItems.create({
        data: {
          tenantId: tenant.id,
          name: '招牌牛肉面',
          description: '精选牛肉，手工面条',
          price: 38.00,
          categoryId: category.id,
          status: 'AVAILABLE',
          sortOrder: 1,
          imageUrl: 'https://example.com/beef-noodles.jpg'
        }
      }),
      prisma.menuItems.create({
        data: {
          tenantId: tenant.id,
          name: '麻辣香锅',
          description: '多种食材，麻辣鲜香',
          price: 68.00,
          categoryId: category.id,
          status: 'AVAILABLE',
          sortOrder: 2,
          imageUrl: 'https://example.com/spicy-pot.jpg'
        }
      }),
      prisma.menuItems.create({
        data: {
          tenantId: tenant.id,
          name: '清炒时蔬',
          description: '新鲜时令蔬菜',
          price: 22.00,
          categoryId: category.id,
          status: 'AVAILABLE',
          sortOrder: 3
        }
      })
    ]);
    
    console.log(`✅ 创建 ${menuItems.length} 个菜单项`);

    // 7. 关联店铺和菜单项
    console.log('\n7. 关联店铺和菜单项...');
    const storeMenuItems = await Promise.all(
      menuItems.map(item => 
        prisma.storeMenuItems.create({
          data: {
            storeId: store.id,
            menuItemId: item.id,
            price: item.price,
            status: 'AVAILABLE',
            sortOrder: item.sortOrder
          }
        })
      )
    );
    console.log(`✅ 创建 ${storeMenuItems.length} 个店铺菜单关联`);

    // 8. 生成测试JWT Token
    console.log('\n8. 生成测试JWT Token...');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = 'qilin-development-jwt-secret-minimum-32-characters-here';
    
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: tenant.id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('\n🎉 测试数据创建完成！\n');

    // 输出测试信息
    console.log('📋 测试数据摘要:');
    console.log(`   租户ID: ${tenant.id}`);
    console.log(`   用户ID: ${user.id}`);
    console.log(`   店铺ID: ${store.id}`);
    console.log(`   店铺Slug: ${store.slug}`);
    console.log(`   餐桌编号: ${table.tableNumber}`);
    console.log(`   菜单项数量: ${menuItems.length}`);

    console.log('\n🔐 测试JWT Token:');
    console.log(token);

    console.log('\n🚀 测试命令:');
    console.log(`# 1. 测试租户列表 (需要认证):`);
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:33038/api/tenant/list`);
    
    console.log(`\n# 2. 测试店铺信息 (无需认证):`);
    console.log(`curl http://localhost:33038/api/public/stores/${store.slug}`);
    
    console.log(`\n# 3. 测试店铺菜单 (无需认证):`);
    console.log(`curl http://localhost:33038/api/public/stores/${store.slug}/menu`);
    
    console.log(`\n# 4. 测试餐桌信息 (无需认证):`);
    console.log(`curl http://localhost:33038/api/public/stores/${store.slug}/tables/${table.tableNumber}`);

  } catch (error) {
    console.error('\n❌ 创建测试数据失败:', error.message);
    if (error.code) console.error('错误代码:', error.code);
    if (error.meta) console.error('元数据:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();