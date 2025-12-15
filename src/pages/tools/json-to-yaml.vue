<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">JSON转YAML - 在线JSON转YAML格式转换工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 JSON to YAML Converter。支持将 JSON 数据快速转换为 YAML 格式，保留数据结构，完美支持嵌套对象和数组。纯本地计算，数据隐私绝对安全。</p>
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
            <label class="text-xs text-muted-foreground">缩进:</label>
            <select
              v-model="indentSize"
              class="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value="2">2空格</option>
              <option value="4">4空格</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">行宽限制:</label>
            <input
              type="number"
              v-model="lineWidth"
              min="40"
              max="200"
              step="10"
              class="text-xs bg-muted border border-border rounded px-2 py-1 w-16"
            />
          </div>
        </div>
        <textarea
          v-model="inputJSON"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入JSON数据..."
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
          <label class="text-sm font-medium text-foreground">YAML输出</label>
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
              下载YAML
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
        >{{ outputYAML }}</pre>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        转换为 YAML
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
          什么是 JSON 转 YAML？
        </h2>
        <p class="text-muted-foreground mb-4">
          JSON（JavaScript Object Notation）和 YAML（YAML Ain't Markup Language）都是常用的数据序列化格式。
          JSON 转 YAML 是将 JSON 数据转换为更易读的 YAML 格式的过程。YAML 使用缩进和简洁的语法，
          使配置文件和人类可读的数据更加友好。
        </p>
        <p class="text-muted-foreground">
          YAML 是 JSON 的超集，支持更多的数据类型和特性，如注释、多行字符串、锚点等。
          在 DevOps、容器化应用（Kubernetes、Docker Compose）中，YAML 是标准的配置格式。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 JSON 数据粘贴到左侧输入框</li>
          <li>选择缩进大小（2空格或4空格）</li>
          <li>设置行宽限制（可选）</li>
          <li>点击"转换为 YAML"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换后的 YAML 结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>保留结构</strong>: 完整保留 JSON 的数据结构和层次关系</li>
          <li><strong>智能格式化</strong>: 根据数据类型选择最佳的 YAML 表示方式</li>
          <li><strong>数组处理</strong>: 智能处理数组，生成清晰的 YAML 列表格式</li>
          <li><strong>字符串优化</strong>: 自动选择是否需要引号，提高可读性</li>
          <li><strong>多行支持</strong>: 长字符串自动转换为多行 YAML 格式</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          JSON vs YAML 对比
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">JSON 特点</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 使用花括号和方括号</li>
              <li>• 必须使用双引号表示字符串</li>
              <li>• 不支持注释</li>
              <li>• 严格的语法规范</li>
              <li>• 适合机器解析和网络传输</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">YAML 特点</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 使用缩进表示层级</li>
              <li>• 字符串通常不需要引号</li>
              <li>• 支持 # 注释</li>
              <li>• 更灵活的语法</li>
              <li>• 适合配置文件和人类阅读</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">转换后的 YAML 会丢失数据吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。YAML 是 JSON 的超集，可以表示所有 JSON 的数据结构。转换是双向无损的，
              您也可以将 YAML 转换回原始的 JSON 格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么使用 YAML 而不是 JSON？</h3>
            <p class="text-muted-foreground mt-1">
              YAML 更适合配置文件，因为它支持注释、更易读、更简洁。在 DevOps 工具链中
              （如 Kubernetes、Docker Compose、Ansible），YAML 是标准格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">YAML 的缩进有什么要求？</h3>
            <p class="text-muted-foreground mt-1">
              YAML 使用空格进行缩进，不能使用 Tab。同一级别的元素必须有相同的缩进量。
              建议使用 2 个空格作为标准缩进，这也是本工具的默认设置。
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
  FileJson, Code, Copy, Download, RotateCcw,
  FileText, Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, ChevronDown, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'
import Breadcrumb from '~/components/Breadcrumb.vue'

// SEO 配置
useSeoMeta({
  title: 'JSON转YAML - 在线JSON转YAML格式转换工具',
  description: '免费在线 JSON to YAML 转换工具，支持将 JSON 数据快速转换为 YAML 格式，保留数据结构，支持嵌套对象和数组。纯本地计算，数据安全。',
  keywords: 'JSON转YAML, JSON to YAML, JSON YAML转换, 数据格式转换, 配置文件转换, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'JSON转YAML - 在线JSON转YAML格式转换工具',
  ogDescription: '免费在线 JSON to YAML 转换工具，支持将 JSON 数据快速转换为 YAML 格式，保留数据结构。',
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
        name: 'JSON转YAML工具',
        description: '免费在线 JSON to YAML 转换工具，支持将 JSON 数据快速转换为 YAML 格式',
        url: 'https://www.util.cn/tools/json-to-yaml',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'JSON转YAML',
          '保留数据结构',
          '智能格式化',
          '可配置缩进',
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
const tool = tools.find(t => t.id === 'json-to-yaml')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputJSON = ref('')
const outputYAML = ref('')
const inputError = ref('')
const indentSize = ref('2')
const lineWidth = ref(120)

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
    t.category === 'format' && t.id !== 'json-to-yaml'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'yaml-converter'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'yaml-formatter'),
    tools.find(t => t.id === 'json-to-xml')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// JSON 转 YAML
const convert = () => {
  if (!inputJSON.value) return

  try {
    inputError.value = ''
    const jsonData = JSON.parse(inputJSON.value)
    const yamlString = jsonToYAML(jsonData, 0)
    outputYAML.value = yamlString
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputYAML.value = ''
  }
}

// 递归转换 JSON 为 YAML
const jsonToYAML = (obj, indent = 0) => {
  const indentStr = ' '.repeat(parseInt(indentSize.value) * indent)
  const nextIndentStr = ' '.repeat(parseInt(indentSize.value) * (indent + 1))

  if (obj === null) {
    return 'null'
  }

  if (obj === undefined) {
    return ''
  }

  if (typeof obj === 'string') {
    // 检查是否需要引号
    if (needsQuotes(obj)) {
      // 处理多行字符串
      if (obj.includes('\n') && obj.length > lineWidth.value) {
        return `|\n${nextIndentStr}${obj.replace(/\n/g, `\n${nextIndentStr}`)}`
      }
      return `"${escapeYAMLString(obj)}"`
    }
    return obj
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]'
    }

    let yaml = ''
    for (const item of obj) {
      const value = jsonToYAML(item, indent + 1)
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        yaml += `${indentStr}-\n${nextIndentStr}${value}\n`
      } else {
        yaml += `${indentStr}- ${value}\n`
      }
    }
    return yaml.trim()
  }

  if (typeof obj === 'object') {
    let yaml = ''
    const entries = Object.entries(obj)

    for (const [key, value] of entries) {
      const yamlKey = isValidYAMLKey(key) ? key : `"${escapeYAMLString(key)}"`
      const yamlValue = jsonToYAML(value, indent + 1)

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${indentStr}${yamlKey}:\n${nextIndentStr}${yamlValue}\n`
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        yaml += `${indentStr}${yamlKey}:\n${yamlValue}\n`
      } else {
        yaml += `${indentStr}${yamlKey}: ${yamlValue}\n`
      }
    }

    return yaml.trim()
  }

  return String(obj)
}

// 检查字符串是否需要引号
const needsQuotes = (str) => {
  // 空字符串或包含特殊字符需要引号
  if (!str) return true

  // 检查特殊字符
  const specialChars = /[:{}\[\],&*#?|<>'"%@`]|^\s|\s$|\n/
  if (specialChars.test(str)) return true

  // 检查是否是特殊值
  if (['true', 'false', 'null', 'True', 'False', 'Null', 'TRUE', 'FALSE', 'NULL'].includes(str)) return true

  // 检查是否是数字
  if (!isNaN(str) && str.trim() !== '') return true

  return false
}

// 检查是否是有效的 YAML 键
const isValidYAMLKey = (key) => {
  // YAML 键不能包含特殊字符，且不能以数字开头
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
}

// 转义 YAML 字符串
const escapeYAMLString = (str) => {
  return str
    .replace(/"/g, '\\"')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

// 清空输入
const clearInput = () => {
  inputJSON.value = ''
  outputYAML.value = ''
  inputError.value = ''
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
  inputJSON.value = `{
  "application": {
    "name": "MyApp",
    "version": "1.0.0",
    "description": "A sample application",
    "enabled": true,
    "port": 8080,
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "myapp_db",
      "credentials": {
        "username": "admin",
        "password": "secret123"
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
    ],
    "environment": "production"
  }
}`
}

// 复制输出
const copyOutput = async () => {
  if (!outputYAML.value) return

  try {
    await navigator.clipboard.writeText(outputYAML.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputYAML.value) return

  const blob = new Blob([outputYAML.value], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'converted.yaml'
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