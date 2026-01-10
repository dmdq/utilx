<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">时间戳批量转换工具 - 多个Unix时间戳同时转换</h1>
      <p class="text-muted-foreground">同时处理多个Unix时间戳，支持秒和毫秒格式，批量转换为可读日期时间。自动识别格式，适用于日志分析、数据处理等场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          输入时间戳
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">时间戳格式</label>
          <div class="flex gap-2">
            <button @click="inputFormat = 'auto'" :class="['px-3 py-1 text-sm rounded', inputFormat === 'auto' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">自动识别</button>
            <button @click="inputFormat = 'seconds'" :class="['px-3 py-1 text-sm rounded', inputFormat === 'seconds' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">秒 (10位)</button>
            <button @click="inputFormat = 'milliseconds'" :class="['px-3 py-1 text-sm rounded', inputFormat === 'milliseconds' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">毫秒 (13位)</button>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">输入时间戳 (每行一个)</label>
          <textarea v-model="inputText" rows="12" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm" placeholder="输入Unix时间戳，每行一个..."></textarea>
          <div class="flex justify-between mt-2">
            <span class="text-sm text-muted-foreground">已输入: {{ lineCount }} 行</span>
            <div class="flex gap-2">
              <button @click="pasteFromClipboard" class="text-sm text-primary hover:text-primary/70">粘贴</button>
              <button @click="loadSample" class="text-sm text-green-500 hover:text-green-700">示例</button>
              <button @click="clearInput" class="text-sm text-red-500 hover:text-red-700">清空</button>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">输出格式</label>
          <select v-model="outputFormat" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="iso8601">ISO 8601 (YYYY-MM-DD HH:mm:ss)</option>
            <option value="ymd">年-月-日 时:分:秒</option>
            <option value="mdy">月/日/年 时:分:秒 AM/PM</option>
            <option value="dmy">日/月/年 时:分:秒</option>
          </select>
        </div>

        <button @click="convert" :disabled="!inputText || lineCount === 0" class="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:bg-muted flex items-center justify-center gap-2">
          <RefreshCw class="w-5 h-5" />
          批量转换
        </button>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary" />
          转换结果
          <span v-if="results.length > 0" class="text-sm font-normal text-muted-foreground">({{ results.length }} 条)</span>
        </h2>

        <div v-if="results.length > 0" class="mb-4 flex gap-2">
          <button @click="copyAllResults" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm flex items-center gap-2">
            <Copy class="w-4 h-4" />
            复制全部
          </button>
          <button @click="exportToFile" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2">
            <Download class="w-4 h-4" />
            导出文件
          </button>
        </div>

        <div v-if="results.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <div v-for="(item, index) in results" :key="index" class="p-3 border border-border rounded-lg">
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <div class="text-xs text-muted-foreground mb-1">第 {{ index + 1 }} 条</div>
                <div class="flex items-center gap-2">
                  <code class="text-sm font-mono text-primary break-all">{{ item.original }}</code>
                  <span v-if="item.detectedFormat" class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-primary">{{ item.detectedFormat }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <ArrowRight class="w-4 h-4 text-muted-foreground" />
                <div class="text-sm font-medium">{{ item.converted }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="results.length === 0" class="text-center py-8 text-muted-foreground">
          <Clock class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>输入时间戳后点击"批量转换"</p>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink v-for="relatedTool in relatedTools" :key="relatedTool.id" :to="`/tools/${relatedTool.id}`" class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
          <div class="flex items-center gap-2 mb-2">
            <component :is="iconMap[relatedTool.icon]" class="w-5 h-5 text-primary" />
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
import { Clock, Calendar, RefreshCw, Copy, Download, ArrowRight, Globe, Calculator, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

useSeoMeta({
  title: '时间戳批量转换工具 - 多个Unix时间戳同时转换 | Util工具箱',
  description: '在线时间戳批量转换工具，支持同时处理多个Unix时间戳。自动识别秒/毫秒格式，转换为可读日期时间。',
  keywords: '时间戳批量转换,Unix时间戳,批量转换,日志时间戳,时间戳格式化,在线批量工具'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: '时间戳批量转换工具',
      description: '在线时间戳批量转换工具',
      url: 'https://www.util.cn/tools/timestamp-batch-convert'
    })
  }]
})

const iconMap = { Clock, Calendar, Globe, Calculator }

const relatedTools = computed(() => [
  tools.find(t => t.id === 'timestamp-convert'),
  tools.find(t => t.id === 'date-formatter'),
  tools.find(t => t.id === 'timezone-convert'),
  tools.find(t => t.id === 'date-calculator')
].filter(Boolean))

const inputText = ref('')
const inputFormat = ref('auto')
const outputFormat = ref('iso8601')
const results = ref([])
const errors = ref([])

const lineCount = computed(() => {
  if (!inputText.value) return 0
  return inputText.value.split('\n').filter(line => line.trim()).length
})

function convert() {
  if (!inputText.value) return
  results.value = []
  errors.value = []

  const lines = inputText.value.split('\n')

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return

    let timestamp = null
    let detected = ''

    if (inputFormat.value === 'seconds') {
      timestamp = parseInt(trimmed) * 1000
      detected = '秒'
    } else if (inputFormat.value === 'milliseconds') {
      timestamp = parseInt(trimmed)
      detected = '毫秒'
    } else {
      const num = parseInt(trimmed)
      if (isNaN(num)) {
        errors.value.push({ line: index + 1, value: trimmed, message: '无效的时间戳格式' })
        return
      }
      if (trimmed.length <= 10) {
        timestamp = num * 1000
        detected = '秒'
      } else {
        timestamp = num
        detected = '毫秒'
      }
    }

    if (timestamp < 0 || timestamp > 9999999999999) {
      errors.value.push({ line: index + 1, value: trimmed, message: '时间戳超出有效范围' })
      return
    }

    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      errors.value.push({ line: index + 1, value: trimmed, message: '无效的日期' })
      return
    }

    const converted = formatDate(date, outputFormat.value)
    results.value.push({ original: trimmed, converted, detectedFormat: detected })
  })
}

function formatDate(date, format) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')

  switch (format) {
    case 'iso8601': return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    case 'ymd': return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`
    case 'mdy': return date.toLocaleString('en-US', { hour12: true })
    case 'dmy': return `${day}/${month}/${year} ${hour}:${minute}:${second}`
    default: return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }
}

function loadSample() {
  const now = Date.now() / 1000
  inputText.value = [
    Math.floor(now).toString(),
    Math.floor(now - 86400).toString(),
    Math.floor(now - 86400 * 7).toString(),
    Math.floor(now + 86400).toString()
  ].join('\n')
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
  } catch {
    alert('无法访问剪贴板')
  }
}

function copyResult(text) {
  navigator.clipboard.writeText(text)
}

function copyAllResults() {
  const text = results.value.map(r => r.converted).join('\n')
  navigator.clipboard.writeText(text)
}

function exportToFile() {
  const lines = results.value.map(r => `${r.original} -> ${r.converted}`)
  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timestamp-converted-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function clearInput() {
  inputText.value = ''
  results.value = []
  errors.value = []
}
</script>
