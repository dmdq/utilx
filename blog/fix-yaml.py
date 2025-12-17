#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复Hugo文章YAML格式脚本
"""

import os
import re
import frontmatter
from pathlib import Path

def fix_yaml_files():
    """修复所有文章的YAML格式"""
    articles_dir = Path("content/articles")
    fixed_count = 0

    if not articles_dir.exists():
        print(f"错误：找不到 {articles_dir} 目录")
        return

    # 处理每个markdown文件
    for md_file in articles_dir.rglob("*.md"):
        print(f"\n处理文件: {md_file}")

        try:
            # 读取文件内容
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 尝试解析frontmatter
            try:
                post = frontmatter.load(md_file)
            except Exception as e:
                print(f"  错误解析frontmatter: {e}")

                # 手动修复格式
                lines = content.split('\n')
                new_lines = []
                in_frontmatter = False
                frontmatter_lines = []
                content_lines = []

                for line in lines:
                    if line.strip() == '---':
                        if not in_frontmatter:
                            in_frontmatter = True
                            new_lines.append(line)
                        else:
                            # 检查是否需要添加结束符
                            if len(frontmatter_lines) > 0 and frontmatter_lines[-1].strip() != '---':
                                new_lines.extend(frontmatter_lines)
                                new_lines.append('')
                            new_lines.append(line)
                            in_frontmatter = False
                        continue

                    if in_frontmatter:
                        frontmatter_lines.append(line)
                    else:
                        content_lines.append(line)

                # 重新构建内容
                fixed_content = '\n'.join(new_lines) + '\n\n' + '\n'.join(content_lines)

                # 写入修复后的文件
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)

                print(f"  ✓ 已修复YAML格式")
                fixed_count += 1

            # 确保有正确的slug字段
            if 'slug' not in post.metadata:
                # 从文件名生成slug
                slug = md_file.stem.lower().replace(' ', '-').replace('_', '-')
                post.metadata['slug'] = slug

                # 保存修复后的文件
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(frontmatter.dumps(post))

                print(f"  ✓ 已添加slug: {slug}")
                fixed_count += 1

        except Exception as e:
            print(f"  错误处理文件: {e}")

    print(f"\n修复完成！共处理 {fixed_count} 个文件")

if __name__ == "__main__":
    fix_yaml_files()