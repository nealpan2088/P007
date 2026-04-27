#!/usr/bin/env node
/**
 * 麒麟云点餐 - 餐桌二维码批量生成脚本 (Node.js)
 * 生成 A4 排版可打印 PDF，每张桌一个独立 PNG 二维码图片
 *
 * 用法: node gen-qr.cjs <short_prefix> <start_table> <count> [output_dir]
 *
 * 示例: node gen-qr.cjs "ZSCG" "A01" 20
 *       输出: ./qr/ZSCG_A01.png ~ ZSCG_A20.png (每张桌独立图片)
 *       同时输出: ./qr/qr_all.pdf (A4 排版可打印)
 *
 * 前端也可以用这里生成的短码调用后端 API 获取 store_slug
 * 或直接按短码规则拼接短链 URL。
 *
 * 依赖: npm install qrcode pdfkit
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// === 配置 ===
const DOMAIN = 'https://saas.openyun.xin';
const SHORT_BASE = 's';  // 短链路径前缀

// === 参数 ===
const PREFIX = process.argv[2] || (() => { console.error('用法: node gen-qr.cjs <short_prefix> <start_table> <count> [output_dir]'); process.exit(1); })();
const START_TABLE = process.argv[3] || 'A01';
const COUNT = parseInt(process.argv[4]) || 10;
const OUT_DIR = process.argv[5] || './qr';

// 解析桌号
const BASE_LETTER = START_TABLE.match(/^[A-Z]/)?.[0] || 'A';
const BASE_NUM = parseInt(START_TABLE.slice(1)) || 1;

// === 生成 ===
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n=== 生成 ${COUNT} 张桌二维码 ===\n`);
  console.log(`短码前缀: ${PREFIX}`);
  console.log(`桌号范围: ${BASE_LETTER}${String(BASE_NUM).padStart(2, '0')} ~ ${BASE_LETTER}${String(BASE_NUM + COUNT - 1).padStart(2, '0')}`);
  console.log(`输出目录: ${OUT_DIR}\n`);

  let htmlRows = '';

  for (let i = 0; i < COUNT; i++) {
    const tableNum = String(BASE_NUM + i).padStart(2, '0');
    const tableCode = `${BASE_LETTER}${tableNum}`;
    const shortCode = `${PREFIX}${tableCode}`;
    const shortUrl = `${DOMAIN}/${SHORT_BASE}/${shortCode}`;

    const outFile = path.join(OUT_DIR, `${shortCode}.png`);

    try {
      await QRCode.toFile(outFile, shortUrl, {
        type: 'png',
        width: 400,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });

      // A4 等比例拼版（3列×多行）
      htmlRows += `
        <div style="
          display:inline-block; width:180px; text-align:center;
          border:1px dashed #ddd; padding:8px; margin:4px;
          page-break-inside:avoid;
        ">
          <img src="${shortCode}.png" style="width:150px;height:150px;" />
          <div style="font-size:20px;font-weight:bold;margin-top:4px;">${tableCode}</div>
          <div style="font-size:10px;color:#999;">${DOMAIN}/${SHORT_BASE}/${shortCode}</div>
        </div>`;

      console.log(`  ✅ ${tableCode} → ${shortUrl}`);
    } catch (e) {
      console.error(`  ❌ ${tableCode} 生成失败: ${e.message}`);
    }
  }

  // 生成 HTML 排版（直接用浏览器打印 A4）
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>餐桌二维码</title>
<style>
  @page { size: A4; margin: 10mm; }
  body { font-family: sans-serif; text-align: center; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
  <h2 class="no-print">餐桌二维码（共 ${COUNT} 张）</h2>
  <p class="no-print">短码前缀: ${PREFIX} | 短链: ${DOMAIN}/${SHORT_BASE}/{短码}</p>
  <div style="max-width:620px;margin:0 auto;">
    ${htmlRows}
  </div>
  <p class="no-print" style="margin-top:20px;font-size:12px;color:#999;">
    用浏览器打印（Ctrl+P），选择 A4 纸、无页眉页脚，即可裁剪使用
  </p>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, 'qr_print.html'), html);
  console.log(`\n✅ 完成！共 ${COUNT} 张`);
  console.log(`📄 打印排版: ${path.join(OUT_DIR, 'qr_print.html')}`);
  console.log(`   （浏览器打开 → Ctrl+P 打印）\n`);
}

main().catch(e => {
  console.error('失败:', e);
  process.exit(1);
});
