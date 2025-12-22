#!/bin/bash

echo "🚀 运行工具页面检查脚本"
echo "=========================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 设置默认URL（可以通过参数覆盖）
BASE_URL=${1:-"http://localhost:3000/tools/"}

echo "🌐 检查URL: $BASE_URL"
echo ""

# 运行检查脚本
echo "📋 运行简化版检查脚本..."
node test-tools-simple.js "$BASE_URL"

echo ""
echo "✅ 检查完成！"
echo ""
echo "📁 生成的文件:"
echo "- tools-check-report-*.md (Markdown格式报告)"
echo "- tools-check-*.json (JSON格式数据)"
echo ""
echo "💡 提示: 使用其他URL请运行: ./run-test.sh https://your-domain.com/tools/"