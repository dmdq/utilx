#!/bin/bash

echo "🧹 优化项目缓存和依赖..."

# 清理Nuxt缓存
echo "清理 Nuxt 缓存..."
rm -rf .nuxt
rm -rf .output
rm -rf dist
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# 清理Tauri缓存
echo "清理 Tauri 缓存..."
cd src-tauri
cargo clean 2>/dev/null || true
rm -rf target/debug
rm -rf target/release
cd ..

# 清理npm缓存
echo "清理 npm 缓存..."
npm cache clean --force

# 清理临时文件
echo "清理临时文件..."
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete

# 重新安装依赖（使用更快的选项）
echo "重新安装依赖..."
npm ci --prefer-offline --no-audit --no-fund

# 预构建依赖
echo "预构建 Vite 依赖..."
npm run build 2>/dev/null || echo "构建失败，将在开发时构建"

echo "✅ 缓存优化完成！"
echo ""
echo "💡 使用方法："
echo "  npm run dev:ultra  - 超快速开发模式"
echo "  npm run dev:fast  - 快速开发模式"
echo "  npm run dev:config - 使用开发配置"
echo "  npm run dev:watch - 监听模式"