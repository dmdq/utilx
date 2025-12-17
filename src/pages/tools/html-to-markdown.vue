<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">HTML转Markdown - 在线HTML Markdown格式转换工具</h1>
      <p class="text-muted-foreground">一款免费的在线 HTML to Markdown 转换工具。支持将 HTML 内容快速转换为 Markdown 格式，保留格式和链接。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入HTML</label>
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
              示例HTML
            </button>
          </div>
        </div>
        <div class="flex items-center gap-4 mb-2">
          <label class="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              v-model="options.preserveLinks"
              class="rounded"
            />
            保留链接
          </label>
          <label class="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              v-model="options.preserveImages"
              class="rounded"
            />
            保留图片
          </label>
          <label class="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              v-model="options.preserveEmphasis"
              class="rounded"
            />
            保留强调
          </label>
          <label class="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              v-model="options.preserveCode"
              class="rounded"
            />
            保留代码
          </label>
        </div>
        <textarea
          v-model="inputHTML"
          class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入HTML代码..."
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
          <label class="text-sm font-medium text-foreground">Markdown输出</label>
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
              下载MD
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="togglePreview"
            >
              {{ showPreview ? '隐藏预览' : '显示预览' }}
            </button>
          </div>
        </div>
        <div v-if="!showPreview" class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg overflow-auto">
          <pre class="font-mono text-sm whitespace-pre-wrap">{{ outputMarkdown }}</pre>
        </div>
        <div v-else class="flex-1 w-full min-h-[400px] p-6 bg-card border border-border rounded-lg overflow-auto prose prose-sm max-w-none">
          <div v-html="previewHTML"></div>
        </div>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        转换为 Markdown
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
          什么是 HTML 转 Markdown？
        </h2>
        <p class="text-muted-foreground mb-4">
          HTML（HyperText Markup Language）是网页的标准标记语言，而 Markdown 是一种轻量级标记语言，
          旨在更易读易写。HTML 转 Markdown 是将 HTML 内容转换为 Markdown 格式的过程，让内容更适合在
          文档、README、博客文章等场景中使用。
        </p>
        <p class="text-muted-foreground">
          Markdown 语法简洁明了，可以轻松转换为 HTML、PDF 等其他格式，是技术文档、笔记、博客撰写的
          首选格式。通过本工具，您可以快速将网页内容或 HTML 文档转换为 Markdown 格式。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将 HTML 代码粘贴到左侧输入框</li>
          <li>选择需要保留的元素（链接、图片、强调等）</li>
          <li>点击"转换为 Markdown"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换后的 Markdown 结果</li>
          <li>可以点击"显示预览"查看渲染效果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的 HTML 元素
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">文本格式</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• &lt;h1&gt; - &lt;h6&gt;: 标题</li>
              <li>• &lt;p&gt;: 段落</li>
              <li>• &lt;strong&gt;, &lt;b&gt;: 粗体</li>
              <li>• &lt;em&gt;, &lt;i&gt;: 斜体</li>
              <li>• &lt;br&gt;: 换行</li>
              <li>• &lt;hr&gt;: 分割线</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">列表和链接</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• &lt;ul&gt;: 无序列表</li>
              <li>• &lt;ol&gt;: 有序列表</li>
              <li>• &lt;li&gt;: 列表项</li>
              <li>• &lt;a&gt;: 链接</li>
              <li>• &lt;img&gt;: 图片</li>
              <li>• &lt;blockquote&gt;: 引用</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">代码元素</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• &lt;code&gt;: 行内代码</li>
              <li>• &lt;pre&gt;: 代码块</li>
              <li>• 保留代码格式</li>
              <li>• 转义特殊字符</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">表格</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• &lt;table&gt;: 表格</li>
              <li>• &lt;thead&gt;: 表头</li>
              <li>• &lt;tbody&gt;: 表体</li>
              <li>• &lt;tr&gt;: 行</li>
              <li>• &lt;th&gt;, &lt;td&gt;: 单元格</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能解析</strong>: 准确识别 HTML 结构并转换为对应的 Markdown 语法</li>
          <li><strong>保留格式</strong>: 保持原有的文本格式、链接、图片等元素</li>
          <li><strong>可配置选项</strong>: 可以选择需要保留的元素类型</li>
          <li><strong>实时预览</strong>: 支持 Markdown 实时预览功能</li>
          <li><strong>批量转换</strong>: 支持复杂 HTML 文档的转换</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          HTML vs Markdown 对比
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">HTML 特点</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 标签成对出现</li>
              <li>• 支持复杂的样式</li>
              <li>• 适合网页展示</li>
              <li>• 语法冗长</li>
              <li>• 不易纯文本编辑</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">Markdown 特点</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 语法简洁</li>
              <li>• 易读易写</li>
              <li>• 适合文档写作</li>
              <li>• 纯文本友好</li>
              <li>• 可转换多种格式</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">转换后的 Markdown 会丢失样式吗？</h3>
            <p class="text-muted-foreground mt-1">
              Markdown 本身不支持复杂的 CSS 样式，所以会丢失颜色、字体、布局等样式信息。
              但会保留文档的结构、链接、图片等核心内容。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理 HTML 中的脚本和样式？</h3>
            <p class="text-muted-foreground mt-1">
              本工具会忽略 &lt;script&gt; 和 &lt;style&gt; 标签及其内容，因为这些元素在 Markdown 中没有对应的概念。
              如果需要保留样式信息，建议使用 CSS 类或其他注释方式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持转换 HTML 表格吗？</h3>
            <p class="text-muted-foreground mt-1">
              支持。HTML 表格会被转换为 GitHub Flavored Markdown (GFM) 格式的表格。
              注意：一些复杂的表格结构（如合并单元格）可能需要手动调整。
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
  title: 'HTML转Markdown - 在线HTML Markdown格式转换工具',
  description: '免费在线 HTML to Markdown 转换工具，支持将 HTML 内容快速转换为 Markdown 格式，保留格式和链接。纯本地计算，数据安全。',
  keywords: 'HTML转Markdown, HTML to Markdown, HTML Markdown转换, 网页转Markdown, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'HTML转Markdown - 在线HTML Markdown格式转换工具',
  ogDescription: '免费在线 HTML to Markdown 转换工具，支持将 HTML 内容快速转换为 Markdown 格式。',
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
        name: 'HTML转Markdown工具',
        description: '免费在线 HTML to Markdown 转换工具，支持将 HTML 内容快速转换为 Markdown 格式',
        url: 'https://www.util.cn/tools/html-to-markdown',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'HTML转Markdown',
          '保留链接',
          '保留图片',
          '智能解析',
          '实时预览',
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
const tool = tools.find(t => t.id === 'html-to-markdown')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputHTML = ref('')
const outputMarkdown = ref('')
const inputError = ref('')

// 转换选项
const options = ref({
  preserveLinks: true,
  preserveImages: true,
  preserveEmphasis: true,
  preserveCode: true
})

// 预览相关
const showPreview = ref(false)
const previewHTML = ref('')

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
    t.category === 'format' && t.id !== 'html-to-markdown'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'markdown-to-html'),
    tools.find(t => t.id === 'html-formatter'),
    tools.find(t => t.id === 'markdown-editor'),
    tools.find(t => t.id === 'text-diff')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// HTML 转 Markdown
const htmlToMarkdown = (html, opts) => {
  // 创建一个临时的 DOM 元素来解析 HTML
  const div = document.createElement('div')
  div.innerHTML = html

  // 递归处理节点
  const processNode = (node, depth = 0) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      let result = ''

      // 处理子节点
      const children = Array.from(node.childNodes).map(child => processNode(child, depth + 1)).join('')

      // 根据标签类型进行转换
      switch (tagName) {
        case 'h1':
          result = `# ${children}\n\n`
          break
        case 'h2':
          result = `## ${children}\n\n`
          break
        case 'h3':
          result = `### ${children}\n\n`
          break
        case 'h4':
          result = `#### ${children}\n\n`
          break
        case 'h5':
          result = `##### ${children}\n\n`
          break
        case 'h6':
          result = `###### ${children}\n\n`
          break
        case 'p':
          result = `${children}\n\n`
          break
        case 'strong':
        case 'b':
          result = opts.preserveEmphasis ? `**${children}**` : children
          break
        case 'em':
        case 'i':
          result = opts.preserveEmphasis ? `*${children}*` : children
          break
        case 'code':
          result = opts.preserveCode ? `\`${children}\`` : children
          break
        case 'pre':
          result = opts.preserveCode ? `\`\`\`\n${children}\n\`\`\`\n\n` : children
          break
        case 'a':
          if (opts.preserveLinks && node.href) {
            result = `[${children}](${node.href})`
          } else {
            result = children
          }
          break
        case 'img':
          if (opts.preserveImages && node.src) {
            const alt = node.alt || ''
            result = `![${alt}](${node.src})`
          } else {
            result = ''
          }
          break
        case 'br':
          result = '  \n'
          break
        case 'hr':
          result = '---\n\n'
          break
        case 'blockquote':
          result = children.split('\n').map(line => `> ${line}`).join('\n') + '\n\n'
          break
        case 'ul':
          result = processList(node, 'ul', depth)
          break
        case 'ol':
          result = processList(node, 'ol', depth)
          break
        case 'table':
          result = processTable(node)
          break
        case 'div':
        case 'section':
        case 'article':
          result = children + '\n\n'
          break
        case 'span':
          result = children
          break
        default:
          result = children
      }

      return result
    }

    return ''
  }

  // 处理列表
  const processList = (listNode, type, depth) => {
    const items = Array.from(listNode.querySelectorAll(':scope > li'))
    let result = ''

    items.forEach((item, index) => {
      const content = Array.from(item.childNodes).map(node => processNode(node, depth + 1)).join('')
      const indent = '  '.repeat(depth)

      if (type === 'ul') {
        result += `${indent}- ${content.trim()}\n`
      } else {
        result += `${indent}${index + 1}. ${content.trim()}\n`
      }
    })

    return result + '\n'
  }

  // 处理表格
  const processTable = (tableNode) => {
    const rows = Array.from(tableNode.querySelectorAll('tr'))
    if (rows.length === 0) return ''

    let result = ''
    let isFirstRow = true

    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th'))
      const markdown = cells.map(cell => {
        const content = Array.from(cell.childNodes).map(node => processNode(node, 0)).join('')
        return ` ${content.trim()} `
      }).join('|')

      result += `|${markdown}|\n`

      if (isFirstRow) {
        const separator = cells.map(() => ' --- ').join('|')
        result += `|${separator}|\n`
        isFirstRow = false
      }
    })

    return result + '\n'
  }

  return processNode(div).trim()
}

// 执行转换
const convert = () => {
  if (!inputHTML.value) return

  try {
    inputError.value = ''
    outputMarkdown.value = htmlToMarkdown(inputHTML.value, options.value)
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputMarkdown.value = ''
  }
}

// 切换预览
const togglePreview = () => {
  showPreview.value = !showPreview.value
  if (showPreview.value && outputMarkdown.value) {
    previewHTML.value = marked(outputMarkdown.value)
  }
}

// 监听输出变化，更新预览
watch(outputMarkdown, (newValue) => {
  if (showPreview.value && newValue) {
    previewHTML.value = marked(newValue)
  }
})

// 清空输入
const clearInput = () => {
  inputHTML.value = ''
  outputMarkdown.value = ''
  inputError.value = ''
  previewHTML.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputHTML.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  inputHTML.value = `<!DOCTYPE html>
<html>
<head>
    <title>示例文档</title>
</head>
<body>
    <h1>欢迎使用HTML转Markdown工具</h1>
    <p>这是一个<strong>功能强大</strong>的转换工具，支持将<em>HTML</em>内容转换为Markdown格式。</p>

    <h2>主要特性</h2>
    <ul>
        <li>支持各种HTML标签</li>
        <li>保留链接和图片</li>
        <li>智能格式化</li>
        <li>实时预览功能</li>
    </ul>

    <h3>代码示例</h3>
    <p>以下是一个<code>代码示例</code>：</p>
    <pre><code>function hello() {
    console.log("Hello, World!");
}</code></pre>

    <h3>表格示例</h3>
    <table>
        <tr>
            <th>功能</th>
            <th>状态</th>
            <th>描述</th>
        </tr>
        <tr>
            <td>文本转换</td>
            <td>✓ 支持</td>
            <td>段落、标题、列表等</td>
        </tr>
        <tr>
            <td>链接处理</td>
            <td>✓ 支持</td>
            <td>保留所有链接信息</td>
        </tr>
    </table>

    <blockquote>
        <p><strong>提示：</strong>您可以选择保留哪些元素类型。</p>
    </blockquote>

    <p>访问我们的<a href="https://example.com">官方网站</a>了解更多信息。</p>
</body>
</html>`
}

// 复制输出
const copyOutput = async () => {
  if (!outputMarkdown.value) return

  try {
    await navigator.clipboard.writeText(outputMarkdown.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputMarkdown.value) return

  const blob = new Blob([outputMarkdown.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'converted.md'
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