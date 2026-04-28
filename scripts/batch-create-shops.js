/**
 * 批量创建演示店铺脚本
 * 创建快点餐-1 到 快点餐-6 共5个店铺
 * 输出表格1（账号密码）和表格2（桌号+二维码）
 */

import { PrismaClient } from '@prisma/client';
import DemoShopService from '../apps/backend/src/services/demo-shop.service.js';

const prisma = new PrismaClient();
const service = new DemoShopService();

async function main() {
  // 获取一个超管用户作为创建者
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
  });
  if (!admin) {
    console.error('未找到超管用户');
    process.exit(1);
  }

  const results = [];

  for (let i = 1; i <= 6; i++) {
    const shopName = `快点餐-${i}`;
    console.log(`\n=== 创建 ${shopName} ===`);
    
    try {
      const result = await service.createDemoShop({
        shopName,
        contactPhone: '',
        adminUserId: admin.id,
        tableCount: 10,
        keyword: '',
      });

      const data = result.data || result;
      results.push(data);
      console.log(`✅ ${shopName} 创建成功`);
    } catch (err) {
      console.error(`❌ ${shopName} 创建失败:`, err.message);
    }
  }

  // 输出表格1：账号密码
  console.log('\n\n========== 表格1：账号密码 ==========');
  console.log('店铺名\t邮箱\t密码');
  for (const r of results) {
    console.log(`${r.shopName}\t${r.email}\t${r.password}`);
  }

  // 输出表格2：桌号+二维码
  console.log('\n\n========== 表格2：桌号+二维码 ==========');
  console.log('店铺名\t桌号\t二维码链接');
  
  for (const r of results) {
    // 获取该店铺的桌子
    const tables = await prisma.table.findMany({
      where: { storeId: r.storeId },
      orderBy: { tableNumber: 'asc' },
    });
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: r.tenantId },
    });
    const store = await prisma.store.findUnique({
      where: { id: r.storeId },
    });

    for (const table of tables) {
      const qrUrl = `https://saas.openyun.xin/t/${tenant.subdomain}/s/${store.slug}/scan/${table.tableNumber}`;
      console.log(`${r.shopName}\t${table.tableNumber}\t${qrUrl}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});
