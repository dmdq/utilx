<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Markdown转HTML - 在线Markdown HTML转换工具</h1>
      <p class="text-muted-foreground">一款免费的在线 Markdown to HTML 转换工具。支持将 Markdown 文本转换为 HTML 格式，支持扩展语法。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入Markdown</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteFromClipboard"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadSample"
            >
              示例MD
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                v-model="options.gfm"
                class="rounded"
              />
              GitHub风格
            </label>
            <label class="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                v-model="options.breaks"
                class="rounded"
              />
              换行符
            </label>
            <label class="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                v-model="options.tables"
                class="rounded"
              />
              表格
            </label>
            <label class="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                v-model="options.taskLists"
                class="rounded"
              />
              任务列表
            </label>
          </div>
        </div>
        <textarea
          v-model="inputMarkdown"
          class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入Markdown文本..."
          @keydown.ctrl.enter="convert"
          @keydown.meta.enter="convert"
        ></textarea>
        <div v-if="inputError" class="mt-2 p-2 bg-destructive/20 text-destructive text-sm rounded">
          {{ inputError }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">HTML输出</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyOutput"
            >
              复制
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="downloadOutput"
            >
              下载HTML
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="togglePreview"
            >
              {{ showPreview ? '显示源码' : '显示预览' }}
            </button>
          </div>
        </div>
        <div v-if="!showPreview" class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg overflow-auto">
          <pre class="font-mono text-sm whitespace-pre-wrap">{{ outputHTML }}</pre>
        </div>
        <div v-else class="flex-1 w-full min-h-[400px] p-6 bg-card border border-border rounded-lg overflow-auto">
          <div v-html="outputHTML" class="prose prose-sm max-w-none"></div>
        </div>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        转换为 HTML
      </button>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 Markdown 转 HTML？
        </h2>
        <p class="text-muted-foreground mb-4">
          Markdown 是一种轻量级标记语言，而 HTML（HyperText Markup Language）是网页的标准标记语言。
          Markdown 转 HTML 是将 Markdown 文本转换为对应的 HTML 代码的过程，让 Markdown 内容可以在网页中显示。
        </p>
        <p class="text-muted-foreground">
          Markdown 的简洁语法使其成为写作、文档、博客等场景的理想选择。通过转换为 HTML，
          Markdown 内容可以在任何支持 HTML 的平台和浏览器中完美展示。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将 Markdown 文本粘贴到左侧输入框</li>
          <li>选择需要的扩展语法选项</li>
          <li>点击"转换为 HTML"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换后的 HTML 结果</li>
          <li>可以点击"显示预览"查看渲染效果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的 Markdown 语法
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">基础语法</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• # 标题 (H1-H6)</li>
              <li>• *斜体* 或 _斜体_</li>
              <li>• **粗体** 或 __粗体__</li>
              <li>• ~~删除线~~</li>
              <li>• `行内代码`</li>
              <li>• > 引用</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">列表和链接</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• - 无序列表</li>
              <li>• 1. 有序列表</li>
              <li>• [链接文本](URL)</li>
              <li>• ![图片](URL)</li>
              <li>• [任务列表] - [x] 完成</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">代码块</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• ```语言 代码块```</li>
              <li>• 语法高亮</li>
              <li>• 行号显示</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">扩展语法</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• | 表格 | 支持 |</li>
              <li>• --- 分割线</li>
              <li>• 自动链接</li>
              <li>• 脚注</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>完整支持</strong>: 支持标准 Markdown 和 GitHub Flavored Markdown (GFM)</li>
          <li><strong>扩展语法</strong>: 支持表格、任务列表、删除线等扩展语法</li>
          <li><strong>代码高亮</strong>: 支持代码块的语法高亮</li>
          <li><strong>实时预览</strong>: 可以实时预览转换后的 HTML 效果</li>
          <li><strong>安全输出</strong>: 生成安全、规范的 HTML 代码</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          扩展选项说明
        </h2>
        <div class="space-y-3 mb-6">
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">GitHub 风格 (GFM)</h4>
            <p class="text-sm text-muted-foreground">
              启用 GitHub Flavored Markdown 扩展，包括表格、任务列表、删除线等语法。
            </p>
          </div>
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">换行符</h4>
            <p class="text-sm text-muted-foreground">
              将换行符转换为 &lt;br&gt; 标签，而不是段落分隔。
            </p>
          </div>
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">表格</h4>
            <p class="text-sm text-muted-foreground">
              支持使用管道符创建表格，自动生成对应的 HTML table 标签。
            </p>
          </div>
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">任务列表</h4>
            <p class="text-sm text-muted-foreground">
              支持 - [x] 和 - [ ] 语法创建可交互的任务列表。
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的 HTML 包含 CSS 样式吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具只生成基础的 HTML 标签，不包含 CSS 样式。您需要自己添加样式表来美化显示效果。
              如果需要完整的页面，可以选择导出为完整的 HTML 文件。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持自定义渲染规则吗？</h3>
            <p class="text-muted-foreground mt-1">
              当前版本使用标准的 Markdown 渲染规则。如果需要自定义渲染，
              可以使用代码块功能，或在转换后手动调整 HTML 代码。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理 HTML 注入问题？</h3>
            <p class="text-muted-foreground mt-1">
              本工具会自动转义 HTML 特殊字符，防止恶意代码注入。
              如果需要在 Markdown 中嵌入原始 HTML，可以使用代码块或注释方式。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}/`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileJson, FileText, Copy, Download, Eye, EyeOff,
  Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import { marked } from 'marked'

// SEO 配置
useSeoMeta({
  title: 'Markdown转HTML - 在线Markdown HTML转换工具',
  description: '免费在线 Markdown to HTML 转换工具，支持将 Markdown 文本转换为 HTML 格式，支持扩展语法。纯本地计算，数据安全。',
  keywords: 'Markdown转HTML, Markdown to HTML, Markdown HTML转换, MD转HTML, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'Markdown转HTML - 在线Markdown HTML转换工具',
  ogDescription: '免费在线 Markdown to HTML 转换工具，支持将 Markdown 文本转换为 HTML 格式。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// Schema.org 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Markdown转HTML工具',
        description: '免费在线 Markdown to HTML 转换工具，支持将 Markdown 文本转换为 HTML 格式',
        url: 'https://www.util.cn/tools/markdown-to-html',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'Markdown转HTML',
          'GitHub风格',
          '表格支持',
          '任务列表',
          '代码高亮',
          '本地处理'
        ]
      })
    }
  ]
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'markdown-to-html')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputMarkdown = ref('')
const outputHTML = ref('')
const inputError = ref('')

// 转换选项
const options = ref({
  gfm: true,
  breaks: false,
  tables: true,
  taskLists: true
})

// 预览相关
const showPreview = ref(false)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, Eye, EyeOff
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'format' && t.id !== 'markdown-to-html'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'html-to-markdown'),
    tools.find(t => t.id === 'markdown-editor'),
    tools.find(t => t.id === 'html-formatter'),
    tools.find(t => t.id === 'text-diff')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 配置 marked
const configureMarked = () => {
  marked.setOptions({
    highlight: function(code, lang) {
      // 简单的代码高亮处理
      return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code)}</code></pre>`
    },
    langPrefix: 'language-',
    smartypants: true,
    xhtml: false
  })

  // 自定义渲染器
  const renderer = new marked.Renderer()

  // 自定义代码块渲染
  renderer.code = function(code, language) {
    const validLang = language && language.match(/^[^ \r\n\t\f<>]+$/)
    const lang = validLang ? language : ''
    return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>\n`
  }

  // 自定义任务列表
  renderer.listitem = function(text) {
    if (/^\s*\[[x ]\]\s*/.test(text)) {
      text = text.replace(/^\s*\[ \]\s*/, '<input type="checkbox" disabled> ')
        .replace(/^\s*\[x\]\s*/, '<input type="checkbox" checked disabled> ')
      return `<li class="task-list-item">${text}</li>\n`
    }
    return `<li>${text}</li>\n`
  }

  // 应用自定义渲染器
  marked.use({ renderer })
}

// HTML 转义
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// 执行转换
const convert = () => {
  if (!inputMarkdown.value) return

  try {
    inputError.value = ''

    // 配置 marked
    configureMarked()

    // 设置选项
    const markedOptions = {
      gfm: options.value.gfm,
      breaks: options.value.breaks,
      tables: options.value.tables,
      taskLists: options.value.taskLists,
      sanitize: false,
      smartLists: true,
      smartypants: true
    }

    // 转换 Markdown 到 HTML
    outputHTML.value = marked(inputMarkdown.value, markedOptions)
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputHTML.value = ''
  }
}

// 切换预览
const togglePreview = () => {
  showPreview.value = !showPreview.value
}

// 监听选项变化，自动重新转换
watch(options, () => {
  if (inputMarkdown.value) {
    convert()
  }
}, { deep: true })

// 清空输入
const clearInput = () => {
  inputMarkdown.value = ''
  outputHTML.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputMarkdown.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  inputMarkdown.value = `# Markdown 示例文档

欢迎使用 **Markdown 转 HTML** 工具！这是一个功能强大的转换器，支持各种 Markdown 语法。

## 基础语法示例

### 文本格式

- **粗体文本**
- *斜体文本*
- ~~删除线文本~~
- \`行内代码\`

### 列表

#### 无序列表
- 第一项
- 第二项
  - 嵌套项 1
  - 嵌套项 2
- 第三项

#### 有序列表
1. 第一步
2. 第二步
3. 第三步

### 任务列表

- [x] 已完成的任务
- [ ] 待完成的任务
- [ ] 另一个待办事项

## 代码示例

### 行内代码
在文本中使用 \`console.log('Hello')\` 输出信息。

### 代码块

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome, \${name}\`;
}

// 调用函数
greet('World');
\`\`\`

\`\`\`python
def greet(name):
    print(f"Hello, {name}!")
    return f"Welcome, {name}"

# 调用函数
greet("World")
\`\`\`

## 表格示例

| 功能 | 状态 | 说明 |
|------|------|------|
| 标题 | ✅ 支持 | H1-H6 标题 |
| 列表 | ✅ 支持 | 有序和无序列表 |
| 链接 | ✅ 支持 | 内联和引用链接 |
| 图片 | ✅ 支持 | ![示例](https://example.com/image.png) |

## 引用示例

> 这是一个引用块。
>
> 可以包含多个段落，以及其他的 Markdown 元素。
>
> > 嵌套引用也是支持的。

---

## 链接

- [内联链接](https://example.com)
- [引用链接][1]
- [自动链接](https://github.com)

[1]: https://example.com "链接标题"

## 分割线

上面是一个分割线。

---

### 试试这些功能！

1. 编辑左侧的 Markdown 文本
2. 选择需要的扩展选项
3. 点击转换按钮查看结果
4. 使用预览功能查看最终效果`
}

// 复制输出
const copyOutput = async () => {
  if (!outputHTML.value) return

  try {
    await navigator.clipboard.writeText(outputHTML.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputHTML.value) return

  const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown转换结果</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        pre {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        code {
            background: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #f5f5f5;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 0;
            padding-left: 20px;
            color: #666;
        }
        .task-list-item {
            list-style: none;
        }
    </style>
</head>
<body>
${outputHTML.value}
</body>
</html>`

  const blob = new Blob([htmlTemplate], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'converted.html'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  // 跳转到具体工具页面
  router.push(`/tools/${selectedTool.id}/`)
  // 添加到最近使用
  addRecentTool(selectedTool.id)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>