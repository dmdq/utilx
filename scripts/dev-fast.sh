#!/bin/bash

# 设置文件句柄限制
ulimit -n 65536

# 设置 Chokidar 环境变量以减少文件句柄使用
export CHOKIDAR_USEPOLLING=true
export CHOKIDAR_INTERVAL=1000
export CHOKIDAR_USEFS_EVENTS=false

# 检查是否存在已编译的 .output 目录
if [ ! -d ".output/public" ]; then
    echo "首次运行，需要编译前端..."
    npm run generate
fi

# 检查前端服务是否已运行
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "前端服务未运行，启动前端服务..."
    # 启动前端服务，但使用静态文件模式
    npm run start &
    # 等待前端服务启动
    sleep 5
fi

echo "启动 Tauri 开发模式（跳过前端编译）..."
# 使用 --no-bundle 参数跳过捆绑
exec cargo tauri dev --no-bundle