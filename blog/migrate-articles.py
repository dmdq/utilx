#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hugo博客文章迁移脚本
将文章从content/posts迁移到content/articles/[年]/[月-英文]/结构
"""

import os
import re
import shutil
from datetime import datetime
from pathlib import Path

def get_month_name(month_num):
    """获取英文月份名称"""
    months = {
        "01": "january", "02": "february", "03": "march", "04": "april",
        "05": "may", "06": "june", "07": "july", "08": "august",
        "09": "september", "10": "october", "11": "november", "12": "december"
    }
    return months.get(month_num, "unknown")

def generate_slug(title):
    """从标题生成slug"""
    # 移除中文，保留英文和数字
    slug = re.sub(r'[^\w\s-]', '', title)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = slug.strip('-').lower()
    return slug

def update_frontmatter(content, slug, date_str):
    """更新文章的frontmatter"""
    lines = content.split('\n')
    in_frontmatter = False
    frontmatter_end = 0
    updated_lines = []
    has_slug = False
    has_time = False
    has_lastmod = False
    has_seo = False

    # 找到frontmatter的结束位置
    for i, line in enumerate(lines):
        if line.strip() == '---':
            if not in_frontmatter:
                in_frontmatter = True
            else:
                frontmatter_end = i
                break
            updated_lines.append(line)
        else:
            updated_lines.append(line)

    # 更新frontmatter内容
    for i in range(1, frontmatter_end):
        line = lines[i]
        if line.startswith('slug:'):
            has_slug = True
        if line.startswith('date:') and ':' in line and 'T' in line:
            has_time = True
        if line.startswith('lastmod:'):
            has_lastmod = True
        if 'description:' in line or 'keywords:' in line:
            has_seo = True

    # 插入缺失的字段
    final_lines = []
    for i in range(len(updated_lines)):
        final_lines.append(updated_lines[i])

        # 在date后插入slug和时间信息
        if updated_lines[i].startswith('date:') and not has_slug:
            final_lines.append(f"slug: \"{slug}\"")
            if not has_time:
                # 添加时间戳
                date_part = updated_lines[i].split(':', 1)[1].strip()
                if 'T' not in date_part:
                    final_lines.append(f"lastmod: {date_part}T12:00:00+08:00")
                else:
                    final_lines.append(f"lastmod: {date_part}")

        # 在draft后插入SEO优化信息
        if not has_seo and updated_lines[i].startswith('draft:'):
            title = ""
            for line in lines[:frontmatter_end]:
                if line.startswith('title:'):
                    title = line.split(':', 1)[1].strip().strip('"\'')
                    break

            if title:
                final_lines.append("")
                final_lines.append("# SEO优化")
                final_lines.append(f"description: \"从技术博客{title}，提供实用的开发技巧和解决方案\"")
                final_lines.append("keywords: [\"技术博客\", \"开发者工具\", \"编程技巧\"]")
                final_lines.append("")
                final_lines.append("# 阅读时间")
                final_lines.append("reading_time: true")
                final_lines.append("")
                final_lines.append("# 目录")
                final_lines.append("toc: true")
                has_seo = True

    return '\n'.join(final_lines) + '\n' + '\n'.join(lines[frontmatter_end+1:])

def migrate_articles():
    """迁移文章到新结构"""
    posts_dir = Path("content/posts")
    articles_dir = Path("content/articles")

    if not posts_dir.exists():
        print(f"错误：找不到 {posts_dir} 目录")
        return

    # 创建articles目录
    articles_dir.mkdir(exist_ok=True)

    # 处理每个markdown文件
    md_files = list(posts_dir.glob("*.md"))

    for md_file in md_files:
        print(f"\n处理文件: {md_file}")

        # 读取文件内容
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 提取日期信息
        date_match = re.search(r'date:\s*(\d{4}-\d{2}-\d{2})', content)
        if date_match:
            date_str = date_match.group(1)
            year, month = date_str.split('-')[:2]
            month_name = get_month_name(month)
        else:
            # 从文件名提取日期
            date_match = re.search(r'(\d{4}-\d{2}-\d{2})', md_file.stem)
            if date_match:
                date_str = date_match.group(1)
                year, month = date_str.split('-')[:2]
                month_name = get_month_name(month)
            else:
                print(f"  警告：无法确定日期，使用当前日期")
                now = datetime.now()
                year = str(now.year)
                month = f"{now.month:02d}"
                month_name = get_month_name(month)
                date_str = f"{year}-{month}-01"

        # 提取标题并生成slug
        title_match = re.search(r'title:\s*["\']([^"\']+)["\']', content)
        if title_match:
            title = title_match.group(1)
            slug = generate_slug(title)
        else:
            # 使用文件名作为slug
            slug = md_file.stem.lower()

        # 创建目标目录
        target_dir = articles_dir / year / f"{month}-{month_name}"
        target_dir.mkdir(parents=True, exist_ok=True)

        # 生成新文件名
        new_filename = f"{slug}.md"
        target_path = target_dir / new_filename

        # 更新frontmatter
        updated_content = update_frontmatter(content, slug, date_str)

        # 写入新文件
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"  ✓ 已迁移到: {target_path}")

        # 备份原文件
        backup_dir = Path("content/posts/backup")
        backup_dir.mkdir(exist_ok=True)
        shutil.move(str(md_file), backup_dir / md_file.name)
        print(f"  ✓ 原文件已备份到: {backup_dir / md_file.name}")

    print(f"\n迁移完成！共处理 {len(md_files)} 个文件")

if __name__ == "__main__":
    migrate_articles()