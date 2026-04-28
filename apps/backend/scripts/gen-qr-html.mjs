/**
 * 生成带二维码图片的 HTML 页面
 * 包含表格1（账号密码）和表格2（店名+桌号+二维码图片+短链）
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const OUT_DIR = '/home/admin/projects/P007/qr-codes';

async function main() {
  // 获取快点餐店铺（取最近创建的6个）
  const stores = await prisma.store.findMany({
    where: { name: { startsWith: '快点餐' } },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      tenant: true,
    },
  });
  stores.reverse(); // 按名称升序

  // 获取每个店的桌子和店长用户
  const shopData = [];
  for (const store of stores) {
    const tables = await prisma.table.findMany({
      where: { storeId: store.id },
      orderBy: { tableNumber: 'asc' },
    });
    const storeAdmin = await prisma.user.findFirst({
      where: {
        storeAssignments: { some: { storeId: store.id } },
        role: 'STORE_ADMIN',
      },
    });
    shopData.push({ store, tables, storeAdmin });
  }

  // 生成 HTML
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>快点餐店铺二维码汇总</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, 'PingFang SC', sans-serif; background: #f5f5f5; padding: 20px; }
h1 { text-align: center; color: #333; margin-bottom: 30px; font-size: 24px; }
.shop-section { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.shop-title { font-size: 18px; font-weight: 700; color: #e67e22; margin-bottom: 12px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; }
.account-info { font-size: 13px; color: #666; margin-bottom: 16px; line-height: 1.8; }
.account-info span { color: #333; font-weight: 600; }
.qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.qr-item { text-align: center; padding: 10px; border: 1px solid #eee; border-radius: 8px; background: #fafafa; }
.qr-item img { width: 140px; height: 140px; display: block; margin: 0 auto; }
.qr-item .table-name { font-size: 14px; font-weight: 600; color: #333; margin-top: 6px; }
.qr-item .shop-name { font-size: 11px; color: #999; margin-top: 2px; }
.qr-item .short-link { font-size: 11px; color: #007bff; margin-top: 2px; word-break: break-all; }
</style>
</head>
<body>
<h1>📋 快点餐店铺二维码汇总</h1>`;

  // 表格1
  html += `<div class="shop-section" style="overflow-x:auto;">
<h2 style="font-size:16px;margin-bottom:12px;">🔑 表格1：账号密码</h2>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<tr style="background:#f0f0f0;"><th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">店铺名</th>
<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">店长端邮箱</th>
<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">密码</th>
<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">商家端邮箱</th>
<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">密码</th></tr>`;

  for (const s of shopData) {
    html += `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600;">${s.store.name}</td>
<td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.storeAdmin?.email || '-'}</td>
<td style="padding:6px 10px;border-bottom:1px solid #eee;">Demo@2026</td>
<td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.store.tenant?.id ? 'demo_*@qilin.demo' : '-'}</td>
<td style="padding:6px 10px;border-bottom:1px solid #eee;">Demo@2026</td></tr>`;
  }

  html += `</table></div>`;

  // 表格2：每个店生成二维码
  for (const s of shopData) {
    html += `<div class="shop-section">
<div class="shop-title">🏪 ${s.store.name}</div>
<div class="account-info">店长端：<span>${s.storeAdmin?.email || '-'}</span> / <span>Demo@2026</span></div>
<div class="qr-grid">`;

    for (const table of s.tables) {
      const shortUrl = `https://s.openyun.xin/s/${table.shortCode}`;
      const qrFile = `qr_${s.store.name}_${table.tableNumber}.png`;
      const qrPath = path.join(OUT_DIR, qrFile);

      // 生成二维码图片
      try {
        execSync(`qrencode -o "${qrPath}" -s 8 -m 2 "${shortUrl}"`, { timeout: 3000 });
      } catch (e) {
        console.error(`QR生成失败 ${shortUrl}:`, e.message);
      }

      html += `<div class="qr-item">
<img src="../qr-codes/${qrFile}" alt="二维码" />
<div class="table-name">${table.tableNumber}</div>
<div class="shop-name">${s.store.name}</div>
<div class="short-link">${shortUrl}</div>
</div>`;
    }

    html += `</div></div>`;
  }

  html += `</body></html>`;

  fs.writeFileSync('/home/admin/projects/P007/qr-codes/index.html', html);
  console.log('✅ 已生成: qr-codes/index.html');
  console.log(`📊 店铺: ${shopData.length} 个`);
  console.log(`📋 二维码: ${shopData.reduce((a, s) => a + s.tables.length, 0)} 个`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('失败:', err);
  process.exit(1);
});
