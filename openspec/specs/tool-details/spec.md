# Tool Details Page Structure and Implementation

## Purpose
为Util.cn工具箱应用定义统一的工具详情页面结构、源码组织规范、配置管理和页面设计标准，确保所有工具页面在用户体验、代码质量和维护性方面保持一致性和专业性，同时支持快速开发和功能扩展。

## Requirements

### Requirement: 工具详情页面整体结构
每个工具详情页面 SHALL 遵循统一的页面结构布局，确保一致的用户体验。

#### Scenario: 标准页面布局
- **WHEN** 用户访问工具详情页面
- **THEN** 页面 SHALL 按以下结构组织：
  1. **面包屑导航** - 显示当前页面位置和导航路径
  2. **工具标题区** - 包含工具名称、描述和基本信息
  3. **主要功能区** - 核心工具交互界面（输入/输出/操作）
  4. **操作按钮区** - 主要操作和辅助操作按钮
  5. **SEO内容区** - 可折叠的详细说明和帮助内容
  6. **相关推荐区** - 相关工具推荐和交叉推广

#### Scenario: 响应式布局
- **WHEN** 在不同设备尺寸下显示
- **THEN** 页面 SHALL 自动适配布局：
  - **桌面端**：2列或3列网格布局，最大宽度8xl
  - **平板端**：2列网格布局，适当边距
  - **移动端**：单列布局，优化触摸操作

### Requirement: 工具页面源码组织规范
工具页面源码 SHALL 遵循统一的文件组织、命名和代码结构规范。

#### Scenario: 文件存放目录
- **WHEN** 创建工具页面文件
- **THEN** SHALL 存放在 `src/pages/tools/` 目录下
- **AND** 文件名 SHALL 使用kebab-case格式
- **AND** 文件名 SHALL 与工具ID保持一致

#### Scenario: 页面文件命名规范
- **WHEN** 命名工具页面文件
- **THEN** MUST 遵循以下规则：
  - **格式**: `[tool-name].vue`
  - **长度**: 3-50个字符
  - **字符**: 小写字母、数字、连字符
  - **语义**: 清晰反映工具功能
  - **示例**: `json-formatter.vue`, `base64-encode.vue`, `password-generator.vue`

#### Scenario: Vue组件结构规范
- **WHEN** 编写工具页面组件
- **THEN** MUST 按以下顺序组织：
  ```vue
  <template>
    <!-- 模板内容 -->
  </template>

  <script setup>
    // 1. 导入声明
    import { ref, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'

    // 2. 图标导入
    import { Icon1, Icon2 } from 'lucide-vue-next'

    // 3. 工具和分类导入
    import { tools } from '~/data/tools'
    import { categories } from '~/data/categories'

    // 4. 组件导入
    import Component1 from '~/components/Component1.vue'

    // 5. 页面元数据
    definePageMeta({
      layout: 'default'
    })

    // 6. 路由实例
    const router = useRouter()

    // 7. 工具和分类数据
    const tool = tools.find(t => t.id === 'tool-id')
    const category = categories.find(c => c.id === 'category-id')

    // 8. 响应式数据
    const data1 = ref('')
    const data2 = ref(false)

    // 9. 计算属性
    const computedData = computed(() => { /* ... */ })

    // 10. 方法定义
    const method1 = () => { /* ... */ }

    // 11. 生命周期钩子
    onMounted(() => { /* ... */ })
  </script>
  ```

### Requirement: 工具配置定义规范
每个工具 SHALL 在数据配置中定义完整的元数据信息。

#### Scenario: 工具基础配置
- **WHEN** 定义工具配置
- **THEN** MUST 包含以下字段：
  - **id**: 工具唯一标识符（kebab-case）
  - **name**: 工具显示名称（中文）
  - **description**: 工具功能描述（30-100字符）
  - **category**: 所属分类ID
  - **icon**: Lucide图标名称
  - **hot**: 是否热门工具
  - **new**: 是否新工具
  - **local**: 是否纯本地计算
  - **sortOrder**: 显示排序权重

#### Scenario: 工具扩展配置
- **WHEN** 需要额外工具信息
- **THEN** SHALL 提供以下扩展字段：
  - **viewCount**: 访问次数统计
  - **lastUpdated**: 最后更新时间
  - **tags**: 功能标签数组
  - **keywords**: 搜索关键词数组
  - **version**: 工具版本号
  - **author**: 开发者信息

#### Scenario: 配置文件结构
- **WHEN** 组织工具配置数据
- **THEN** SHALL 使用 `src/data/tools.js` 文件
- **AND** 工具配置 SHALL 按分类分组组织
- **AND** 每个分类添加注释说明

### Requirement: 页面设计标准规范
工具页面 SHALL 遵循统一的设计规范和视觉标准。

#### Scenario: 色彩和样式规范
- **WHEN** 设计工具页面界面
- **THEN** MUST 使用统一的色彩系统：
  - **主色调**: `primary` (6366f1)
  - **前景色**: `foreground` (文本)
  - **背景色**: `background` (页面)
  - **次要色**: `secondary` (辅助)
  - **强调色**: `accent` (交互)
  - **边框色**: `border` (分割线)

#### Scenario: 字体和排版规范
- **WHEN** 设置页面文字样式
- **THEN** MUST 遵循以下排版标准：
  - **主标题**: text-3xl font-bold (32px, 粗体)
  - **副标题**: text-2xl font-bold (24px, 粗体)
  - **区域标题**: text-lg font-semibold (18px, 半粗体)
  - **正文**: text-sm text-muted-foreground (14px, 次要文本)
  - **小字**: text-xs text-muted-foreground (12px, 次要文本)

#### Scenario: 交互组件规范
- **WHEN** 设计交互元素
- **THEN** MUST 使用统一样式：
  - **主按钮**: px-6 py-3 bg-primary text-primary-foreground rounded-lg
  - **次要按钮**: px-3 py-1 text-sm text-muted-foreground hover:text-foreground
  - **输入框**: p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
  - **卡片**: p-4 bg-card border border-border rounded-lg hover:bg-accent

### Requirement: 核心功能区域设计
工具的主要功能区域 SHALL 提供清晰、高效的用户交互体验。

#### Scenario: 输入区域设计
- **WHEN** 设计数据输入界面
- **THEN** SHALL 包含以下元素：
  - **区域标题**: 清晰标识输入内容类型
  - **操作按钮**: 清空、粘贴、示例数据等
  - **配置选项**: 缩进、格式等参数设置
  - **输入控件**: textarea、input、文件上传等
  - **错误提示**: 输入验证和错误信息显示

#### Scenario: 输出区域设计
- **WHEN** 设计结果展示界面
- **THEN** SHALL 包含以下元素：
  - **区域标题**: 标识输出结果
  - **操作按钮**: 复制、下载、全屏等
  - **结果展示**: 格式化的输出内容
  - **状态指示**: 处理状态和结果信息

#### Scenario: 操作按钮区域
- **WHEN** 设计主要操作界面
- **THEN** SHALL 提供以下功能：
  - **主要操作**: 执行工具核心功能的大按钮
  - **快捷键支持**: Ctrl+Enter等常用快捷键
  - **操作反馈**: 按钮状态变化和加载指示
  - **确认机制**: 重要操作的用户确认

### Requirement: SEO和内容优化
工具页面 SHALL 包含丰富的SEO内容，提升搜索引擎可见度。

#### Scenario: 可折叠帮助内容
- **WHEN** 用户需要详细说明
- **THEN** 页面 SHALL 提供可折叠的帮助区域：
  - **工具介绍**: 功能说明和使用场景
  - **使用指南**: 详细的操作步骤说明
  - **功能特性**: 核心功能和技术特点
  - **常见问题**: FAQ和解决方案
  - **相关概念**: 技术背景和扩展知识

#### Scenario: 内容结构和格式
- **WHEN** 编写SEO内容
- **THEN** MUST 遵循以下格式：
  - **标题**: 使用H2标签，包含编号标识
  - **段落**: 使用text-muted-foreground样式
  - **列表**: 使用有序/无序列表
  - **代码**: 使用代码块和行内代码
  - **强调**: 使用strong和em标签

### Requirement: 相关工具推荐
工具页面 SHALL 提供相关工具推荐，提升用户体验和工具发现。

#### Scenario: 相关工具算法
- **WHEN** 展示相关工具推荐
- **THEN** SHALL 按以下优先级选择：
  1. 同分类下的其他工具（最多3个）
  2. 功能相似的推荐工具
  3. 经常一起使用的工具组合
  4. 最近更新的热门工具

#### Scenario: 推荐界面设计
- **WHEN** 展示工具推荐卡片
- **THEN** SHALL 包含以下信息：
  - **工具图标**: 使用统一的图标系统
  - **工具名称**: 清晰的工具标题
  - **功能描述**: 简要的功能说明
  - **跳转链接**: 点击跳转到工具页面

### Requirement: 性能和用户体验优化
工具页面 SHALL 满足性能要求，提供流畅的用户体验。

#### Scenario: 加载性能优化
- **WHEN** 用户访问工具页面
- **THEN** SHALL 实现以下优化：
  - **组件懒加载**: 非关键组件延迟加载
  - **图片优化**: 使用适当的图片格式和尺寸
  - **代码分割**: 按需加载工具相关代码
  - **缓存策略**: 合理的数据缓存机制

#### Scenario: 交互体验优化
- **WHEN** 用户使用工具功能
- **THEN** SHALL 提供以下体验优化：
  - **实时反馈**: 操作结果的即时显示
  - **加载指示**: 长时间操作的进度提示
  - **错误处理**: 友好的错误信息和恢复建议
  - **快捷操作**: 常用操作的快捷方式

### Requirement: 可访问性支持
工具页面 SHALL 满足Web可访问性标准，支持所有用户群体。

#### Scenario: 键盘导航支持
- **WHEN** 用户使用键盘操作
- **THEN** 所有可交互元素 SHALL 支持键盘访问
- **AND** SHALL 提供清晰的焦点指示器

#### Scenario: 屏幕阅读器支持
- **WHEN** 用户使用屏幕阅读器
- **THEN** 页面 SHALL 提供合适的语义标签和aria属性
- **AND** 表单控件 SHALL 有关联的标签文本

#### Scenario: 色彩对比度
- **WHEN** 检查界面色彩使用
- **THEN** 文本和背景的对比度 SHALL 满足WCAG AA标准
- **AND** 重要信息 SHALL 不仅依赖颜色传达

### Requirement: 工具特定功能规范
根据不同工具类型，页面 SHALL 提供特定的功能和界面元素。

#### Scenario: 文本处理类工具
- **WHEN** 实现文本处理工具
- **THEN** SHALL 提供文本输入框、字符计数、格式选项
- **AND** 支持大文本处理和实时预览

#### Scenario: 文件处理类工具
- **WHEN** 实现文件处理工具
- **THEN** SHALL 提供文件上传、拖拽、格式选择
- **AND** 支持多文件处理和批量操作

#### Scenario: 转换类工具
- **WHEN** 实现格式转换工具
- **THEN** SHALL 提供双向转换界面和格式配置
- **AND** 支持转换预览和错误提示

#### Scenario: 生成类工具
- **WHEN** 实现数据生成工具
- **THEN** SHALL 提供参数配置和批量生成
- **AND** 支持结果导出和自定义选项