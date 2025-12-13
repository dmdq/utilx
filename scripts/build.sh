#!/bin/bash

echo "🚀 开始构建应用..."

# 清理之前的构建
echo "🧹 清理旧的构建文件..."
rm -rf src-tauri/target/release/bundle

# 设置环境变量以优化构建
export RUSTFLAGS="-C target-cpu=native"
export MACOSX_DEPLOYMENT_TARGET=10.13

# 首先编译前端
echo "📦 编译前端..."
npm run generate

# 进入 Rust 项目目录
cd src-tauri

# 构建 Rust 应用
echo "🔨 构建 Rust 应用..."
cargo build --release

# 手动创建 DMG（绕过有问题的 bundle_dmg.sh）
echo "📀 创建 DMG..."

# 创建临时目录
mkdir -p ../dist/dmg
mkdir -p ../dist/Utilx.app

# 复制应用内容
cp -r target/release/bundle/macos/Utilx.app ../dist/

# 创建 DMG
hdiutil create -volname "有条工具" -srcfolder ../dist/Utilx.app -ov -format UDZO ../dist/Utilx-1.0.0.dmg

echo "✅ 构建完成！DMG 文件位置: ../dist/Utilx-1.0.0.dmg"