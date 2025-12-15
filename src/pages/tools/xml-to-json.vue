<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">XML转JSON - 在线XML转JSON格式转换工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 XML to JSON Converter。支持将 XML 数据快速转换为 JSON 格式，保留数据结构，支持属性转换和数组检测。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入XML</label>
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
            <label class="text-xs text-muted-foreground">处理属性:</label>
            <select
              v-model="attributeHandling"
              class="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value="prefix">加@前缀</option>
              <option value="separate">单独对象</option>
              <option value="ignore">忽略</option>
            </select>
          </div>
        </div>
        <textarea
          v-model="inputXML"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入XML数据..."
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
          <label class="text-sm font-medium text-foreground">JSON输出</label>
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
              下载JSON
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
        >{{ outputJSON }}</pre>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        转换为 JSON
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
          什么是 XML 转 JSON？
        </h2>
        <p class="text-muted-foreground mb-4">
          XML（eXtensible Markup Language）和 JSON（JavaScript Object Notation）都是常用的数据交换格式。
          XML 转 JSON 是将 XML 标记语言数据转换为 JSON 对象格式的过程。JSON 更轻量级、更易解析，
          在现代 Web 应用中被广泛使用。
        </p>
        <p class="text-muted-foreground">
          转换过程中，XML 的元素、属性、文本内容会被映射到 JSON 的对象、属性和值。
          需要考虑如何处理 XML 特有的特性，如属性、命名空间、注释等。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 XML 数据粘贴到左侧输入框</li>
          <li>选择 JSON 缩进大小（2空格或4空格）</li>
          <li>选择属性处理方式（加@前缀、单独对象或忽略）</li>
          <li>点击"转换为 JSON"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换后的 JSON 结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换规则说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>元素转换</strong>: XML 元素转换为 JSON 对象的属性</li>
          <li><strong>属性处理</strong>: XML 属性可转换为带@前缀的属性或单独的对象</li>
          <li><strong>文本内容</strong>: 元素的文本内容作为特殊属性 "#text" 或直接作为值</li>
          <li><strong>数组检测</strong>: 相同名称的兄弟元素自动转换为 JSON 数组</li>
          <li><strong>混合内容</strong>: 包含文本和子元素的元素会被特殊处理</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          属性处理选项
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">加@前缀</h4>
            <p class="text-sm text-muted-foreground">
              将 XML 属性转换为以 @ 开头的 JSON 属性。
              例如：&lt;item id="1"&gt; → {"@id": "1"}
            </p>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">单独对象</h4>
            <p class="text-sm text-muted-foreground">
              将所有属性收集到单独的 "@attributes" 对象中。
              例如：&lt;item id="1"&gt; → {"@attributes": {"id": "1"}}
            </p>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">忽略</h4>
            <p class="text-sm text-muted-foreground">
              完全忽略 XML 属性，只保留元素和文本内容。
              这适用于只需要数据的场景。
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">XML 中的命名空间如何处理？</h3>
            <p class="text-muted-foreground mt-1">
              命名空间前缀会保留在元素名称中。例如 &lt;ns:item&gt; 会被转换为 {"ns:item": ...}。
              如果需要完全移除命名空间，可以在转换后进行后处理。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理 CDATA 部分？</h3>
            <p class="text-muted-foreground mt-1">
              CDATA 部分的内容会作为普通文本处理，不会被解析为 XML 标记。
              这确保了特殊字符和代码片段能够正确保留。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">转换后的 JSON 可以再转回 XML 吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。使用我们的 JSON 转 XML 工具可以将转换后的 JSON 再转回 XML 格式。
              某些 XML 特性（如注释、处理指令）在转换过程中可能会丢失。
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
  Code, FileJson, Copy, Download, RotateCcw,
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
  title: 'XML转JSON - 在线XML转JSON格式转换工具',
  description: '免费在线 XML to JSON 转换工具，支持将 XML 数据快速转换为 JSON 格式，保留数据结构，支持属性转换和数组检测。纯本地计算，数据安全。',
  keywords: 'XML转JSON, XML to JSON, XML JSON转换, 数据格式转换, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'XML转JSON - 在线XML转JSON格式转换工具',
  ogDescription: '免费在线 XML to JSON 转换工具，支持将 XML 数据快速转换为 JSON 格式。',
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
        name: 'XML转JSON工具',
        description: '免费在线 XML to JSON 转换工具，支持将 XML 数据快速转换为 JSON 格式',
        url: 'https://www.util.cn/tools/xml-to-json',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'XML转JSON',
          '属性处理选项',
          '数组自动检测',
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
const tool = tools.find(t => t.id === 'xml-to-json')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputXML = ref('')
const outputJSON = ref('')
const inputError = ref('')
const indentSize = ref('2')
const attributeHandling = ref('prefix')

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
    t.category === 'format' && t.id !== 'xml-to-json'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-to-xml'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'xml-formatter'),
    tools.find(t => t.id === 'json-to-yaml')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// XML 转 JSON
const convert = () => {
  if (!inputXML.value) return

  try {
    inputError.value = ''

    // 解析 XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(inputXML.value, 'text/xml')

    // 检查解析错误
    const parseError = xmlDoc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      throw new Error('XML格式错误，请检查语法')
    }

    // 转换为 JSON
    const jsonResult = xmlToJSON(xmlDoc.documentElement)

    // 格式化输出
    const indent = parseInt(indentSize.value)
    outputJSON.value = JSON.stringify(jsonResult, null, indent)
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputJSON.value = ''
  }
}

// XML 节点转 JSON
const xmlToJSON = (node) => {
  const result = {}

  // 处理属性
  const attributes = {}
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i]
    if (attributeHandling.value === 'prefix') {
      result[`@${attr.name}`] = attr.value
    } else if (attributeHandling.value === 'separate') {
      attributes[attr.name] = attr.value
    }
  }

  if (attributeHandling.value === 'separate' && Object.keys(attributes).length > 0) {
    result['@attributes'] = attributes
  }

  // 处理子节点
  const childNodes = Array.from(node.childNodes).filter(n => n.nodeType !== 7 && n.nodeType !== 8) // 排除处理指令和注释

  // 收集文本内容
  let textContent = ''
  const elementChildren = []

  for (const child of childNodes) {
    if (child.nodeType === 3) { // 文本节点
      textContent += child.textContent
    } else if (child.nodeType === 1) { // 元素节点
      elementChildren.push(child)
    }
  }

  // 处理元素子节点
  for (const child of elementChildren) {
    const childName = child.tagName
    const childValue = xmlToJSON(child)

    if (result[childName]) {
      // 如果已存在，转换为数组
      if (!Array.isArray(result[childName])) {
        result[childName] = [result[childName]]
      }
      result[childName].push(childValue)
    } else {
      result[childName] = childValue
    }
  }

  // 处理文本内容
  textContent = textContent.trim()
  if (textContent) {
    if (Object.keys(result).length === 0) {
      // 如果只有文本内容，直接返回文本
      return textContent
    } else if (Object.keys(result).length > 0) {
      // 如果既有属性/子元素又有文本，添加 #text
      result['#text'] = textContent
    }
  }

  // 如果结果是空对象，返回 null
  if (Object.keys(result).length === 0) {
    return null
  }

  return result
}

// 清空输入
const clearInput = () => {
  inputXML.value = ''
  outputJSON.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputXML.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  inputXML.value = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction" isbn="978-0-7432-7356-5">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
    <description>
      A classic American novel set in the Jazz Age.
    </description>
  </book>
  <book category="children" isbn="978-0-439-70818-1">
    <title lang="en">Harry Potter</title>
    <author>J.K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
    <description>
      A magical adventure of a young wizard.
    </description>
  </book>
  <metadata>
    <created>2023-01-01</created>
    <version>1.0</version>
  </metadata>
</bookstore>`
}

// 复制输出
const copyOutput = async () => {
  if (!outputJSON.value) return

  try {
    await navigator.clipboard.writeText(outputJSON.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputJSON.value) return

  const blob = new Blob([outputJSON.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'converted.json'
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