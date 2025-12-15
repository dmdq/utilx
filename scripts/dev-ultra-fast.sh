#!/bin/bash

# 超快速开发模式脚本
# 专门针对Tauri + Nuxt开发优化

echo "🚀 启动超快速开发模式..."

# 设置环境变量
export NODE_ENV=development
export NODE_OPTIONS="--max-old-space-size=8192"
export VITE_CJS_IGNORE_WARNING=true

# 设置Chokidar使用原生文件监听（最高效）
export CHOKIDAR_USEPOLLING=false
export CHOKIDAR_USEFS_EVENTS=true

# 设置文件监听限制
ulimit -n 65536 2>/dev/null || true

# 检查是否有预构建的静态文件
if [ -d ".output/public" ] && [ -f ".output/public/index.html" ]; then
    echo "📦 检测到预构建文件，启动Nuxt静态服务器..."

    # 后台启动Nuxt静态服务器
    npx npx serve .output/public --listen 3000 --single &
    NUXT_PID=$!

    # 等待服务器启动
    sleep 2

    # 检查服务器是否成功启动
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Nuxt静态服务器已启动 (PID: $NUXT_PID)"

        # 启动Tauri开发模式（跳过前端构建）
        echo "🔧 启动Tauri开发模式（跳过前端构建）..."
        cd src-tauri
        cargo tauri dev --no-bundle --config-path tauri.conf.json

        # 清理：停止Nuxt服务器
        kill $NUXT_PID 2>/dev/null || true
    else
        echo "❌ Nuxt服务器启动失败，回退到常规模式..."
        rm -rf .output
        npm run dev:fast
    fi
else
    echo "⚠️ 未检测到预构建文件，执行快速预构建..."

    # 创建临时配置文件
    cat > .nuxtrc.temp << EOF
# 临时开发配置
build.transpile=[]
devServer.hotReload=true
devServer.watchFiles=false
EOF

    # 使用开发配置快速构建
    NUXT_PUBLIC_DEV_MODE=ultra-fast npm run generate

    # 清理临时配置
    rm -f .nuxtrc.temp

    # 递归调用自己（这次会有预构建文件）
    exec "$0"
fi