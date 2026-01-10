<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本统计分析工具 - 在线词频统计、字符频率、行数统计</h1>
      <p class="text-muted-foreground">在线文本统计分析工具，支持词频统计、字符频率分析、行数统计、段落数统计、平均长度计算，适用于SEO分析、内容分析。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 输入区域 -->
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
            示例文本
          </button>
        </div>
      </div>

      <textarea
        v-model="inputText"
        class="w-full h-48 p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
        placeholder="在此输入需要分析的文本..."
        @input="analyze"
      ></textarea>
    </div>

    <!-- 基础统计 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 class="w-5 h-5 text-primary" />
        基础统计
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ basicStats.totalChars }}</div>
          <div class="text-sm text-muted-foreground">总字符数</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ basicStats.visibleChars }}</div>
          <div class="text-sm text-muted-foreground">可见字符</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ basicStats.totalWords }}</div>
          <div class="text-sm text-muted-foreground">总词数</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ basicStats.totalLines }}</div>
          <div class="text-sm text-muted-foreground">总行数</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ basicStats.totalParagraphs }}</div>
          <div class="text-sm text-muted-foreground">段落数</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ basicStats.avgWordLength }}</div>
          <div class="text-sm text-muted-foreground">平均词长</div>
        </div>
      </div>

      <!-- 详细统计 -->
      <div class="grid md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-3 text-foreground">字符分类</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">中文字符:</span>
              <span class="font-medium text-foreground">{{ basicStats.chineseChars }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">英文字母:</span>
              <span class="font-medium text-foreground">{{ basicStats.englishChars }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">数字:</span>
              <span class="font-medium text-foreground">{{ basicStats.numbers }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">标点符号:</span>
              <span class="font-medium text-foreground">{{ basicStats.punctuation }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">空白字符:</span>
              <span class="font-medium text-foreground">{{ basicStats.whitespace }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-3 text-foreground">长度统计</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">最长行:</span>
              <span class="font-medium text-foreground">{{ basicStats.maxLineLength }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">最短行:</span>
              <span class="font-medium text-foreground">{{ basicStats.minLineLength }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">平均行长:</span>
              <span class="font-medium text-foreground">{{ basicStats.avgLineLength }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">最长词:</span>
              <span class="font-medium text-foreground">{{ basicStats.maxWordLength }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">预估阅读时间:</span>
              <span class="font-medium text-foreground">{{ basicStats.readingTime }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-3 text-foreground">统计选项</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.caseSensitive" @change="analyze" class="rounded">
              <span>区分大小写</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.includePunctuation" @change="analyze" class="rounded">
              <span>包含标点</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.includeNumbers" @change="analyze" class="rounded">
              <span>包含数字</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.chineseMode" @change="analyze" class="rounded">
              <span>中文分词模式</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 词频统计 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Hash class="w-5 h-5 text-primary" />
          词频统计
        </h2>
        <div class="flex gap-2">
          <button
            @click="exportWordFreq"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
          >
            导出
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-2 px-4 text-foreground">排名</th>
              <th class="text-left py-2 px-4 text-foreground">词语</th>
              <th class="text-left py-2 px-4 text-foreground">出现次数</th>
              <th class="text-left py-2 px-4 text-foreground">频率占比</th>
              <th class="text-left py-2 px-4 text-foreground">占比图</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in wordFrequency.slice(0, 20)"
              :key="item.word"
              class="border-b border-border hover:bg-muted"
            >
              <td class="py-2 px-4 text-foreground">#{{ index + 1 }}</td>
              <td class="py-2 px-4 font-mono text-foreground">{{ item.word }}</td>
              <td class="py-2 px-4 text-foreground">{{ item.count }}</td>
              <td class="py-2 px-4 text-foreground">{{ item.percentage }}%</td>
              <td class="py-2 px-4 w-48">
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full"
                    :style="{ width: `${Math.min(item.percentage, 100)}%` }"
                  ></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="wordFrequency.length === 0" class="text-center py-8 text-muted-foreground">
        暂无数据，请输入文本后分析
      </div>
    </div>

    <!-- 字符频率 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Type class="w-5 h-5 text-primary" />
          字符频率
        </h2>
        <select
          v-model="charFilter"
          class="px-3 py-1 border border-border rounded bg-muted text-sm text-foreground"
          @change="analyze"
        >
          <option value="all">全部字符</option>
          <option value="chinese">仅中文</option>
          <option value="english">仅英文</option>
          <option value="number">仅数字</option>
          <option value="punctuation">仅标点</option>
        </select>
      </div>

      <div class="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
        <div
          v-for="item in charFrequency.slice(0, 100)"
          :key="item.char"
          class="px-3 py-2 bg-muted hover:bg-accent rounded cursor-pointer"
          :title="`出现 ${item.count} 次，占比 ${item.percentage}%`"
        >
          <span class="font-mono font-bold text-foreground">{{ item.char }}</span>
          <span class="text-xs text-muted-foreground ml-1">{{ item.count }}</span>
        </div>
      </div>

      <div v-if="charFrequency.length === 0" class="text-center py-8 text-muted-foreground">
        暂无数据，请输入文本后分析
      </div>
    </div>

    <!-- 行统计 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <List class="w-5 h-5 text-primary" />
        行长度分布
      </h2>

      <div class="space-y-2">
        <div
          v-for="(item, index) in lineDistribution"
          :key="index"
          class="flex items-center gap-2"
        >
          <div class="w-20 text-sm text-muted-foreground text-right">
            {{ item.label }}
          </div>
          <div class="flex-1 bg-muted rounded-full h-4">
            <div
              class="bg-primary h-4 rounded-full"
              :style="{ width: `${item.percentage}%` }"
            ></div>
          </div>
          <div class="w-16 text-sm text-muted-foreground">
            {{ item.count }} 行
          </div>
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
          什么是文本统计分析？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本统计分析是一种通过计算机技术对文本数据进行量化分析的方法。它可以统计文本的基本信息（如字数、行数、段落数），
          分析词频、字符频率分布，计算平均长度等指标。这些分析对于SEO优化、内容质量评估、读者阅读时间预估等具有重要价值。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>基础统计:</strong> 总字符数、可见字符数、词数、行数、段落数等</li>
          <li><strong>字符分类:</strong> 分别统计中文、英文、数字、标点符号、空白字符的数量</li>
          <li><strong>词频统计:</strong> 统计每个词语出现的次数和频率占比</li>
          <li><strong>字符频率:</strong> 分析每个字符的出现频率，支持按类型筛选</li>
          <li><strong>长度分布:</strong> 分析行长度的分布情况，了解文本结构</li>
          <li><strong>阅读时间:</strong> 根据字数预估阅读所需时间</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>SEO优化:</strong> 分析关键词密度，优化文章结构</li>
          <li><strong>内容分析:</strong> 评估文章长度、阅读难度</li>
          <li><strong>数据清洗:</strong> 发现异常字符、重复内容</li>
          <li><strong>质量检查:</strong> 检查文本是否符合字数要求</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">词频统计支持中文吗？</h3>
            <p class="text-muted-foreground mt-1">
              支持。开启"中文分词模式"后，工具会将每个汉字作为一个词进行统计。
              对于英文，则按单词进行统计。您还可以选择是否区分大小写、是否包含标点和数字。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">阅读时间如何计算？</h3>
            <p class="text-muted-foreground mt-1">
              阅读时间基于平均阅读速度200字/分钟进行估算。这个速度是一般成年人的平均阅读速度，
              实际阅读时间会因内容难度、读者阅读习惯等因素有所不同。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线分析安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的文本统计分析工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
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
  BarChart3,
  Hash,
  Type,
  List,
  Sparkles,
  Scissors,
  FileDiff,
  ChevronUp,
  HelpCircle,
  Code,
  ArrowLeftRight
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '文本统计分析工具 - 在线词频统计、字符频率、行数统计 | Util工具箱',
  description: '免费在线文本统计分析工具，支持词频统计、字符频率分析、行数统计、段落数统计、平均长度计算。纯本地计算，数据安全隐私。',
  keywords: '文本统计,词频统计,字符频率,行数统计,段落统计,内容分析,SEO分析,文本分析',
  author: 'Util工具箱',
  ogTitle: '文本统计分析工具 - 在线词频统计、字符频率、行数统计',
  ogDescription: '专业的文本统计分析工具，支持词频统计、字符频率分析、行数统计、段落数统计。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/text-statistics.png',
  ogUrl: 'https://www.util.cn/tools/text-statistics',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本统计分析工具 - 在线词频统计、字符频率、行数统计',
  twitterDescription: '专业的文本统计分析工具，支持词频统计、字符频率分析、行数统计、段落数统计。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/text-statistics.png'
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
            name: '文本统计分析工具',
            description: '在线文本统计分析工具，支持词频统计、字符频率分析、行数统计',
            url: 'https://www.util.cn/tools/text-statistics',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '基础统计',
              '词频统计',
              '字符频率分析',
              '行长度分布',
              '阅读时间预估',
              '中文分词模式',
              '本地安全处理',
              '导出分析结果'
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
                name: '文本统计分析',
                item: 'https://www.util.cn/tools/text-statistics'
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
const charFilter = ref('all')
const isSeoContentVisible = ref(true)

const options = ref({
  caseSensitive: false,
  includePunctuation: false,
  includeNumbers: true,
  chineseMode: false
})

const basicStats = ref({
  totalChars: 0,
  visibleChars: 0,
  totalWords: 0,
  totalLines: 0,
  totalParagraphs: 0,
  avgWordLength: '0',
  chineseChars: 0,
  englishChars: 0,
  numbers: 0,
  punctuation: 0,
  whitespace: 0,
  maxLineLength: 0,
  minLineLength: 0,
  avgLineLength: '0',
  maxWordLength: 0,
  readingTime: '0 分钟'
})

const wordFrequency = ref([])
const charFrequency = ref([])
const lineDistribution = ref([])

// 图标映射
const iconMap = {
  Code, FileText, Scissors, Sparkles, BarChart3, FileDiff,
  ArrowLeftRight, Hash, Type, List
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'text-statistics'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'text-escape'),
    tools.find(t => t.id === 'full-half-converter'),
    tools.find(t => t.id === 'text-split-merge'),
    tools.find(t => t.id === 'text-cleaner')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 分析文本
function analyze() {
  const text = inputText.value

  if (!text) {
    resetStats()
    return
  }

  calculateBasicStats(text)
  calculateWordFrequency(text)
  calculateCharFrequency(text)
  calculateLineDistribution(text)
}

// 基础统计
function calculateBasicStats(text) {
  const lines = text.split('\n')
  const nonEmptyLines = lines.filter(line => line.trim().length > 0)

  basicStats.value.totalChars = text.length
  basicStats.value.visibleChars = text.replace(/\s/g, '').length
  basicStats.value.totalLines = lines.length
  basicStats.value.totalParagraphs = nonEmptyLines.length

  basicStats.value.chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  basicStats.value.englishChars = (text.match(/[a-zA-Z]/g) || []).length
  basicStats.value.numbers = (text.match(/\d/g) || []).length
  basicStats.value.punctuation = (text.match(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：""''（）【】《》、]/g) || []).length
  basicStats.value.whitespace = (text.match(/\s/g) || []).length

  const lineLengths = lines.map(line => line.length)
  basicStats.value.maxLineLength = Math.max(...lineLengths, 0)
  basicStats.value.minLineLength = Math.min(...lineLengths.filter(l => l > 0), 0)
  basicStats.value.avgLineLength = lineLengths.length > 0
    ? (lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length).toFixed(1)
    : '0'

  let wordCount = 0
  if (options.value.chineseMode) {
    const chineseWords = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    wordCount = chineseWords + englishWords
  } else {
    wordCount = (text.match(/\S+/g) || []).length
  }
  basicStats.value.totalWords = wordCount

  const words = text.match(/\S+/g) || []
  const avgLen = words.length > 0
    ? (words.join('').length / words.length).toFixed(1)
    : '0'
  basicStats.value.avgWordLength = avgLen

  basicStats.value.maxWordLength = words.length > 0
    ? Math.max(...words.map(w => w.length))
    : 0

  const readingMinutes = Math.ceil(basicStats.value.visibleChars / 200)
  basicStats.value.readingTime = readingMinutes > 60
    ? `${Math.floor(readingMinutes / 60)} 小时 ${readingMinutes % 60} 分钟`
    : `${readingMinutes} 分钟`
}

// 词频统计
function calculateWordFrequency(text) {
  let words = []

  if (options.value.chineseMode) {
    words = text.match(/[\u4e00-\u9fa5]/g) || []
  } else {
    words = text.match(/\S+/g) || []
  }

  if (!options.value.caseSensitive) {
    words = words.map(w => w.toLowerCase())
  }

  if (!options.value.includePunctuation) {
    words = words.map(w => w.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：""''（）【】《》、]/g, '')).filter(w => w.length > 0)
  }

  if (!options.value.includeNumbers) {
    words = words.filter(w => !/^\d+$/.test(w))
  }

  const freqMap = new Map()
  words.forEach(word => {
    freqMap.set(word, (freqMap.get(word) || 0) + 1)
  })

  const total = words.length
  wordFrequency.value = Array.from(freqMap.entries())
    .map(([word, count]) => ({
      word,
      count,
      percentage: ((count / total) * 100).toFixed(2)
    }))
    .sort((a, b) => b.count - a.count)
}

// 字符频率
function calculateCharFrequency(text) {
  const chars = text.split('')
  const freqMap = new Map()

  chars.forEach(char => {
    freqMap.set(char, (freqMap.get(char) || 0) + 1)
  })

  const total = chars.length
  let filtered = Array.from(freqMap.entries())
    .map(([char, count]) => ({
      char,
      count,
      percentage: ((count / total) * 100).toFixed(2)
    }))
    .sort((a, b) => b.count - a.count)

  if (charFilter.value === 'chinese') {
    filtered = filtered.filter(item => /[\u4e00-\u9fa5]/.test(item.char))
  } else if (charFilter.value === 'english') {
    filtered = filtered.filter(item => /[a-zA-Z]/.test(item.char))
  } else if (charFilter.value === 'number') {
    filtered = filtered.filter(item => /\d/.test(item.char))
  } else if (charFilter.value === 'punctuation') {
    filtered = filtered.filter(item => /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：""''（）【】《》、]/.test(item.char))
  }

  charFrequency.value = filtered
}

// 行分布
function calculateLineDistribution(text) {
  const lines = text.split('\n')
  const buckets = [
    { label: '0-10', min: 0, max: 10, count: 0 },
    { label: '11-30', min: 11, max: 30, count: 0 },
    { label: '31-50', min: 31, max: 50, count: 0 },
    { label: '51-100', min: 51, max: 100, count: 0 },
    { label: '101+', min: 101, max: Infinity, count: 0 }
  ]

  lines.forEach(line => {
    const len = line.length
    for (const bucket of buckets) {
      if (len >= bucket.min && len <= bucket.max) {
        bucket.count++
        break
      }
    }
  })

  const total = lines.length
  lineDistribution.value = buckets.map(bucket => ({
    ...bucket,
    percentage: total > 0 ? ((bucket.count / total) * 100).toFixed(1) : '0'
  }))
}

// 重置统计
function resetStats() {
  basicStats.value = {
    totalChars: 0,
    visibleChars: 0,
    totalWords: 0,
    totalLines: 0,
    totalParagraphs: 0,
    avgWordLength: '0',
    chineseChars: 0,
    englishChars: 0,
    numbers: 0,
    punctuation: 0,
    whitespace: 0,
    maxLineLength: 0,
    minLineLength: 0,
    avgLineLength: '0',
    maxWordLength: 0,
    readingTime: '0 分钟'
  }
  wordFrequency.value = []
  charFrequency.value = []
  lineDistribution.value = []
}

// 清空输入
function clearInput() {
  inputText.value = ''
  analyze()
}

// 粘贴文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    analyze()
  } catch (err) {
    console.error('Failed to paste:', err)
  }
}

// 导出词频
function exportWordFreq() {
  const data = wordFrequency.value.map(item => `${item.word}\t${item.count}\t${item.percentage}%`).join('\n')
  const blob = new Blob([`词语\t出现次数\t频率占比\n${data}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'word-frequency.txt'
  a.click()
  URL.revokeObjectURL(url)
}

// 加载示例
function loadSample() {
  inputText.value = `文本统计分析工具是一款功能强大的文本分析工具。它可以帮您快速分析文本的各项指标。

这个工具支持词频统计、字符频率分析、行数统计等功能。无论是SEO分析、内容分析还是数据清洗，都能派上用场。

使用方法非常简单，只需要在输入框中粘贴或输入您要分析的文本，工具会自动进行统计分析。您还可以根据需要调整分析选项。

词频统计功能可以帮您找出文本中出现频率最高的词语，这对于关键词分析非常有用。字符频率则可以显示每个字符的出现次数。`

  analyze()
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
loadSample()
</script>
