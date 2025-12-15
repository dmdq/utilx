<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">YAML转换器 - YAML与JSON互转工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 YAML Converter。支持 YAML 与 JSON 格式互相转换，格式化、验证 YAML 语法。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入YAML</label>
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
            <label class="text-xs text-muted-foreground">输入格式:</label>
            <select
              v-model="inputFormat"
              class="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value="yaml">YAML</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">输出格式:</label>
            <select
              v-model="outputFormat"
              class="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </select>
          </div>
        </div>
        <textarea
          v-model="inputData"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          :placeholder="inputFormat === 'yaml' ? '在此输入YAML数据...' : '在此输入JSON数据...'"
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
          <label class="text-sm font-medium text-foreground">转换结果</label>
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
              下载文件
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
        >{{ outputData }}</pre>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        {{ getButtonText() }}
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
          什么是 YAML？
        </h2>
        <p class="text-muted-foreground mb-4">
          YAML（YAML Ain't Markup Language）是一种人类可读的数据序列化格式，常用于配置文件、
          数据交换和应用程序配置。它以其简洁性和易读性而闻名，支持列表、字典、标量等数据结构。
          YAML 使用缩进来表示层级关系，避免了使用花括号和标签的复杂性。
        </p>
        <p class="text-muted-foreground">
          YAML 与 JSON 可以互相转换，因为它们都表示相同的数据结构。YAML 更加人类友好，
          而 JSON 更加机器友好。在 DevOps、容器化应用（如 Docker、Kubernetes）中，
          YAML 是标准的配置格式。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择输入格式（YAML 或 JSON）</li>
          <li>将数据粘贴到左侧输入框</li>
          <li>选择输出格式（JSON 或 YAML）</li>
          <li>点击转换按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换结果，可复制或下载</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>双向转换</strong>: 支持 YAML 到 JSON 和 JSON 到 YAML 的双向转换</li>
          <li><strong>语法验证</strong>: 自动检测输入数据的语法错误并提供详细提示</li>
          <li><strong>格式美化</strong>: 转换后的数据自动格式化，提高可读性</li>
          <li><strong>保留注释</strong>: YAML 到 JSON 转换时尽力保留注释信息</li>
          <li><strong>本地处理</strong>: 所有转换都在浏览器本地完成，确保数据安全</li>
          <li><strong>批量转换</strong>: 支持大型文件的快速转换</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          YAML vs JSON
        </h2>
        <div class="space-y-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">YAML 优势：</h3>
            <ul class="list-disc list-inside text-muted-foreground ml-4">
              <li>更易读，使用缩进代替括号</li>
              <li>支持注释（# 注释）</li>
              <li>支持多行字符串、日期等高级类型</li>
              <li>更适合配置文件</li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">JSON 优势：</h3>
            <ul class="list-disc list-inside text-muted-foreground ml-4">
              <li>解析速度更快</li>
              <li>更严格的语法规范</li>
              <li>原生支持于大多数编程语言</li>
              <li>更适合 API 数据交换</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">YAML 转换为 JSON 会丢失什么？</h3>
            <p class="text-muted-foreground mt-1">
              YAML 转换为 JSON 时可能会丢失：注释、多行字符串的精确格式、日期类型等。
              这些是 JSON 格式不支持的特性。如果需要保留这些信息，建议继续使用 YAML 格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么选择 YAML 而不是 JSON？</h3>
            <p class="text-muted-foreground mt-1">
              YAML 更适合人类编辑和阅读，特别是配置文件。它支持注释让配置更易理解，
              缩进结构让层级关系一目了然。而 JSON 更适合机器处理和网络传输。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">YAML 的缩进有什么要求？</h3>
            <p class="text-muted-foreground mt-1">
              YAML 使用空格进行缩进，不能使用 Tab。建议使用 2 个空格作为标准缩进。
              同一级别的元素必须保持相同的缩进量，缩进错误会导致解析失败。
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
  title: 'YAML转换器 - YAML与JSON互转工具 | 有条工具',
  meta: [
    { name: 'description', content: '一款免费的在线 YAML 转换工具。支持 YAML 与 JSON 格式互相转换，格式化、验证 YAML 语法。智能识别结构，自动美化输出，支持注释保留，纯本地计算，数据隐私绝对安全。' },
    { name: 'keywords', content: 'YAML转换器,YAML转JSON,JSON转YAML,YAML格式化,YAML验证,YAML工具,在线YAML转换,YAML解析,YAML编辑器,K8s配置,Docker配置' },
    { name: 'author', content: 'Util.cn' }
  ],
  og: {
    title: 'YAML转换器 - YAML与JSON互转工具',
    description: '一款免费的在线 YAML 转换工具。支持 YAML 与 JSON 格式互相转换，格式化、验证 YAML 语法。智能识别结构，自动美化输出，支持注释保留，纯本地计算，数据隐私绝对安全。'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YAML转换器 - YAML与JSON互转工具',
    description: '一款免费的在线 YAML 转换工具。支持 YAML 与 JSON 格式互相转换，格式化、验证 YAML 语法。智能识别结构，自动美化输出，支持注释保留，纯本地计算，数据隐私绝对安全。'
  }
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'yaml-converter')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputData = ref('')
const outputData = ref('')
const inputError = ref('')
const inputFormat = ref('yaml')
const outputFormat = ref('json')

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
    t.category === 'format' && t.id !== 'yaml-converter'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'xml-formatter'),
    tools.find(t => t.id === 'sql-formatter'),
    tools.find(t => t.id === 'base64-encoder')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 获取按钮文本
const getButtonText = () => {
  if (inputFormat.value === 'yaml' && outputFormat.value === 'json') {
    return 'YAML 转 JSON'
  } else if (inputFormat.value === 'json' && outputFormat.value === 'yaml') {
    return 'JSON 转 YAML'
  }
  return '转换'
}

// 简单的 YAML 解析器
const parseYAML = (yaml) => {
  const lines = yaml.split('\n')
  const result = {}
  const stack = [result]
  let currentIndent = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const indent = line.search(/\S/)
    const level = Math.floor(indent / 2)

    // 调整栈到正确的层级
    while (stack.length > level + 1) {
      stack.pop()
    }

    const current = stack[stack.length - 1]

    // 处理数组项
    if (trimmed.startsWith('- ')) {
      const value = trimmed.substring(2).trim()
      if (!Array.isArray(current)) {
        stack.pop()
        const parent = stack[stack.length - 1]
        const key = Object.keys(parent).pop()
        parent[key] = []
        stack.push(parent[key])
      }

      if (value.includes(':')) {
        const [k, v] = value.split(':').map(s => s.trim())
        const obj = {}
        obj[k] = parseValue(v)
        current.push(obj)
      } else {
        current.push(parseValue(value))
      }
    }
    // 处理键值对
    else if (trimmed.includes(':')) {
      const [key, value] = trimmed.split(':').map(s => s.trim())

      if (value) {
        // 有值的键值对
        current[key] = parseValue(value)
      } else {
        // 可能有子项的键值对
        current[key] = {}
        stack.push(current[key])
      }
    }
  }

  return result
}

// 解析值
const parseValue = (value) => {
  // 尝试解析为数字
  if (!isNaN(value) && value !== '') {
    return Number(value)
  }

  // 尝试解析为布尔值
  if (value === 'true' || value === 'false') {
    return value === 'true'
  }

  // 尝试解析为 null
  if (value === 'null' || value === '~') {
    return null
  }

  // 去除引号
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }

  return value
}

// 简单的 YAML 生成器
const toYAML = (obj, indent = 0) => {
  const indentStr = '  '.repeat(indent)
  let yaml = ''

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        yaml += `${indentStr}-\n`
        yaml += toYAML(item, indent + 1)
      } else {
        yaml += `${indentStr}- ${formatYAMLValue(item)}\n`
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        yaml += `${indentStr}${key}:\n`
        yaml += toYAML(value, indent + 1)
      } else {
        yaml += `${indentStr}${key}: ${formatYAMLValue(value)}\n`
      }
    }
  }

  return yaml
}

// 格式化 YAML 值
const formatYAMLValue = (value) => {
  if (value === null) return 'null'
  if (typeof value === 'string') {
    // 如果包含特殊字符或数字，添加引号
    if (value.includes(':') || value.includes('#') || value.includes('@') ||
        value.includes('`') || value.includes('|') || value.includes('>')) {
      return `"${value}"`
    }
    return value
  }
  return String(value)
}

// 转换数据
const convert = () => {
  if (!inputData.value) return

  try {
    inputError.value = ''
    let parsed = null

    // 解析输入
    if (inputFormat.value === 'yaml') {
      parsed = parseYAML(inputData.value)
    } else {
      parsed = JSON.parse(inputData.value)
    }

    // 生成输出
    if (outputFormat.value === 'yaml') {
      outputData.value = toYAML(parsed)
    } else {
      outputData.value = JSON.stringify(parsed, null, 2)
    }
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputData.value = ''
  }
}

// 清空输入
const clearInput = () => {
  inputData.value = ''
  outputData.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputData.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  if (inputFormat.value === 'yaml') {
    inputData.value = `# 应用配置示例
app:
  name: "My Application"
  version: 1.0.0
  debug: true

database:
  host: "localhost"
  port: 5432
  credentials:
    username: "admin"
    password: "secret123"

  connection_pool:
    max_connections: 20
    timeout: 30s

features:
  - authentication
  - logging
  - monitoring
  - api_v2

servers:
  - name: "web-server"
    host: "192.168.1.10"
    roles: ["web", "cache"]
  - name: "db-server"
    host: "192.168.1.20"
    roles: ["database"]`
  } else {
    inputData.value = `{
  "app": {
    "name": "My Application",
    "version": 1.0,
    "debug": true
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "credentials": {
      "username": "admin",
      "password": "secret123"
    },
    "connection_pool": {
      "max_connections": 20,
      "timeout": "30s"
    }
  },
  "features": [
    "authentication",
    "logging",
    "monitoring",
    "api_v2"
  ],
  "servers": [
    {
      "name": "web-server",
      "host": "192.168.1.10",
      "roles": ["web", "cache"]
    },
    {
      "name": "db-server",
      "host": "192.168.1.20",
      "roles": ["database"]
    }
  ]
}`
  }
}

// 复制输出
const copyOutput = async () => {
  if (!outputData.value) return

  try {
    await navigator.clipboard.writeText(outputData.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputData.value) return

  const extension = outputFormat.value === 'yaml' ? 'yaml' : 'json'
  const mimeType = outputFormat.value === 'yaml' ? 'text/yaml' : 'application/json'

  const blob = new Blob([outputData.value], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `converted.${extension}`
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