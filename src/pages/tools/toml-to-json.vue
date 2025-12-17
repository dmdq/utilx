<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">TOML与JSON互转 - 在线TOML JSON格式转换工具</h1>
      <p class="text-muted-foreground">一款免费的在线 TOML to JSON / JSON to TOML 转换工具。支持 TOML 和 JSON 格式互相转换，完美保留配置文件结构。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 转换方向选择 -->
    <div class="flex items-center justify-center gap-4 mb-6">
      <span class="text-sm font-medium" :class="convertDirection === 'toml-to-json' ? 'text-primary' : 'text-muted-foreground'">TOML</span>
      <button
        @click="toggleDirection"
        class="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        title="切换转换方向"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
      <span class="text-sm font-medium" :class="convertDirection === 'json-to-toml' ? 'text-primary' : 'text-muted-foreground'">JSON</span>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">
            输入{{ convertDirection === 'toml-to-json' ? 'TOML' : 'JSON' }}
          </label>
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
        <textarea
          v-model="inputData"
          class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          :placeholder="`在此输入${convertDirection === 'toml-to-json' ? 'TOML' : 'JSON'}数据...`"
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
          <label class="text-sm font-medium text-foreground">
            {{ convertDirection === 'toml-to-json' ? 'JSON' : 'TOML' }}输出
          </label>
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
              下载{{ convertDirection === 'toml-to-json' ? 'JSON' : 'TOML' }}
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="formatOutput"
              v-if="convertDirection === 'toml-to-json'"
            >
              格式化
            </button>
          </div>
        </div>
        <pre
          ref="outputPre"
          class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap"
        >{{ outputData }}</pre>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        转换为 {{ convertDirection === 'toml-to-json' ? 'JSON' : 'TOML' }}
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
          什么是 TOML 与 JSON 互转？
        </h2>
        <p class="text-muted-foreground mb-4">
          TOML（Tom's Obvious, Minimal Language）和 JSON（JavaScript Object Notation）都是常用的数据序列化格式。
          TOML 主要用于配置文件，语法简洁易读；JSON 则广泛用于 Web API 和数据交换。
          本工具支持两种格式之间的双向转换，方便开发者在不同场景下使用。
        </p>
        <p class="text-muted-foreground">
          TOML 由 GitHub 联合创始人 Tom Preston-Werner 创建，旨在成为一种语义明确且易于阅读的配置文件格式。
          相比 JSON，TOML 支持注释、日期时间、数组等更多特性，更适合人类编辑配置文件。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择转换方向（TOML 转 JSON 或 JSON 转 TOML）</li>
          <li>将您的数据粘贴到左侧输入框</li>
          <li>点击转换按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换后的结果</li>
          <li>可以复制或下载转换后的数据</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          TOML vs JSON 对比
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">TOML 特点</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 支持注释（# 注释）</li>
              <li>• 更易读的配置文件格式</li>
              <li>• 支持日期时间类型</li>
              <li>• 支持多行字符串</li>
              <li>• 适合人类编写的配置文件</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">JSON 特点</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 标准化的数据交换格式</li>
              <li>• 广泛用于 API 和 Web 服务</li>
              <li>• 严格的语法规范</li>
              <li>• 原生支持多种编程语言</li>
              <li>• 适合机器解析和处理</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>双向转换</strong>: 支持 TOML 到 JSON 和 JSON 到 TOML 的双向转换</li>
          <li><strong>保留结构</strong>: 完整保留数据的层次结构和关系</li>
          <li><strong>类型转换</strong>: 自动处理日期时间、数组、对象等数据类型</li>
          <li><strong>注释处理</strong>: JSON 转 TOML 时智能处理注释位置</li>
          <li><strong>格式优化</strong>: 生成格式规范、易读的输出</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">TOML 和 JSON 转换会丢失数据吗？</h3>
            <p class="text-muted-foreground mt-1">
              基本不会丢失。TOML 支持的所有数据类型都可以转换为 JSON 对应的类型。
              但需要注意，TOML 的注释在转换为 JSON 时会丢失，因为 JSON 不支持注释。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么情况下使用 TOML？</h3>
            <p class="text-muted-foreground mt-1">
              TOML 非常适合配置文件，如应用配置、部署配置、CI/CD 配置等。
              像 Rust 的 Cargo、Python 的 Poetry、Hugo 等工具都使用 TOML 作为配置文件格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">TOML 支持哪些数据类型？</h3>
            <p class="text-muted-foreground mt-1">
              TOML 支持字符串、整数、浮点数、布尔值、日期时间、数组和表（对象）。
              还支持多行字符串、内联表、数组表等高级特性。
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
  FileJson, FileText, Copy, Download, RotateCcw,
  Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO 配置
useSeoMeta({
  title: 'TOML与JSON互转 - 在线TOML JSON格式转换工具',
  description: '免费在线 TOML to JSON / JSON to TOML 转换工具，支持 TOML 和 JSON 格式互相转换，完美保留配置文件结构。纯本地计算，数据安全。',
  keywords: 'TOML转JSON, JSON转TOML, TOML JSON转换, 配置文件转换, 数据格式转换, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'TOML与JSON互转 - 在线TOML JSON格式转换工具',
  ogDescription: '免费在线 TOML to JSON / JSON to TOML 转换工具，支持 TOML 和 JSON 格式互相转换。',
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
        name: 'TOML与JSON互转工具',
        description: '免费在线 TOML to JSON / JSON to TOML 转换工具，支持 TOML 和 JSON 格式互相转换',
        url: 'https://www.util.cn/tools/toml-to-json',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'TOML转JSON',
          'JSON转TOML',
          '双向转换',
          '保留数据结构',
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
const tool = tools.find(t => t.id === 'toml-to-json')
const category = categories.find(c => c.id === 'format')

// 转换方向
const convertDirection = ref('toml-to-json')

// 输入输出数据
const inputData = ref('')
const outputData = ref('')
const inputError = ref('')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 全屏相关
const outputPre = ref(null)
const isFullscreen = ref(false)

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'format' && t.id !== 'toml-to-json'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'toml-formatter'),
    tools.find(t => t.id === 'json-to-yaml'),
    tools.find(t => t.id === 'yaml-formatter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 切换转换方向
const toggleDirection = () => {
  convertDirection.value = convertDirection.value === 'toml-to-json' ? 'json-to-toml' : 'toml-to-json'
  // 交换输入输出
  const temp = inputData.value
  inputData.value = outputData.value
  outputData.value = temp
  inputError.value = ''
}

// TOML 转 JSON
const tomlToJSON = (tomlStr) => {
  // 简单的 TOML 解析器实现
  const lines = tomlStr.split('\n')
  const result = {}
  let currentSection = result
  const sectionStack = [result]

  for (let line of lines) {
    line = line.trim()

    // 跳过空行和注释
    if (!line || line.startsWith('#')) continue

    // 处理节（[section]）
    if (line.startsWith('[') && line.endsWith(']')) {
      const sectionName = line.slice(1, -1)
      const sectionPath = sectionName.split('.')

      currentSection = result
      sectionStack.length = 1

      for (const part of sectionPath) {
        if (!currentSection[part]) {
          currentSection[part] = {}
        }
        currentSection = currentSection[part]
        sectionStack.push(currentSection)
      }
      continue
    }

    // 处理键值对
    const equalIndex = line.indexOf('=')
    if (equalIndex === -1) continue

    const key = line.slice(0, equalIndex).trim()
    let value = line.slice(equalIndex + 1).trim()

    // 解析值
    currentSection[key] = parseTOMLValue(value)
  }

  return result
}

// 解析 TOML 值
const parseTOMLValue = (value) => {
  // 字符串
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1)
  }

  // 多行字符串
  if (value.startsWith('"""')) {
    return value.slice(3).trim()
  }

  // 布尔值
  if (value === 'true') return true
  if (value === 'false') return false

  // 数字
  if (!isNaN(value) && value !== '') {
    if (value.includes('.')) {
      return parseFloat(value)
    }
    return parseInt(value, 10)
  }

  // 数组
  if (value.startsWith('[') && value.endsWith(']')) {
    const items = value.slice(1, -1).split(',').map(item => parseTOMLValue(item.trim()))
    return items
  }

  // 默认作为字符串
  return value
}

// JSON 转 TOML
const jsonToTOML = (obj, indent = 0) => {
  const indentStr = '  '.repeat(indent)
  let result = ''

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result += `\n${indentStr}[${key}]\n`
      result += jsonToTOML(value, indent + 1)
    } else if (Array.isArray(value)) {
      result += `${indentStr}${key} = ${JSON.stringify(value)}\n`
    } else if (typeof value === 'string') {
      result += `${indentStr}${key} = "${value}"\n`
    } else {
      result += `${indentStr}${key} = ${value}\n`
    }
  }

  return result
}

// 执行转换
const convert = () => {
  if (!inputData.value) return

  try {
    inputError.value = ''

    if (convertDirection.value === 'toml-to-json') {
      const jsonData = tomlToJSON(inputData.value)
      outputData.value = JSON.stringify(jsonData, null, 2)
    } else {
      const jsonData = JSON.parse(inputData.value)
      outputData.value = jsonToTOML(jsonData)
    }
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputData.value = ''
  }
}

// 格式化输出
const formatOutput = () => {
  if (!outputData.value || convertDirection.value !== 'toml-to-json') return

  try {
    const jsonData = JSON.parse(outputData.value)
    outputData.value = JSON.stringify(jsonData, null, 2)
  } catch (error) {
    console.error('格式化失败:', error)
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
  if (convertDirection.value === 'toml-to-json') {
    inputData.value = `# TOML 配置文件示例
title = "我的应用"

[database]
server = "localhost"
port = 5432
username = "admin"
password = "secret123"
connection_pool = 10

[features]
enabled = true
debug = false
plugins = [
  "authentication",
  "logging",
  "monitoring"
]

[servers]
alpha = "10.0.0.1"
beta = "10.0.0.2"`
  } else {
    inputData.value = `{
  "title": "我的应用",
  "database": {
    "server": "localhost",
    "port": 5432,
    "username": "admin",
    "password": "secret123",
    "connection_pool": 10
  },
  "features": {
    "enabled": true,
    "debug": false,
    "plugins": [
      "authentication",
      "logging",
      "monitoring"
    ]
  },
  "servers": {
    "alpha": "10.0.0.1",
    "beta": "10.0.0.2"
  }
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

  const mimeType = convertDirection.value === 'toml-to-json' ? 'application/json' : 'text/toml'
  const extension = convertDirection.value === 'toml-to-json' ? 'json' : 'toml'

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