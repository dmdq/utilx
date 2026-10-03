#!/bin/bash
# 一键打包静态部署包：npm run build:static + 产物校验 + zip 压缩
# 用法:
#   ./package-static.sh              # 完整构建 + 校验 + 压缩
#   ./package-static.sh /tmp/out     # 指定 zip 输出目录（默认项目根目录）
#   SKIP_BUILD=1 ./package-static.sh # 跳过构建，直接打包现有 .output/public
# 注意：macOS 自带 bash 3.2 对 $var 后紧跟全角标点的解析有缺陷，所有变量引用一律用 ${}
set -euo pipefail

cd "$(dirname "$0")"

# 内存参数已在 package.json 的 build:nuxt/generate 内置，此处兜底防止被外部环境覆盖
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192 --max-semi-space-size=1024}"

OUT_DIR="${1:-.}"
TS=$(date +%Y%m%d-%H%M%S)
ZIP_NAME="utilx-static-${TS}.zip"
PUB=".output/public"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$1"; exit 1; }

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  step "1/4 构建（Hugo 博客 + Nuxt 全量静态化，约 10-15 分钟）"
  START=$(date +%s)
  npm run build:static
  ok "构建完成，耗时 $(( $(date +%s) - START )) 秒"
else
  step "1/4 跳过构建（SKIP_BUILD=1），使用现有 ${PUB}"
  [ -d "$PUB" ] || fail "${PUB} 不存在，请先完整构建"
fi

step "2/4 产物校验"
[ -f "${PUB}/index.html" ] || fail "缺少 index.html"
[ -f "${PUB}/sitemap.xml" ] || fail "缺少 sitemap.xml"

HTML_COUNT=$(find "$PUB" -name '*.html' | wc -l | tr -d ' ')
TOOL_PAGES=$(find "${PUB}/tools" -name 'index.html' | wc -l | tr -d ' ')
if [ "$TOOL_PAGES" -lt 503 ]; then
  fail "工具页仅 ${TOOL_PAGES} 个（应 ≥503），构建不完整"
fi

# 回归守卫：/blog/ 曾被 Nuxt 预渲染错误页覆盖（nitro 爬虫跟踪页脚链接所致）
grep -q "技术博客" "${PUB}/blog/index.html" || fail "blog/index.html 被 Nuxt 错误页污染（prerender.ignore 失效？）"
if [ -f "${PUB}/blog/_payload.json" ]; then
  fail "blog/_payload.json 残留，博客产物被污染"
fi

ok "HTML 总数 ${HTML_COUNT}，工具页 ${TOOL_PAGES} 个，博客首页正常"

step "3/4 压缩为 zip（archive 根目录即站点根，解压即部署）"
mkdir -p "$OUT_DIR"
FILES=$(find "$PUB" -type f | wc -l | tr -d ' ')
ZIP_PATH="$(cd "$OUT_DIR" && pwd)/${ZIP_NAME}"
( cd "$PUB" && zip -rq "$ZIP_PATH" . -x '*.DS_Store' '__MACOSX*' )
ok "已生成 ${ZIP_PATH}"

step "4/4 完成"
SIZE=$(du -h "$ZIP_PATH" | cut -f1 | tr -d ' ')
ok "部署包: ${ZIP_PATH}（${SIZE}，${FILES} 个文件）"
echo "  部署方式: 解压到 nginx 站点根目录"
echo "  nginx 关键配置: try_files \$uri \$uri/ \$uri/index.html =404;"
echo "  上线后复检: TOOLS_BASE_URL=\"https://你的域名/tools/\" node scripts/test-tools.js"
