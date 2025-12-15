<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">XML格式化 - 在线XML美化与格式化工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 XML Formatter。支持一键美化、压缩、语法错误检测及格式转换。纯本地计算，数据隐私绝对安全。</p>
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
              <option value="tab">Tab</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">自动修复:</label>
            <input
              type="checkbox"
              v-model="autoFix"
              class="rounded"
            />
          </div>
        </div>
        <textarea
          v-model="inputXML"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入XML数据..."
          @keydown.ctrl.enter="formatXML"
          @keydown.meta.enter="formatXML"
        ></textarea>
        <div v-if="inputError" class="mt-2 p-2 bg-destructive/20 text-destructive text-sm rounded">
          {{ inputError }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">格式化结果</label>
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

    <!-- 格式化按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="formatXML"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        格式化 XML
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
          什么是 XML 格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          XML（eXtensible Markup Language）是一种标记语言，被设计用来传输和存储数据。
          XML 格式化是将压缩或混乱的 XML 文档转换为具有良好的层次结构、缩进和换行的可读格式的过程。
          格式化后的 XML 不仅更易读，也便于开发者进行调试和维护。
        </p>
        <p class="text-muted-foreground">
          XML 广泛应用于 Web 服务、配置文件、数据交换等场景。由于传输效率的考虑，
          XML 数据经常被压缩成一行或格式混乱，使用 XML 格式化工具可以快速还原其可读的结构。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 XML 数据粘贴到左侧输入框</li>
          <li>选择缩进方式（2空格、4空格或Tab）</li>
          <li>可选择启用自动修复功能来修复常见错误</li>
          <li>点击"格式化 XML"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧格式化后的结果，可复制或下载</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能格式化</strong>: 自动识别 XML 标签、属性、文本内容并进行合理缩进</li>
          <li><strong>错误检测</strong>: 检测 XML 语法错误，如未闭合标签、属性格式错误等</li>
          <li><strong>自动修复</strong>: 智能修复常见的 XML 语法错误</li>
          <li><strong>多种缩进</strong>: 支持 2 空格、4 空格、Tab 缩进</li>
          <li><strong>本地处理</strong>: 所有处理都在浏览器本地完成，确保数据安全</li>
          <li><strong>导出功能</strong>: 支持复制和下载格式化后的 XML</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">XML 和 JSON 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              XML 和 JSON 都是数据交换格式，但主要区别在于：XML 使用标签标记数据，支持命名空间、
              属性、注释等丰富功能；JSON 使用键值对，语法更简洁，解析速度更快。
              XML 更适合文档和配置，JSON 更适合数据交换。选择取决于具体应用场景。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">格式化后的 XML 可以直接使用吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。XML 格式化只改变文档的视觉呈现（添加缩进和换行），不会改变 XML 的结构和内容。
              格式化后的 XML 在功能上与原始 XML 完全等价，可以直接用于应用程序或数据交换。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要 XML 格式化？</h3>
            <p class="text-muted-foreground mt-1">
              XML 格式化的主要原因是提高可读性。压缩的 XML 难以阅读和理解，格式化后可以清晰地看到文档结构。
              这有助于：快速理解数据结构、方便调试、便于代码审查、提高团队协作效率。
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
  Code, Copy, Download, RotateCcw,
  FileText, Lock, Shield, Clock, Type, Wifi, Image, FileJson,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, ChevronDown, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'
import Breadcrumb from '~/components/Breadcrumb.vue'

definePageMeta({
  layout: 'default'
})

// 设置页面的SEO元信息
useSeoMeta({
  title: 'XML格式化 - 在线XML美化与格式化工具 | 有条工具',
  description: '免费的在线XML格式化工具，支持一键美化、压缩、语法错误检测及格式转换。纯本地计算，数据隐私绝对安全。支持2空格、4空格、Tab缩进，自动修复常见错误。',
  keywords: 'XML格式化,XML美化,XML压缩,XML验证,在线XML工具,XML编辑器,XML语法检查,XML格式转换',
  author: 'Util.cn',
  ogTitle: 'XML格式化 - 在线XML美化与格式化工具',
  ogDescription: '免费的在线XML格式化工具，支持一键美化、压缩、语法错误检测及格式转换。纯本地计算，数据隐私绝对安全。',
  ogType: 'website',
  ogSiteName: '有条工具',
  twitterCard: 'summary',
  twitterTitle: 'XML格式化 - 在线XML美化与格式化工具',
  twitterDescription: '免费的在线XML格式化工具，支持一键美化、压缩、语法错误检测及格式转换。纯本地计算，数据隐私绝对安全。'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'xml-formatter')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputXML = ref('')
const outputXML = ref('')
const inputError = ref('')
const indentSize = ref('2')
const autoFix = ref(false)

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
    t.category === 'format' && t.id !== 'xml-formatter'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'yaml-converter'),
    tools.find(t => t.id === 'sql-formatter'),
    tools.find(t => t.id === 'base64-encoder')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 格式化XML
const formatXML = () => {
  if (!inputXML.value) return

  try {
    inputError.value = ''

    let xmlString = inputXML.value.trim()

    // 如果启用了自动修复，尝试修复常见错误
    if (autoFix.value) {
      xmlString = fixCommonXMLErrors(xmlString)
    }

    // 解析XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

    // 检查解析错误
    const parseError = xmlDoc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      throw new Error('XML格式错误，请检查语法')
    }

    // 格式化XML
    const formatted = formatXMLNode(xmlDoc.documentElement, 0)
    outputXML.value = formatted
  } catch (error) {
    inputError.value = error.message || `XML格式错误: ${error.message}`
    outputXML.value = ''
  }
}

// 修复常见XML错误
const fixCommonXMLErrors = (xml) => {
  // 移除控制字符
  xml = xml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 确保XML声明存在
  if (!xml.startsWith('<?xml')) {
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml
  }

  // 修复自闭合标签
  xml = xml.replace(/<(\w+)([^>]*)\/>/g, (match, tag, attrs) => {
    // 检查是否是真正的自闭合标签
    const content = xml.substring(xml.indexOf(match) + match.length, xml.length)
    if (!content.includes(`</${tag}>`)) {
      return match
    }
    return `<${tag}${attrs}></${tag}>`
  })

  return xml
}

// 递归格式化XML节点
const formatXMLNode = (node, indent) => {
  if (!node) return ''

  const indentChar = indentSize.value === 'tab' ? '\t' : ' '.repeat(parseInt(indentSize.value) || 2)
  const currentIndent = indentChar.repeat(indent)
  const childIndent = indentChar.repeat(indent + 1)

  let result = ''

  // 处理节点开始标签
  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.tagName
    const attributes = []

    // 收集属性
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i]
      attributes.push(`${attr.name}="${attr.value}"`)
    }

    // 构建开始标签
    if (attributes.length > 0) {
      result += `${currentIndent}<${tagName} ${attributes.join(' ')}>`
    } else {
      result += `${currentIndent}<${tagName}>`
    }

    // 处理子节点
    const children = []
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i]
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(formatXMLNode(child, indent + 1))
      } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        children.push(child.textContent.trim())
      }
    }

    if (children.length > 0) {
      result += '\n'
      result += children.join('\n')
      result += '\n' + currentIndent
    }

    // 添加结束标签
    result += `</${tagName}>`
  } else if (node.nodeType === Node.DOCUMENT_NODE) {
    // 处理文档节点
    for (let i = 0; i < node.childNodes.length; i++) {
      result += formatXMLNode(node.childNodes[i], indent)
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    // 处理文本节点
    const text = node.textContent.trim()
    if (text) {
      result += currentIndent + text
    }
  }

  return result
}

// 清空输入
const clearInput = () => {
  inputXML.value = ''
  outputXML.value = ''
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

// 加载示例XML
const loadSample = () => {
  inputXML.value = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
  </book>
  <book category="children">
    <title lang="en">Harry Potter</title>
    <author>J.K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>`
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
  a.download = 'formatted.xml'
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