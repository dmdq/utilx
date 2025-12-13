#!/bin/bash

# 安装构建依赖的脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 安装 macOS 构建依赖...${NC}"

# 检查操作系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ 此脚本仅适用于 macOS${NC}"
    exit 1
fi

# 安装 Homebrew（如果未安装）
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}📦 安装 Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✅ Homebrew 已安装${NC}"
fi

# 安装 Rust（如果未安装）
if ! command -v cargo &> /dev/null; then
    echo -e "${YELLOW}📦 安装 Rust...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo -e "${GREEN}✅ Rust 已安装${NC}"
fi

# 安装 Rust 目标平台
echo -e "${YELLOW}📦 安装 Rust 目标平台...${NC}"
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin

# 安装 Node.js（如果未安装）
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 安装 Node.js...${NC}"
    brew install node
else
    echo -e "${GREEN}✅ Node.js 已安装${NC}"
fi

# 安装 pnpm（推荐）
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}📦 安装 pnpm...${NC}"
    npm install -g pnpm
else
    echo -e "${GREEN}✅ pnpm 已安装${NC}"
fi

# 安装 create-dmg（用于创建更好的 DMG）
if ! command -v create-dmg &> /dev/null; then
    echo -e "${YELLOW}📦 安装 create-dmg...${NC}"
    brew install create-dmg
else
    echo -e "${GREEN}✅ create-dmg 已安装${NC}"
fi

# 安装 Xcode 命令行工具（如果需要）
if ! xcode-select -p &> /dev/null; then
    echo -e "${YELLOW}📦 安装 Xcode 命令行工具...${NC}"
    xcode-select --install
else
    echo -e "${GREEN}✅ Xcode 命令行工具已安装${NC}"
fi

# 安装 xpath（用于公证脚本）
if ! command -v xpath &> /dev/null; then
    echo -e "${YELLOW}📦 安装 xpath...${NC}"
    brew install libxml2
    brew link --overwrite libxml2
else
    echo -e "${GREEN}✅ xpath 已安装${NC}"
fi

# 安装 Tauri CLI（如果未安装）
if ! cargo tauri --version &> /dev/null; then
    echo -e "${YELLOW}📦 安装 Tauri CLI...${NC}"
    cargo install tauri-cli@1.5.10 --locked
else
    echo -e "${GREEN}✅ Tauri CLI 已安装${NC}"
fi

echo ""
echo -e "${GREEN}🎉 依赖安装完成！${NC}"
echo ""
echo -e "${BLUE}下一步操作:${NC}"
echo "1. 设置 Apple 开发者环境变量（可选，用于代码签名和公证）:"
echo "   export CODESIGN_IDENTITY=\"Developer ID Application: Your Name\""
echo "   export APPLE_ID=\"your@apple.id\""
echo "   export APPLE_PASSWORD=\"app-specific-password\""
echo "   export APPLE_TEAM_ID=\"your-team-id\""
echo ""
echo "2. 运行构建脚本:"
echo "   ./scripts/build-apple-silicon.sh"
echo ""
echo "3. 如需公证（需要 Apple 开发者账户）:"
echo "   ./scripts/notarize-app.sh"
echo ""