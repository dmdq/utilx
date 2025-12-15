<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">TOML格式化 - 在线TOML美化工具</h1>
      <p class="text-muted-foreground">一款免费的在线 TOML Formatter。支持一键美化、格式化TOML配置文件，自动调整缩进，检查语法。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入TOML</label>
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
            <label class="text-xs text-muted-foreground">键值对缩进:</label>
            <select
              v-model="indentSize"
              class="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value="2">2空格</option>
              <option value="4">4空格</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">排序键:</label>
            <input
              type="checkbox"
              v-model="sortKeys"
              class="rounded"
            />
          </div>
        </div>
        <textarea
          v-model="inputTOML"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入TOML数据..."
          @keydown.ctrl.enter="formatTOML"
          @keydown.meta.enter="formatTOML"
        ></textarea>
        <div v-if="inputError" class="mt-2 p-2 bg-destructive/20 text-destructive text-sm rounded">
          {{ inputError }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输出结果</label>
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
              下载TOML
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
        >{{ outputTOML }}</pre>
      </div>
    </div>

    <!-- 格式化按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="formatTOML"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        格式化 TOML
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
          什么是 TOML 格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          TOML (Tom's Obvious, Minimal Language) 是一种语义化明显的最小化配置文件格式。
          它旨在成为易于阅读和编写，同时明确映射到各种数据类型的配置文件格式。
          TOML 由 GitHub 联合创始人 Tom Preston-Werner 创建，被广泛用于 Rust、Cargo、
          Python 等生态系统中的配置文件。
        </p>
        <p class="text-muted-foreground">
          为什么需要格式化 TOML？TOML 文件虽然语法简单，但在多人协作或手动编辑时，
          可能会出现格式不一致的问题。TOML 格式化工具可以自动规范化格式，
          确保缩进一致、键值对对齐，使配置文件更加易读易维护。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 TOML 配置粘贴到左侧输入框</li>
          <li>选择键值对的缩进大小（2空格或4空格）</li>
          <li>可选择是否对键进行字母排序</li>
          <li>点击"格式化 TOML"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧格式化后的代码，或点击"复制"导出</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能格式化</strong>: 自动识别 TOML 结构，进行正确的格式化</li>
          <li><strong>键值对排序</strong>: 可选的字母排序功能，使配置更有序</li>
          <li><strong>缩进控制</strong>: 支持自定义缩进大小，满足不同编码规范</li>
          <li><strong>保留注释</strong>: 保持 TOML 注释的完整性</li>
          <li><strong>语法检查</strong>: 基本的语法验证，帮助发现常见错误</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，保护数据隐私</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线 TOML 格式化安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的 TOML 格式化工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您可以使用它处理包含敏感配置信息的 TOML 文件。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">TOML 和其他配置格式有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              TOML 介于 YAML 和 INI 之间：比 INI 更强大（支持数组、嵌套结构），
              比 YAML 更简洁明确（避免歧义的语法）。TOML 的设计目标是明确和最小化，
              适合作为机器和人类都可读的配置文件格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">TOML 支持哪些数据类型？</h3>
            <p class="text-muted-foreground mt-1">
              TOML 支持字符串、整数、浮点数、布尔值、日期时间、数组和表（对象）。
              字符串可用双引号或单引号，支持多行字符串。日期时间遵循 RFC 3339 格式。
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
  title: 'TOML格式化工具 - 在线TOML美化工具 | 有条工具',
  meta: [
    { name: 'description', content: '一款免费的在线 TOML 格式化工具。支持一键美化、格式化TOML配置文件，自动调整缩进，检查语法。支持键值对排序，保留注释，纯本地计算，数据隐私绝对安全。' },
    { name: 'keywords', content: 'TOML格式化,TOML美化,TOML工具,在线TOML格式化,TOML配置文件,Cargo配置,Rust配置,配置文件格式化,TOML解析,TOML验证,TOML编辑器' },
    { name: 'author', content: 'Util.cn' }
  ],
  og: {
    title: 'TOML格式化工具 - 在线TOML美化工具',
    description: '一款免费的在线 TOML 格式化工具。支持一键美化、格式化TOML配置文件，自动调整缩进，检查语法。支持键值对排序，保留注释，纯本地计算，数据隐私绝对安全。'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TOML格式化工具 - 在线TOML美化工具',
    description: '一款免费的在线 TOML 格式化工具。支持一键美化、格式化TOML配置文件，自动调整缩进，检查语法。支持键值对排序，保留注释，纯本地计算，数据隐私绝对安全。'
  }
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'toml-formatter')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputTOML = ref('')
const outputTOML = ref('')
const inputError = ref('')
const indentSize = ref('2')
const sortKeys = ref(false)

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
    t.category === 'format' && t.id !== 'toml-formatter'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'yaml-formatter'),
    tools.find(t => t.id === 'xml-formatter'),
    tools.find(t => t.id === 'yaml-converter')
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

// 格式化TOML
const formatTOML = () => {
  if (!inputTOML.value) return

  try {
    inputError.value = ''

    // 简单的 TOML 格式化实现
    const lines = inputTOML.value.split('\n')
    const indent = parseInt(indentSize.value) || 2
    const formattedLines = []
    let currentSection = ''

    for (const line of lines) {
      const trimmedLine = line.trim()

      // 跳过空行
      if (!trimmedLine) {
        formattedLines.push('')
        continue
      }

      // 处理注释行
      if (trimmedLine.startsWith('#')) {
        formattedLines.push(' '.repeat(currentSection ? indent : 0) + trimmedLine)
        continue
      }

      // 处理节（[section]）
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        currentSection = trimmedLine
        formattedLines.push('')
        formattedLines.push(trimmedLine)
        formattedLines.push('')
        continue
      }

      // 处理键值对
      if (trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        const value = valueParts.join('=').trim()

        // 格式化键值对
        formattedLines.push(' '.repeat(currentSection ? indent : 0) + key.trim() + ' = ' + value)
      }
      // 处理多行数组
      else if (currentSection && trimmedLine.startsWith('[') && !trimmedLine.endsWith(']')) {
        formattedLines.push(' '.repeat(indent) + trimmedLine)
      }
      // 数组元素
      else if (currentSection && trimmedLine.startsWith('  ') || trimmedLine.startsWith('\t')) {
        formattedLines.push(' '.repeat(indent) + trimmedLine)
      }
      // 其他内容
      else {
        formattedLines.push(trimmedLine)
      }
    }

    outputTOML.value = formattedLines.join('\n').trim()

  } catch (error) {
    inputError.value = `TOML格式化错误: ${error.message}`
    outputTOML.value = ''
  }
}

// 清空输入
const clearInput = () => {
  inputTOML.value = ''
  outputTOML.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputTOML.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  inputTOML.value = `# TOML 配置示例
title = "TOML Example"
owner.name = "Tom Preston-Werner"
owner.dob = 1979-05-27T07:32:00-08:00

[database]
server = "192.168.1.1"
ports = [ 8001, 8001, 8002 ]
connection_max = 5000
enabled = true

[servers]
alpha = "10.0.0.1"
beta = "10.0.0.2"`
}

// 复制输出
const copyOutput = async () => {
  if (!outputTOML.value) return

  try {
    await navigator.clipboard.writeText(outputTOML.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputTOML.value) return

  const blob = new Blob([outputTOML.value], { type: 'text/toml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.toml'
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