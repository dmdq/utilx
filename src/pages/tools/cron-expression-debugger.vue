<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Cron表达式调试器</h1>
      <p class="text-gray-600 dark:text-gray-400">解析Cron表达式，显示执行时间，可视化调试定时任务</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Cron表达式</h2>
      <div class="flex gap-4 mb-4">
        <input
          v-model="cronExpression"
          class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-lg"
          placeholder="* * * * *"
          @input="parseCron"
        >
        <button @click="loadSample" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">示例</button>
        <button @click="clearAll" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">清空</button>
      </div>

      <!-- 快捷预设 -->
      <div class="flex flex-wrap gap-2">
        <button @click="setPreset('*/5 * * * *')" class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">每5分钟</button>
        <button @click="setPreset('0 * * * *')" class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">每小时</button>
        <button @click="setPreset('0 0 * * *')" class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">每天零点</button>
        <button @click="setPreset('0 0 * * 0')" class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">每周日</button>
        <button @click="setPreset('0 0 1 * *')" class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">每月1号</button>
        <button @click="setPreset('0 9-17 * * 1-5')" class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">工作日9-17点</button>
      </div>
    </div>

    <!-- 表达式解析 -->
    <div v-if="parsedCron" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">表达式解析</h2>
      <div class="grid grid-cols-5 gap-4">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">{{ parsedCron.minute }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">分钟 (0-59)</div>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">{{ parsedCron.hour }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">小时 (0-23)</div>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-600">{{ parsedCron.day }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">日期 (1-31)</div>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">{{ parsedCron.month }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">月份 (1-12)</div>
        </div>
        <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-pink-600">{{ parsedCron.weekday }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">星期 (0-6)</div>
        </div>
      </div>

      <!-- 人类可读描述 -->
      <div v-if="humanReadable" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <span class="font-medium">执行规则：</span>
        <span class="text-blue-600">{{ humanReadable }}</span>
      </div>
    </div>

    <!-- 执行时间列表 -->
    <div v-if="nextRuns.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">未来执行时间</h2>
        <div class="flex gap-2">
          <button @click="runCount = 5; calculateRuns()" class="px-3 py-1 text-sm rounded" :class="runCount === 5 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'">5次</button>
          <button @click="runCount = 10; calculateRuns()" class="px-3 py-1 text-sm rounded" :class="runCount === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'">10次</button>
          <button @click="runCount = 20; calculateRuns()" class="px-3 py-1 text-sm rounded" :class="runCount === 20 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'">20次</button>
        </div>
      </div>
      <div class="space-y-2 max-h-80 overflow-y-auto">
        <div v-for="(run, index) in nextRuns" :key="index" class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <span class="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-sm font-medium">{{ index + 1 }}</span>
          <span class="font-mono text-lg">{{ run }}</span>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="bg-red-100 dark:bg-red-900/30 rounded-xl p-6 mb-6">
      <div class="flex items-center gap-2 text-red-700 dark:text-red-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <!-- Cron语法说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Cron表达式语法</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-2">特殊字符</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">*</code>
              <span>任意值</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">,</code>
              <span>列表分隔符</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">-</code>
              <span>范围</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">/</code>
              <span>步长</span>
            </div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2">格式说明</h3>
          <div class="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded">
            分 时 日 月 周<br>
            * * * * *<br>
            │ │ │ │ │<br>
            │ │ │ │ └─ 星期 (0-6, 0=周日)<br>
            │ │ │ └─── 月份 (1-12)<br>
            │ │ └───── 日期 (1-31)<br>
            │ └─────── 小时 (0-23)<br>
            └───────── 分钟 (0-59)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Cron表达式调试器 - 在线Cron解析与执行时间计算',
  meta: [{ name: 'description', content: '在线Cron表达式调试工具，解析Cron表达式，显示未来执行时间，支持标准5位Cron格式。' }],
  keywords: ['Cron表达式', 'Cron调试', '定时任务', 'Crontab', '任务调度']
})

const cronExpression = ref('0 9 * * *')
const parsedCron = ref<any>(null)
const humanReadable = ref('')
const nextRuns = ref<string[]>([])
const runCount = ref(5)
const errorMessage = ref('')

function loadSample() {
  setPreset('*/5 * * * *')
}

function clearAll() {
  cronExpression.value = ''
  parsedCron.value = null
  nextRuns.value = []
  humanReadable.value = ''
}

function setPreset(expr: string) {
  cronExpression.value = expr
  parseCron()
}

function parseCron() {
  errorMessage.value = ''

  const parts = cronExpression.value.trim().split(/\s+/)
  if (parts.length !== 5) {
    errorMessage.value = 'Cron表达式必须包含5个部分：分 时 日 月 周'
    parsedCron.value = null
    nextRuns.value = []
    return
  }

  parsedCron.value = {
    minute: parts[0],
    hour: parts[1],
    day: parts[2],
    month: parts[3],
    weekday: parts[4]
  }

  calculateRuns()
  generateHumanReadable()
}

function calculateRuns() {
  if (!parsedCron.value) return

  try {
    const runs: string[] = []
    let date = new Date()
    date.setSeconds(0, 0)
    date.setMinutes(date.getMinutes() + 1)

    while (runs.length < runCount.value && runs.length < 100) {
      if (matchesCron(date)) {
        runs.push(formatDate(date))
      }
      date.setMinutes(date.getMinutes() + 1)
    }

    nextRuns.value = runs
  } catch {
    errorMessage.value = '计算执行时间失败'
  }
}

function matchesCron(date: Date): boolean {
  const minute = date.getMinutes()
  const hour = date.getHours()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const weekday = date.getDay()

  return matchesField(minute, parsedCron.value.minute, 0, 59) &&
    matchesField(hour, parsedCron.value.hour, 0, 23) &&
    matchesField(day, parsedCron.value.day, 1, 31) &&
    matchesField(month, parsedCron.value.month, 1, 12) &&
    matchesField(weekday, parsedCron.value.weekday, 0, 6)
}

function matchesField(value: number, pattern: string, min: number, max: number): boolean {
  if (pattern === '*') return true

  // 处理逗号分隔的列表
  const parts = pattern.split(',')
  for (const part of parts) {
    if (part.includes('/')) {
      // 步长: */5 或 1-10/2
      const [range, step] = part.split('/')
      const stepNum = parseInt(step)
      const rangeMatch = range === '*'
        ? { min, max }
        : range.includes('-')
          ? (() => { const [s, e] = range.split('-'); return { min: parseInt(s), max: parseInt(e) } })()
          : { min: parseInt(range), max: parseInt(range) }

      for (let i = rangeMatch.min; i <= rangeMatch.max; i += stepNum) {
        if (i === value) return true
      }
    } else if (part.includes('-')) {
      // 范围: 1-5
      const [start, end] = part.split('-').map(Number)
      if (value >= start && value <= end) return true
    } else {
      // 单个值
      if (parseInt(part) === value) return true
    }
  }

  return false
}

function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short'
  })
}

function generateHumanReadable() {
  if (!parsedCron.value) return

  const desc: string[] = []

  const minuteDesc = describeField(parsedCron.value.minute, '分钟', 0, 59)
  const hourDesc = describeField(parsedCron.value.hour, '点', 0, 23)
  const dayDesc = describeField(parsedCron.value.day, '日', 1, 31)
  const monthDesc = describeField(parsedCron.value.month, '月', 1, 12)
  const weekdayDesc = describeField(parsedCron.value.weekday, '周', 0, 6)

  if (parsedCron.value.minute === '*') desc.push('每分钟')
  else desc.push(minuteDesc)

  if (parsedCron.value.hour === '*') desc.push('每小时')
  else desc.push(hourDesc)

  humanReadable.value = desc.join('，')
}

function describeField(pattern: string, unit: string, min: number, max: number): string {
  if (pattern === '*') return `任意${unit}`

  if (pattern.includes('/')) {
    const [range, step] = pattern.split('/')
    if (range === '*') return `每${step}${unit}`
  }

  return `${pattern}${unit}`
}

// 初始化
parseCron()
</script>
