#!/bin/bash

# 简单构建脚本 - 不预渲染，避免内存溢出

echo "🚀 开始简单构建（无预渲染）..."

# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=$(node "$(dirname "$0")/heap-size.cjs" 2>/dev/null || echo 4096)"

# 清理之前的构建
echo "📦 清理旧文件..."
rm -rf .nuxt
rm -rf .output
rm -rf dist

# 运行构建（不预渲染）
echo "🔨 开始构建（SSR 模式）..."
NODE_OPTIONS="--max-old-space-size=$(node "$(dirname "$0")/heap-size.cjs" 2>/dev/null || echo 4096)" nuxt build

echo "✅ 构建完成！"
echo "💡 提示：运行 'npm start' 启动服务器"