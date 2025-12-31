<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文本统计分析工具</h1>
      <p class="text-gray-600 dark:text-gray-400">词频统计、字符频率分析、行数统计，适用于SEO分析、内容分析</p>
    </div>

    <!-- 输入区域 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <FileText class="w-5 h-5 text-blue-500" />
          输入文本
        </h2>
        <div class="flex gap-2">
          <button
            @click="inputText = ''; analyze()"
            class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
          >
            清空
          </button>
          <button
            @click="pasteText"
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            粘贴
          </button>
          <button
            @click="loadSample"
            class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            示例文本
          </button>
        </div>
      </div>

      <textarea
        v-model="inputText"
        class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
        placeholder="在此输入需要分析的文本..."
        @input="analyze"
      ></textarea>
    </div>

    <!-- 基础统计 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart3 class="w-5 h-5 text-green-500" />
        基础统计
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">{{ basicStats.totalChars }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">总字符数</div>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">{{ basicStats.visibleChars }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">可见字符</div>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">{{ basicStats.totalWords }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">总词数</div>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-600">{{ basicStats.totalLines }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">总行数</div>
        </div>
        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-red-600">{{ basicStats.totalParagraphs }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">段落数</div>
        </div>
        <div class="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-cyan-600">{{ basicStats.avgWordLength }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">平均词长</div>
        </div>
      </div>

      <!-- 详细统计 -->
      <div class="grid md:grid-cols-3 gap-4 mt-6">
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-3">字符分类</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>中文字符:</span>
              <span class="font-medium">{{ basicStats.chineseChars }}</span>
            </div>
            <div class="flex justify-between">
              <span>英文字母:</span>
              <span class="font-medium">{{ basicStats.englishChars }}</span>
            </div>
            <div class="flex justify-between">
              <span>数字:</span>
              <span class="font-medium">{{ basicStats.numbers }}</span>
            </div>
            <div class="flex justify-between">
              <span>标点符号:</span>
              <span class="font-medium">{{ basicStats.punctuation }}</span>
            </div>
            <div class="flex justify-between">
              <span>空白字符:</span>
              <span class="font-medium">{{ basicStats.whitespace }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-3">长度统计</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>最长行:</span>
              <span class="font-medium">{{ basicStats.maxLineLength }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span>最短行:</span>
              <span class="font-medium">{{ basicStats.minLineLength }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span>平均行长:</span>
              <span class="font-medium">{{ basicStats.avgLineLength }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span>最长词:</span>
              <span class="font-medium">{{ basicStats.maxWordLength }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span>预估阅读时间:</span>
              <span class="font-medium">{{ basicStats.readingTime }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-3">统计选项</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.caseSensitive" @change="analyze" class="rounded">
              <span>区分大小写</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.includePunctuation" @change="analyze" class="rounded">
              <span>包含标点</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.includeNumbers" @change="analyze" class="rounded">
              <span>包含数字</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.chineseMode" @change="analyze" class="rounded">
              <span>中文分词模式</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 词频统计 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <Hash class="w-5 h-5 text-purple-500" />
          词频统计
        </h2>
        <div class="flex gap-2">
          <button
            @click="exportWordFreq"
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            导出
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b dark:border-gray-700">
              <th class="text-left py-2 px-4">排名</th>
              <th class="text-left py-2 px-4">词语</th>
              <th class="text-left py-2 px-4">出现次数</th>
              <th class="text-left py-2 px-4">频率占比</th>
              <th class="text-left py-2 px-4">占比图</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in wordFrequency.slice(0, 20)"
              :key="item.word"
              class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="py-2 px-4">#{{ index + 1 }}</td>
              <td class="py-2 px-4 font-mono">{{ item.word }}</td>
              <td class="py-2 px-4">{{ item.count }}</td>
              <td class="py-2 px-4">{{ item.percentage }}%</td>
              <td class="py-2 px-4 w-48">
                <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full"
                    :style="{ width: `${Math.min(item.percentage, 100)}%` }"
                  ></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="wordFrequency.length === 0" class="text-center py-8 text-gray-500">
        暂无数据，请输入文本后分析
      </div>
    </div>

    <!-- 字符频率 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <Type class="w-5 h-5 text-orange-500" />
          字符频率
        </h2>
        <select
          v-model="charFilter"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
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
          class="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
          :title="`出现 ${item.count} 次，占比 ${item.percentage}%`"
        >
          <span class="font-mono font-bold">{{ item.char }}</span>
          <span class="text-xs text-gray-500 ml-1">{{ item.count }}</span>
        </div>
      </div>

      <div v-if="charFrequency.length === 0" class="text-center py-8 text-gray-500">
        暂无数据，请输入文本后分析
      </div>
    </div>

    <!-- 行统计 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <List class="w-5 h-5 text-green-500" />
        行长度分布
      </h2>

      <div class="space-y-2">
        <div
          v-for="(item, index) in lineDistribution"
          :key="index"
          class="flex items-center gap-2"
        >
          <div class="w-20 text-sm text-gray-600 dark:text-gray-400 text-right">
            {{ item.label }}
          </div>
          <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-4">
            <div
              class="bg-green-500 h-4 rounded-full"
              :style="{ width: `${item.percentage}%` }"
            ></div>
          </div>
          <div class="w-16 text-sm text-gray-600 dark:text-gray-400">
            {{ item.count }} 行
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/text-cleaner" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Sparkles class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">文本清洗</h3>
          <p class="text-sm text-gray-500">去除特殊字符</p>
        </NuxtLink>
        <NuxtLink to="/tools/text-counter" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileText class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">字数统计</h3>
          <p class="text-sm text-gray-500">统计字数</p>
        </NuxtLink>
        <NuxtLink to="/tools/text-split-merge" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Scissors class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">文本分割</h3>
          <p class="text-sm text-gray-500">分割合并文本</p>
        </NuxtLink>
        <NuxtLink to="/tools/text-diff" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileDiff class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">文本对比</h3>
          <p class="text-sm text-gray-500">比较文本差异</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  FileText,
  BarChart3,
  Hash,
  Type,
  List,
  Sparkles,
  Scissors,
  FileDiff
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '文本统计分析工具 - 在线词频统计、字符频率、行数统计',
  meta: [
    {
      name: 'description',
      content: '在线文本统计分析工具，支持词频统计、字符频率分析、行数统计、段落数统计、平均长度计算，适用于SEO分析、内容分析。'
    },
    {
      name: 'keywords',
      content: '文本统计,词频统计,字符频率,行数统计,段落统计,内容分析,SEO分析,文本分析'
    }
  ]
})

// State
const inputText = ref('')
const charFilter = ref('all')

const options = ref({
  caseSensitive: false,
  includePunctuation: false,
  includeNumbers: true,
  chineseMode: false
})

const basicStats = ref<any>({
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

const wordFrequency = ref<any[]>([])
const charFrequency = ref<any[]>([])
const lineDistribution = ref<any[]>([])

// 分析文本
function analyze() {
  const text = inputText.value

  if (!text) {
    resetStats()
    return
  }

  // 基础统计
  calculateBasicStats(text)

  // 词频统计
  calculateWordFrequency(text)

  // 字符频率
  calculateCharFrequency(text)

  // 行分布
  calculateLineDistribution(text)
}

// 基础统计
function calculateBasicStats(text: string) {
  const lines = text.split('\n')
  const nonEmptyLines = lines.filter(line => line.trim().length > 0)

  basicStats.value.totalChars = text.length
  basicStats.value.visibleChars = text.replace(/\s/g, '').length
  basicStats.value.totalLines = lines.length
  basicStats.value.totalParagraphs = nonEmptyLines.length

  // 字符分类统计
  basicStats.value.chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  basicStats.value.englishChars = (text.match(/[a-zA-Z]/g) || []).length
  basicStats.value.numbers = (text.match(/\d/g) || []).length
  basicStats.value.punctuation = (text.match(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：""''（）【】《》、]/g) || []).length
  basicStats.value.whitespace = (text.match(/\s/g) || []).length

  // 行长度统计
  const lineLengths = lines.map(line => line.length)
  basicStats.value.maxLineLength = Math.max(...lineLengths, 0)
  basicStats.value.minLineLength = Math.min(...lineLengths.filter(l => l > 0), 0)
  basicStats.value.avgLineLength = lineLengths.length > 0
    ? (lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length).toFixed(1)
    : '0'

  // 词数统计
  let wordCount = 0
  if (options.value.chineseMode) {
    // 中文模式：汉字+英文单词
    const chineseWords = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    wordCount = chineseWords + englishWords
  } else {
    wordCount = (text.match(/\S+/g) || []).length
  }
  basicStats.value.totalWords = wordCount

  // 平均词长
  const words = text.match(/\S+/g) || []
  const avgLen = words.length > 0
    ? (words.join('').length / words.length).toFixed(1)
    : '0'
  basicStats.value.avgWordLength = avgLen

  // 最长词
  basicStats.value.maxWordLength = words.length > 0
    ? Math.max(...words.map(w => w.length))
    : 0

  // 阅读时间 (假设200字/分钟)
  const readingMinutes = Math.ceil(basicStats.value.visibleChars / 200)
  basicStats.value.readingTime = readingMinutes > 60
    ? `${Math.floor(readingMinutes / 60)} 小时 ${readingMinutes % 60} 分钟`
    : `${readingMinutes} 分钟`
}

// 词频统计
function calculateWordFrequency(text: string) {
  let words: string[] = []

  if (options.value.chineseMode) {
    // 中文分词（简单按字符）
    words = text.match(/[\u4e00-\u9fa5]/g) || []
  } else {
    // 英文分词
    words = text.match(/\S+/g) || []
  }

  if (!options.value.caseSensitive) {
    words = words.map(w => w.toLowerCase())
  }

  // 过滤
  if (!options.value.includePunctuation) {
    words = words.map(w => w.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：""''（）【】《》、]/g, '')).filter(w => w.length > 0)
  }

  if (!options.value.includeNumbers) {
    words = words.filter(w => !/^\d+$/.test(w))
  }

  // 统计频率
  const freqMap = new Map<string, number>()
  words.forEach(word => {
    freqMap.set(word, (freqMap.get(word) || 0) + 1)
  })

  // 转换为数组并排序
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
function calculateCharFrequency(text: string) {
  const chars = text.split('')
  const freqMap = new Map<string, number>()

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

  // 过滤
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
function calculateLineDistribution(text: string) {
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

// 初始化
loadSample()
</script>
