#!/bin/bash
# 麒麟云点餐 - 餐桌二维码批量生成脚本
# 用法: ./gen-qr.sh <店铺slug> <短码前缀> <起始桌号> <桌数> [域名] [输出目录]
#
# 示例: ./gen-qr.sh "zhang-san-chuan-cai-guan" "ZSCG" "A01" 20
#       输出: ./qr_zhang-san-chuan-cai-guan/A01.png ～ A20.png
#
# 依赖: Python3 + qrcode + Pillow
# 安装: pip3 install qrcode[pil]

set -euo pipefail

# === 参数 ===
STORE_SLUG="${1:?错误: 请指定店铺 slug}"
SHORT_PREFIX="${2:-}"        # 短码前缀（不指定则用 slug 前4位）
START_TABLE="${3:-A01}"      # 起始桌号
TABLE_COUNT="${4:-10}"       # 桌数
DOMAIN="${5:-https://saas.openyun.xin}"
OUT_DIR="${6:-qr_${STORE_SLUG}}"

# === 检测依赖 ===
if ! command -v python3 &>/dev/null; then
  echo "❌ 需要 Python3"
  exit 1
fi

python3 -c "import qrcode" 2>/dev/null || {
  echo "❌ 缺少 qrcode 库，请运行: pip3 install qrcode[pil]"
  exit 1
}

# === 准备 ===
mkdir -p "$OUT_DIR"

# 解析桌号
BASE_NUM=${START_TABLE:1}  # 去掉前缀字母
PREFIX_CHAR=${START_TABLE:0:1}
BASE_NUM=${BASE_NUM##0}    # 去掉前导0

# === 生成二维码 ===
echo "=== 生成二维码 ==="
echo "店铺: $STORE_SLUG"
echo "目录: $OUT_DIR"
echo "桌号: $START_TABLE ~ ${PREFIX_CHAR}$(printf '%02d' $((BASE_NUM + TABLE_COUNT - 1)))"
echo ""

for i in $(seq 0 $((TABLE_COUNT - 1))); do
  TABLE_NUM=$(printf '%02d' $((BASE_NUM + i)))
  TABLE_CODE="${PREFIX_CHAR}${TABLE_NUM}"
  SHORT_CODE="${SHORT_PREFIX}${TABLE_CODE}"

  # 短链 URL
  SHORT_URL="${DOMAIN}/s/${SHORT_CODE}"

  # 输出文件名
  OUTFILE="${OUT_DIR}/${TABLE_CODE}.png"

  python3 -c "
import qrcode
from PIL import Image, ImageDraw, ImageFont
import io

url = '$SHORT_URL'
shop = '$STORE_SLUG'
table = '$TABLE_CODE'
out = '$OUTFILE'

# 生成二维码
qr = qrcode.QRCode(box_size=8, border=2)
qr.add_data(url)
qr.make(fit=True)
qr_img = qr.make_image(fill_color='black', back_color='white').convert('RGB')

# 画布尺寸：二维码 200x200 + 留白
QR_SIZE = 400
PADDING = 10
TEXT_HEIGHT = 100
W = QR_SIZE + PADDING * 2
H = QR_SIZE + PADDING * 2 + TEXT_HEIGHT

canvas = Image.new('RGB', (W, H), 'white')
draw = ImageDraw.Draw(canvas)

# 贴二维码
resized_qr = qr_img.resize((QR_SIZE, QR_SIZE), Image.NEAREST)
canvas.paste(resized_qr, (PADDING, PADDING))

# 文字：桌号（大号）+ 店铺名（小号）
try:
    font_big = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', 36)
    font_small = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', 18)
except:
    font_big = ImageFont.load_default()
    font_small = ImageFont.load_default()

# 桌号居中
table_bbox = draw.textbbox((0, 0), table, font=font_big)
table_w = table_bbox[2] - table_bbox[0]
draw.text(((W - table_w) // 2, QR_SIZE + PADDING + 5), table, fill='black', font=font_big)

# 店铺名居中
shop_bbox = draw.textbbox((0, 0), shop, font=font_small)
shop_w = shop_bbox[2] - shop_bbox[0]
draw.text(((W - shop_w) // 2, QR_SIZE + PADDING + 50), shop, fill='#666', font=font_small)

canvas.save(out)
print(f'  ✅ {TABLE_CODE} → {SHORT_URL}')
" || echo "  ❌ $TABLE_CODE 生成失败"
done

echo ""
echo "=== 完成！==="
echo "输出目录: $(realpath "$OUT_DIR")"
echo "示例文件: ${OUT_DIR}/${START_TABLE}.png"
