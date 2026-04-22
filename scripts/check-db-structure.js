// 检查数据库结构
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库结构...');
    
    // 1. 检查tenants表
    console.log('\n📋 tenants表结构:');
    const tenantColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `;
    
    console.table(tenantColumns);
    
    // 2. 检查现有数据
    console.log('\n📊 现有租户数据:');
    const tenants = await prisma.$queryRaw`
      SELECT id, name, slug, subdomain, display_name, status
      FROM tenants 
      WHERE deleted_at IS NULL
      LIMIT 5
    `;
    
    console.table(tenants);
    
    // 3. 检查stores表
    console.log('\n📋 stores表结构:');
    const storeColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `;
    
    console.table(storeColumns);
    
    // 4. 现有店铺数据
    console.log('\n📊 现有店铺数据:');
    const stores = await prisma.$queryRaw`
      SELECT id, tenant_id, name, slug, display_name, status
      FROM stores 
      WHERE deleted_at IS NULL
      LIMIT 5
    `;
    
    console.table(stores);
    
    console.log('\n✅ 数据库检查完成');
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();