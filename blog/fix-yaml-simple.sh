#!/bin/bash
# 简单的YAML修复脚本

for file in $(find content/articles -name "*.md"); do
  echo "Checking: $file"

  # 获取第一个 --- 的行号
  first_line=$(grep -n "^---$" "$file" | head -1 | cut -d: -f1)

  # 获取第二个 --- 的行号
  second_line=$(grep -n "^---$" "$file" | head -2 | tail -1 | cut -d: -f1)

  # 如果只有一个 --- 符号
  if [ -n "$first_line" ] && [ -z "$second_line" ]; then
    echo "  - Fixing YAML frontmatter..."

    # 读取文件内容
    content=$(cat "$file")

    # 在第一个 --- 后的所有内容前添加 ---
    frontmatter_end_line=$(grep -n "^$" "$file" | head -2 | tail -1 | cut -d: -f1)

    # 创建新文件
    {
      head -n $((frontmatter_end_line)) "$file"
      echo "---"
      echo ""
      tail -n +$((frontmatter_end_line + 1)) "$file"
    } > "$file.tmp"

    mv "$file.tmp" "$file"
  fi
done

echo "Done!"