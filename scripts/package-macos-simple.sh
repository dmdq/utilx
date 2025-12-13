#!/bin/bash

# macOS 简化打包脚本 - 仅使用 Tauri 自带功能
echo "🚀 开始 macOS 应用打包..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 设置文件句柄限制
ulimit -n 65536

# 生成静态文件
if [ ! -d ".output/public" ]; then
    echo "📦 生成静态文件..."
    npm run generate
fi

# Tauri 构建
echo "🏗️  开始 Tauri 构建..."
cd src-tauri
cargo tauri build

# 找到构建结果（自动检测架构和路径）
echo "🔍 检查构建结果..."
TARGET_DIR="target/$(rustc -vV | grep host | awk '{print $2}')/release/bundle/macos"
APP_BUNDLE="$TARGET_DIR/有条工具.app"
DMG_FILE="$TARGET_DIR/有条工具 1.0.0.dmg"

echo "✅ 构建完成!"
echo "📦 输出文件位置:"
echo "   - App: $APP_BUNDLE"
if [ -f "$DMG_FILE" ]; then
    echo "   - DMG: $DMG_FILE"
else
    echo "   - DMG: 未找到 DMG 文件"
fi