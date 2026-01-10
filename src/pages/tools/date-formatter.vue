<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">日期格式化工具 - 在线ISO 8601/RFC 2822日期格式转换</h1>
      <p class="text-muted-foreground">将日期转换为各种标准格式，支持ISO 8601、RFC 2822等常用格式。提供多种日期格式输出，包括中文日期、时间戳，适用于API开发、日志记录等场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary" />
          选择日期时间
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">日期</label>
          <input v-model="dateInput" type="date" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">时间</label>
          <input v-model="timeInput" type="time" step="1" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">快捷操作</label>
          <div class="flex flex-wrap gap-2">
            <button @click="setNow" class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">当前时间</button>
            <button @click="setToday" class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground">今天0点</button>
            <button @click="setTodayEnd" class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground">今天23:59</button>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">时区</label>
          <select v-model="selectedTimezone" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="local">本地时区</option>
            <option value="UTC">UTC (协调世界时)</option>
            <option value="Asia/Shanghai">中国 (UTC+8)</option>
            <option value="America/New_York">纽约 (EST/EDT)</option>
            <option value="Europe/London">伦敦 (GMT/BST)</option>
          </select>
        </div>
      </div>

      <!-- 格式化结果 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          格式化结果
        </h2>

        <div v-if="currentDate" class="space-y-3">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300">ISO 8601</span>
              <button @click="copyText(iso8601)" class="text-blue-500 hover:text-blue-700" title="复制">
                <Copy class="w-4 h-4" />
              </button>
            </div>
            <code class="text-sm font-mono break-all">{{ iso8601 }}</code>
          </div>

          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-green-700 dark:text-green-300">RFC 2822</span>
              <button @click="copyText(rfc2822)" class="text-green-500 hover:text-green-700" title="复制">
                <Copy class="w-4 h-4" />
              </button>
            </div>
            <code class="text-sm font-mono break-all">{{ rfc2822 }}</code>
          </div>

          <div class="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Unix时间戳</span>
              <button @click="copyText(unixTimestamp)" class="text-gray-500 hover:text-gray-700" title="复制">
                <Copy class="w-4 h-4" />
              </button>
            </div>
            <code class="text-sm font-mono">{{ unixTimestamp }}</code>
          </div>
        </div>

        <div v-else class="text-center py-8 text-muted-foreground">
          <Calendar class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>请选择日期和时间</p>
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
import { Calendar, Clock, Copy, Info, Globe, Calculator } from 'lucide-vue-next'
import { tools } from '~/data/tools'

useSeoMeta({
  title: '日期格式化工具 - 在线ISO 8601/RFC 2822日期格式转换 | Util工具箱',
  description: '在线日期格式化工具，支持ISO 8601、RFC 2822等标准日期格式转换。提供多种日期格式输出，包括中文日期、时间戳。',
  keywords: '日期格式化,ISO 8601,RFC 2822,日期转换,时间格式,Unix时间戳,在线日期格式化'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: '日期格式化工具',
      url: 'https://www.util.cn/tools/date-formatter'
    })
  }]
})

const iconMap = { Calendar, Clock, Globe, Calculator }

const relatedTools = computed(() => [
  tools.find(t => t.id === 'timestamp-convert'),
  tools.find(t => t.id === 'timezone-convert'),
  tools.find(t => t.id === 'date-calculator'),
  tools.find(t => t.id === 'cron-generator')
].filter(Boolean))

const dateInput = ref(new Date().toISOString().split('T')[0])
const timeInput = ref(new Date().toTimeString().split(' ')[0].slice(0, 8))
const selectedTimezone = ref('local')

const currentDate = computed(() => {
  if (!dateInput.value) return null

  const dateStr = dateInput.value
  const timeStr = timeInput.value || '00:00:00'

  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute, second = 0] = timeStr.split(':').map(Number)

  let date = new Date(year, month - 1, day, hour, minute, second)

  if (selectedTimezone.value !== 'local') {
    const offset = getTimezoneOffset(selectedTimezone.value, date)
    date = new Date(date.getTime() - offset)
  }

  return date
})

const iso8601 = computed(() => {
  if (!currentDate.value) return ''
  return currentDate.value.toISOString()
})

const rfc2822 = computed(() => {
  if (!currentDate.value) return ''
  return currentDate.value.toUTCString().replace('GMT', '+0000')
})

const unixTimestamp = computed(() => {
  if (!currentDate.value) return ''
  return Math.floor(currentDate.value.getTime() / 1000).toString()
})

function getTimezoneOffset(tz, date) {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: tz }))
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  return localDate.getTime() - utcDate.getTime()
}

function setNow() {
  const now = new Date()
  dateInput.value = now.toISOString().split('T')[0]
  timeInput.value = now.toTimeString().split(' ')[0].slice(0, 8)
}

function setToday() {
  const now = new Date()
  dateInput.value = now.toISOString().split('T')[0]
  timeInput.value = '00:00:00'
}

function setTodayEnd() {
  const now = new Date()
  dateInput.value = now.toISOString().split('T')[0]
  timeInput.value = '23:59:59'
}

function copyText(text) {
  navigator.clipboard.writeText(text)
}
</script>
