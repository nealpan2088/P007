/**
 * 批量创建演示店铺
 */
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const demoShopService = (await import(path.join(__dirname, '../src/services/demo-shop.service.js'))).default;
const prisma = new PrismaClient();

async function main() {
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
    console.log(`=== 创建 ${shopName} ===`);
    
    try {
      const result = await demoShopService.createDemoShop({
        shopName,
        contactPhone: '',
        adminUserId: admin.id,
        tableCount: 10,
        keyword: '',
      });
      const data = result.data || result;
      results.push(data);
      console.log(`✅ ${shopName}`);
    } catch (err) {
      console.error(`❌ ${shopName}:`, err.message);
    }
  }

  // ====== 表格1：账号密码 ======
  console.log('\n\n========== 表格1：账号密码 ==========');
  console.log('店铺名\t店长端邮箱\t密码\t商家端邮箱\t密码');
  for (const r of results) {
    console.log(`${r.shopName}\t${r.storeAdminEmail}\t${r.storeAdminPassword}\t${r.ownerEmail}\t${r.ownerPassword}`);
  }

  // ====== 表格2：桌号+二维码（短链） ======
  console.log('\n\n========== 表格2：桌号+二维码（短链） ==========');
  console.log('店铺名\t桌号\t二维码');
  
  for (const r of results) {
    const tables = await prisma.table.findMany({
      where: { storeId: r.storeId },
      orderBy: { tableNumber: 'asc' },
    });

    for (const table of tables) {
      const qrShortUrl = `https://s.openyun.xin/s/${table.shortCode}`;
      console.log(`${r.shopName}\t${table.tableNumber}\t${qrShortUrl}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});
