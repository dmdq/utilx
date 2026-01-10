<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本转义工具 - HTML/XML/JSON/SQL特殊字符转义</h1>
      <p class="text-muted-foreground">在线文本转义工具，支持HTML、XML、JSON、SQL特殊字符转义和反转义，防止注入攻击和格式错误。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入文本</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteText"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadSample"
            >
              示例
            </button>
          </div>
        </div>
        <textarea
          v-model="inputText"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入需要转义的文本..."
          @input="escape"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">转义结果</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyResult"
            >
              复制
            </button>
          </div>
        </div>
        <textarea
          v-model="outputText"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg font-mono text-sm resize-none"
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 转义类型选择 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-lg font-semibold text-foreground mb-4">转义类型</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in escapeTypes"
          :key="type.id"
          @click="currentType = type.id; escape()"
          :class="[
            'px-4 py-2 rounded transition-colors',
            currentType === type.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          ]"
        >
          {{ type.name }}
        </button>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12 relative">
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
          什么是文本转义？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本转义是一种将特殊字符转换为安全表示形式的技术。在编程和数据交换中，某些字符具有特殊含义（如HTML中的&lt;和&gt;、JSON中的引号等），
          如果直接使用这些字符，可能导致语法错误或安全漏洞（如SQL注入、XSS攻击）。
        </p>
        <p class="text-muted-foreground mb-4">
          转义通过在特殊字符前添加转义符号或将其替换为对应的实体编码，使其失去特殊含义，仅作为普通字符处理。
          例如，在HTML中，&lt;表示小于号&lt;，在JSON中，\"表示双引号"。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见转义类型
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>HTML转义:</strong> 将&lt;、&gt;、&amp;、&quot;等字符转换为&amp;lt;、&amp;gt;、&amp;amp;、&amp;quot;等实体编码</li>
          <li><strong>XML转义:</strong> 与HTML类似，还将单引号转换为&amp;apos;</li>
          <li><strong>JSON转义:</strong> 转义引号、反斜杠、换行符等特殊字符</li>
          <li><strong>SQL转义:</strong> 将单引号替换为两个单引号，防止SQL注入</li>
          <li><strong>URL转义:</strong> 将非ASCII字符和特殊字符转换为%XX形式</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入需要转义的文本</li>
          <li>选择转义类型（HTML、XML、JSON、SQL、URL等）</li>
          <li>右侧自动显示转义结果</li>
          <li>点击"复制"按钮复制结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Web开发:</strong> 防止XSS攻击，确保用户输入安全显示</li>
          <li><strong>API开发:</strong> 正确处理JSON数据中的特殊字符</li>
          <li><strong>数据库操作:</strong> 防止SQL注入攻击</li>
          <li><strong>URL处理:</strong> 正确编码URL参数中的特殊字符</li>
          <li><strong>日志处理:</strong> 转义日志中的特殊字符，便于解析</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么要进行文本转义？</h3>
            <p class="text-muted-foreground mt-1">
              文本转义主要有两个目的：一是防止特殊字符导致语法错误，二是防止安全漏洞（如注入攻击）。
              例如，用户输入的JavaScript代码如果不转义直接显示在网页上，可能导致XSS攻击。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">转义和编码有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              转义通常是在特定上下文中将特殊字符转换为安全形式（如HTML实体、JSON转义字符），
              而编码是将字符转换为字节序列的统一表示形式（如Base64、URL编码）。
              转义保持字符的可读性，编码则可能使内容变得不可读。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线转义安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的文本转义工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器，确保隐私安全。
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
import { ref, computed } from 'vue'
import {
  Code, FileText, Hash, Type, Scissors, Sparkles, Settings,
  ChevronUp, HelpCircle, ArrowLeftRight, BarChart3, FileDiff
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '文本转义工具 - HTML/XML/JSON/SQL特殊字符转义 | Util工具箱',
  description: '免费在线文本转义工具，支持HTML、XML、JSON、SQL特殊字符转义和反转义，防止注入攻击。纯本地计算，数据安全隐私。',
  keywords: '文本转义,HTML转义,XML转义,JSON转义,SQL转义,URL转义,特殊字符,防止注入',
  author: 'Util工具箱',
  ogTitle: '文本转义工具 - HTML/XML/JSON/SQL特殊字符转义',
  ogDescription: '专业的文本转义工具，支持HTML、XML、JSON、SQL、URL转义和反转义。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/text-escape.png',
  ogUrl: 'https://www.util.cn/tools/text-escape',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本转义工具 - HTML/XML/JSON/SQL特殊字符转义',
  twitterDescription: '专业的文本转义工具，支持HTML、XML、JSON、SQL、URL转义和反转义。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/text-escape.png'
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
            name: '文本转义工具',
            description: '在线文本转义工具，支持HTML、XML、JSON、SQL、URL转义和反转义',
            url: 'https://www.util.cn/tools/text-escape',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'HTML转义和反转义',
              'XML转义和反转义',
              'JSON转义和反转义',
              'SQL转义',
              'URL转义和反转义',
              '实时转换',
              '本地安全处理',
              '一键复制结果'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '文本转义',
                item: 'https://www.util.cn/tools/text-escape'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '为什么要进行文本转义？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '文本转义主要有两个目的：一是防止特殊字符导致语法错误，二是防止安全漏洞（如注入攻击）。'
                }
              },
              {
                '@type': 'Question',
                name: '转义和编码有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '转义通常是在特定上下文中将特殊字符转换为安全形式，而编码是将字符转换为字节序列的统一表示形式。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// 输入输出数据
const inputText = ref('')
const outputText = ref('')
const currentType = ref('html')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 转义类型
const escapeTypes = [
  { id: 'html', name: 'HTML转义' },
  { id: 'html-un', name: 'HTML反转义' },
  { id: 'xml', name: 'XML转义' },
  { id: 'json', name: 'JSON转义' },
  { id: 'json-un', name: 'JSON反转义' },
  { id: 'sql', name: 'SQL转义' },
  { id: 'url', name: 'URL转义' },
  { id: 'url-un', name: 'URL反转义' }
]

// 图标映射
const iconMap = {
  Code, FileText, Hash, Type, Scissors, Sparkles, Settings,
  ArrowLeftRight, BarChart3, FileDiff
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'text-escape'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'full-half-converter'),
    tools.find(t => t.id === 'text-split-merge'),
    tools.find(t => t.id === 'text-cleaner'),
    tools.find(t => t.id === 'text-statistics')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 转义函数
function escape() {
  const text = inputText.value

  switch (currentType.value) {
    case 'html':
      outputText.value = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
      break
    case 'html-un':
      outputText.value = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
      break
    case 'xml':
      outputText.value = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
      break
    case 'json':
      outputText.value = text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
      break
    case 'json-un':
      try {
        outputText.value = JSON.parse(`"${text}"`)
      } catch {
        outputText.value = text
      }
      break
    case 'sql':
      outputText.value = text.replace(/'/g, "''")
      break
    case 'url':
      outputText.value = encodeURIComponent(text)
      break
    case 'url-un':
      outputText.value = decodeURIComponent(text)
      break
  }
}

// 清空输入
function clearInput() {
  inputText.value = ''
  outputText.value = ''
}

// 粘贴文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    escape()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 复制结果
async function copyResult() {
  if (!outputText.value) return

  try {
    await navigator.clipboard.writeText(outputText.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 加载示例
function loadSample() {
  inputText.value = '<div class="test">Hello & "World"</div>'
  escape()
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化示例
loadSample()
</script>
