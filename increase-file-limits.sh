#!/bin/bash

# 增加系统文件句柄限制
echo "正在增加文件句柄限制..."

# 设置当前会话的限制
ulimit -n 65536
echo "当前文件句柄限制: $(ulimit -n)"

# 永久设置 - 添加到 shell 配置文件
if [[ "$SHELL" == */zsh ]]; then
    echo "export ulimit -n 65536" >> ~/.zshrc
    echo "已添加到 ~/.zshrc"
elif [[ "$SHELL" == */bash ]]; then
    echo "ulimit -n 65536" >> ~/.bashrc
    echo "已添加到 ~/.bashrc"
fi

# 提示重启终端
echo ""
echo "请重启终端或运行以下命令使设置生效："
echo "source ~/.zshrc  # 或 source ~/.bashrc"