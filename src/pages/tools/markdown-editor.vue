<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Markdown 编辑器 - 在线 Markdown 实时预览编辑器</h1>
      <p class="text-muted-foreground">一款功能强大的在线 Markdown 编辑器，支持实时预览、语法高亮、快捷工具栏和自动保存。让您专注于内容创作，无需担心格式问题。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="mb-8">
      <!-- 工具栏 -->
      <div class="bg-card border border-border rounded-t-lg px-2 py-2 flex items-center gap-1 flex-wrap">
        <!-- 常用格式按钮 -->
        <div class="flex items-center gap-0.5">
          <button
            @click="insertMarkdown('**', '**')"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="粗体"
          >
            <Bold class="w-3.5 h-3.5" />
          </button>
          <button
            @click="insertMarkdown('*', '*')"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="斜体"
          >
            <Italic class="w-3.5 h-3.5" />
          </button>
          <button
            @click="insertMarkdown('~~', '~~')"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="删除线"
          >
            <Strikethrough class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="w-px h-5 bg-border" />

        <!-- 标题按钮 -->
        <div class="flex items-center gap-0.5">
          <button
            @click="insertHeading(1)"
            class="px-2 py-1 hover:bg-muted rounded transition-colors text-xs font-bold"
            title="一级标题"
          >
            H1
          </button>
          <button
            @click="insertHeading(2)"
            class="px-2 py-1 hover:bg-muted rounded transition-colors text-xs font-bold"
            title="二级标题"
          >
            H2
          </button>
          <button
            @click="insertHeading(3)"
            class="px-2 py-1 hover:bg-muted rounded transition-colors text-xs font-bold"
            title="三级标题"
          >
            H3
          </button>
        </div>

        <div class="w-px h-5 bg-border" />

        <!-- 列表按钮 -->
        <div class="flex items-center gap-0.5">
          <button
            @click="insertList('unordered')"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="无序列表"
          >
            <List class="w-3.5 h-3.5" />
          </button>
          <button
            @click="insertList('ordered')"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="有序列表"
          >
            <ListOrdered class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="w-px h-5 bg-border" />

        <!-- 链接和图片 -->
        <div class="flex items-center gap-0.5">
          <button
            @click="insertLink"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="插入链接"
          >
            <Link class="w-3.5 h-3.5" />
          </button>
          <button
            @click="insertImage"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="插入图片"
          >
            <Image class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="w-px h-5 bg-border" />

        <!-- 代码和引用 -->
        <div class="flex items-center gap-0.5">
          <button
            @click="insertInlineCode"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="行内代码"
          >
            <Code class="w-3.5 h-3.5" />
          </button>
          <button
            @click="insertCodeBlock"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="代码块"
          >
            <FileCode class="w-3.5 h-3.5" />
          </button>
          <button
            @click="insertQuote"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="引用"
          >
            <Quote class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="w-px h-5 bg-border" />

        <!-- 分割线和表格 -->
        <div class="flex items-center gap-0.5">
          <button
            @click="insertHorizontalRule"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="分割线"
          >
            <Minus class="w-3.5 h-3.5" />
          </button>
          <button
            @click="insertTable"
            class="p-1.5 hover:bg-muted rounded transition-colors"
            title="插入表格"
          >
            <Table class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- 操作按钮 -->
        <div class="ml-auto flex items-center gap-1.5">
          <button
            @click="clearEditor"
            class="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
          <button
            @click="copyMarkdown"
            class="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            复制
          </button>
          <button
            @click="uploadMarkdown"
            class="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            上传
          </button>
          <button
            @click="downloadMarkdown"
            class="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            下载
          </button>
          <!-- 隐藏的文件上传输入框 -->
          <input
            ref="fileInputRef"
            type="file"
            accept=".md,.markdown,.txt"
            @change="handleFileUpload"
            class="hidden"
          />
        </div>
      </div>

      <!-- 编辑器和预览区 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-t-0 border-border rounded-b-lg min-h-[500px] h-[70vh]">
        <!-- 编辑器 -->
        <div class="relative">
          <textarea
            ref="editorRef"
            v-model="markdownText"
            @input="handleInput"
            @keydown="handleKeydown"
            @scroll="syncScroll"
            placeholder="在这里输入 Markdown 文本..."
            class="absolute inset-0 w-full h-full p-4 resize-none focus:outline-none font-mono text-sm bg-background"
          ></textarea>
        </div>

        <!-- 预览区 -->
        <div class="border-l bg-muted/30 p-4 overflow-auto">
          <div
            ref="previewRef"
            @scroll="syncScroll"
            v-html="renderedMarkdown"
            class="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-foreground"
            :style="{
              '--prose-h1-font-size': '1.875rem',
              '--prose-h1-line-height': '2.25rem',
              '--prose-h1-margin-top': '2rem',
              '--prose-h1-margin-bottom': '1rem',
              '--prose-h2-font-size': '1.5rem',
              '--prose-h2-line-height': '2rem',
              '--prose-h2-margin-top': '1.75rem',
              '--prose-h2-margin-bottom': '0.75rem',
              '--prose-h3-font-size': '1.25rem',
              '--prose-h3-line-height': '1.75rem',
              '--prose-h3-margin-top': '1.5rem',
              '--prose-h3-margin-bottom': '0.5rem',
              '--prose-h4-font-size': '1.125rem',
              '--prose-h4-line-height': '1.75rem',
              '--prose-h4-margin-top': '1.25rem',
              '--prose-h4-margin-bottom': '0.5rem',
              '--prose-h5-font-size': '1rem',
              '--prose-h5-line-height': '1.5rem',
              '--prose-h5-margin-top': '1rem',
              '--prose-h5-margin-bottom': '0.5rem',
              '--prose-h6-font-size': '0.875rem',
              '--prose-h6-line-height': '1.25rem',
              '--prose-h6-margin-top': '0.75rem',
              '--prose-h6-margin-bottom': '0.25rem'
            }"
          ></div>
        </div>
      </div>

      <!-- 状态栏 -->
      <div class="mt-4 flex items-center justify-between text-sm text-muted-foreground bg-card border border-border rounded-lg p-3">
        <div class="flex items-center gap-4">
          <span>{{ markdownText.length }} 个字符</span>
          <span>{{ wordCount }} 个词</span>
          <span>{{ lineCount }} 行</span>
        </div>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="autoSave"
              class="rounded"
            />
            <span>自动保存</span>
          </label>
          <span v-if="lastSaved">（{{ lastSaved }} 已保存）</span>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
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
          什么是 Markdown？
        </h2>
        <p class="text-muted-foreground mb-4">
          Markdown 是一种轻量级标记语言，由 John Gruber 在 2004 年创建。它允许人们使用易读易写的纯文本格式编写文档，
          然后转换成有效的 XHTML（或者 HTML）文档。Markdown 的目标是实现易读易写，成为一种适用于网络的书写语言。
        </p>
        <p class="text-muted-foreground">
          Markdown 的语法非常简洁，只包含少量标点符号，让文档作者能够专注于内容创作而不是复杂的格式设置。
          由于其简单性和可读性，Markdown 已成为技术文档、博客文章、README 文件和许多其他类型文档的首选格式。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          Markdown 语法快速入门
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-3">基础语法</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left py-2 text-foreground">元素</th>
                  <th class="text-left py-2 text-foreground">语法</th>
                  <th class="text-left py-2 text-foreground">效果</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border">
                  <td class="py-2">标题</td>
                  <td class="font-mono text-xs"># H1</td>
                  <td class="text-xl font-bold">H1</td>
                </tr>
                <tr class="border-b border-border">
                  <td class="py-2">粗体</td>
                  <td class="font-mono text-xs">**文本**</td>
                  <td class="font-bold">文本</td>
                </tr>
                <tr class="border-b border-border">
                  <td class="py-2">斜体</td>
                  <td class="font-mono text-xs">*文本*</td>
                  <td class="italic">文本</td>
                </tr>
                <tr>
                  <td class="py-2">链接</td>
                  <td class="font-mono text-xs">[文本](url)</td>
                  <td class="text-primary">文本</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-3">高级语法</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left py-2 text-foreground">元素</th>
                  <th class="text-left py-2 text-foreground">语法</th>
                  <th class="text-left py-2 text-foreground">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border">
                  <td class="py-2">代码块</td>
                  <td class="font-mono text-xs">```代码```</td>
                  <td class="text-xs">多行代码</td>
                </tr>
                <tr class="border-b border-border">
                  <td class="py-2">行内代码</td>
                  <td class="font-mono text-xs">`代码`</td>
                  <td class="text-xs">单行代码</td>
                </tr>
                <tr class="border-b border-border">
                  <td class="py-2">引用</td>
                  <td class="font-mono text-xs">&gt; 文本</td>
                  <td class="text-xs">引用块</td>
                </tr>
                <tr>
                  <td class="py-2">表格</td>
                  <td class="font-mono text-xs">|列|列|</td>
                  <td class="text-xs">数据表格</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>实时预览</strong>: 编辑器左侧输入，右侧即时显示渲染效果，所见即所得</li>
          <li><strong>语法高亮</strong>: 自动识别 Markdown 语法，提供清晰的视觉反馈</li>
          <li><strong>快捷工具栏</strong>: 常用格式一键插入，无需记忆繁琐的语法</li>
          <li><strong>自动保存</strong>: 开启自动保存后，内容会实时保存到本地存储</li>
          <li><strong>键盘快捷键</strong>: 支持 Ctrl+B（粗体）、Ctrl+I（斜体）等快捷操作</li>
          <li><strong>滚动同步</strong>: 编辑器和预览区滚动位置自动同步，方便对比查看</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>导出功能</strong>: 支持复制 Markdown 源码和下载为 .md 文件</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">技术文档</h3>
            <p class="text-sm text-muted-foreground">编写 API 文档、技术规范、项目 README 等技术类文档</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">博客文章</h3>
            <p class="text-sm text-muted-foreground">创作博客文章、教程、笔记等内容，专注于写作而非格式</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">项目文档</h3>
            <p class="text-sm text-muted-foreground">撰写项目说明、用户手册、开发指南等项目相关文档</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">学术写作</h3>
            <p class="text-sm text-muted-foreground">编写论文、报告、笔记等学术内容，支持数学公式和图表</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何插入图片？</h3>
            <p class="text-muted-foreground mt-1">
              点击工具栏的图片按钮，或手动输入 `![图片描述](图片链接)`。支持本地图片路径和网络图片链接。
              建议使用图床服务托管图片，然后插入图片链接。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何创建表格？</h3>
            <p class="text-muted-foreground mt-1">
              使用 `|` 分隔列，使用 `-` 分隔表头和表体。例如：`|列1|列2|\n|---|---|\n|内容1|内容2|`。
              您也可以点击工具栏的表格按钮快速插入表格模板。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些 Markdown 扩展？</h3>
            <p class="text-muted-foreground mt-1">
              本编辑器支持 GitHub Flavored Markdown (GFM)，包括表格、任务列表、删除线、自动链接等扩展语法。
              同时支持代码块语法高亮，可指定编程语言以获得更好的显示效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何使用数学公式？</h3>
            <p class="text-muted-foreground mt-1">
              对于数学公式的支持，您可以使用 LaTeX 语法，如 `$E=mc^2$` 表示行内公式，
              `$$E=mc^2$$` 表示块级公式。注意：需要您的目标平台支持 MathJax 或 KaTeX 渲染。
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
          :to="`/tools/${relatedTool.id}`"
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
import { ref, computed, watch, onMounted } from 'vue'
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Link, Image, Code, FileCode, Quote, Minus, Table,
  HelpCircle, ChevronUp, Upload,
  FileText, FileDiff, Type, Hash, FileJson, Terminal
} from 'lucide-vue-next'
import { marked } from 'marked'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'markdown-editor')
const category = categories.find(c => c.id === 'text')

// 状态管理
const markdownText = ref('')
const autoSave = ref(false)
const lastSaved = ref('')
const editorRef = ref(null)
const previewRef = ref(null)
const fileInputRef = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, FileDiff, Type, Hash, FileJson, Terminal,
  Code, Image, Link
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'markdown-editor'
  ).slice(0, 2)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'text-diff'),
    tools.find(t => t.id === 'code-format'),
    tools.find(t => t.id === 'html-encode'),
    tools.find(t => t.id === 'base64-encode')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    // 简单的语法高亮处理
    if (lang && Prism && Prism.languages[lang]) {
      return Prism.highlight(code, Prism.languages[lang], lang)
    }
    return code
  }
})

// 计算属性
const renderedMarkdown = computed(() => {
  if (!markdownText.value) return '<p class="text-muted-foreground">预览内容将在这里显示...</p>'
  try {
    return marked.parse(markdownText.value)
  } catch (error) {
    return '<p class="text-destructive">Markdown 解析错误</p>'
  }
})

const wordCount = computed(() => {
  if (!markdownText.value) return 0
  return markdownText.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const lineCount = computed(() => {
  if (!markdownText.value) return 0
  return markdownText.value.split('\n').length
})

// 自动保存功能
watch(markdownText, () => {
  if (autoSave.value) {
    saveToLocalStorage()
  }
})

onMounted(() => {
  // 从本地存储加载
  const saved = localStorage.getItem('markdown-editor-content')
  if (saved) {
    markdownText.value = saved
  }
})

// 保存到本地存储
const saveToLocalStorage = () => {
  localStorage.setItem('markdown-editor-content', markdownText.value)
  lastSaved.value = new Date().toLocaleTimeString()
}

// 处理输入
const handleInput = () => {
  if (autoSave.value) {
    saveToLocalStorage()
  }
}

// 键盘快捷键
const handleKeydown = (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'b':
        e.preventDefault()
        insertMarkdown('**', '**')
        break
      case 'i':
        e.preventDefault()
        insertMarkdown('*', '*')
        break
      case 'k':
        e.preventDefault()
        insertLink()
        break
      case 's':
        e.preventDefault()
        saveToLocalStorage()
        break
    }
  }

  // Tab 键缩进
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = e.target.selectionStart
    const end = e.target.selectionEnd
    const text = markdownText.value
    markdownText.value = text.substring(0, start) + '  ' + text.substring(end)
    e.target.selectionStart = e.target.selectionEnd = start + 2
  }
}

// 同步滚动
const syncScroll = (e) => {
  const source = e.target
  const target = source === editorRef.value ? previewRef.value : editorRef.value

  if (target) {
    const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight)
    target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight)
  }
}

// 插入 Markdown 语法
const insertMarkdown = (before, after) => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownText.value.substring(start, end)
  const replacement = before + selectedText + after

  markdownText.value =
    markdownText.value.substring(0, start) +
    replacement +
    markdownText.value.substring(end)

  // 重新设置光标位置
  textarea.focus()
  textarea.setSelectionRange(
    start + before.length,
    start + before.length + selectedText.length
  )
}

// 插入标题
const insertHeading = (level) => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const lineStart = markdownText.value.lastIndexOf('\n', start - 1) + 1
  const prefix = '#'.repeat(level) + ' '

  markdownText.value =
    markdownText.value.substring(0, lineStart) +
    prefix +
    markdownText.value.substring(lineStart)

  textarea.focus()
  textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length)
}

// 插入列表
const insertList = (type) => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const lineStart = markdownText.value.lastIndexOf('\n', start - 1) + 1
  const prefix = type === 'ordered' ? '1. ' : '- '

  markdownText.value =
    markdownText.value.substring(0, lineStart) +
    prefix +
    markdownText.value.substring(lineStart)

  textarea.focus()
  textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length)
}

// 插入链接
const insertLink = () => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownText.value.substring(start, end) || '链接文本'
  const replacement = `[${selectedText}](url)`

  markdownText.value =
    markdownText.value.substring(0, start) +
    replacement +
    markdownText.value.substring(end)

  textarea.focus()
  textarea.setSelectionRange(start + selectedText.length + 3, start + selectedText.length + 6)
}

// 插入图片
const insertImage = () => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownText.value.substring(start, end) || '图片描述'
  const replacement = `![${selectedText}](url)`

  markdownText.value =
    markdownText.value.substring(0, start) +
    replacement +
    markdownText.value.substring(end)

  textarea.focus()
  textarea.setSelectionRange(start + selectedText.length + 4, start + selectedText.length + 7)
}

// 插入行内代码
const insertInlineCode = () => {
  insertMarkdown('`', '`')
}

// 插入代码块
const insertCodeBlock = () => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const replacement = '```\n\n```'

  markdownText.value =
    markdownText.value.substring(0, start) +
    replacement +
    markdownText.value.substring(start)

  textarea.focus()
  textarea.setSelectionRange(start + 4, start + 4)
}

// 插入引用
const insertQuote = () => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const lineStart = markdownText.value.lastIndexOf('\n', start - 1) + 1

  markdownText.value =
    markdownText.value.substring(0, lineStart) +
    '> ' +
    markdownText.value.substring(lineStart)

  textarea.focus()
  textarea.setSelectionRange(lineStart + 2, lineStart + 2)
}

// 插入分割线
const insertHorizontalRule = () => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const replacement = '\n\n---\n\n'

  markdownText.value =
    markdownText.value.substring(0, start) +
    replacement +
    markdownText.value.substring(start)

  textarea.focus()
  textarea.setSelectionRange(start + replacement.length, start + replacement.length)
}

// 插入表格
const insertTable = () => {
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const table = '\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n|     |     |     |\n|     |     |     |\n'

  markdownText.value =
    markdownText.value.substring(0, start) +
    table +
    markdownText.value.substring(start)

  textarea.focus()
  textarea.setSelectionRange(start + table.length, start + table.length)
}

// 清空编辑器
const clearEditor = () => {
  if (confirm('确定要清空所有内容吗？')) {
    markdownText.value = ''
    lastSaved.value = ''
  }
}

// 复制 Markdown
const copyMarkdown = async () => {
  try {
    await navigator.clipboard.writeText(markdownText.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载 Markdown
const downloadMarkdown = () => {
  const blob = new Blob([markdownText.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `markdown-${Date.now()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 上传 Markdown
const uploadMarkdown = () => {
  fileInputRef.value.click()
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result

    // 如果当前内容不为空，提示用户是否替换
    if (markdownText.value && markdownText.value.trim()) {
      if (confirm('当前编辑器已有内容，是否要替换为上传的文件内容？')) {
        markdownText.value = content
      }
    } else {
      markdownText.value = content
    }

    // 重置文件输入框
    event.target.value = ''
  }

  reader.readAsText(file)
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// SEO配置
useSeoMeta({
  title: 'Markdown编辑器 - 在线Markdown实时预览编辑器',
  description: '免费在线Markdown编辑器，支持实时预览、语法高亮、快捷工具栏和自动保存功能。专注于内容创作，无需担心格式问题。',
  keywords: ['markdown', 'editor', 'preview', 'realtime', 'syntax', '在线编辑器', 'markdown编辑器', '实时预览']
})

definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
/* 自定义滚动条样式 */
textarea::-webkit-scrollbar,
div::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

textarea::-webkit-scrollbar-track,
div::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb,
div::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover,
div::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.3);
}

/* 文本行数限制 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 代码块样式增强 */
:deep(pre) {
  @apply bg-muted border border-border rounded-md p-3 overflow-x-auto;
}

:deep(code) {
  @apply bg-muted px-1 py-0.5 rounded text-sm;
}

:deep(pre code) {
  @apply bg-transparent p-0;
}

/* 表格样式 */
:deep(table) {
  @apply w-full border-collapse;
}

:deep(table th),
:deep(table td) {
  @apply border border-border px-3 py-2;
}

:deep(table th) {
  @apply bg-muted font-semibold;
}

/* 引用样式 */
:deep(blockquote) {
  @apply border-l-4 border-primary pl-4 my-4 italic;
}

/* 链接样式 */
:deep(a) {
  @apply text-primary hover:underline;
}

/* 列表样式 */
:deep(ul),
:deep(ol) {
  @apply my-2 pl-6;
}

:deep(ul li) {
  @apply list-disc;
}

:deep(ol li) {
  @apply list-decimal;
}

/* 强制设置标题样式 */
:deep(h1) {
  font-size: 1.875rem !important;
  line-height: 2.25rem !important;
  margin-top: 2rem !important;
  margin-bottom: 1rem !important;
  font-weight: 700 !important;
  color: hsl(var(--foreground)) !important;
  border-bottom: 1px solid hsl(var(--border)) !important;
  padding-bottom: 0.5rem !important;
}

:deep(h2) {
  font-size: 1.5rem !important;
  line-height: 2rem !important;
  margin-top: 1.75rem !important;
  margin-bottom: 0.75rem !important;
  font-weight: 600 !important;
  color: hsl(var(--foreground)) !important;
  border-bottom: 1px solid hsl(var(--border) / 0.5) !important;
  padding-bottom: 0.25rem !important;
}

:deep(h3) {
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
  margin-top: 1.5rem !important;
  margin-bottom: 0.5rem !important;
  font-weight: 600 !important;
  color: hsl(var(--foreground)) !important;
}

:deep(h4) {
  font-size: 1.125rem !important;
  line-height: 1.75rem !important;
  margin-top: 1.25rem !important;
  margin-bottom: 0.5rem !important;
  font-weight: 600 !important;
  color: hsl(var(--foreground)) !important;
}

:deep(h5) {
  font-size: 1rem !important;
  line-height: 1.5rem !important;
  margin-top: 1rem !important;
  margin-bottom: 0.5rem !important;
  font-weight: 600 !important;
  color: hsl(var(--foreground)) !important;
}

:deep(h6) {
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
  margin-top: 0.75rem !important;
  margin-bottom: 0.25rem !important;
  font-weight: 600 !important;
  color: hsl(var(--foreground)) !important;
}

/* 其他元素样式增强 */
:deep(p) {
  margin-bottom: 1rem !important;
  color: hsl(var(--foreground)) !important;
}

:deep(ul), :deep(ol) {
  margin: 1rem 0 !important;
  padding-left: 1.5rem !important;
}

:deep(li) {
  margin-bottom: 0.25rem !important;
  color: hsl(var(--foreground)) !important;
}

:deep(a) {
  color: hsl(var(--primary)) !important;
  text-decoration: none !important;
}

:deep(a:hover) {
  text-decoration: underline !important;
}

:deep(blockquote) {
  border-left: 4px solid hsl(var(--primary)) !important;
  padding-left: 1rem !important;
  margin: 1rem 0 !important;
  color: hsl(var(--muted-foreground)) !important;
  font-style: italic !important;
}
</style>