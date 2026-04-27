/**
 * 为已有餐桌补充分配 shortCode
 * 使用方式：node scripts/backfill-short-codes.js
 */
const { PrismaClient } = require('@prisma/client');

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateShortCode() {
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return result;
}

async function main() {
  const prisma = new PrismaClient();
  const existing = new Set();

  // 加载已有短码
  const tables = await prisma.table.findMany({ select: { id: true, shortCode: true } });
  const missing = tables.filter(t => !t.shortCode);
  const codesInUse = new Set(tables.map(t => t.shortCode).filter(Boolean));

  console.log(`总餐桌数: ${tables.length}`);
  console.log(`已有短码: ${tables.length - missing.length}`);
  console.log(`需要补充: ${missing.length}`);

  for (const table of missing) {
    let code;
    let tries = 0;
    do {
      code = generateShortCode();
      tries++;
      if (tries > 20) throw new Error('重试次数过多，短码池可能耗尽');
    } while (codesInUse.has(code));

    codesInUse.add(code);
    await prisma.table.update({
      where: { id: table.id },
      data: { shortCode: code },
    });
    console.log(`  ✅ ${table.id.slice(0, 8)}... → ${code}`);
  }

  console.log(`\n✅ 完成！共补充 ${missing.length} 个短码`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('失败:', e);
  process.exit(1);
});
