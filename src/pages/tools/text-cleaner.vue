<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本清洗工具 - 在线去除特殊字符、空白字符、控制字符</h1>
      <p class="text-muted-foreground">在线文本清洗工具，支持去除特殊字符、多余空白、不可见字符、控制字符，适用于日志处理、数据清洗、文本格式化。纯本地计算，数据隐私绝对安全。</p>
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
          placeholder="在此输入需要清洗的文本..."
          @input="cleanText"
        ></textarea>
        <div class="mt-4 text-sm text-muted-foreground">
          字符数: {{ inputText.length }} | 行数: {{ inputText.split('\n').length }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">清洗结果</label>
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
          placeholder="清洗后的文本将显示在这里..."
          readonly
        ></textarea>
        <div class="mt-4 text-sm text-muted-foreground">
          字符数: {{ outputText.length }} | 减少: {{ inputText.length - outputText.length }} 字符
        </div>
      </div>
    </div>

    <!-- 清洗选项 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Settings class="w-5 h-5 text-primary" />
        清洗选项
      </h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <!-- 空白字符处理 -->
        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-3 text-primary">空白字符处理</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeExtraSpaces" @change="cleanText" class="rounded">
              <span>去除多余空格</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeExtraLines" @change="cleanText" class="rounded">
              <span>去除多余空行</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.trimLines" @change="cleanText" class="rounded">
              <span>去除每行首尾空白</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeTabs" @change="cleanText" class="rounded">
              <span>将Tab转空格</span>
            </label>
          </div>
        </div>

        <!-- 特殊字符处理 -->
        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-3 text-primary">特殊字符处理</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removePunctuation" @change="cleanText" class="rounded">
              <span>去除标点符号</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeSpecialChars" @change="cleanText" class="rounded">
              <span>去除特殊符号</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeInvisible" @change="cleanText" class="rounded">
              <span>去除不可见字符</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeControlChars" @change="cleanText" class="rounded">
              <span>去除控制字符</span>
            </label>
          </div>
        </div>

        <!-- 内容处理 -->
        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-3 text-primary">内容处理</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeNumbers" @change="cleanText" class="rounded">
              <span>去除数字</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeLetters" @change="cleanText" class="rounded">
              <span>去除字母</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.removeChinese" @change="cleanText" class="rounded">
              <span>去除中文</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.KeepOnlyChinese" @change="cleanText" class="rounded">
              <span>仅保留中文</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 快捷预设 -->
      <div>
        <h3 class="font-medium mb-3 text-foreground">快捷预设</h3>
        <div class="flex flex-wrap gap-2">
          <button
            @click="applyPreset('clean')"
            class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            标准清洗
          </button>
          <button
            @click="applyPreset('log')"
            class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            日志清洗
          </button>
          <button
            @click="applyPreset('code')"
            class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            代码清洗
          </button>
          <button
            @click="applyPreset('data')"
            class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            数据清洗
          </button>
          <button
            @click="applyPreset('minimal')"
            class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded"
          >
            重置选项
          </button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-4">统计信息</h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.originalChars }}</div>
          <div class="text-sm text-muted-foreground">原始字符</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.cleanedChars }}</div>
          <div class="text-sm text-muted-foreground">清洗后字符</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.removedChars }}</div>
          <div class="text-sm text-muted-foreground">移除字符</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.reductionRate }}%</div>
          <div class="text-sm text-muted-foreground">减少比例</div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12 relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是文本清洗？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本清洗是数据预处理的重要环节，指从原始文本中去除不需要的字符、格式化文本、统一标准的过程。
          清洗后的文本更加规范、干净，便于后续的处理和分析。常见的清洗操作包括：去除多余空白、删除特殊字符、
          移除控制字符、统一字符格式等。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>空白字符处理:</strong> 去除多余空格、空行、Tab字符，统一文本格式</li>
          <li><strong>特殊字符处理:</strong> 去除标点符号、特殊符号、不可见字符、控制字符</li>
          <li><strong>内容过滤:</strong> 根据需要去除数字、字母、中文，或仅保留中文</li>
          <li><strong>快捷预设:</strong> 提供标准清洗、日志清洗、代码清洗、数据清洗等预设方案</li>
          <li><strong>实时统计:</strong> 显示原始字符数、清洗后字符数、移除字符数和减少比例</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          快捷预设说明
        </h2>
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">标准清洗</h3>
            <p class="text-sm text-muted-foreground">去除多余空格、空行，去除每行首尾空白</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">日志清洗</h3>
            <p class="text-sm text-muted-foreground">去除多余空格、首尾空白、不可见字符、控制字符</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">代码清洗</h3>
            <p class="text-sm text-muted-foreground">去除每行首尾空白，Tab转空格，去除多余空行</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h3 class="font-semibold text-foreground mb-2">数据清洗</h3>
            <p class="text-sm text-muted-foreground">全面清洗，包括空格、空行、不可见字符、控制字符</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>日志处理:</strong> 清洗系统日志，去除时间戳、控制字符等</li>
          <li><strong>数据清洗:</strong> 清洗导入的数据，去除格式问题</li>
          <li><strong>文本编辑:</strong> 统一文本格式，去除多余空白</li>
          <li><strong>代码处理:</strong> 清理代码中的缩进和空白</li>
          <li><strong>内容提取:</strong> 从混合内容中提取纯文本</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是不可见字符？</h3>
            <p class="text-muted-foreground mt-1">
              不可见字符是指那些在屏幕上不显示但占用的字符，如零宽字符（Zero Width Characters）、
              软连字符等。这些字符通常在复制粘贴网页内容时被带入，可能导致文本处理异常。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是控制字符？</h3>
            <p class="text-muted-foreground mt-1">
              控制字符是用于控制设备而非显示的字符，如换行符、回车符、制表符等。
              某些控制字符（如ASCII 0-31, 127）在文本处理中可能引起问题，需要清洗。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线清洗安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的文本清洗工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
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
  FileText,
  Sparkles,
  Settings,
  BarChart3,
  FileDiff,
  ChevronUp,
  HelpCircle,
  Code,
  ArrowLeftRight,
  Type,
  Hash as HashIcon
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '文本清洗工具 - 在线去除特殊字符、空白字符、控制字符 | Util工具箱',
  description: '免费在线文本清洗工具，支持去除特殊字符、多余空白、不可见字符、控制字符，适用于日志处理、数据清洗、文本格式化。纯本地计算，数据安全隐私。',
  keywords: '文本清洗,去除特殊字符,去除空白字符,数据清洗,日志处理,文本格式化,去除控制字符',
  author: 'Util工具箱',
  ogTitle: '文本清洗工具 - 在线去除特殊字符、空白字符、控制字符',
  ogDescription: '专业的文本清洗工具，支持去除特殊字符、多余空白、不可见字符、控制字符。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/text-cleaner.png',
  ogUrl: 'https://www.util.cn/tools/text-cleaner',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本清洗工具 - 在线去除特殊字符、空白字符、控制字符',
  twitterDescription: '专业的文本清洗工具，支持去除特殊字符、多余空白、不可见字符、控制字符。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/text-cleaner.png'
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
            name: '文本清洗工具',
            description: '在线文本清洗工具，支持去除特殊字符、多余空白、不可见字符、控制字符',
            url: 'https://www.util.cn/tools/text-cleaner',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '去除多余空格',
              '去除多余空行',
              '去除每行首尾空白',
              'Tab转空格',
              '去除标点符号',
              '去除特殊符号',
              '去除不可见字符',
              '去除控制字符',
              '快捷预设',
              '本地安全处理',
              '实时统计'
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
                name: '文本清洗',
                item: 'https://www.util.cn/tools/text-cleaner'
              }
            ]
          }
        ]
      })
    }
  ]
})

// State
const inputText = ref('')
const outputText = ref('')
const isSeoContentVisible = ref(true)

const options = ref({
  removeExtraSpaces: false,
  removeExtraLines: false,
  trimLines: false,
  removeTabs: false,
  removePunctuation: false,
  removeSpecialChars: false,
  removeInvisible: false,
  removeControlChars: false,
  removeNumbers: false,
  removeLetters: false,
  removeChinese: false,
  KeepOnlyChinese: false
})

// 统计信息
const stats = computed(() => {
  const original = inputText.value.length
  const cleaned = outputText.value.length
  const removed = original - cleaned
  const reductionRate = original > 0 ? ((removed / original) * 100).toFixed(1) : '0.0'

  return {
    originalChars: original,
    cleanedChars: cleaned,
    removedChars: removed,
    reductionRate
  }
})

// 图标映射
const iconMap = {
  Code, FileText, Sparkles, Settings, BarChart3, FileDiff,
  ArrowLeftRight, Type, HashIcon
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'text-cleaner'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'text-escape'),
    tools.find(t => t.id === 'full-half-converter'),
    tools.find(t => t.id === 'text-split-merge'),
    tools.find(t => t.id === 'text-statistics')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 清洗文本
function cleanText() {
  let text = inputText.value

  // 空白字符处理
  if (options.value.removeExtraSpaces) {
    text = text.replace(/[ \u3000]+/g, ' ')
  }
  if (options.value.removeExtraLines) {
    text = text.replace(/\n{3,}/g, '\n\n')
  }
  if (options.value.trimLines) {
    text = text.split('\n').map(line => line.trim()).join('\n')
  }
  if (options.value.removeTabs) {
    text = text.replace(/\t/g, '    ')
  }

  // 特殊字符处理
  if (options.value.removePunctuation) {
    text = text.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：""''（）【】《》、]/g, '')
  }
  if (options.value.removeSpecialChars) {
    text = text.replace(/[~`!@#$%^&*()\-_=+[\]{}|\\;:'",<.>/?]/g, '')
  }
  if (options.value.removeInvisible) {
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '')
  }
  if (options.value.removeControlChars) {
    text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  }

  // 内容处理
  if (options.value.removeNumbers) {
    text = text.replace(/\d/g, '')
  }
  if (options.value.removeLetters) {
    text = text.replace(/[a-zA-Z]/g, '')
  }
  if (options.value.removeChinese) {
    text = text.replace(/[\u4e00-\u9fa5]/g, '')
  }
  if (options.value.KeepOnlyChinese) {
    text = text.replace(/[^\u4e00-\u9fa5\n]/g, '')
  }

  outputText.value = text
}

// 应用预设
function applyPreset(type) {
  Object.keys(options.value).forEach(key => {
    options.value[key] = false
  })

  switch (type) {
    case 'clean':
      options.value.removeExtraSpaces = true
      options.value.removeExtraLines = true
      options.value.trimLines = true
      break
    case 'log':
      options.value.removeExtraSpaces = true
      options.value.trimLines = true
      options.value.removeInvisible = true
      options.value.removeControlChars = true
      break
    case 'code':
      options.value.removeExtraSpaces = false
      options.value.trimLines = true
      options.value.removeTabs = true
      options.value.removeExtraLines = true
      break
    case 'data':
      options.value.removeExtraSpaces = true
      options.value.removeExtraLines = true
      options.value.trimLines = true
      options.value.removeInvisible = true
      options.value.removeControlChars = true
      break
    case 'minimal':
      break
  }

  cleanText()
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
    cleanText()
  } catch (err) {
    console.error('Failed to paste:', err)
  }
}

// 复制结果
async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 加载示例
function loadSample() {
  inputText.value = `  这是一段  包含  多余空格  的文本




还有多余空行


\t包含Tab字符\t\t
特殊符号: @#$%^&*
不可见字符: ​‌‍
控制字符:
`
  cleanText()
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
loadSample()
</script>
