# 博客文章编写指南

## 概述

本文档是Util.cn技术博客的文章编写规范和操作指南，旨在确保所有博客文章的质量、一致性和SEO优化效果。

## 快速开始

### 创建新文章

1. **使用Hugo命令创建文章**
   ```bash
   # 创建普通文章
   hugo new posts/YYYY-MM-DD/article-title.md

   # 创建教程文章
   hugo new --kind tutorial posts/YYYY-MM-DD/tutorial-title.md
   ```

2. **手动创建文章**
   - 在 `blog/content/posts/YYYY-MM-DD/` 目录下创建Markdown文件
   - 文件名使用英文，用连字符分隔：`article-title.md`

3. **使用模板**
   - 复制相应的archetype模板
   - 根据实际内容修改模板

### 文件结构规范

```
blog/content/posts/
├── 2025-12-18/
│   ├── my-article.md          # 文章文件
│   └── images/                # 文章图片目录
│       ├── cover.jpg          # 封面图片
│       ├── screenshot1.png    # 内容图片
│       └── diagram.svg        # 图表文件
├── 2025-12-19/
│   └── another-article.md
└── ...
```

## Front Matter配置

### 必填字段

```yaml
---
title: "文章标题（中文，50字以内）"
slug: "url-friendly-slug"          # URL友好标识
date: 2025-12-18T12:00:00+08:00   # 发布时间
author: "作者名称"                  # 文章作者
draft: false                       # 是否为草稿
---
```

### SEO字段

```yaml
---
description: "文章描述，150字以内，包含主要关键词"
keywords: ["关键词1", "关键词2", "关键词3"]  # 3-5个关键词
summary: "文章摘要，用于列表页展示，100字以内"
categories: ["技术博客"]                    # 1-2个主分类
tags: ["标签1", "标签2", "标签3"]           # 3-8个相关标签
---
```

### 增强字段

```yaml
---
lastmod: 2025-12-18T12:00:00+08:00   # 最后修改时间
reading_time: true                   # 显示阅读时间
toc: true                           # 显示目录
featured: false                      # 是否为精选文章
image: "/images/posts/article/cover.jpg"  # 封面图片
difficulty: "beginner"              # 难度等级（教程用）
estimated_time: "30分钟"            # 预计阅读时间（教程用）
---
```

## 文章结构规范

### 标准结构

```markdown
# H1: 文章标题（仅有一个）

## H2: 背景介绍
- 问题描述
- 解决思路
- 学习目标

## H2: 核心内容
### H3: 具体实现
#### H4: 详细步骤
- 步骤说明
- 代码示例
- 注意事项

### H3: 代码示例
```代码块```

### H3: 实际效果
- 效果展示
- 性能对比

## H2: 总结
### H3: 要点回顾
### H3: 延伸阅读
### H3: 相关资源
```

### 标题层级规范

- **H1**：文章标题（每篇文章只有一个）
- **H2**：主要章节（3-6个）
- **H3**：子章节（每个H2下1-4个）
- **H4**：细节内容（必要时使用）
- **避免**：跳级使用标题（如H1直接到H3）

## SEO优化指南

### 关键词策略

1. **关键词密度**：2-3%
2. **关键词布局**：
   - 标题：包含主要关键词
   - 第一段：自然融入关键词
   - 各级标题：使用长尾关键词
   - 图片alt：描述性关键词
3. **避免**：关键词堆砌和过度优化

### Meta信息优化

```yaml
---
# Title优化（50-60字符）
title: "Hugo博客优化指南：提升SEO和用户体验的最佳实践"

# Description优化（150-160字符）
description: "详细介绍如何优化Hugo博客，包含SEO技巧、性能优化、用户体验提升等实用方法"

# Keywords优化（3-5个）
keywords: ["Hugo博客", "SEO优化", "博客优化", "静态网站", "技术博客"]
---
```

### 内部链接策略

- **链接数量**：每篇文章2-3个内部链接
- **链接目标**：
  - 相关的工具页面：`[JSON格式化工具](/tools/json-formatter)`
  - 相关的文章：`[Hugo入门教程](/articles/hugo-tutorial)`
- **锚文本**：使用有意义的描述性文字
- **链接检查**：确保所有链接有效

## 内容质量标准

### 技术准确性

- ✅ 代码示例经过测试验证
- ✅ 技术信息准确无误
- ✅ 引用资料可靠权威
- ✅ 提供充分的上下文说明

### 语言表达

- ✅ 使用专业准确的术语
- ✅ 语言简洁明了，逻辑清晰
- ✅ 无语法错误和错别字
- ✅ 语调和风格一致

### 文章长度

- **推荐长度**：1500-3000字
- **最小长度**：800字
- **最大长度**：5000字（超过考虑分页）

## 媒体内容规范

### 图片要求

| 类型 | 尺寸 | 格式 | 大小 |
|------|------|------|------|
| 文章封面 | 1200×630px | WebP/JPEG | <200KB |
| 内容图片 | 最大宽度800px | WebP/PNG | <150KB |
| 缩略图 | 300×300px | WebP/PNG | <50KB |

### 文件命名规范

```
images/
├── cover.jpg              # 封面图片
├── screenshot-001.png     # 截图使用数字编号
├── diagram-workflow.svg   # 图表使用描述性名称
└── icon-settings.png      # 图标使用功能描述
```

### Markdown图片语法

```markdown
![图片描述](/images/posts/article/image.jpg "图片标题")

<figcaption>图片说明文字</figcaption>
```

## 代码块规范

### 基础语法

```markdown
```javascript[linenums=1]
// 代码示例
function example() {
    console.log("Hello World");
}
```

<figcaption>代码示例说明</figcaption>
```

### 支持的语言

- `javascript` / `js`
- `typescript` / `ts`
- `python` / `py`
- `html`
- `css`
- `scss`
- `json`
- `yaml`
- `bash`
- `dockerfile`

### 代码块增强

```markdown
{{< highlight javascript "linenos=table,hl_lines=8 15-17,linenostart=199" >}}
// 带行号和高亮的代码
{{< /highlight >}}
```

## 自定义短代码

### 提示框

```markdown
{{< tip >}}
这是一个提示信息
{{< /tip >}}

{{< warning >}}
这是一个警告信息
{{< /warning >}}

{{< note >}}
这是一个注意事项
{{< /note >}}
```

### 工具链接

```markdown
{{< tool-link id="json-formatter" >}}
{{< tool-link name="JSON格式化工具" >}}
```

### 图片画廊

```markdown
{{< gallery >}}
{{< figure src="image1.jpg" title="图片1" >}}
{{< figure src="image2.jpg" title="图片2" >}}
{{< /gallery >}}
```

## 发布前检查清单

### Front Matter检查

- [ ] title字段完整且简洁
- [ ] slug字段URL友好
- [ ] date字段格式正确
- [ ] author字段正确
- [ ] draft字段设置正确
- [ ] description包含关键词且长度合适
- [ ] keywords字段包含3-5个关键词
- [ ] summary字段简洁有力
- [ ] categories和tags字段完整

### 内容质量检查

- [ ] 文章结构符合规范
- [ ] 标题层级使用正确
- [ ] 技术内容经过验证
- [ ] 语言表达清晰准确
- [ ] 无语法错误和错别字
- [ ] 文章长度在推荐范围内

### SEO优化检查

- [ ] 关键词密度合理（2-3%）
- [ ] Meta信息完整
- [ ] 内部链接有效且相关
- [ ] 图片alt标签完整
- [ ] 首段包含关键词

### 技术检查

- [ ] Markdown语法正确
- [ ] 代码块语法高亮正常
- [ ] 图片显示正常
- [ ] 链接可以正常访问
- [ ] 移动端显示正常

## 常见问题

### Q: 如何设置文章为精选？
A: 在Front Matter中设置 `featured: true`

### Q: 如何添加代码行号？
A: 使用 `linenums=1` 参数或在hugo.toml中全局配置

### Q: 如何优化图片加载速度？
A: 使用WebP格式，压缩图片大小，启用懒加载

### Q: 如何设置文章摘要？
A: 在文章中添加 `<!--more-->` 分隔符，或在Front Matter中设置summary字段

### Q: 如何关联相关文章？
A: 使用related字段或在文章中手动添加相关链接

## 工具和资源

### 推荐工具

- **Markdown编辑器**：Typora, Mark Text, VS Code
- **图片优化**：TinyPNG, ImageOptim, WebP转换工具
- **SEO检查**：Yoast SEO, Screaming Frog, Google Search Console
- **语法检查**：Grammarly, Hemingway Editor

### 有用资源

- [Markdown语法指南](https://www.markdownguide.org/)
- [Hugo官方文档](https://gohugo.io/documentation/)
- [SEO优化指南](https://developers.google.com/search/docs)
- [WebP转换工具](https://squoosh.app/)

### 模板和示例

- 查看已发布文章作为参考
- 使用archetype模板快速开始
- 参考优秀技术博客的写作风格

## 持续改进

### 反馈机制

- 定期收集读者反馈
- 分析文章表现数据
- 根据SEO效果调整策略

### 更新维护

- 定期更新过时内容
- 添加新的最佳实践
- 优化文章结构和可读性

### 培训支持

- 定期组织写作培训
- 建立写作规范文档库
- 提供一对一指导和反馈

---

**联系我们**：如有任何问题或建议，请联系技术团队或提交Issue。

**最后更新**：2025年12月18日