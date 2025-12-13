#!/bin/bash

# macOS Apple Silicon 打包脚本
# 为有条工具 - Utilx 应用创建 macOS 应用包

set -e  # 遇到错误时退出

echo "🚀 开始 macOS Apple Silicon 应用打包..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查是否为 Apple Silicon
ARCH=$(uname -m)
if [ "$ARCH" != "arm64" ]; then
    echo "⚠️  警告: 当前不是 Apple Silicon (arm64) 架构，当前架构: $ARCH"
    echo "💡 建议在 Apple Silicon Mac 上运行此脚本以获得最佳性能"
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 设置变量
PROJECT_NAME="utilx"
APP_NAME="有条工具"
APP_VERSION="1.0.0"
OUTPUT_DIR="dist-macos"
BUNDLE_ID="cn.util.app"

echo "📋 打包配置:"
echo "   - 应用名称: $APP_NAME"
echo "   - 版本: $APP_VERSION"
echo "   - Bundle ID: $BUNDLE_ID"
echo "   - 架构: $ARCH"
echo ""

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"

# 生成静态文件 (如果需要)
if [ ! -d ".output/public" ]; then
    echo "📦 生成静态文件..."
    npm run generate
else
    echo "✅ 静态文件已存在，跳过生成"
fi

# Tauri 构建
echo "🏗️  开始 Tauri 构建..."
cd src-tauri

# 使用默认工具链构建（会自动适配当前架构）
echo "⚡ 构建应用..."
cargo tauri build

# 检查构建结果（自动检测架构和路径）
echo "🔍 检查构建结果..."
TARGET_DIR="target/$(rustc -vV | grep host | awk '{print $2}')/release/bundle/macos"
APP_BUNDLE="$TARGET_DIR/$APP_NAME.app"
DMG_FILE="$TARGET_DIR/$APP_NAME $APP_VERSION.dmg"

if [ ! -d "$APP_BUNDLE" ]; then
    echo "❌ 构建失败: 找不到应用包 $APP_BUNDLE"
    echo "🔍 可用的构建文件:"
    find target -name "*.app" -type d 2>/dev/null || echo "未找到 .app 文件"
    exit 1
fi

echo "✅ 应用构建成功!"

# 复制到输出目录
echo "📋 复制构建产物..."
cd ..
cp -R "src-tauri/$APP_BUNDLE" "$OUTPUT_DIR/"
if [ -f "src-tauri/$DMG_FILE" ]; then
    cp "src-tauri/$DMG_FILE" "$OUTPUT_DIR/"
else
    echo "⚠️  DMG 文件未找到，将手动创建"
    DMG_FILE=""
fi

# 创建自定义 DMG（如果Tauri没有自动生成）
DMG_NAME="$APP_NAME-$APP_VERSION-macOS-$ARCH"
DMG_PATH="$OUTPUT_DIR/$DMG_NAME.dmg"

if [ -z "$DMG_FILE" ] || [ ! -f "$DMG_FILE" ]; then
    echo "💿 创建自定义 DMG 安装包..."

    # 创建临时 DMG 目录
    DMG_TEMP_DIR="$OUTPUT_DIR/dmg-temp"
    mkdir -p "$DMG_TEMP_DIR"

    # 复制应用到临时目录
    cp -R "$OUTPUT_DIR/$APP_NAME.app" "$DMG_TEMP_DIR/"

    # 创建 Applications 文件夹链接
    ln -s /Applications "$DMG_TEMP_DIR/Applications"

    # 创建 DMG
    hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_TEMP_DIR" -ov -format UDZO "$DMG_PATH"

    # 清理临时目录
    rm -rf "$DMG_TEMP_DIR"
else
    echo "✅ 使用 Tauri 生成的 DMG"
    DMG_PATH="$OUTPUT_DIR/$(basename $DMG_FILE)"
fi

# 创建应用信息文件
echo "📄 创建应用信息..."
cat > "$OUTPUT_DIR/README.txt" << EOF
${APP_NAME} v${APP_VERSION}
====================

系统要求:
- macOS 10.13 或更高版本
- Apple Silicon (M1/M2/M3) Mac 推荐用于最佳性能

安装方法:
1. 双击 ${DMG_NAME}.dmg 文件
2. 将 ${APP_NAME}.app 拖拽到 Applications 文件夹
3. 从 Launchpad 或 Applications 文件夹启动应用

卸载方法:
1. 从 Applications 文件夹删除 ${APP_NAME}.app
2. 清理用户数据 (可选):
   ~/Library/Application\ Support/${PROJECT_NAME}
   ~/Library/Saved\ Application\ State/cn.util.app.savedState

技术信息:
- Bundle ID: ${BUNDLE_ID}
- 架构: ${ARCH}
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
echo "🎉 打包完成!"
echo ""
echo "📦 输出文件:"
echo "   - 应用包: $OUTPUT_DIR/$APP_NAME.app"
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
echo "✨ 恭喜! $APP_NAME 已准备就绪!"