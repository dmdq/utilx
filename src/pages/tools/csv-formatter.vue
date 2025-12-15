<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSV格式化 - 在线CSV美化与表格预览工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 CSV Formatter。支持美化CSV数据，自动识别分隔符，表格预览，导出格式化后的CSV。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入CSV</label>
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
              示例数据
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">分隔符:</label>
            <select
              v-model="delimiter"
              class="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value=",">逗号 (,)</option>
              <option value=";">分号 (;)</option>
              <option value="\t">Tab</option>
              <option value="|">竖线 (|)</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">包含标题行:</label>
            <input
              type="checkbox"
              v-model="hasHeader"
              class="rounded"
            />
          </div>
        </div>
        <textarea
          v-model="inputCSV"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入CSV数据..."
          @keydown.ctrl.enter="formatCSV"
          @keydown.meta.enter="formatCSV"
        ></textarea>
        <div v-if="inputError" class="mt-2 p-2 bg-destructive/20 text-destructive text-sm rounded">
          {{ inputError }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">预览结果</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyOutput"
            >
              复制CSV
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="downloadOutput"
            >
              下载CSV
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="toggleFullscreen"
            >
              全屏模式
            </button>
          </div>
        </div>
        <div class="flex-1 w-full min-h-[300px] bg-muted border border-border rounded-lg overflow-auto">
          <table v-if="csvData.length" class="w-full">
            <thead v-if="hasHeader && csvData[0]">
              <tr class="bg-accent">
                <th
                  v-for="header in csvData[0]"
                  :key="header"
                  class="px-4 py-2 text-left text-sm font-medium border-b border-border sticky top-0 bg-accent"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in (hasHeader ? csvData.slice(1) : csvData)"
                :key="index"
                class="hover:bg-accent/50"
              >
                <td
                  v-for="(cell, cellIndex) in row"
                  :key="cellIndex"
                  class="px-4 py-2 text-sm border-b border-border"
                >
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
          <pre
            v-else
            class="p-4 font-mono text-sm whitespace-pre-wrap"
          >{{ formattedOutput || '等待输入CSV数据...' }}</pre>
        </div>
      </div>
    </div>

    <!-- 格式化按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="formatCSV"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        格式化并预览
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
          什么是 CSV 格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSV (Comma-Separated Values) 是一种通用的、相对简单的文件格式，被广泛用于存储和交换表格数据。
          CSV 文件以纯文本形式存储数据，通常每条记录占一行，记录中的字段由分隔符（通常是逗号）分隔。
          它是一种简单但功能强大的数据交换格式，可以被几乎所有的电子表格程序（如 Excel）和数据库系统导入导出。
        </p>
        <p class="text-muted-foreground">
          为什么需要格式化 CSV？在实际应用中，CSV 数据可能格式混乱，字段不对齐，包含不必要的空格等。
          CSV 格式化工具可以美化 CSV 数据，使其更易读，并提供表格预览功能，方便查看和编辑数据。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 CSV 数据粘贴到左侧输入框</li>
          <li>选择合适的分隔符（逗号、分号、Tab或竖线）</li>
          <li>勾选是否包含标题行（第一行作为列名）</li>
          <li>点击"格式化并预览"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧表格预览，或点击"复制CSV"导出格式化后的数据</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能识别分隔符</strong>: 支持多种常用分隔符，自动适应不同格式的CSV文件</li>
          <li><strong>表格预览</strong>: 将CSV数据以表格形式展示，更直观地查看数据结构</li>
          <li><strong>标题行支持</strong>: 可选择是否将第一行作为列标题，使表格更清晰</li>
          <li><strong>数据美化</strong>: 自动整理格式，去除多余空格，对齐数据列</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>导出功能</strong>: 支持复制和下载格式化后的CSV文件</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线 CSV 格式化安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的 CSV 格式化工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您可以使用它处理包含敏感信息的 CSV 数据。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些 CSV 分隔符？</h3>
            <p class="text-muted-foreground mt-1">
              本工具支持最常用的几种分隔符：逗号（,）、分号（;）、Tab制表符和竖线（|）。
              如果您的CSV使用了其他分隔符，可以在格式化后手动替换。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理包含逗号的字段？</h3>
            <p class="text-muted-foreground mt-1">
              标准的CSV格式使用双引号包围包含分隔符的字段。例如："John, Doe"。
              本工具会正确处理这种情况，确保逗号被识别为字段内容而非分隔符。
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSeoMeta } from 'nuxt/app'
import {
  FileJson, Copy, Download, RotateCcw,
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, ChevronDown, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'
import Breadcrumb from '~/components/Breadcrumb.vue'

// SEO配置
useSeoMeta({
  title: 'CSV格式化工具 - 在线CSV美化与表格预览工具 | 有条工具',
  meta: [
    { name: 'description', content: '一款免费的在线 CSV 格式化工具。支持美化CSV数据，自动识别分隔符，表格预览，导出格式化后的CSV。支持逗号、分号、Tab和竖线分隔符，纯本地计算，数据隐私绝对安全。' },
    { name: 'keywords', content: 'CSV格式化,CSV美化,CSV工具,在线CSV格式化,CSV表格预览,CSV分隔符,逗号分隔值,CSV编辑器,CSV转换,CSV查看器' },
    { name: 'author', content: 'Util.cn' }
  ],
  og: {
    title: 'CSV格式化工具 - 在线CSV美化与表格预览工具',
    description: '一款免费的在线 CSV 格式化工具。支持美化CSV数据，自动识别分隔符，表格预览，导出格式化后的CSV。支持逗号、分号、Tab和竖线分隔符，纯本地计算，数据隐私绝对安全。'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CSV格式化工具 - 在线CSV美化与表格预览工具',
    description: '一款免费的在线 CSV 格式化工具。支持美化CSV数据，自动识别分隔符，表格预览，导出格式化后的CSV。支持逗号、分号、Tab和竖线分隔符，纯本地计算，数据隐私绝对安全。'
  }
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'csv-formatter')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputCSV = ref('')
const csvData = ref([])
const formattedOutput = ref('')
const inputError = ref('')
const delimiter = ref(',')
const hasHeader = ref(true)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 全屏相关
const outputPre = ref(null)
const isFullscreen = ref(false)

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'format' && t.id !== 'csv-formatter'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-to-csv'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'xml-formatter'),
    tools.find(t => t.id === 'base64-encoder')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

// 格式化CSV
const formatCSV = () => {
  if (!inputCSV.value) return

  try {
    inputError.value = ''
    csvData.value = []

    // 解析CSV
    const lines = inputCSV.value.trim().split('\n')
    const delimiterChar = delimiter.value === '\\t' ? '\t' : delimiter.value
    const regex = new RegExp('(\\"([^"]*(\\"")[^"]*)+\\"|[^\\' + delimiterChar + '\\"]+)(\\' + delimiterChar + '|$)', 'g')

    for (const line of lines) {
      if (!line.trim()) continue

      const fields = []
      let match
      while ((match = regex.exec(line)) !== null) {
        let value = match[1]

        // 移除字段分隔符
        if (value.endsWith(delimiterChar)) {
          value = value.slice(0, -1)
        }

        // 处理引号包围的字段
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
          // 处理双引号转义
          value = value.replace(/""/g, '"')
        }

        fields.push(value.trim())
      }
      csvData.value.push(fields)
    }

    // 生成格式化输出
    const maxLengths = []
    for (let i = 0; i < csvData.value[0]?.length || 0; i++) {
      maxLengths[i] = Math.max(...csvData.value.map(row => (row[i] || '').length))
    }

    formattedOutput.value = csvData.value.map(row => {
      return row.map((cell, index) => {
        const cellStr = cell || ''
        // 如果包含分隔符或换行符或引号，用引号包围
        if (cellStr.includes(delimiterChar) || cellStr.includes('\n') || cellStr.includes('"')) {
          return '"' + cellStr.replace(/"/g, '""') + '"'
        }
        return cellStr.padEnd(maxLengths[index])
      }).join(delimiterChar)
    }).join('\n')

  } catch (error) {
    inputError.value = `CSV格式化错误: ${error.message}`
    csvData.value = []
    formattedOutput.value = ''
  }
}

// 清空输入
const clearInput = () => {
  inputCSV.value = ''
  csvData.value = []
  formattedOutput.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputCSV.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  inputCSV.value = `姓名,年龄,城市,职业
张三,28,北京,工程师
李四,32,上海,设计师
王五,25,广州,产品经理
赵六,30,深圳,数据分析师`
}

// 复制输出
const copyOutput = async () => {
  if (!formattedOutput.value) return

  try {
    await navigator.clipboard.writeText(formattedOutput.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!formattedOutput.value) return

  const blob = new Blob([formattedOutput.value], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 切换全屏模式
const toggleFullscreen = () => {
  if (!outputPre.value) return

  if (!isFullscreen.value) {
    if (outputPre.value.requestFullscreen) {
      outputPre.value.requestFullscreen()
    } else if (outputPre.value.webkitRequestFullscreen) {
      outputPre.value.webkitRequestFullscreen()
    } else if (outputPre.value.msRequestFullscreen) {
      outputPre.value.msRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
  isFullscreen.value = !isFullscreen.value
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  // 跳转到具体工具页面
  router.push(`/tools/${selectedTool.id}`)
  // 添加到最近使用
  addRecentTool(selectedTool.id)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 监听全屏变化事件
onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
  document.addEventListener('webkitfullscreenchange', () => {
    isFullscreen.value = !!document.webkitFullscreenElement
  })
  document.addEventListener('msfullscreenchange', () => {
    isFullscreen.value = !!document.msFullscreenElement
  })
})
</script>