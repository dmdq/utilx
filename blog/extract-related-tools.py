#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
递归检查博客文章中的"相关工具"并生成表格汇总
"""

import os
import re
from pathlib import Path
from collections import defaultdict

def extract_frontmatter(content):
    """提取文章的frontmatter"""
    if content.startswith('---'):
        try:
            end_index = content.find('---', 3)
            if end_index != -1:
                frontmatter_str = content[3:end_index]
                frontmatter = parse_simple_yaml(frontmatter_str)
                return frontmatter, content[end_index + 3:]
        except Exception as e:
            print(f"解析frontmatter时出错: {e}")
    return {}, content

def parse_simple_yaml(yaml_str):
    """简单的YAML解析器，只解析我们需要的基本字段"""
    result = {}
    lines = yaml_str.strip().split('\n')

    for line in lines:
        line = line.strip()
        if ':' in line and not line.startswith('#'):
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()

            # 移除引号
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]

            # 处理列表
            if value.startswith('[') and value.endswith(']'):
                value = value[1:-1].split(',')
                value = [item.strip().strip('"\'') for item in value if item.strip()]

            result[key] = value

    return result

def find_related_tools(content):
    """查找文章中提到的相关工具"""
    tools = []

    # 查找"相关工具"章节
    related_tools_pattern = r'(?:相关工具|推荐工具|工具推荐|实用工具)[：:]\s*\n((?:[-*+]\s*.*\n?)*)'
    match = re.search(related_tools_pattern, content, re.IGNORECASE)

    if match:
        tools_section = match.group(1)
        # 提取工具列表项
        tool_items = re.findall(r'^[-*+]\s*(.+)$', tools_section, re.MULTILINE)

        for item in tool_items:
            tool_info = parse_tool_item(item)
            if tool_info:
                tools.append(tool_info)

    # 查找其他可能的工具提及模式
    # 模式1: [工具名称](URL) - 描述
    link_pattern = r'\[([^\]]+)\]\(([^)]+)\)\s*[-—–]\s*([^*\n]+)'
    matches = re.findall(link_pattern, content)
    for title, url, desc in matches:
        if any(keyword in title.lower() for keyword in ['tool', '工具', 'util', 'editor', '格式化', 'converter']):
            tools.append({
                'title': title.strip(),
                'url': url.strip(),
                'description': desc.strip(),
                'source': 'content_link'
            })

    # 模式2: 工具名称: URL
    tool_url_pattern = r'([^:\n]+工具?)[:：]\s*(https?://[^\s\n]+)'
    matches = re.findall(tool_url_pattern, content)
    for title, url in matches:
        tools.append({
            'title': title.strip(),
            'url': url.strip(),
            'description': '',
            'source': 'inline_mention'
        })

    return tools

def parse_tool_item(item):
    """解析工具项"""
    # 模式1: [工具名称](URL) - 描述
    link_desc_pattern = r'\[([^\]]+)\]\(([^)]+)\)\s*[-—–]\s*(.+)'
    match = re.match(link_desc_pattern, item)
    if match:
        return {
            'title': match.group(1).strip(),
            'url': match.group(2).strip(),
            'description': match.group(3).strip(),
            'source': 'related_tools_section'
        }

    # 模式2: [工具名称](URL)
    link_only_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    match = re.match(link_only_pattern, item)
    if match:
        return {
            'title': match.group(1).strip(),
            'url': match.group(2).strip(),
            'description': '',
            'source': 'related_tools_section'
        }

    # 模式3: 纯文本（可能是工具名称）
    if '工具' in item or 'Tool' in item or 'Editor' in item or 'Converter' in item:
        return {
            'title': item.strip(),
            'url': '',
            'description': '',
            'source': 'text_only'
        }

    return None

def enhance_tool_description(tool):
    """扩展工具功能描述"""
    title = tool['title'].lower()
    description = tool['description']

    # 工具功能映射
    tool_functions = {
        'json': ['JSON格式化', 'JSON验证', 'JSON压缩', 'JSON转义', 'JSON美化', '数据转换'],
        'sql': ['SQL格式化', 'SQL美化', 'SQL压缩', 'SQL语法高亮', 'SQL优化'],
        'markdown': ['Markdown编辑器', 'Markdown预览', 'Markdown转HTML', '实时编辑', '语法高亮'],
        'base64': ['Base64编码', 'Base64解码', '字符编码转换', '数据加密'],
        'url': ['URL编码', 'URL解码', '参数解析', '链接格式化'],
        'regex': ['正则表达式测试', '正则验证', '模式匹配', '正则生成器'],
        'color': ['颜色选择器', '颜色转换', 'HEX转RGB', '调色板', '渐变生成'],
        'css': ['CSS压缩', 'CSS格式化', 'CSS优化', '样式表处理'],
        'js': ['JavaScript压缩', 'JS格式化', '代码美化', '语法检查'],
        'html': ['HTML格式化', 'HTML压缩', '标签清理', '代码验证'],
        'timestamp': ['时间戳转换', '日期格式化', '时区转换', '日期计算'],
        'qr': ['二维码生成', 'QR码创建', '条码生成', '移动端识别'],
        'hash': ['哈希生成', 'MD5计算', 'SHA加密', '数据校验'],
        'diff': ['文本对比', '差异检测', '合并工具', '版本比较'],
        'crontab': ['Cron表达式', '定时任务', '调度配置', '时间解析'],
        'jwt': ['JWT解析', 'Token生成', '签名验证', 'Claims查看'],
        'yaml': ['YAML格式化', 'YAML验证', '配置文件处理', '数据序列化'],
        'xml': ['XML格式化', 'XML验证', '数据转换', '文档处理'],
        'image': ['图片压缩', '格式转换', '尺寸调整', '图片处理'],
        'password': ['密码生成', '随机密码', '强度检测', '密码管理'],
        'uuid': ['UUID生成', '唯一标识', 'ID生成器', '随机字符串'],
        'lorem': ['Lorem文本', '占位符生成', '测试数据', '内容填充'],
        'mime': ['MIME类型', '文件类型', '格式识别', '内容类型'],
        'port': ['端口扫描', '网络检测', '连接测试', '服务检查']
    }

    enhanced_functions = []
    for keyword, functions in tool_functions.items():
        if keyword in title:
            enhanced_functions.extend(functions)

    # 如果找到相关功能，添加到描述中
    if enhanced_functions and not description:
        tool['enhanced_description'] = '、'.join(enhanced_functions[:5])  # 最多显示5个功能
    elif enhanced_functions and description:
        tool['enhanced_description'] = f"{description} | 主要功能：{'、'.join(enhanced_functions[:3])}"
    else:
        tool['enhanced_description'] = description or '开发者实用工具'

    # 为工具分类
    tool['category'] = categorize_tool(title)

    return tool

def categorize_tool(title):
    """为工具分类"""
    categories = {
        '文本处理': ['json', 'xml', 'yaml', 'markdown', 'text', 'diff'],
        '编码转换': ['base64', 'url', 'encoding', 'decode', 'encode'],
        '代码工具': ['css', 'js', 'html', 'sql', 'formatter', 'minifier'],
        '加密安全': ['hash', 'encrypt', 'decrypt', 'jwt', 'password', 'ssl'],
        '时间日期': ['time', 'date', 'timestamp', 'cron'],
        '图形图像': ['image', 'color', 'qr', 'png', 'jpg', 'svg'],
        '网络工具': ['url', 'port', 'ip', 'http', 'api'],
        '数据生成': ['uuid', 'lorem', 'random', 'generator'],
        '正则表达式': ['regex', 'pattern', 'match'],
        '开发辅助': ['git', 'docker', 'npm', 'package', 'dev']
    }

    title_lower = title.lower()
    for category, keywords in categories.items():
        if any(keyword in title_lower for keyword in keywords):
            return category

    return '其他工具'

def scan_blog_posts(posts_dir):
    """扫描博客文章目录"""
    all_tools = []
    article_count = 0

    # 递归遍历所有目录
    for root, dirs, files in os.walk(posts_dir):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, posts_dir)

                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    frontmatter, body_content = extract_frontmatter(content)

                    # 获取文章标题
                    article_title = frontmatter.get('title', file.replace('.md', ''))
                    article_slug = frontmatter.get('slug', file.replace('.md', ''))

                    # 查找相关工具
                    tools = find_related_tools(body_content)

                    if tools:
                        for tool in tools:
                            enhanced_tool = enhance_tool_description(tool)
                            enhanced_tool['article_title'] = article_title
                            enhanced_tool['article_slug'] = article_slug
                            enhanced_tool['file_path'] = relative_path
                            all_tools.append(enhanced_tool)

                        article_count += 1
                        print(f"✓ 在文章《{article_title}》中找到 {len(tools)} 个工具")

                except Exception as e:
                    print(f"处理文件 {file_path} 时出错: {e}")

    print(f"\n总共扫描了 {article_count} 篇包含工具的文章，找到 {len(all_tools)} 个工具")
    return all_tools

def generate_tools_table(tools):
    """生成工具表格"""
    if not tools:
        return "未找到任何相关工具。"

    # 按类别分组
    tools_by_category = defaultdict(list)
    for tool in tools:
        tools_by_category[tool['category']].append(tool)

    table_content = []
    table_content.append("# 博客文章中的相关工具汇总")
    table_content.append("")
    table_content.append(f"总计发现 {len(tools)} 个工具，分布在 {len(tools_by_category)} 个类别中。")
    table_content.append("")

    # 按类别生成表格
    for category, category_tools in sorted(tools_by_category.items()):
        table_content.append(f"## {category} ({len(category_tools)}个)")
        table_content.append("")
        table_content.append("| 工具名称 | 功能描述 | 来源文章 | URL |")
        table_content.append("|---------|---------|---------|-----|")

        for tool in category_tools:
            url_display = tool['url'][:50] + "..." if len(tool['url']) > 50 else tool['url']
            if not url_display:
                url_display = "-"

            table_content.append(f"| **{tool['title']}** | {tool['enhanced_description']} | [{tool['article_title']}](/articles/{tool['article_slug']}/) | {url_display} |")

        table_content.append("")

    # 生成统计信息
    table_content.append("## 统计信息")
    table_content.append("")
    table_content.append("| 类别 | 工具数量 |")
    table_content.append("|-----|---------|")

    for category, category_tools in sorted(tools_by_category.items(), key=lambda x: len(x[1]), reverse=True):
        table_content.append(f"| {category} | {len(category_tools)} |")

    table_content.append("")
    table_content.append("## 工具来源文章")
    table_content.append("")

    # 统计每篇文章的工具数量
    article_tools = defaultdict(list)
    for tool in tools:
        article_tools[tool['article_title']].append(tool)

    table_content.append("| 文章标题 | 工具数量 |")
    table_content.append("|---------|---------|")

    for article_title, article_tool_list in sorted(article_tools.items(), key=lambda x: len(x[1]), reverse=True):
        table_content.append(f"| [{article_title}](/articles/{article_tool_list[0]['article_slug']}/) | {len(article_tool_list)} |")

    return "\n".join(table_content)

def main():
    """主函数"""
    print("开始扫描博客文章中的相关工具...")
    print("=" * 50)

    posts_dir = "/Users/apple/Documents/code/util/blog/content/posts"

    if not os.path.exists(posts_dir):
        print(f"错误：目录 {posts_dir} 不存在")
        return

    # 扫描文章
    tools = scan_blog_posts(posts_dir)

    if tools:
        # 生成表格
        table_content = generate_tools_table(tools)

        # 保存到文件
        output_file = "/Users/apple/Documents/code/util/BLOG_RELATED_TOOLS.md"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(table_content)

        print(f"\n✅ 工具汇总表格已保存到: {output_file}")
        print("\n" + "=" * 50)
        print("表格预览（前500字符）:")
        print("-" * 50)
        print(table_content[:500] + "..." if len(table_content) > 500 else table_content)
    else:
        print("\n❌ 未找到任何相关工具")

if __name__ == "__main__":
    main()