<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">JSON转CSV - 在线JSON转CSV格式转换工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 JSON to CSV Converter。支持将 JSON 数组或对象转换为 CSV 格式，自定义分隔符，支持嵌套数据处理。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入JSON</label>
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
              <option value="\t">制表符 (\t)</option>
              <option value="|">竖线 (|)</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">包含表头:</label>
            <input
              type="checkbox"
              v-model="includeHeader"
              class="rounded"
            />
          </div>
        </div>
        <textarea
          v-model="inputJSON"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入JSON数据（数组格式或包含数组的对象）..."
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
          <label class="text-sm font-medium text-foreground">CSV输出</label>
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
        <pre
          ref="outputPre"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap"
        >{{ outputCSV }}</pre>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        转换为 CSV
      </button>
    </div>

    <!-- 预览区 -->
    <div v-if="csvPreview.length" class="mb-12">
      <h2 class="text-xl font-bold text-foreground mb-4">CSV 预览</h2>
      <div class="overflow-auto border border-border rounded-lg">
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-muted">
            <tr>
              <th
                v-for="header in csvPreview[0]"
                :key="header"
                class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-card divide-y divide-border">
            <tr v-for="(row, index) in csvPreview.slice(1, 6)" :key="index">
              <td
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                class="px-6 py-4 whitespace-nowrap text-sm text-foreground"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="csvPreview.length > 6" class="text-sm text-muted-foreground mt-2">
        显示前 5 行数据，共 {{ csvPreview.length - 1 }} 行
      </p>
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
          什么是 JSON 转 CSV？
        </h2>
        <p class="text-muted-foreground mb-4">
          JSON（JavaScript Object Notation）和 CSV（Comma-Separated Values）是两种常用的数据格式。
          JSON 转 CSV 是将 JSON 数据转换为表格形式的 CSV 格式的过程。CSV 是一种简单的文本格式，
          使用逗号或其他分隔符分隔值，每行代表一条记录，非常适合在 Excel 等表格软件中处理。
        </p>
        <p class="text-muted-foreground">
          转换过程中，JSON 的对象结构会被扁平化，嵌套的对象会被展开为单独的列。
          数组会被转换为多行数据，使得数据可以在表格软件中轻松查看和分析。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 JSON 数据粘贴到左侧输入框（必须是数组格式）</li>
          <li>选择 CSV 分隔符（逗号、分号、制表符等）</li>
          <li>选择是否包含表头行</li>
          <li>点击"转换为 CSV"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换结果和下方预览表格</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换规则
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>数组转换</strong>: JSON 数组的每个元素转换为 CSV 的一行</li>
          <li><strong>扁平化处理</strong>: 嵌套对象会被扁平化，使用点号连接键名</li>
          <li><strong>键名提取</strong>: 所有对象的键会被提取作为 CSV 的列名</li>
          <li><strong>缺失值处理</strong>: 如果某行缺少某列的值，会留空</li>
          <li><strong>特殊字符转义</strong>: 包含分隔符或换行符的值会被引号包围</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">可以转换嵌套的 JSON 对象吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。本工具会自动扁平化嵌套对象，使用点号连接键名。例如，
              {"user": {"name": "John"}} 会被转换为列名 "user.name"。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">JSON 数组中的元素结构不同怎么办？</h3>
            <p class="text-muted-foreground mt-1">
              工具会收集所有对象的键作为列名。如果某行缺少某个键，对应的列会留空。
              这确保了所有数据都能正确转换，即使结构不完全一致。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要 JSON 转 CSV？</h3>
            <p class="text-muted-foreground mt-1">
              CSV 格式广泛应用于数据分析、报表生成、Excel 处理等场景。
              转换为 CSV 后可以：在 Excel 中打开和分析数据、导入到数据库、
              用于数据可视化工具、与他人共享数据等。
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileJson, Database, Copy, Download, RotateCcw,
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, ChevronDown, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'
import Breadcrumb from '~/components/Breadcrumb.vue'

// SEO 配置
useSeoMeta({
  title: 'JSON转CSV - 在线JSON转CSV格式转换工具',
  description: '免费在线 JSON to CSV 转换工具，支持将 JSON 数组或对象转换为 CSV 格式，自定义分隔符，支持嵌套数据处理。纯本地计算，数据安全。',
  keywords: 'JSON转CSV, JSON to CSV, JSON CSV转换, 数据格式转换, 表格数据, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'JSON转CSV - 在线JSON转CSV格式转换工具',
  ogDescription: '免费在线 JSON to CSV 转换工具，支持将 JSON 数组或对象转换为 CSV 格式。',
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
        name: 'JSON转CSV工具',
        description: '免费在线 JSON to CSV 转换工具，支持将 JSON 数组或对象转换为 CSV 格式',
        url: 'https://www.util.cn/tools/json-to-csv',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'JSON转CSV',
          '自定义分隔符',
          '嵌套数据处理',
          '包含表头选项',
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
const tool = tools.find(t => t.id === 'json-to-csv')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputJSON = ref('')
const outputCSV = ref('')
const inputError = ref('')
const delimiter = ref(',')
const includeHeader = ref(true)
const csvPreview = ref([])

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
    t.category === 'format' && t.id !== 'json-to-csv'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'csv-formatter'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'json-to-xml'),
    tools.find(t => t.id === 'json-to-yaml')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// JSON 转 CSV
const convert = () => {
  if (!inputJSON.value) return

  try {
    inputError.value = ''
    const jsonData = JSON.parse(inputJSON.value)

    // 检查是否是数组
    if (!Array.isArray(jsonData)) {
      // 尝试找到数组
      const arrayKey = findArrayKey(jsonData)
      if (arrayKey) {
        convertToCSV(jsonData[arrayKey])
      } else {
        throw new Error('输入必须是数组格式')
      }
    } else {
      convertToCSV(jsonData)
    }
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputCSV.value = ''
    csvPreview.value = []
  }
}

// 查找对象中的数组
const findArrayKey = (obj) => {
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      return key
    }
  }
  return null
}

// 转换为 CSV
const convertToCSV = (data) => {
  if (!data.length) {
    outputCSV.value = ''
    csvPreview.value = []
    return
  }

  // 扁平化数据并收集所有键
  const flattenedData = data.map(item => flattenObject(item))
  const allKeys = [...new Set(flattenedData.flatMap(item => Object.keys(item)))]

  // 生成 CSV
  const csvRows = []

  // 添加表头
  if (includeHeader.value) {
    csvRows.push(allKeys.join(delimiter.value))
  }

  // 添加数据行
  for (const item of flattenedData) {
    const row = allKeys.map(key => {
      const value = item[key] || ''
      return escapeCSVValue(String(value))
    })
    csvRows.push(row.join(delimiter.value))
  }

  outputCSV.value = csvRows.join('\n')

  // 生成预览数据
  generatePreview(allKeys, csvRows)
}

// 扁平化对象
const flattenObject = (obj, prefix = '', result = {}) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result)
      } else if (Array.isArray(obj[key])) {
        // 处理数组，将其转换为字符串
        result[newKey] = obj[key].join('; ')
      } else {
        result[newKey] = obj[key]
      }
    }
  }
  return result
}

// 转义 CSV 值
const escapeCSVValue = (value) => {
  // 如果值包含分隔符、换行符或引号，需要用引号包围
  if (value.includes(delimiter.value) || value.includes('\n') || value.includes('"')) {
    // 转义内部的引号
    const escaped = value.replace(/"/g, '""')
    return `"${escaped}"`
  }
  return value
}

// 生成预览
const generatePreview = (headers, csvRows) => {
  const preview = []

  // 添加表头
  if (includeHeader.value) {
    preview.push(headers)
  }

  // 解析数据行
  const parser = new CSVParser(delimiter.value)
  for (let i = includeHeader.value ? 1 : 0; i < Math.min(csvRows.length, 6); i++) {
    const row = parser.parseLine(csvRows[i])
    preview.push(row)
  }

  csvPreview.value = preview
}

// CSV 解析器（用于预览）
class CSVParser {
  constructor(delimiter) {
    this.delimiter = delimiter
  }

  parseLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i += 2
        } else {
          inQuotes = !inQuotes
          i++
        }
      } else if (char === this.delimiter && !inQuotes) {
        result.push(current)
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current)
    return result
  }
}

// 清空输入
const clearInput = () => {
  inputJSON.value = ''
  outputCSV.value = ''
  inputError.value = ''
  csvPreview.value = []
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputJSON.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  inputJSON.value = `[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "country": "USA"
    },
    "hobbies": ["reading", "swimming", "coding"],
    "active": true
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "age": 25,
    "address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "country": "USA"
    },
    "hobbies": ["painting", "yoga"],
    "active": true
  },
  {
    "id": 3,
    "name": "Bob Johnson",
    "email": "bob@example.com",
    "age": 35,
    "address": {
      "street": "789 Pine Rd",
      "city": "Chicago",
      "country": "USA"
    },
    "hobbies": ["gaming", "cooking", "traveling"],
    "active": false
  }
]`
}

// 复制输出
const copyOutput = async () => {
  if (!outputCSV.value) return

  try {
    await navigator.clipboard.writeText(outputCSV.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputCSV.value) return

  const blob = new Blob([outputCSV.value], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'converted.csv'
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
  router.push(`/tools/${selectedTool.id}/`)
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