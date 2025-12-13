#!/bin/bash

# 设置文件句柄限制
ulimit -n 65536

# 设置 Chokidar 环境变量以减少文件句柄使用
export CHOKIDAR_USEPOLLING=true
export CHOKIDAR_INTERVAL=1000
export CHOKIDAR_USEFS_EVENTS=false

# 运行命令
# 运行命令，使用 nuxi 来启动 nuxt
if [ "$1" = "nuxt" ]; then
    shift
    exec npx nuxi "$@"
else
    exec "$@"
fi