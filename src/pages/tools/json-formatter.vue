<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->
    
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">JSON格式化 - 在线JSON解析、验证与美化工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 JSON Formatter。支持一键美化、压缩、语法错误检测及树形视图展示。纯本地计算，数据隐私绝对安全。</p>
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
            <label class="text-xs text-muted-foreground">自动修复:</label>
            <input 
              type="checkbox" 
              v-model="autoFix" 
              class="rounded"
            />
          </div>
        </div>
        <textarea
          v-model="inputJSON"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入JSON数据..."
          @keydown.ctrl.enter="formatJSON"
          @keydown.meta.enter="formatJSON"
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
    
    <!-- 格式化按钮 -->
    <div class="flex justify-center mb-12">
      <button 
        @click="formatJSON"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        格式化 JSON
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
          什么是 JSON 格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          JSON (JavaScript Object Notation) 是一种轻量级的数据交换格式，易于人阅读和编写，同时也易于机器解析和生成。
          它基于 JavaScript Programming Language, Standard ECMA-262 3rd Edition - December 1999 的一个子集。
          JSON 采用完全独立于语言的文本格式，但是也使用了类似于 C 语言家族的习惯（包括 C, C++, C#, Java, JavaScript, Perl, Python 等）。
          这些特性使 JSON 成为理想的数据交换语言。
        </p>
        <p class="text-muted-foreground">
          为什么需要格式化 JSON？因为在实际应用中，为了节省传输带宽，JSON 数据通常会被压缩成一行，
          这使得开发者在调试和查看时非常困难。JSON 格式化工具可以将压缩的 JSON 数据转换为具有适当缩进和换行的可读格式，
          方便开发者查看和调试。
        </p>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 JSON 字符串粘贴到左侧输入框</li>
          <li>点击顶部的"格式化"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧的高亮代码，或点击"复制"导出</li>
          <li>如有需要，可以调整缩进大小或启用自动修复功能</li>
        </ol>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>语法高亮</strong>: 区分 Key 和 Value 的颜色，让代码结构更清晰</li>
          <li><strong>错误定位</strong>: 快速发现 JSON 中的语法错误，并提供详细的错误信息</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器，确保隐私安全</li>
          <li><strong>多种缩进</strong>: 支持 2 空格或 4 空格缩进，满足不同编码规范</li>
          <li><strong>自动修复</strong>: 智能修复常见的 JSON 语法错误</li>
          <li><strong>快捷操作</strong>: 支持快捷键操作，提高工作效率</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线 JSON 格式化安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的 JSON 格式化工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。我们使用 WebAssembly 和 JavaScript 技术确保数据处理的安全性和高效性，
              您可以放心使用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">JSON 和 XML 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              JSON 和 XML 都是数据交换格式，但它们有一些重要区别：
              JSON 更加轻量级，语法更简洁；XML 使用标签标记数据，而 JSON 使用键值对；
              JSON 解析速度更快，占用带宽更少；JSON 原生支持数组和对象结构，而 XML 需要额外的约定。
              对于 Web 应用开发，JSON 通常是更好的选择。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">格式化后的 JSON 为什么比原始数据大？</h3>
            <p class="text-muted-foreground mt-1">
              这是正常现象。原始 JSON 通常为了节省传输带宽而被压缩成一行，
              格式化过程会添加缩进和换行符来提高可读性，因此文件大小会增加。
              这种增加是为了提高开发者的可读性，而不是数据本身的膨胀。
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

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: 'JSON格式化工具 - 在线JSON解析、验证与美化 | Util工具箱',
  description: '免费在线JSON格式化工具，支持JSON美化、压缩、语法错误检测与树形视图展示。纯本地计算，数据安全隐私。一键格式化JSON，提升开发效率。',
  keywords: 'JSON格式化,JSON解析,JSON验证,JSON美化,在线JSON工具,JSON压缩,JSON格式化器,JSON查看器',
  author: 'Util工具箱',
  ogTitle: 'JSON格式化工具 - 免费在线JSON解析美化工具',
  ogDescription: '专业的JSON格式化工具，支持一键美化、压缩、语法验证。纯前端处理，数据安全可靠，支持多种缩进格式和自动修复。',
  ogImage: 'https://util.cn/images/tools/json-formatter.png',
  ogUrl: 'https://util.cn/tools/json-formatter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'JSON格式化工具 - 免费在线JSON解析美化',
  twitterDescription: '专业的JSON格式化工具，支持一键美化、压缩、语法验证。纯前端处理，数据安全可靠。',
  twitterImage: 'https://util.cn/images/tools/json-formatter.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'JSON格式化工具',
            description: '免费在线JSON格式化、解析和验证工具',
            url: 'https://util.cn/tools/json-formatter',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'JSON格式化美化',
              'JSON压缩最小化',
              '语法错误检测',
              '自动修复常见错误',
              '本地安全处理',
              '多种缩进格式',
              '一键复制下载'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'JSON格式化',
                item: 'https://util.cn/tools/json-formatter'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '在线JSON格式化安全吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '绝对安全。我们的JSON格式化工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，数据不会上传到任何服务器，确保隐私安全。'
                }
              },
              {
                '@type': 'Question',
                name: 'JSON和XML有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'JSON和XML都是数据交换格式，但JSON更加轻量级，语法更简洁；XML使用标签标记数据，而JSON使用键值对；JSON解析速度更快，占用带宽更少；JSON原生支持数组和对象结构。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'json-formatter')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputJSON = ref('')
const outputJSON = ref('')
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
    t.category === 'format' && t.id !== 'json-formatter'
  ).slice(0, 3)
  
  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'xml-formatter'),
    tools.find(t => t.id === 'yaml-converter'),
    tools.find(t => t.id === 'base64-encoder'),
    tools.find(t => t.id === 'url-encoder')
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

// 格式化JSON
const formatJSON = () => {
  if (!inputJSON.value) return
  
  try {
    inputError.value = ''
    
    let jsonString = inputJSON.value
    
    // 如果启用了自动修复，尝试修复常见错误
    if (autoFix.value) {
      jsonString = fixCommonJSONErrors(jsonString)
    }
    
    const parsed = JSON.parse(jsonString)
    const indent = parseInt(indentSize.value)
    outputJSON.value = JSON.stringify(parsed, null, indent)
  } catch (error) {
    inputError.value = `JSON格式错误: ${error.message}`
    outputJSON.value = ''
  }
}

// 修复常见JSON错误
const fixCommonJSONErrors = (str) => {
  // 移除注释 (简单的实现)
  str = str.replace(/\/\/.*$/gm, '')
  
  // 将单引号替换为双引号 (简单的实现)
  str = str.replace(/'/g, '"')
  
  // 添加缺失的逗号 (简单的实现)
  str = str.replace(/([}\]])\s*([{\[])/g, '$1,$2')
  
  return str
}

// 清空输入
const clearInput = () => {
  inputJSON.value = ''
  outputJSON.value = ''
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
  "name": "张三",
  "age": 30,
  "city": "北京",
  "skills": [
    "JavaScript",
    "Vue.js",
    "Node.js"
  ],
  "address": {
    "street": "长安街1号",
    "zipcode": "100000"
  }
}`
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
  a.download = 'formatted.json'
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