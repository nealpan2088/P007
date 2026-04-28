#!/bin/bash
# 批量生成二维码图片
# 用法: ./generate-qr-codes.sh

OUTPUT_DIR="/home/admin/projects/P007/qr-codes"
mkdir -p "$OUTPUT_DIR"

# 每个短链数据: 店名,桌号,短链
declare -A TABLES

# 从数据库获取最新6个快点餐店铺的短链
cd /home/admin/projects/P007/apps/backend
node --input-type=module -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const stores = await prisma.store.findMany({
  where: { name: { startsWith: '快点餐' } },
  orderBy: { createdAt: 'desc' },
  take: 6,
});
for (const store of stores.reverse()) {
  const tables = await prisma.table.findMany({
    where: { storeId: store.id },
    orderBy: { tableNumber: 'asc' },
  });
  for (const t of tables) {
    console.log(\`\${store.name}|\${t.tableNumber}|\${t.shortCode}\`);
  }
}
await prisma.\$disconnect();
" 2>/dev/null > /tmp/shop-tables.txt

echo "数据已导出到 /tmp/shop-tables.txt"
cat /tmp/shop-tables.txt
