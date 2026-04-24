#!/bin/bash
# 硬编码检查脚本
# 检测项目中所有硬编码的路径、API调用和token处理
# 使用: bash scripts/check-hardcoded.sh [--fix]

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/apps/frontend/src"

EXIT_CODE=0
SHOULD_FIX=false

if [ "$1" = "--fix" ]; then
  SHOULD_FIX=true
fi

echo "🔍 开始硬编码检查..."
echo ""

# 1. 检查硬编码的 navigate 路径
echo "=== 1. 检查 navigate('硬编码路径') ==="
HARDCODED_NAV=$(grep -rn "navigate(" "$SRC_DIR" --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules" \
  | grep -v "config/routes\|config/scan-routes" \
  | grep -E "navigate\s*\(\s*['\"/]" \
  || true)

if [ -n "$HARDCODED_NAV" ]; then
  echo "$HARDCODED_NAV"
  EXIT_CODE=1
else
  echo "  ✅ 没有发现硬编码的 navigate 路径"
fi
echo ""

# 2. 检查硬编码的 fetch API 调用
echo "=== 2. 检查 fetch('/api/...') 硬编码 API 路径 ==="
HARDCODED_FETCH=$(grep -rn "fetch(" "$SRC_DIR" --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules" \
  | grep -v "api-client.ts\|simple-auth.ts\|api-routes" \
  | grep -E "fetch\s*\(\s*['\"]\/api" \
  || true)

if [ -n "$HARDCODED_FETCH" ]; then
  echo "$HARDCODED_FETCH"
  EXIT_CODE=1
else
  echo "  ✅ 没有发现硬编码的 fetch API 调用"
fi
echo ""

# 3. 检查硬编码的 Authorization 头
echo "=== 3. 检查手动拼接 Authorization header ==="
HARDCODED_AUTH=$(grep -rn "Authorization" "$SRC_DIR" --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules" \
  | grep -v "api-client.ts\|simple-auth.ts" \
  || true)

if [ -n "$HARDCODED_AUTH" ]; then
  echo "$HARDCODED_AUTH"
  EXIT_CODE=1
else
  echo "  ✅ 没有发现手动拼接的 Authorization header"
fi
echo ""

# 4. 检查硬编码的 localStorage token 读取
echo "=== 4. 检查手动读取 token ==="
HARDCODED_TOKEN=$(grep -rn "localStorage.getItem.*token\|localStorage.getItem.*Token" "$SRC_DIR" --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules" \
  | grep -v "api-client.ts\|simple-auth.ts" \
  || true)

if [ -n "$HARDCODED_TOKEN" ]; then
  echo "$HARDCODED_TOKEN"
  EXIT_CODE=1
else
  echo "  ✅ 没有发现手动读取 token"
fi
echo ""

# 5. 检查 Link to 硬编码路径（不包含常量）
echo "=== 5. 检查 Link to='硬编码路径' ==="
HARDCODED_LINK=$(grep -rn "<Link to=" "$SRC_DIR" --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules" \
  | grep -v "config/routes\|config/scan-routes" \
  | grep -E "Link\s+to\s*=\s*['\"]" \
  || true)

if [ -n "$HARDCODED_LINK" ]; then
  echo "$HARDCODED_LINK"
  EXIT_CODE=1
else
  echo "  ✅ 没有发现硬编码的 Link to 路径"
fi
echo ""

# 6. 检查 Route path 硬编码
echo "=== 6. 检查 App.tsx 中 Route path 硬编码 ==="
HARDCODED_ROUTE=$(grep -n "path=" "$SRC_DIR/App.tsx" \
  | grep -v "path={" \
  | grep -v "path=\"\*\"" \
  || true)

if [ -n "$HARDCODED_ROUTE" ]; then
  echo "$HARDCODED_ROUTE"
  EXIT_CODE=1
else
  echo "  ✅ 没有发现硬编码的 Route path"
fi
echo ""

echo "=============================="
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ 所有硬编码检查通过！"
else
  echo "❌ 发现硬编码问题，请修复后重新运行"
fi
exit $EXIT_CODE
