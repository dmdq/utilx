<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本分割合并工具 - 按行/字符/分隔符分割合并文本</h1>
      <p class="text-muted-foreground">在线文本分割合并工具，支持按行、字符、自定义分隔符分割或合并文本，适用于批量处理、数据整理、日志分析。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText class="w-5 h-5 text-primary" />
          输入文本
        </h2>
        <div class="flex gap-2">
          <button
            @click="clearInput"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
          >
            清空
          </button>
          <button
            @click="pasteText"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
          >
            粘贴
          </button>
          <button
            @click="loadSample"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
          >
            示例
          </button>
        </div>
      </div>

      <textarea
        v-model="inputText"
        class="w-full h-48 p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
        placeholder="在此输入需要处理的文本..."
        @input="process"
      ></textarea>

      <div class="mt-4 text-sm text-muted-foreground">
        输入: {{ inputText.length }} 字符 | {{ inputText.split('\n').length }} 行
      </div>
    </div>

    <!-- 操作模式 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Settings class="w-5 h-5 text-primary" />
        操作模式
      </h2>

      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="mode in modes"
          :key="mode.id"
          @click="currentMode = mode.id; process()"
          :class="[
            'px-4 py-2 rounded transition-colors font-medium',
            currentMode === mode.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          ]"
        >
          <component :is="mode.icon" class="w-4 h-4 inline mr-1" />
          {{ mode.name }}
        </button>
      </div>

      <!-- 分割模式选项 -->
      <div v-if="['split-char', 'split-custom'].includes(currentMode)" class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">分割方式</label>
          <select
            v-if="currentMode === 'split-char'"
            v-model="splitOptions.by"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            @change="process"
          >
            <option value="char">按字符分割</option>
            <option value="line">按行分割</option>
            <option value="word">按单词分割</option>
            <option value="sentence">按句子分割</option>
          </select>
          <div v-else class="flex gap-2">
            <input
              v-model="splitOptions.customDelimiter"
              type="text"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted font-mono text-foreground"
              placeholder="输入分隔符"
              @input="process"
            >
            <button
              v-for="preset in ['\n', '\t', ',', ';', ' ']"
              :key="preset"
              @click="splitOptions.customDelimiter = preset; process()"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm font-mono text-muted-foreground"
              :title="preset === '\n' ? '换行符' : preset === '\t' ? 'Tab' : preset === ' ' ? '空格' : preset"
            >
              {{ preset === '\n' ? '⏎' : preset === '\t' ? '⇥' : preset === ' ' ? '␣' : preset }}
            </button>
          </div>
        </div>

        <div v-if="currentMode === 'split-char'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">每段字符数</label>
            <input
              v-model.number="splitOptions.chunkSize"
              type="number"
              min="1"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
              @input="process"
            >
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" v-model="splitOptions.preserveDelimiters" @change="process" class="rounded">
            <span>保留分隔符</span>
          </label>
        </div>
      </div>

      <!-- 合并模式选项 -->
      <div v-if="currentMode === 'merge'" class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">合并分隔符</label>
          <div class="flex gap-2">
            <input
              v-model="mergeOptions.delimiter"
              type="text"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted font-mono text-foreground"
              placeholder="输入分隔符"
              @input="process"
            >
            <button
              v-for="preset in ['\n', ' ', '', ',']"
              :key="preset"
              @click="mergeOptions.delimiter = preset; process()"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm font-mono text-muted-foreground"
              :title="preset === '\n' ? '换行符' : preset === '' ? '无' : preset"
            >
              {{ preset === '\n' ? '⏎' : preset === '' ? '无' : preset === ' ' ? '␣' : preset }}
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" v-model="mergeOptions.trim" @change="process" class="rounded">
            <span>去除每段首尾空白</span>
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" v-model="mergeOptions.skipEmpty" @change="process" class="rounded">
            <span>跳过空行</span>
          </label>
        </div>
      </div>

      <!-- 提取模式选项 -->
      <div v-if="currentMode === 'extract'" class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">提取类型</label>
          <select
            v-model="extractOptions.type"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            @change="process"
          >
            <option value="lines">指定行</option>
            <option value="range">行范围</option>
            <option value="regex">正则匹配</option>
            <option value="contains">包含文本</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">参数</label>
          <input
            v-if="extractOptions.type === 'lines'"
            v-model="extractOptions.lines"
            type="text"
            placeholder="例如: 1,3,5-10"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            @input="process"
          >
          <input
            v-else-if="extractOptions.type === 'range'"
            v-model="extractOptions.range"
            type="text"
            placeholder="例如: 5-10"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            @input="process"
          >
          <input
            v-else-if="extractOptions.type === 'regex'"
            v-model="extractOptions.pattern"
            type="text"
            placeholder="正则表达式"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted font-mono text-foreground"
            @input="process"
          >
          <input
            v-else
            v-model="extractOptions.contains"
            type="text"
            placeholder="包含的文本"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            @input="process"
          >
        </div>
      </div>
    </div>

    <!-- 输出区域 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-primary" />
          输出结果
        </h2>
        <div class="flex gap-2">
          <button
            v-if="currentMode === 'split-char' || currentMode === 'split-custom'"
            @click="outputAsArray = !outputAsArray"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
          >
            {{ outputAsArray ? '文本视图' : '数组视图' }}
          </button>
          <button
            @click="copyResult"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
          >
            复制
          </button>
        </div>
      </div>

      <!-- 数组视图 -->
      <div v-if="outputAsArray && splittedText.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="(item, index) in splittedText"
          :key="index"
          class="flex gap-2 p-2 bg-muted rounded font-mono text-sm"
        >
          <span class="text-muted-foreground w-12 flex-shrink-0">[{{ index }}]</span>
          <span class="flex-1 break-all text-foreground">{{ item || '(空)' }}</span>
          <span class="text-muted-foreground w-16 flex-shrink-0 text-right">{{ item.length }}字</span>
        </div>
      </div>

      <!-- 文本视图 -->
      <textarea
        v-else
        v-model="outputText"
        class="w-full h-64 p-4 bg-muted border border-border rounded-lg font-mono text-sm resize-none"
        readonly
      ></textarea>

      <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div class="p-3 bg-muted rounded">
          <span class="text-muted-foreground">输出字符:</span>
          <span class="font-bold ml-2 text-foreground">{{ outputText.length }}</span>
        </div>
        <div class="p-3 bg-muted rounded">
          <span class="text-muted-foreground">输出行数:</span>
          <span class="font-bold ml-2 text-foreground">{{ outputText.split('\n').length }}</span>
        </div>
        <div v-if="splittedText.length > 0" class="p-3 bg-muted rounded">
          <span class="text-muted-foreground">分段数:</span>
          <span class="font-bold ml-2 text-foreground">{{ splittedText.length }}</span>
        </div>
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
          什么是文本分割合并？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本分割合并工具是一款功能强大的文本处理工具，可以帮助您快速分割、合并、提取、去重、排序文本内容。
          无论是批量处理数据、整理日志文件，还是进行数据分析，这个工具都能大大提高您的工作效率。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>按字符分割:</strong> 指定每段字符数进行分割，适用于限制长度的场景</li>
          <li><strong>按行分割:</strong> 每行作为独立段落，适用于处理列表数据</li>
          <li><strong>按单词分割:</strong> 按空格分词后分割，适用于英文文本处理</li>
          <li><strong>按句子分割:</strong> 按句号等标点分割，适用于文章分析</li>
          <li><strong>自定义分隔符:</strong> 使用任意字符作为分隔符，灵活性极高</li>
          <li><strong>合并文本:</strong> 将多段文本合并为一段，支持自定义分隔符</li>
          <li><strong>提取行:</strong> 根据行号、范围、正则等提取指定行</li>
          <li><strong>去重排序:</strong> 快速去除重复行并排序</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中粘贴或输入需要处理的文本</li>
          <li>选择操作模式（分割、合并、提取等）</li>
          <li>根据需要调整相关选项（如分隔符、字符数等）</li>
          <li>查看处理结果，点击"复制"按钮导出</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>数据整理:</strong> 将Excel导出的数据按列分割或合并</li>
          <li><strong>日志分析:</strong> 提取特定时间段的日志记录</li>
          <li><strong>代码处理:</strong> 批量处理代码片段</li>
          <li><strong>内容编辑:</strong> 快速整理文章段落</li>
          <li><strong>数据清洗:</strong> 去重、排序、格式化数据</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何按自定义分隔符分割？</h3>
            <p class="text-muted-foreground mt-1">
              选择"按分隔符分割"模式，在输入框中输入任意分隔符（如逗号、Tab、换行符等），
              工具会自动按该分隔符分割文本。您还可以使用快捷按钮快速输入常用分隔符。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">提取支持哪些方式？</h3>
            <p class="text-muted-foreground mt-1">
              支持多种提取方式：指定行号（如1,3,5-10）、行范围（如5-10）、正则表达式匹配、
              包含特定文本的行等，满足各种提取需求。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线处理安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的文本分割合并工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
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
  Settings,
  Sparkles,
  Scissors,
  Merge,
  Filter,
  ArrowUpDown,
  Hash as HashIcon,
  RefreshCw,
  Code,
  ChevronUp,
  HelpCircle,
  ArrowLeftRight,
  BarChart3,
  FileDiff
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '文本分割合并工具 - 按行/字符/分隔符分割合并文本 | Util工具箱',
  description: '免费在线文本分割合并工具，支持按行、字符、自定义分隔符分割或合并文本，适用于批量处理、数据整理、日志分析。纯本地计算，数据安全隐私。',
  keywords: '文本分割,文本合并,按行分割,批量处理,数据整理,字符串分割,文本处理',
  author: 'Util工具箱',
  ogTitle: '文本分割合并工具 - 按行/字符/分隔符分割合并文本',
  ogDescription: '专业的文本分割合并工具，支持按行、字符、自定义分隔符分割或合并文本。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/text-split-merge.png',
  ogUrl: 'https://www.util.cn/tools/text-split-merge',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本分割合并工具 - 按行/字符/分隔符分割合并文本',
  twitterDescription: '专业的文本分割合并工具，支持按行、字符、自定义分隔符分割或合并文本。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/text-split-merge.png'
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
            name: '文本分割合并工具',
            description: '在线文本分割合并工具，支持按行、字符、自定义分隔符分割或合并文本',
            url: 'https://www.util.cn/tools/text-split-merge',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '按字符分割',
              '按行分割',
              '按单词分割',
              '按句子分割',
              '自定义分隔符分割',
              '文本合并',
              '提取指定行',
              '去重排序',
              '本地安全处理'
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
                name: '文本分割合并',
                item: 'https://www.util.cn/tools/text-split-merge'
              }
            ]
          }
        ]
      })
    }
  ]
})

// 模式定义
const modes = [
  { id: 'split-char', name: '按字符分割', icon: Scissors },
  { id: 'split-custom', name: '按分隔符分割', icon: Scissors },
  { id: 'merge', name: '合并文本', icon: Merge },
  { id: 'extract', name: '提取行', icon: Filter },
  { id: 'dedupe', name: '去重', icon: HashIcon },
  { id: 'sort', name: '排序', icon: ArrowUpDown },
  { id: 'reverse', name: '反转', icon: RefreshCw },
  { id: 'number', name: '添加编号', icon: HashIcon }
]

// State
const inputText = ref('')
const outputText = ref('')
const currentMode = ref('split-char')
const outputAsArray = ref(false)
const isSeoContentVisible = ref(true)

const splitOptions = ref({
  by: 'line',
  chunkSize: 100,
  preserveDelimiters: false,
  customDelimiter: ''
})

const mergeOptions = ref({
  delimiter: '\n',
  trim: false,
  skipEmpty: true
})

const extractOptions = ref({
  type: 'lines',
  lines: '1,3,5',
  range: '1-10',
  pattern: '',
  contains: ''
})

const splittedText = ref([])

// 图标映射
const iconMap = {
  Code, FileText, Scissors, Merge, Filter, ArrowUpDown, BarChart3, FileDiff,
  ArrowLeftRight, HashIcon, RefreshCw, Sparkles, Settings
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'text-split-merge'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'text-escape'),
    tools.find(t => t.id === 'full-half-converter'),
    tools.find(t => t.id === 'text-cleaner'),
    tools.find(t => t.id === 'text-statistics')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 处理文本
function process() {
  const text = inputText.value

  switch (currentMode.value) {
    case 'split-char':
      handleSplitByChar(text)
      break
    case 'split-custom':
      handleSplitByCustom(text)
      break
    case 'merge':
      handleMerge(text)
      break
    case 'extract':
      handleExtract(text)
      break
    case 'dedupe':
      handleDedupe(text)
      break
    case 'sort':
      handleSort(text)
      break
    case 'reverse':
      handleReverse(text)
      break
    case 'number':
      handleNumber(text)
      break
  }
}

// 按字符分割
function handleSplitByChar(text) {
  let parts = []

  switch (splitOptions.value.by) {
    case 'char':
      const size = splitOptions.value.chunkSize || 100
      for (let i = 0; i < text.length; i += size) {
        parts.push(text.slice(i, i + size))
      }
      break
    case 'line':
      parts = text.split('\n')
      break
    case 'word':
      parts = text.split(/\s+/)
      break
    case 'sentence':
      parts = text.split(/[。！？.!?]+/)
      break
  }

  if (splitOptions.value.preserveDelimiters && splitOptions.value.by === 'char') {
    outputText.value = parts.join('\n---分---\n')
  } else {
    outputText.value = parts.join('\n')
  }

  splittedText.value = parts
}

// 按自定义分隔符分割
function handleSplitByCustom(text) {
  const delimiter = splitOptions.value.customDelimiter
  if (!delimiter) {
    splittedText.value = [text]
    outputText.value = text
    return
  }

  const parts = text.split(delimiter)
  splittedText.value = parts
  outputText.value = parts.join('\n')
}

// 合并文本
function handleMerge(text) {
  let lines = text.split('\n')

  if (mergeOptions.value.trim) {
    lines = lines.map(line => line.trim())
  }

  if (mergeOptions.value.skipEmpty) {
    lines = lines.filter(line => line.length > 0)
  }

  outputText.value = lines.join(mergeOptions.value.delimiter)
  splittedText.value = lines
}

// 提取行
function handleExtract(text) {
  const lines = text.split('\n')
  let result = []

  switch (extractOptions.value.type) {
    case 'lines':
      const lineNums = extractOptions.value.lines.split(',')
        .map(s => s.trim())
        .flatMap(s => {
          if (s.includes('-')) {
            const [start, end] = s.split('-').map(Number)
            return Array.from({ length: end - start + 1 }, (_, i) => start + i)
          }
          return [Number(s)]
        })
      result = lineNums.filter(n => n > 0 && n <= lines.length).map(n => lines[n - 1])
      break

    case 'range':
      const [start, end] = extractOptions.value.range.split('-').map(Number)
      result = lines.slice(start - 1, end)
      break

    case 'regex':
      try {
        const regex = new RegExp(extractOptions.value.pattern, 'i')
        result = lines.filter(line => regex.test(line))
      } catch (e) {
        result = []
      }
      break

    case 'contains':
      result = lines.filter(line => line.includes(extractOptions.value.contains))
      break
  }

  outputText.value = result.join('\n')
  splittedText.value = result
}

// 去重
function handleDedupe(text) {
  const lines = text.split('\n')
  const unique = [...new Set(lines)]
  outputText.value = unique.join('\n')
  splittedText.value = unique
}

// 排序
function handleSort(text) {
  const lines = text.split('\n')
  const sorted = [...lines].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  outputText.value = sorted.join('\n')
  splittedText.value = sorted
}

// 反转
function handleReverse(text) {
  const lines = text.split('\n').reverse()
  outputText.value = lines.join('\n')
  splittedText.value = lines
}

// 添加编号
function handleNumber(text) {
  const lines = text.split('\n')
  const numbered = lines.map((line, i) => `${i + 1}. ${line}`)
  outputText.value = numbered.join('\n')
  splittedText.value = numbered
}

// 清空输入
function clearInput() {
  inputText.value = ''
  outputText.value = ''
  splittedText.value = []
}

// 粘贴文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    process()
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
  inputText.value = `这是第一行文本
这是第二行文本
这是第三行文本
这是第四行文本
这是第五行文本
这是第六行文本
这是第七行文本
这是第八行文本
这是第九行文本
这是第十行文本`
  process()
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
loadSample()
</script>
