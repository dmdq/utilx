# 博客文章编写规范规格说明

## Purpose
为Util.cn技术博客建立统一的文章编写规范，确保内容质量、SEO优化和品牌一致性，提升用户体验和搜索引擎排名。

## Requirements

## ADDED Requirements

### Requirement: 文章Front Matter标准化
所有博客文章 SHALL 遵循统一的Front Matter配置标准，确保元数据的完整性和一致性。

#### Scenario: 必填字段配置
- **WHEN** 创建新文章时
- **THEN** SHALL 包含以下必填字段：
  - `title`: 文章标题（中文，50字以内）
  - `slug`: URL友好标识（英文，使用连字符分隔）
  - `date`: 发布日期（ISO 8601格式：YYYY-MM-DDTHH:MM:SS+08:00）
  - `author`: 作者名称
  - `draft`: 是否为草稿状态（boolean值）

#### Scenario: SEO优化字段配置
- **WHEN** 配置文章SEO信息时
- **THEN** SHALL 包含以下SEO字段：
  - `description`: 文章描述（150字以内，包含主要关键词）
  - `keywords`: 关键词数组（3-5个核心关键词）
  - `summary`: 文章摘要（用于列表页展示，100字以内）
  - `categories`: 分类数组（1-2个主分类）
  - `tags`: 标签数组（3-8个相关标签）

#### Scenario: 增强字段配置
- **WHEN** 配置文章增强功能时
- **THEN** SHALL 包含以下可选字段：
  - `lastmod`: 最后修改时间（ISO 8601格式）
  - `reading_time`: 是否显示阅读时间（boolean值）
  - `toc`: 是否显示目录（boolean值）
  - `featured`: 是否为精选文章（boolean值）
  - `image`: 封面图片路径（相对路径）

### Requirement: 文章结构规范化
所有博客文章 SHALL 遵循标准化的文章结构和内容组织方式，确保良好的阅读体验。

#### Scenario: 标准文章结构
- **WHEN** 编写技术文章时
- **THEN** SHALL 按以下结构组织内容：
  - **引言部分**：背景介绍、问题陈述、解决思路概述
  - **核心内容**：分步骤详细说明，包含代码示例和实际效果
  - **总结部分**：要点回顾、延伸阅读、相关资源
- **AND** 标题层级 SHALL 遵循H1→H2→H3的层次结构
- **AND** 每个章节 SHALL 适当长度，避免过于冗长

#### Scenario: 不同类型文章模板
- **WHEN** 创建不同类型的文章时
- **THEN** SHALL 使用对应的模板：
  - **技术教程**：包含背景、环境准备、实施步骤、常见问题、总结
  - **工具介绍**：包含功能概述、使用指南、最佳实践、注意事项
  - **经验分享**：包含背景介绍、挑战问题、解决方案、效果评估、经验总结

#### Scenario: 标题层级规范
- **WHEN** 组织文章内容时
- **THEN** 标题层级 SHALL 遵循以下规范：
  - H1：文章标题（每篇文章只有一个）
  - H2：主要章节标题（3-6个）
  - H3：子章节标题（每个H2下1-4个）
  - H4：细节内容（必要时使用）
- **AND** SHALL 避免跳级使用标题
- **AND** 标题 SHALL 简洁明了，反映内容要点

### Requirement: SEO优化标准化
所有博客文章 SHALL 遵循SEO最佳实践，提升搜索引擎排名和可见性。

#### Scenario: 关键词优化策略
- **WHEN** 优化文章关键词时
- **THEN** SHALL 按以下策略布局：
  - **标题**：包含主要关键词，位置靠前
  - **第一段**：自然融入主要关键词和相关词汇
  - **各级标题**：使用长尾关键词和同义词
  - **正文内容**：关键词密度控制在2-3%
  - **图片alt**：使用描述性关键词
- **AND** SHALL 避免关键词堆砌和过度优化

#### Scenario: Meta信息优化
- **WHEN** 配置页面Meta信息时
- **THEN** SHALL 遵循以下标准：
  - **Title**: 50-60字符，包含主要关键词，具有吸引力
  - **Description**: 150-160字符，描述文章内容，包含关键词
  - **Keywords**: 3-5个核心关键词，按重要性排序
- **AND** Meta信息 SHALL 准确反映文章内容，避免误导

#### Scenario: 内部链接策略
- **WHEN** 在文章中添加链接时
- **THEN** SHALL 包含2-3个内部链接：
  - 链接到相关的工具页面
  - 链接到相关的文章内容
  - 使用有意义的锚文本
  - 确保链接有效性
- **AND** SHALL 避免过度链接和链接到无关页面

### Requirement: 内容质量标准
博客文章 SHALL 达到设定的内容质量标准，确保技术准确性和用户体验。

#### Scenario: 技术准确性
- **WHEN** 包含技术内容时
- **THEN** SHALL 确保以下方面：
  - 代码示例经过测试验证
  - 技术信息准确无误
  - 引用资料可靠权威
  - 提供充分的上下文说明
- **AND** SHALL 定期更新过时的技术信息

#### Scenario: 语言表达标准
- **WHEN** 撰写文章内容时
- **THEN** SHALL 遵循语言表达标准：
  - 使用专业准确的术语
  - 语言简洁明了，逻辑清晰
  - 避免语法错误和错别字
  - 保持语调和风格的一致性
- **AND** SHALL 考虑目标读者的技术水平

#### Scenario: 媒体内容规范
- **WHEN** 使用图片和媒体内容时
- **THEN** SHALL 遵循以下规范：
  - **图片尺寸**：文章封面1200x630px，内容图片最大宽度800px
  - **文件格式**：优先WebP，备用JPEG/PNG，文件大小<200KB
  - **命名规范**：使用描述性英文文件名，避免空格和特殊字符
  - **Alt标签**：提供准确的图片描述，包含相关关键词

### Requirement: 技术实现规范
博客系统 SHALL 提供必要的技术支持和工具，确保规范的顺利实施。

#### Scenario: Hugo配置优化
- **WHEN** 配置Hugo静态站点生成器时
- **THEN** SHALL 包含以下优化配置：
  - 启用SEO相关功能（OpenGraph、TwitterCards、JsonLD）
  - 配置友好的URL结构（/articles/:slug/）
  - 设置合理的分页参数
  - 启用阅读时间计算
  - 配置代码高亮和行号显示

#### Scenario: Archetype模板支持
- **WHEN** 使用Hugo创建新文章时
- **THEN** SHALL 提供以下模板：
  - `posts.md`: 通用文章模板
  - `tutorial.md`: 技术教程模板
  - `review.md`: 工具评测模板
- **AND** 模板 SHALL 包含预配置的Front Matter字段
- **AND** SHALL 提供使用示例和说明

#### Scenario: 自定义短代码
- **WHEN** 增强文章展示效果时
- **THEN** SHALL 提供以下短代码：
  - 提示框：`{{< tip >}}`, `{{< warning >}}`, `{{< note >}}`
  - 工具链接：`{{< tool-link id="tool-id" >}}`
  - 图片画廊：`{{< gallery >}}`
  - 代码块增强：语法高亮、行号、复制功能

### Requirement: 内容审核和发布流程
博客文章 SHALL 经过标准化的审核和发布流程，确保质量和一致性。

#### Scenario: 多级审核流程
- **WHEN** 发布文章前
- **THEN** SHALL 经过以下审核流程：
  - **自检阶段**：作者检查内容完整性和格式规范
  - **技术审核**：验证技术准确性和实用性
  - **SEO审核**：检查SEO优化效果和Meta信息
  - **最终审核**：综合评估文章质量和发布就绪性
- **AND** 每个阶段 SHALL 有明确的检查清单和标准

#### Scenario: 发布前检查清单
- **WHEN** 准备发布文章时
- **THEN** SHALL 完成以下检查项目：
  - [ ] Front Matter信息完整准确
  - [ ] 文章结构符合规范
  - [ ] 技术内容经过验证
  - [ ] SEO优化符合标准
  - [ ] 图片和媒体内容正常显示
  - [ ] 内部链接有效
  - [ ] 无语法错误和错别字
  - [ ] 移动端显示正常
  - [ ] 加载速度符合要求

#### Scenario: 版本控制和更新机制
- **WHEN** 更新已发布文章时
- **THEN** SHALL 遵循以下原则：
  - 更新`lastmod`字段为当前时间
  - 在文章开头标注更新内容和日期
  - 保持历史版本的兼容性
  - 重大更新时重新进行审核流程
- **AND** SHALL 建立文章更新记录和通知机制

### Requirement: 性能优化要求
博客文章 SHALL 符合性能优化标准，提供良好的用户体验。

#### Scenario: 加载性能优化
- **WHEN** 优化文章页面性能时
- **THEN** SHALL 达到以下标准：
  - 页面加载时间 < 3秒
  - 首屏内容渲染时间 < 1.5秒
  - 图片懒加载实现
  - 静态资源压缩优化
- **AND** SHALL 定期监控和优化性能指标

#### Scenario: 移动端适配
- **WHEN** 确保移动端用户体验时
- **THEN** SHALL 符合以下标准：
  - 响应式设计正常工作
  - 触摸交互友好
  - 字体大小适合移动阅读
  - 图片在小屏幕上正确显示
- **AND** SHALL 在主流移动设备上测试兼容性

#### Scenario: 可访问性支持
- **WHEN** 考虑用户可访问性时
- **THEN** SHALL 支持以下功能：
  - 屏幕阅读器兼容
  - 键盘导航支持
  - 足够的颜色对比度
  - 语义化HTML结构
- **AND** SHALL 遵循WCAG 2.1 AA级别的可访问性标准

## MODIFIED Requirements

### Requirement: Hugo系统配置增强
现有的Hugo博客系统 SHALL 支持新的写作规范和功能要求。

#### Scenario: 配置文件更新
- **WHEN** 更新Hugo配置时
- **THEN** SHALL 修改`hugo.toml`文件以支持：
  - 新的permalinks配置
  - SEO优化参数设置
  - 自定义参数配置
  - 主题相关设置增强
- **AND** SHALL 保持向后兼容性

#### Scenario: 主题模板优化
- **WHEN** 适配新规范时
- **THEN** SHALL 更新主题模板文件：
  - `layouts/posts/single.html`: 文章详情页模板
  - `layouts/posts/list.html`: 文章列表页模板
  - `layouts/partials/seo.html`: SEO相关模板
  - `layouts/shortcodes/`: 自定义短代码模板
- **AND** SHALL 确保模板的灵活性和可维护性

这个规格说明为博客文章编写规范提供了全面的要求定义，涵盖了从内容创作到技术实现的各个方面，确保规范的科学性、完整性和可操作性。