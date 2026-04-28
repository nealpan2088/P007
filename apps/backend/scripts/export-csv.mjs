/**
 * 导出 CSV 格式的表格1（账号密码）和表格2（桌号+二维码）
 * 带 UTF-8 BOM 解决 Excel 乱码问题
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const BOM = '\uFEFF';
const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    where: { name: { startsWith: '快点餐' } },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { tenant: true },
  });
  stores.reverse();

  // 表格1：账号密码 CSV
  const csv1 = BOM + [
    '店铺名,店长端邮箱,密码,商家端邮箱,密码',
    ...stores.map(s => {
      const slug = s.slug.replace(/^iy3-m9l-can-/, '');
      return `快点餐-${s.name.replace('快点餐-', '')},sa_${slug}@qilin.demo,Demo@2026,demo_${slug}@qilin.demo,Demo@2026`;
    }),
  ].join('\r\n');
  fs.writeFileSync('/home/admin/projects/P007/qr-codes/表格1_账号密码.csv', csv1);
  console.log('✅ 表格1 CSV 已生成');

  // 表格2：桌号+二维码 CSV
  const rows = [];
  for (const store of stores) {
    const tables = await prisma.table.findMany({
      where: { storeId: store.id },
      orderBy: { tableNumber: 'asc' },
    });
    for (const table of tables) {
      rows.push(`${store.name},${table.tableNumber},https://s.openyun.xin/s/${table.shortCode}`);
    }
  }
  const csv2 = BOM + '店铺名,桌号,二维码\r\n' + rows.join('\r\n');
  fs.writeFileSync('/home/admin/projects/P007/qr-codes/表格2_桌号二维码.csv', csv2);
  console.log(`✅ 表格2 CSV 已生成 (${rows.length} 行)`);

  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
