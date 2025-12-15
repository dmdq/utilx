<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">CSS格式化 - 在线CSS美化与压缩工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 CSS Formatter。支持一键美化、压缩CSS代码，自动调整缩进，规范CSS格式。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入CSS</label>
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
            <label class="text-xs text-muted-foreground">压缩模式:</label>
            <input
              type="checkbox"
              v-model="compressMode"
              class="rounded"
            />
          </div>
        </div>
        <textarea
          v-model="inputCSS"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入CSS代码..."
          @keydown.ctrl.enter="formatCSS"
          @keydown.meta.enter="formatCSS"
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
              下载CSS
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
        >{{ outputCSS }}</pre>
      </div>
    </div>

    <!-- 格式化按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="formatCSS"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        格式化 CSS
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
          什么是 CSS 格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          CSS (Cascading Style Sheets) 是一种用来表现HTML或XML等文件样式的计算机语言。
          它不仅可以静态地修饰网页，还可以配合各种脚本语言动态地对网页各元素进行格式化。
          CSS 能够对网页中元素位置的排版进行像素级精确控制，支持几乎所有的字体字号样式，
          拥有对网页对象和模型样式编辑的能力。
        </p>
        <p class="text-muted-foreground">
          为什么需要格式化 CSS？在实际开发中，为了节省网络传输带宽，CSS 代码通常会被压缩成一行，
          这使得开发者在阅读和维护时非常困难。CSS 格式化工具可以将压缩的 CSS 代码转换为具有适当缩进
          和换行的可读格式，方便开发者查看和调试。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 CSS 代码粘贴到左侧输入框</li>
          <li>选择缩进大小（2空格、4空格或Tab）</li>
          <li>可选择是否启用压缩模式</li>
          <li>点击"格式化 CSS"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧格式化后的代码，或点击"复制"导出</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能格式化</strong>: 自动识别选择器、属性和值，并进行适当的缩进和换行</li>
          <li><strong>压缩选项</strong>: 可选择压缩模式，移除不必要的空格和换行</li>
          <li><strong>多种缩进</strong>: 支持 2 空格、4 空格或 Tab 缩进</li>
          <li><strong>语法高亮</strong>: 自动识别 CSS 语法，提供更好的可读性</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>快捷操作</strong>: 支持快捷键操作，提高工作效率</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线 CSS 格式化安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的 CSS 格式化工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您可以使用它处理包含敏感信息的 CSS 代码。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">格式化后的 CSS 为什么比原始数据大？</h3>
            <p class="text-muted-foreground mt-1">
              这是正常现象。原始 CSS 通常为了节省传输带宽而被压缩成一行，
              格式化过程会添加缩进和换行符来提高可读性，因此文件大小会增加。
              这种增加是为了提高开发者的可读性，而不是数据本身的膨胀。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持 CSS 预处理器吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具主要用于格式化标准 CSS 代码。对于 Sass、Less、Stylus 等 CSS 预处理器，
              建议先编译成标准 CSS 后再使用本工具进行格式化。
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
  title: 'CSS格式化工具 - 在线CSS美化与压缩工具 | 有条工具',
  meta: [
    { name: 'description', content: '一款免费的在线 CSS 格式化工具。支持一键美化、压缩CSS代码，自动调整缩进，规范CSS格式。支持2空格、4空格或Tab缩进，纯本地计算，数据隐私绝对安全。' },
    { name: 'keywords', content: 'CSS格式化,CSS美化,CSS压缩,代码格式化,CSS格式化工具,在线CSS工具,CSS代码美化,CSS代码压缩,CSS缩进调整' },
    { name: 'author', content: 'Util.cn' }
  ],
  og: {
    title: 'CSS格式化工具 - 在线CSS美化与压缩工具',
    description: '一款免费的在线 CSS 格式化工具。支持一键美化、压缩CSS代码，自动调整缩进，规范CSS格式。支持2空格、4空格或Tab缩进，纯本地计算，数据隐私绝对安全。'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CSS格式化工具 - 在线CSS美化与压缩工具',
    description: '一款免费的在线 CSS 格式化工具。支持一键美化、压缩CSS代码，自动调整缩进，规范CSS格式。支持2空格、4空格或Tab缩进，纯本地计算，数据隐私绝对安全。'
  }
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'css-formatter')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputCSS = ref('')
const outputCSS = ref('')
const inputError = ref('')
const indentSize = ref('2')
const compressMode = ref(false)

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
    t.category === 'format' && t.id !== 'css-formatter'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'html-formatter'),
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

// 格式化CSS
const formatCSS = () => {
  if (!inputCSS.value) return

  try {
    inputError.value = ''

    if (compressMode.value) {
      // 压缩模式：移除多余空格和换行
      outputCSS.value = inputCSS.value
        .replace(/\s*{\s*/g, '{')
        .replace(/;\s*/g, ';')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*:\s*/g, ':')
        .replace(/\s*,\s*/g, ',')
        .replace(/\s*>\s*/g, '>')
        .replace(/\s*\+\s*/g, '+')
        .replace(/\s*~\s*/g, '~')
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
        .replace(/\s+/g, ' ')
        .trim()
    } else {
      // 格式化模式
      let css = inputCSS.value

      // 移除多余的空行和空格
      css = css.replace(/\s+/g, ' ').trim()

      // 处理每个规则
      const rules = css.split('}')
      const formattedRules = rules.map(rule => {
        if (!rule.trim()) return ''

        // 分离选择器和属性
        const parts = rule.split('{')
        const selector = parts[0].trim()
        const properties = parts[1] || ''

        if (!selector && !properties) return ''

        // 格式化选择器
        let formattedRule = selector + ' {\n'

        // 格式化属性
        if (properties) {
          const props = properties.split(';').filter(p => p.trim())
          const indent = indentSize.value === 'tab' ? '\t' : ' '.repeat(parseInt(indentSize.value) || 2)

          props.forEach(prop => {
            const [key, value] = prop.split(':').map(p => p.trim())
            if (key && value) {
              formattedRule += `${indent}${key}: ${value};\n`
            }
          })
        }

        formattedRule += '}\n'
        return formattedRule
      })

      outputCSS.value = formattedRules.join('\n').trim()
    }
  } catch (error) {
    inputError.value = `CSS格式化错误: ${error.message}`
    outputCSS.value = ''
  }
}

// 清空输入
const clearInput = () => {
  inputCSS.value = ''
  outputCSS.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputCSS.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  inputCSS.value = `.container{max-width:1200px;margin:0 auto;padding:0 15px}.row{display:flex;flex-wrap:wrap;margin:0 -15px}.col{flex:1;padding:0 15px}.btn{display:inline-block;padding:10px 20px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer}.btn:hover{background:#0056b3}`
}

// 复制输出
const copyOutput = async () => {
  if (!outputCSS.value) return

  try {
    await navigator.clipboard.writeText(outputCSS.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputCSS.value) return

  const blob = new Blob([outputCSS.value], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.css'
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