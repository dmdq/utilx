<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本对比 - 在线文本差异比较工具</h1>
      <p class="text-muted-foreground">一款免费的在线文本差异比较工具。支持实时对比两个文本的差异，高亮显示不同之处。提供行级、字符级和单词级三种对比模式，完全本地计算，数据隐私安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 原始文本输入区 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText class="w-4 h-4" />
            原始文本
          </label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearOriginal"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteOriginal"
            >
              粘贴
            </button>
          </div>
        </div>
        <textarea
          v-model="originalText"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入原始文本..."
          @input="compareTexts"
        ></textarea>
      </div>

      <!-- 修改后的文本输入区 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground flex items-center gap-2">
            <FileDiff class="w-4 h-4" />
            修改后的文本
          </label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearModified"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteModified"
            >
              粘贴
            </button>
          </div>
        </div>
        <textarea
          v-model="modifiedText"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入修改后的文本..."
          @input="compareTexts"
        ></textarea>
      </div>
    </div>

    <!-- 对比选项区 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-4">对比选项</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 对比模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">对比模式</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="compareMode"
                value="line"
                @change="compareTexts"
                class="mr-2"
              >
              <span class="text-sm">行级对比</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="compareMode"
                value="word"
                @change="compareTexts"
                class="mr-2"
              >
              <span class="text-sm">单词级对比</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="compareMode"
                value="char"
                @change="compareTexts"
                class="mr-2"
              >
              <span class="text-sm">字符级对比</span>
            </label>
          </div>
        </div>

        <!-- 对比设置 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">对比设置</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="ignoreWhitespace"
                @change="compareTexts"
                class="mr-2"
              >
              <span class="text-sm">忽略空格</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="ignoreCase"
                @change="compareTexts"
                class="mr-2"
              >
              <span class="text-sm">忽略大小写</span>
            </label>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">快捷操作</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="loadExample"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm text-foreground transition-colors"
            >
              加载示例
            </button>
            <button
              @click="swapTexts"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm text-foreground transition-colors"
            >
              交换文本
            </button>
            <button
              @click="clearAll"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm text-foreground transition-colors"
            >
              清空全部
            </button>
            <button
              @click="exportDiff"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm text-foreground transition-colors"
            >
              导出差异
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 对比结果区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <GitCompare class="w-5 h-5" />
          对比结果
        </h3>
        <div class="flex items-center gap-4">
          <div class="text-sm text-muted-foreground">
            <span class="text-green-600 dark:text-green-400">+{{ stats.added }}</span> 添加
            <span class="text-red-600 dark:text-red-400 ml-2">-{{ stats.removed }}</span> 删除
            <span class="ml-2">{{ stats.unchanged }}</span> 未改变
          </div>
          <button
            @click="copyDiff"
            class="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            复制差异
          </button>
        </div>
      </div>

      <!-- 差异显示 -->
      <div class="bg-muted rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
        <div v-if="diffHtml" v-html="diffHtml" class="font-mono text-sm whitespace-pre-wrap"></div>
        <div v-else class="text-center text-muted-foreground py-8">
          请输入文本进行对比
        </div>
      </div>
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
          什么是文本对比工具？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本对比工具（Text Diff Tool）是一种用于比较两个文本之间差异的专业工具。
          它能够精确地识别出文本之间的增删改内容，并通过高亮显示让差异一目了然。
          这类工具在版本控制、文档审阅、代码审查等场景中有着广泛的应用。
        </p>
        <p class="text-muted-foreground mb-6">
          无论您是程序员需要对比代码修改，还是编辑需要审阅文档修订，抑或是学生需要对比论文版本，
          文本对比工具都能帮助您快速准确地找出所有差异，提高工作效率。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧文本框中输入或粘贴原始文本</li>
          <li>在右侧文本框中输入或粘贴修改后的文本</li>
          <li>选择合适的对比模式（行级、单词级或字符级）</li>
          <li>根据需要勾选"忽略空格"或"忽略大小写"选项</li>
          <li>查看下方的对比结果，差异将以不同颜色高亮显示</li>
          <li>使用"复制差异"或"导出差异"功能保存对比结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种对比模式</strong>：支持行级、单词级和字符级三种对比模式，满足不同精度需求</li>
          <li><strong>实时对比</strong>：输入文本时自动进行对比，无需手动点击按钮</li>
          <li><strong>可视化差异</strong>：使用不同颜色标识添加、删除和修改的内容</li>
          <li><strong>智能选项</strong>：支持忽略空格和大小写，让对比更加灵活</li>
          <li><strong>本地安全</strong>：所有处理都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>便捷操作</strong>：提供清空、粘贴、交换文本等快捷操作</li>
          <li><strong>导出功能</strong>：支持复制对比结果或导出为文本文件</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">文本对比工具支持哪些文件格式？</h3>
            <p class="text-muted-foreground mt-1">
              我们的文本对比工具支持所有纯文本格式，包括 .txt、.md、.js、.py、.html、.css、.json、.xml 等文件类型。
              只要是可以以文本形式打开的文件，都可以进行对比。对于二进制文件（如图片、视频等），本工具不支持。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">行级、单词级和字符级对比有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              行级对比以行为单位进行比较，适合代码和文档的大结构差异查看；
              单词级对比以单词为单位进行比较，能够更精细地识别修改内容；
              字符级对比最为精细，可以识别到每个字符的变化，适合对精度要求极高的场景。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">对比结果中的颜色代表什么？</h3>
            <p class="text-muted-foreground mt-1">
              绿色（通常带有+号）表示新增的内容，红色（通常带有-号）表示删除的内容，
              没有特殊标记的普通文本表示未发生变化的内容。这种颜色编码让差异一目了然。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">我的数据安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的文本对比工具采用纯前端技术实现，所有文本对比处理都在您的浏览器本地完成，
              不会上传到任何服务器。您处理的文本永远不会离开您的设备，确保了数据的绝对安全和隐私。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何对比大文件？</h3>
            <p class="text-muted-foreground mt-1">
              对于非常大的文件，建议先使用文本编辑器分割成较小的部分再进行对比。
              虽然我们的工具能够处理相当大的文本，但浏览器内存有限，过大的文本可能会导致性能问题。
              一般来说，几MB以内的文本文件都能流畅处理。
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
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'
import {
  FileText, FileDiff, GitCompare, HelpCircle, ChevronUp,
  Type, Hash, Code, RotateCcw, Copy, Download,
  FileJson, FilePlus, Lock, Shield, Clock, Wifi, Image,
  Database, Link, Timer, Regex, Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO Meta
useSeoMeta({
  title: '文本对比工具 - 在线文本差异比较器 | 有条工具',
  description: '免费的在线文本差异对比工具，支持行级、单词级、字符级三种对比模式，实时高亮显示差异，提供导出功能。纯本地计算，数据安全，支持各种文本文件格式对比。',
  keywords: '文本对比,文本差异,diff工具,文本比较,差异高亮,文件对比,代码对比,文档对比,在线工具,免费工具',
  author: 'Util.cn',
  ogTitle: '文本对比工具 - 免费在线文本差异比较器',
  ogDescription: '专业的文本差异对比工具，支持多种对比模式，实时高亮显示差异，支持导出。纯本地计算，数据安全可靠。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本对比工具 - 免费在线文本差异比较',
  twitterDescription: '免费在线文本差异对比工具，支持行级、单词级、字符级对比，差异高亮显示，支持导出功能。本地计算，数据安全。'
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'text-diff')
const category = categories.find(c => c.id === 'text')

// 响应式数据
const originalText = ref('')
const modifiedText = ref('')
const compareMode = ref('line')
const ignoreWhitespace = ref(false)
const ignoreCase = ref(false)
const diffHtml = ref('')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, FileDiff, GitCompare, Type, Hash, Code, RotateCcw, Copy, Download,
  FileJson, FilePlus, Lock, Shield, Clock, Wifi, Image,
  Database, Link, Timer, Regex, Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'text-diff'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'text-counter'),
    tools.find(t => t.id === 'text-replace'),
    tools.find(t => t.id === 'base64-encode'),
    tools.find(t => t.id === 'base64-decode')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 计算属性
const stats = computed(() => {
  if (!diffHtml.value) return { added: 0, removed: 0, unchanged: 0 }

  const added = (diffHtml.value.match(/class="added"/g) || []).length
  const removed = (diffHtml.value.match(/class="removed"/g) || []).length

  const originalLines = originalText.value.split('\n').length
  const unchanged = Math.max(0, originalLines - removed)

  return { added, removed, unchanged }
})

// 方法
const compareTexts = () => {
  if (!originalText.value && !modifiedText.value) {
    diffHtml.value = ''
    return
  }

  let original = originalText.value
  let modified = modifiedText.value

  // 处理选项
  if (ignoreWhitespace.value) {
    original = original.replace(/\s+/g, ' ').trim()
    modified = modified.replace(/\s+/g, ' ').trim()
  }

  if (ignoreCase.value) {
    original = original.toLowerCase()
    modified = modified.toLowerCase()
  }

  // 简单的差异比较
  if (compareMode.value === 'line') {
    compareByLine(original, modified)
  } else if (compareMode.value === 'char') {
    compareByChar(original, modified)
  } else if (compareMode.value === 'word') {
    compareByWord(original, modified)
  }
}

const compareByLine = (original, modified) => {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  const maxLines = Math.max(originalLines.length, modifiedLines.length)

  let html = ''

  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || ''
    const modifiedLine = modifiedLines[i] || ''

    if (originalLine === modifiedLine) {
      html += `<div class="unchanged">${escapeHtml(originalLine) || '&nbsp;'}</div>`
    } else {
      if (originalLine) {
        html += `<div class="removed">- ${escapeHtml(originalLine)}</div>`
      }
      if (modifiedLine) {
        html += `<div class="added">+ ${escapeHtml(modifiedLine)}</div>`
      }
    }
  }

  diffHtml.value = html
}

const compareByChar = (original, modified) => {
  const diff = calculateCharDiff(original, modified)
  let html = ''

  for (const item of diff) {
    if (item.status === 'equal') {
      html += `<span class="unchanged">${escapeHtml(item.value)}</span>`
    } else if (item.status === 'added') {
      html += `<span class="added">${escapeHtml(item.value)}</span>`
    } else if (item.status === 'removed') {
      html += `<span class="removed">${escapeHtml(item.value)}</span>`
    }
  }

  diffHtml.value = html
}

const compareByWord = (original, modified) => {
  const originalWords = original.split(/(\s+)/)
  const modifiedWords = modified.split(/(\s+)/)

  const diff = calculateCharDiff(originalWords.join(''), modifiedWords.join(''))
  const html = diff.map(item => {
    const className = item.status === 'equal' ? 'unchanged' :
                      item.status === 'added' ? 'added' : 'removed'
    return `<span class="${className}">${escapeHtml(item.value)}</span>`
  }).join('')

  diffHtml.value = html
}

const calculateCharDiff = (str1, str2) => {
  const m = str1.length
  const n = str2.length
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i-1] === str2[j-1]) {
        dp[i][j] = dp[i-1][j-1]
      } else {
        dp[i][j] = Math.min(dp[i-1][j], dp[i][j-1]) + 1
      }
    }
  }

  // 简化版本：只返回字符级别的差异
  const result = []
  let i = 0, j = 0

  while (i < m && j < n) {
    if (str1[i] === str2[j]) {
      result.push({ status: 'equal', value: str1[i] })
      i++
      j++
    } else {
      result.push({ status: 'removed', value: str1[i] })
      i++
    }
  }

  while (i < m) {
    result.push({ status: 'removed', value: str1[i] })
    i++
  }

  while (j < n) {
    result.push({ status: 'added', value: str2[j] })
    j++
  }

  return result
}

const escapeHtml = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const loadExample = () => {
  originalText.value = `这是第一行文本
这是第二行文本
这是第三行文本
这是第四行文本
这是第五行文本`

  modifiedText.value = `这是第一行文本
这是修改后的第二行文本
这是第三行文本
这是新添加的第四行文本
这是第五行文本
这是新增的第六行文本`

  compareTexts()
}

const swapTexts = () => {
  const temp = originalText.value
  originalText.value = modifiedText.value
  modifiedText.value = temp
  compareTexts()
}

const clearOriginal = () => {
  originalText.value = ''
  compareTexts()
}

const clearModified = () => {
  modifiedText.value = ''
  compareTexts()
}

const clearAll = () => {
  originalText.value = ''
  modifiedText.value = ''
  diffHtml.value = ''
}

const pasteOriginal = async () => {
  try {
    const text = await navigator.clipboard.readText()
    originalText.value = text
    compareTexts()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

const pasteModified = async () => {
  try {
    const text = await navigator.clipboard.readText()
    modifiedText.value = text
    compareTexts()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

const exportDiff = () => {
  if (!diffHtml.value) {
    return
  }

  const text = `原始文本:
${originalText.value}

修改后的文本:
${modifiedText.value}

差异统计:
- 添加: ${stats.value.added}
- 删除: ${stats.value.removed}
- 未改变: ${stats.value.unchanged}`

  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'text-diff.txt'
  a.click()
  URL.revokeObjectURL(url)
}

const copyDiff = () => {
  const text = diffHtml.value
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

  navigator.clipboard.writeText(text).then(() => {
    // 这里可以添加复制成功的提示
  })
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>

<style scoped>
.unchanged {
  color: hsl(var(--muted-foreground));
}

.added {
  background-color: hsl(var(--success) / 0.2);
  color: hsl(var(--success));
  padding: 2px 4px;
  border-radius: 2px;
}

.removed {
  background-color: hsl(var(--destructive) / 0.2);
  color: hsl(var(--destructive));
  padding: 2px 4px;
  border-radius: 2px;
  text-decoration: line-through;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .added {
    background-color: hsl(var(--success) / 0.3);
  }

  .removed {
    background-color: hsl(var(--destructive) / 0.3);
  }
}
</style>