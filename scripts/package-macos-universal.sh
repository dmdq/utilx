#!/bin/bash

# macOS Universal App 打包脚本
# 创建支持 Intel 和 Apple Silicon 的通用应用

set -e

echo "🚀 开始 macOS Universal 应用打包..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 设置变量
PROJECT_NAME="utilx"
APP_NAME="有条工具"
APP_VERSION="1.0.0"
OUTPUT_DIR="dist-macos-universal"
BUNDLE_ID="cn.util.app"

echo "📋 Universal 打包配置:"
echo "   - 应用名称: $APP_NAME"
echo "   - 版本: $APP_VERSION"
echo "   - Bundle ID: $BUNDLE_ID"
echo "   - 目标架构: Intel + Apple Silicon"
echo ""

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"

# 生成静态文件
if [ ! -d ".output/public" ]; then
    echo "📦 生成静态文件..."
    npm run generate
else
    echo "✅ 静态文件已存在，跳过生成"
fi

# 设置 Rust 目标
echo "🔧 设置 Rust 目标架构..."
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin

# Tauri 构建
echo "🏗️  开始 Tauri 构建..."
cd src-tauri

# 构建 Apple Silicon 版本
echo "⚡ 构建 Apple Silicon (aarch64) 版本..."
cargo tauri build --target aarch64-apple-darwin

# 构建 Intel 版本
echo "⚡ 构建 Intel (x86_64) 版本..."
cargo tauri build --target x86_64-apple-darwin

# 检查构建结果
ARM_APP="target/aarch64-apple-darwin/release/bundle/macos/$APP_NAME.app"
X64_APP="target/x86_64-apple-darwin/release/bundle/macos/$APP_NAME.app"

if [ ! -d "$ARM_APP" ] || [ ! -d "$X64_APP" ]; then
    echo "❌ 构建失败: 找不到应用包"
    exit 1
fi

echo "✅ 两个架构构建成功!"

# 创建 Universal 应用
echo "🔗 创建 Universal 应用..."
UNIVERSAL_APP="$OUTPUT_DIR/$APP_NAME.app"
cp -R "$ARM_APP" "$UNIVERSAL_APP"

# 合并二进制文件
ARM_BINARY="$ARM_APP/Contents/MacOS/$APP_NAME"
X64_BINARY="$X64_APP/Contents/MacOS/$APP_NAME"
UNIVERSAL_BINARY="$UNIVERSAL_APP/Contents/MacOS/$APP_NAME"

echo "🔧 合并二进制文件..."
lipo -create "$ARM_BINARY" "$X64_BINARY" -output "$UNIVERSAL_BINARY"

# 更新 Info.plist 以支持通用架构
echo "📝 更新应用信息..."
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable $APP_NAME" "$UNIVERSAL_APP/Contents/Info.plist"

# 创建 DMG
echo "💿 创建 Universal DMG 安装包..."
DMG_NAME="$APP_NAME-$APP_VERSION-macOS-Universal"
DMG_PATH="$OUTPUT_DIR/$DMG_NAME.dmg"

# 创建临时 DMG 目录
DMG_TEMP_DIR="$OUTPUT_DIR/dmg-temp"
mkdir -p "$DMG_TEMP_DIR"

# 复制应用到临时目录
cp -R "$UNIVERSAL_APP" "$DMG_TEMP_DIR/"

# 创建 Applications 文件夹链接
ln -s /Applications "$DMG_TEMP_DIR/Applications"

# 创建 DMG
hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_TEMP_DIR" -ov -format UDZO "$DMG_PATH"

# 清理临时目录
rm -rf "$DMG_TEMP_DIR"

# 创建应用信息文件
echo "📄 创建应用信息..."
cat > "$OUTPUT_DIR/README.txt" << EOF
${APP_NAME} v${APP_VERSION} (Universal)
====================

系统要求:
- macOS 10.13 或更高版本
- 支持 Intel 和 Apple Silicon (M1/M2/M3) Mac

安装方法:
1. 双击 ${DMG_NAME}.dmg 文件
2. 将 ${APP_NAME}.app 拖拽到 Applications 文件夹
3. 从 Launchpad 或 Applications 文件夹启动应用

架构信息:
此应用为 Universal App，自动适配以下架构:
- Intel (x86_64) Mac
- Apple Silicon (M1/M2/M3) Mac

卸载方法:
1. 从 Applications 文件夹删除 ${APP_NAME}.app
2. 清理用户数据 (可选):
   ~/Library/Application\ Support/${PROJECT_NAME}
   ~/Library/Saved\ Application\ State/cn.util.app.savedState

技术信息:
- Bundle ID: ${BUNDLE_ID}
- 架构: Universal (Intel + Apple Silicon)
- 构建时间: $(date)

更多信息请访问: https://util.cn
EOF

# 生成校验和
echo "🔐 生成文件校验和..."
cd "$OUTPUT_DIR"
shasum -a 256 "$APP_NAME.app"/* > "checksums.txt" 2>/dev/null || true
shasum -a 256 "$DMG_NAME.dmg" >> "checksums.txt"
shasum -a 256 "README.txt" >> "checksums.txt"
cd ..

# 显示结果
echo ""
echo "🎉 Universal 打包完成!"
echo ""
echo "📦 输出文件:"
echo "   - Universal App: $OUTPUT_DIR/$APP_NAME.app"
echo "   - DMG 安装包: $DMG_PATH"
echo "   - 说明文档: $OUTPUT_DIR/README.txt"
echo "   - 校验和文件: $OUTPUT_DIR/checksums.txt"
echo ""
echo "📊 文件大小:"
if [ -f "$DMG_PATH" ]; then
    DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)
    echo "   - DMG: $DMG_SIZE"
fi
if [ -d "$OUTPUT_DIR/$APP_NAME.app" ]; then
    APP_SIZE=$(du -h "$OUTPUT_DIR/$APP_NAME.app" | cut -f1)
    echo "   - App: $APP_SIZE"
fi
echo ""
echo "💡 安装提示:"
echo "   1. 双击 $DMG_NAME.dmg 文件"
echo "   2. 将 $APP_NAME.app 拖拽到 Applications 文件夹"
echo "   3. 在 Finder 中右键点击应用并选择"打开"以避免安全限制"
echo ""
echo "✨ 恭喜! Universal $APP_NAME 已准备就绪!"