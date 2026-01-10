<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">时间单位转换器 - 秒分时天周月年相互转换</h1>
      <p class="text-muted-foreground">在不同时间单位之间相互转换，支持秒、分、时、天、周、月、年等。提供完整的换算表和常用参考，适用于编程、学习等场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          输入
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">数值</label>
          <input v-model="inputValue" type="number" step="any" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="输入数值" @input="convert">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">从</label>
          <select v-model="inputUnit" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary" @change="convert">
            <option value="ms">毫秒</option>
            <option value="s">秒</option>
            <option value="min">分钟</option>
            <option value="h">小时</option>
            <option value="d">天</option>
            <option value="w">周</option>
            <option value="mo">月</option>
            <option value="y">年</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">到</label>
          <select v-model="outputUnit" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary" @change="convert">
            <option value="ms">毫秒</option>
            <option value="s">秒</option>
            <option value="min">分钟</option>
            <option value="h">小时</option>
            <option value="d">天</option>
            <option value="w">周</option>
            <option value="mo">月</option>
            <option value="y">年</option>
          </select>
        </div>

        <button @click="convert" class="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
          <RefreshCw class="w-5 h-5" />
          转换
        </button>
      </div>

      <!-- 结果区域 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calculator class="w-5 h-5 text-primary" />
          转换结果
        </h2>

        <div class="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
          <div class="text-sm text-green-700 dark:text-green-300 mb-1">{{ resultText }}</div>
          <div class="text-3xl font-mono font-bold text-green-800 dark:text-green-200">
            {{ formattedResult }}
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground mb-3">所有单位换算</div>
          <div v-for="unit in unitNames" :key="unit.value" class="flex justify-between items-center p-2 border-b border-border">
            <span class="text-sm text-muted-foreground">{{ unit.label }}:</span>
            <div class="flex items-center gap-2">
              <code class="text-sm font-mono">{{ formatNumber(conversions[unit.value]) }}</code>
              <button @click="copyResult(conversions[unit.value], unit.label)" class="text-green-500 hover:text-green-700" title="复制">
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          单位说明
        </h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-8">
          <div class="p-4 border border-border rounded-lg">
            <h3 class="font-medium text-foreground mb-2">毫秒</h3>
            <p class="text-muted-foreground">1秒 = 1000毫秒，用于精确计时</p>
          </div>
          <div class="p-4 border border-border rounded-lg">
            <h3 class="font-medium text-foreground mb-2">秒</h3>
            <p class="text-muted-foreground">国际单位制时间基本单位</p>
          </div>
          <div class="p-4 border border-border rounded-lg">
            <h3 class="font-medium text-foreground mb-2">分钟</h3>
            <p class="text-muted-foreground">1分钟 = 60秒</p>
          </div>
          <div class="p-4 border border-border rounded-lg">
            <h3 class="font-medium text-foreground mb-2">小时</h3>
            <p class="text-muted-foreground">1小时 = 60分钟 = 3600秒</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink v-for="relatedTool in relatedTools" :key="relatedTool.id" :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
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
import { Clock, Calculator, RefreshCw, Copy, Timer, Activity, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

useSeoMeta({
  title: '时间单位转换器 - 秒分时天周月年相互转换 | Util工具箱',
  description: '在线时间单位转换工具，支持毫秒、秒、分钟、小时、天、周、月、年之间的相互转换。提供完整的换算表和常用参考。',
  keywords: '时间单位转换,秒分转换,小时换算,天换算,时间计算,在线时间转换器'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: '时间单位转换器',
      description: '在线时间单位转换工具',
      url: 'https://www.util.cn/tools/time-unit-convert'
    })
  }]
})

const iconMap = { Clock, Calculator, Timer, Activity }

const relatedTools = computed(() => [
  tools.find(t => t.id === 'timestamp-convert'),
  tools.find(t => t.id === 'date-calculator'),
  tools.find(t => t.id === 'countdown-timer'),
  tools.find(t => t.id === 'stopwatch')
].filter(Boolean))

const isSeoContentVisible = ref(true)

const unitNames = [
  { value: 'ms', label: '毫秒' },
  { value: 's', label: '秒' },
  { value: 'min', label: '分钟' },
  { value: 'h', label: '小时' },
  { value: 'd', label: '天' },
  { value: 'w', label: '周' },
  { value: 'mo', label: '月' },
  { value: 'y', label: '年' }
]

const inputValue = ref(1)
const inputUnit = ref('s')
const outputUnit = ref('min')
const conversions = ref({})

function toSeconds(value, unit) {
  switch (unit) {
    case 'ms': return value / 1000
    case 's': return value
    case 'min': return value * 60
    case 'h': return value * 3600
    case 'd': return value * 86400
    case 'w': return value * 604800
    case 'mo': return value * 2629746
    case 'y': return value * 31557600
    default: return value
  }
}

function fromSeconds(seconds, unit) {
  switch (unit) {
    case 'ms': return seconds * 1000
    case 's': return seconds
    case 'min': return seconds / 60
    case 'h': return seconds / 3600
    case 'd': return seconds / 86400
    case 'w': return seconds / 604800
    case 'mo': return seconds / 2629746
    case 'y': return seconds / 31557600
    default: return seconds
  }
}

function convert() {
  const input = parseFloat(inputValue.value) || 0
  const seconds = toSeconds(input, inputUnit.value)
  const result = {}
  for (const unit of unitNames) {
    result[unit.value] = fromSeconds(seconds, unit.value)
  }
  conversions.value = result
}

function formatNumber(num) {
  if (num === 0) return '0'
  if (Math.abs(num) < 0.000001 || Math.abs(num) > 1e9) {
    return num.toExponential(6)
  }
  if (Number.isInteger(num)) {
    return num.toLocaleString()
  }
  return num.toFixed(6).replace(/\.?0+$/, '')
}

const resultText = computed(() => {
  const inputLabel = unitNames.find(u => u.value === inputUnit.value)?.label || ''
  return `${inputValue.value} ${inputLabel} =`
})

const formattedResult = computed(() => {
  const result = conversions.value[outputUnit.value] || 0
  return formatNumber(result)
})

function copyResult(value) {
  navigator.clipboard.writeText(formatNumber(value))
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

convert()
</script>
