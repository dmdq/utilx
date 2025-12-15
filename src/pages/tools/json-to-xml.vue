<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">JSON转XML - 在线JSON转XML格式转换工具</h1>
      <p class="text-muted-foreground">一款免费的在线 JSON to XML Converter。支持将 JSON 数据快速转换为 XML 格式，保留数据结构，支持自定义根元素名称。纯本地计算，数据隐私绝对安全。</p>
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
            <label class="text-xs text-muted-foreground">根元素名称:</label>
            <input
              type="text"
              v-model="rootElementName"
              placeholder="root"
              class="text-xs bg-muted border border-border rounded px-2 py-1 w-24"
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">数组元素名称:</label>
            <input
              type="text"
              v-model="arrayElementName"
              placeholder="item"
              class="text-xs bg-muted border border-border rounded px-2 py-1 w-24"
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
          <label class="text-sm font-medium text-foreground">XML输出</label>
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
              下载XML
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
        >{{ outputXML }}</pre>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        转换为 XML
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
          什么是 JSON 转 XML？
        </h2>
        <p class="text-muted-foreground mb-4">
          JSON（JavaScript Object Notation）和 XML（eXtensible Markup Language）都是常用的数据交换格式。
          JSON 转 XML 是将 JSON 数据结构转换为 XML 格式的过程，这在需要与遗留系统集成、
          或某些特定场景下需要 XML 格式的数据时非常有用。
        </p>
        <p class="text-muted-foreground">
          JSON 使用键值对和数组来表示数据结构，而 XML 使用标签和属性。转换过程中需要考虑
          如何映射这些结构，以确保数据的完整性和可读性。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 JSON 数据粘贴到左侧输入框</li>
          <li>设置根元素名称（默认为 "root"）</li>
          <li>设置数组元素名称（默认为 "item"）</li>
          <li>点击"转换为 XML"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换后的 XML 结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换规则说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>对象映射</strong>: JSON 对象转换为 XML 元素，键名作为标签名</li>
          <li><strong>数组处理</strong>: JSON 数组转换为多个相同名称的 XML 元素</li>
          <li><strong>数据类型</strong>: 所有值都转换为 XML 的文本内容（CDATA）</li>
          <li><strong>嵌套结构</strong>: 保留 JSON 的嵌套层级关系</li>
          <li><strong>特殊字符</strong>: 自动转义 XML 特殊字符（<, >, &, ', "）</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">转换后的 XML 会保留数据类型吗？</h3>
            <p class="text-muted-foreground mt-1">
              XML 本身不支持数据类型，所有值都会转换为文本。如果需要在 XML 中保留类型信息，
              可以使用属性或特殊标签来标记数据类型。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">JSON 数组如何转换为 XML？</h3>
            <p class="text-muted-foreground mt-1">
              JSON 数组会转换为多个同名的 XML 元素。例如，数组 ["a", "b"] 会转换为：
              &lt;array&gt;&lt;item&gt;a&lt;/item&gt;&lt;item&gt;b&lt;/item&gt;&lt;/array&gt;
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要 JSON 转 XML？</h3>
            <p class="text-muted-foreground mt-1">
              常见场景包括：与使用 XML 的遗留系统集成、符合行业标准格式要求、
              XML 具有更好的自描述性和验证机制（DTD/XSD）、某些企业应用要求 XML 格式等。
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
  title: 'JSON转XML - 在线JSON转XML格式转换工具',
  description: '免费在线 JSON to XML 转换工具，支持将 JSON 数据快速转换为 XML 格式，保留数据结构，支持自定义根元素。纯本地计算，数据安全。',
  keywords: 'JSON转XML, JSON to XML, JSON XML转换, 数据格式转换, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'JSON转XML - 在线JSON转XML格式转换工具',
  ogDescription: '免费在线 JSON to XML 转换工具，支持将 JSON 数据快速转换为 XML 格式，保留数据结构。',
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
        name: 'JSON转XML工具',
        description: '免费在线 JSON to XML 转换工具，支持将 JSON 数据快速转换为 XML 格式',
        url: 'https://www.util.cn/tools/json-to-xml',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'JSON转XML',
          '自定义根元素',
          '数组元素命名',
          '格式化输出',
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
const tool = tools.find(t => t.id === 'json-to-xml')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputJSON = ref('')
const outputXML = ref('')
const inputError = ref('')
const rootElementName = ref('root')
const arrayElementName = ref('item')

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
    t.category === 'format' && t.id !== 'json-to-xml'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'xml-to-json'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'xml-formatter'),
    tools.find(t => t.id === 'json-to-yaml')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// JSON 转 XML
const convert = () => {
  if (!inputJSON.value) return

  try {
    inputError.value = ''
    const jsonData = JSON.parse(inputJSON.value)
    const xmlString = jsonToXML(jsonData, rootElementName.value)
    outputXML.value = formatXML(xmlString)
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputXML.value = ''
  }
}

// 递归转换 JSON 为 XML
const jsonToXML = (obj, rootName) => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`

  if (typeof obj === 'object' && obj !== null) {
    xml += `<${rootName}>\n`
    xml += objectToXML(obj, 1)
    xml += `</${rootName}>`
  } else {
    xml += `<${rootName}>${escapeXML(String(obj))}</${rootName}>`
  }

  return xml
}

// 对象转 XML
const objectToXML = (obj, indent) => {
  const indentStr = '  '.repeat(indent)
  let xml = ''

  if (Array.isArray(obj)) {
    for (const item of obj) {
      xml += `${indentStr}<${arrayElementName.value}>`
      if (typeof item === 'object' && item !== null) {
        xml += '\n'
        xml += objectToXML(item, indent + 1)
        xml += `${indentStr}</${arrayElementName.value}>\n`
      } else {
        xml += `${escapeXML(String(item))}</${arrayElementName.value}>\n`
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      // 处理非法的 XML 标签名
      const validKey = key.replace(/[^a-zA-Z0-9_-]/g, '_')

      xml += `${indentStr}<${validKey}>`
      if (typeof value === 'object' && value !== null) {
        xml += '\n'
        xml += objectToXML(value, indent + 1)
        xml += `${indentStr}</${validKey}>\n`
      } else {
        xml += `${escapeXML(String(value))}</${validKey}>\n`
      }
    }
  }

  return xml
}

// 转义 XML 特殊字符
const escapeXML = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 格式化 XML
const formatXML = (xml) => {
  return xml
}

// 清空输入
const clearInput = () => {
  inputJSON.value = ''
  outputXML.value = ''
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
  "bookstore": {
    "book": [
      {
        "title": "Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "year": 1925,
        "price": 10.99,
        "category": "fiction"
      },
      {
        "title": "Harry Potter",
        "author": "J.K. Rowling",
        "year": 2005,
        "price": 29.99,
        "category": "children"
      }
    ],
    "name": "My Bookstore",
    "location": "New York"
  }
}`
}

// 复制输出
const copyOutput = async () => {
  if (!outputXML.value) return

  try {
    await navigator.clipboard.writeText(outputXML.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputXML.value) return

  const blob = new Blob([outputXML.value], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'converted.xml'
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