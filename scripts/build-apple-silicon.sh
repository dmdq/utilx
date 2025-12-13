#!/bin/bash

# Apple Silicon macOS 应用打包脚本
# 支持 Apple Silicon (arm64) 和 Intel (x86_64) 通用二进制

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="Util"
BUNDLE_ID="cn.util.app"
VERSION="1.0.0"
MIN_MACOS_VERSION="11.0"  # Apple Silicon 最低支持版本

# 构建目标
TARGETS=("aarch64-apple-darwin" "x86_64-apple-darwin")
UNIVERSAL_TARGET="universal-apple-darwin"

# 路径配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_TAURI_DIR="${PROJECT_ROOT}/src-tauri"
DIST_DIR="${PROJECT_ROOT}/dist"
ARTIFACTS_DIR="${SRC_TAURI_DIR}/target/release/bundle"

echo -e "${BLUE}🚀 开始 Apple Silicon macOS 应用打包...${NC}"
echo "项目根目录: ${PROJECT_ROOT}"
echo "Tauri 源码目录: ${SRC_TAURI_DIR}"

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}📦 检查依赖...${NC}"

    # 检查 Rust
    if ! command -v cargo &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 Rust/Cargo，请先安装 Rust${NC}"
        exit 1
    fi

    # 检查 rustup targets
    echo "检查 Rust 目标平台..."
    for target in "${TARGETS[@]}"; do
        if ! rustup target list --installed | grep -q "$target"; then
            echo "安装目标平台: $target"
            rustup target add "$target"
        fi
    done

    # 检查 Node.js (如果需要前端构建)
    if [ ! -d "${PROJECT_ROOT}/.output/public" ] && ! command -v npm &> /dev/null && ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}⚠️ 警告: 未找到 Node.js，如果前端需要构建请安装 Node.js${NC}"
    fi

    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 清理旧的构建文件
clean_build() {
    echo -e "${BLUE}🧹 清理旧的构建文件...${NC}"

    cd "${SRC_TAURI_DIR}"

    # 清理 Cargo 构建缓存
    cargo clean

    # 删除旧的分发目录
    if [ -d "$DIST_DIR" ]; then
        rm -rf "$DIST_DIR"
    fi

    # 创建分发目录
    mkdir -p "$DIST_DIR"

    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 构建前端（如果需要）
build_frontend() {
    echo -e "${BLUE}🎨 构建前端...${NC}"

    cd "${PROJECT_ROOT}"

    # 检查是否已有构建输出
    if [ -d ".output/public" ]; then
        echo -e "${YELLOW}⚠️ 发现已构建的前端文件，跳过构建${NC}"
        return 0
    fi

    # 使用 pnpm 或 npm 构建
    if command -v pnpm &> /dev/null; then
        echo "使用 pnpm 构建..."
        pnpm run generate
    elif command -v npm &> /dev/null; then
        echo "使用 npm 构建..."
        npm run generate
    else
        echo -e "${YELLOW}⚠️ 未找到包管理器，跳过前端构建${NC}"
    fi
}

# 构建 Tauri 应用
build_tauri() {
    echo -e "${BLUE}🔨 构建 Tauri 应用...${NC}"

    cd "${SRC_TAURI_DIR}"

    # 设置环境变量
    export TAURI_BUNDLE_IDENTIFIER="${BUNDLE_ID}"
    export TAURI_PRIVATE_KEY="${PRIVATE_KEY:-}"
    export TAURI_KEY_PASSWORD="${KEY_PASSWORD:-}"

    # 构建通用二进制
    echo "构建通用二进制 (Universal Binary)..."

    # 先构建 arm64 版本
    echo "构建 Apple Silicon (arm64) 版本..."
    TAURI_TARGET_ARCH="aarch64-apple-darwin" \
    cargo tauri build --target aarch64-apple-darwin

    # 再构建 x86_64 版本
    echo "构建 Intel (x86_64) 版本..."
    TAURI_TARGET_ARCH="x86_64-apple-darwin" \
    cargo tauri build --target x86_64-apple-darwin

    # 创建通用二进制
    echo "合并通用二进制..."
    create_universal_binary

    echo -e "${GREEN}✅ Tauri 构建完成${NC}"
}

# 创建通用二进制
create_universal_binary() {
    local arm64_app="${ARTIFACTS_DIR}/macos/${APP_NAME}.app"
    local x86_64_app="${ARTIFACTS_DIR}/macos/${APP_NAME}.app"
    local universal_app="${DIST_DIR}/${APP_NAME}.app"

    if [ -d "$arm64_app" ] && [ -d "$x86_64_app" ]; then
        echo "合并二进制文件..."

        # 复制 arm64 版本作为基础
        cp -R "$arm64_app" "$universal_app"

        # 合并二进制
        local arm64_binary="$arm64_app/Contents/MacOS/${APP_NAME}"
        local x86_64_binary="$x86_64_app/Contents/MacOS/${APP_NAME}"
        local universal_binary="$universal_app/Contents/MacOS/${APP_NAME}"

        if [ -f "$arm64_binary" ] && [ -f "$x86_64_binary" ]; then
            lipo -create "$arm64_binary" "$x86_64_binary" -output "$universal_binary"
            echo "通用二进制创建完成"
        else
            echo -e "${YELLOW}⚠️ 未找到二进制文件，使用 arm64 版本${NC}"
            cp -R "$arm64_app" "$universal_app"
        fi
    else
        echo -e "${YELLOW}⚠️ 未找到所有架构版本，使用可用版本${NC}"
        if [ -d "$arm64_app" ]; then
            cp -R "$arm64_app" "$universal_app"
        elif [ -d "$x86_64_app" ]; then
            cp -R "$x86_64_app" "$universal_app"
        else
            echo -e "${RED}❌ 未找到构建的应用${NC}"
            exit 1
        fi
    fi
}

# 代码签名（可选）
code_sign() {
    if [ -n "$CODESIGN_IDENTITY" ]; then
        echo -e "${BLUE}✍️ 代码签名...${NC}"

        local app_path="${DIST_DIR}/${APP_NAME}.app"

        # 签名应用
        codesign --force --options runtime --sign "$CODESIGN_IDENTITY" "$app_path"

        # 验证签名
        codesign --verify --verbose "$app_path"

        echo -e "${GREEN}✅ 代码签名完成${NC}"
    else
        echo -e "${YELLOW}⚠️ 未设置代码签名身份，跳过签名${NC}"
    fi
}

# 创建 DMG
create_dmg() {
    echo -e "${BLUE}💿 创建 DMG 安装包...${NC}"

    local app_path="${DIST_DIR}/${APP_NAME}.app"
    local dmg_path="${DIST_DIR}/${APP_NAME}-${VERSION}-universal.dmg"

    # 删除旧的 DMG
    if [ -f "$dmg_path" ]; then
        rm "$dmg_path"
    fi

    # 创建 DMG
    echo "创建 DMG: $dmg_path"

    # 使用 create-dmg 或 hdiutil
    if command -v create-dmg &> /dev/null; then
        echo "使用 create-dmg 创建安装包..."
        create-dmg \
            --volname "${APP_NAME}" \
            --volicon "${app_path}/Contents/Resources/icon.icns" \
            --window-pos 200 120 \
            --window-size 600 300 \
            --icon-size 100 \
            --icon "${APP_NAME}.app" 175 120 \
            --hide-extension "${APP_NAME}.app" \
            --app-drop-link 425 120 \
            --disk-image-size 500 \
            --hdiutil-quiet \
            "$dmg_path" \
            "$DIST_DIR"
    else
        echo "使用 hdiutil 创建安装包..."
        create_dmg_manual "$app_path" "$dmg_path"
    fi

    echo -e "${GREEN}✅ DMG 创建完成: ${dmg_path}${NC}"
}

# 手动创建 DMG
create_dmg_manual() {
    local app_path="$1"
    local dmg_path="$2"
    local mount_point="/tmp/${APP_NAME}_dmg_mount"

    # 创建临时 DMG
    local temp_dmg="${DIST_DIR}/temp.dmg"
    hdiutil create -size 500m -fs HFS+ -volname "${APP_NAME}" "$temp_dmg"

    # 挂载临时 DMG
    hdiutil attach "$temp_dmg" -mountpoint "$mount_point"

    # 复制应用和创建文件夹
    cp -R "$app_path" "$mount_point/"
    ln -s /Applications "$mount_point/Applications"

    # 卸载
    hdiutil detach "$mount_point"

    # 转换为压缩 DMG
    hdiutil convert "$temp_dmg" -format UDZO -imagekey zlib-level=9 -o "$dmg_path"

    # 清理
    rm "$temp_dmg"
}

# 公证（可选）
notarize() {
    if [ -n "$APPLE_ID" ] && [ -n "$APPLE_PASSWORD" ] && [ -n "$APPLE_TEAM_ID" ]; then
        echo -e "${BLUE}📋 公证应用...${NC}"

        local dmg_path="${DIST_DIR}/${APP_NAME}-${VERSION}-universal.dmg"

        # 上传公证
        xcrun altool --notarize-app \
            --primary-bundle-id "${BUNDLE_ID}" \
            --username "$APPLE_ID" \
            --password "$APPLE_PASSWORD" \
            --asc-provider "$APPLE_TEAM_ID" \
            --file "$dmg_path"

        echo -e "${GREEN}✅ 公证上传完成${NC}"
        echo "请检查邮件获取公证结果，然后使用 xcrun stapler staple 装订"
    else
        echo -e "${YELLOW}⚠️ 未设置公证信息，跳过公证${NC}"
    fi
}

# 显示构建信息
show_build_info() {
    echo -e "${BLUE}📊 构建信息:${NC}"
    echo "应用名称: ${APP_NAME}"
    echo "版本: ${VERSION}"
    echo "包标识符: ${BUNDLE_ID}"
    echo "最低 macOS 版本: ${MIN_MACOS_VERSION}"
    echo "构建目标: ${TARGETS[*]}"
    echo ""
    echo -e "${BLUE}📁 构建产物:${NC}"
    echo "应用: ${DIST_DIR}/${APP_NAME}.app"
    echo "DMG: ${DIST_DIR}/${APP_NAME}-${VERSION}-universal.dmg"
    echo ""

    # 显示文件大小
    if [ -f "${DIST_DIR}/${APP_NAME}.app" ]; then
        local app_size=$(du -sh "${DIST_DIR}/${APP_NAME}.app" | cut -f1)
        echo "应用大小: ${app_size}"
    fi

    if [ -f "${DIST_DIR}/${APP_NAME}-${VERSION}-universal.dmg" ]; then
        local dmg_size=$(du -sh "${DIST_DIR}/${APP_NAME}-${VERSION}-universal.dmg" | cut -f1)
        echo "DMG 大小: ${dmg_size}"
    fi
}

# 主函数
main() {
    echo -e "${GREEN}🎯 Apple Silicon macOS 应用打包开始${NC}"
    echo "时间: $(date)"
    echo ""

    # 检查配置
    if [ ! -f "${SRC_TAURI_DIR}/tauri.conf.json" ]; then
        echo -e "${RED}❌ 错误: 未找到 tauri.conf.json${NC}"
        exit 1
    fi

    # 执行构建步骤
    check_dependencies
    clean_build
    build_frontend
    build_tauri
    code_sign
    create_dmg
    notarize
    show_build_info

    echo ""
    echo -e "${GREEN}🎉 打包完成！${NC}"
    echo -e "${BLUE}提示: 如需代码签名和公证，请设置以下环境变量:${NC}"
    echo "  export CODESIGN_IDENTITY=\"Developer ID Application: Your Name\""
    echo "  export APPLE_ID=\"your@apple.id\""
    echo "  export APPLE_PASSWORD=\"app-specific-password\""
    echo "  export APPLE_TEAM_ID=\"your-team-id\""
}

# 脚本选项
case "${1:-}" in
    "clean")
        clean_build
        ;;
    "frontend")
        build_frontend
        ;;
    "tauri")
        build_tauri
        ;;
    "dmg")
        # 需要先有构建好的应用
        if [ ! -d "${DIST_DIR}/${APP_NAME}.app" ]; then
            echo -e "${RED}❌ 未找到构建的应用，请先运行完整构建${NC}"
            exit 1
        fi
        create_dmg
        ;;
    "sign")
        # 需要先有构建好的应用
        if [ ! -d "${DIST_DIR}/${APP_NAME}.app" ]; then
            echo -e "${RED}❌ 未找到构建的应用，请先运行完整构建${NC}"
            exit 1
        fi
        code_sign
        ;;
    "help"|"-h"|"--help")
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  clean     - 清理构建文件"
        echo "  frontend  - 仅构建前端"
        echo "  tauri     - 仅构建 Tauri 应用"
        echo "  dmg       - 仅创建 DMG"
        echo "  sign      - 仅代码签名"
        echo "  help      - 显示此帮助信息"
        echo ""
        echo "环境变量:"
        echo "  CODESIGN_IDENTITY  - 代码签名身份"
        echo "  APPLE_ID          - Apple ID (用于公证)"
        echo "  APPLE_PASSWORD    - App 专用密码"
        echo "  APPLE_TEAM_ID     - Apple 团队 ID"
        echo ""
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo -e "${RED}❌ 未知选项: $1${NC}"
        echo "使用 $0 help 查看帮助"
        exit 1
        ;;
esac