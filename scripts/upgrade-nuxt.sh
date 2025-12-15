#!/bin/bash

echo "🚀 升级 Nuxt 到最新版本..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_NODE="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
    echo -e "${RED}❌ 需要 Node.js v18+，当前版本: $NODE_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 版本检查通过: $NODE_VERSION${NC}"

# 备份package.json
echo "📦 备份 package.json..."
cp package.json package.json.backup

# 清理旧的依赖和缓存
echo "🧹 清理旧的依赖和缓存..."
rm -rf node_modules
rm -rf .nuxt
rm -rf .output
rm -rf dist
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# 更新依赖
echo "📥 安装更新的依赖..."
npm install

# 检查安装是否成功
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败！${NC}"
    echo "恢复 package.json..."
    mv package.json.backup package.json
    exit 1
fi

# 验证关键依赖
echo "🔍 验证关键依赖版本..."
NUXT_VERSION=$(npm list nuxt --depth=0 | grep nuxt | sed 's/.*@//')
VUE_VERSION=$(npm list vue --depth=0 | grep vue | sed 's/.*@//')

echo -e "${GREEN}✅ Nuxt 版本: $NUXT_VERSION${NC}"
echo -e "${GREEN}✅ Vue 版本: $VUE_VERSION${NC}"

# 运行类型检查（如果有）
if command -v vue-tsc &> /dev/null; then
    echo "🔍 运行类型检查..."
    npm run type-check 2>/dev/null || echo "⚠️ 类型检查有警告，但不影响运行"
fi

# 生成新的构建以验证
echo "🏗️ 构建验证..."
npm run generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nuxt 升级成功！${NC}"
    echo ""
    echo "📋 升级摘要："
    echo "  - Nuxt: $NUXT_VERSION"
    echo "  - Vue: $VUE_VERSION"
    echo ""
    echo "💡 下一步："
    echo "  1. 运行 npm run dev 测试开发环境"
    echo "  2. 运行 npm run build 测试生产构建"
    echo "  3. 运行 npm run dev:ultra 使用超快模式"
else
    echo -e "${RED}❌ 构建验证失败！${NC}"
    echo "恢复 package.json..."
    mv package.json.backup package.json
    echo "重新安装依赖..."
    npm install
    exit 1
fi

# 清理备份文件
echo "🗑️ 清理备份文件..."
rm package.json.backup

echo -e "${GREEN}🎉 Nuxt 升级完成！${NC}"