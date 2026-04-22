#!/bin/bash

# 麒麟项目 - TypeScript类型检查脚本
# 用于在提交前自动检查类型错误

set -e

echo "🔍 开始TypeScript类型检查..."
echo "================================"

# 检查TypeScript配置
echo "1. 检查TypeScript配置..."
if [ ! -f "tsconfig.dev.json" ]; then
    echo "❌ 错误: tsconfig.dev.json 文件不存在"
    exit 1
fi

# 运行TypeScript检查
echo "2. 运行TypeScript类型检查..."
npx tsc --noEmit --project tsconfig.dev.json

if [ $? -eq 0 ]; then
    echo "✅ TypeScript类型检查通过！"
    echo ""
    echo "📊 检查统计:"
    echo "  - 配置文件: tsconfig.dev.json"
    echo "  - 检查模式: 严格模式"
    echo "  - 错误数量: 0"
else
    echo "❌ TypeScript类型检查失败！"
    echo ""
    echo "💡 修复建议:"
    echo "  1. 运行 'npm run lint' 修复代码风格问题"
    echo "  2. 检查类型定义文件是否正确导入"
    echo "  3. 确保所有API响应类型匹配"
    echo "  4. 修复未使用的导入和变量"
    exit 1
fi

echo ""
echo "🎉 TypeScript检查完成！代码类型安全。"