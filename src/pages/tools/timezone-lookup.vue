<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">时区查询工具 - 全球城市时区信息查询</h1>
      <p class="text-muted-foreground">查询全球城市时区信息、UTC偏移量、夏令时，支持时区转换。适用于跨境业务、国际会议安排等场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 搜索和选择 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe class="w-5 h-5 text-primary" />
          查询时区
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">搜索城市或时区</label>
          <div class="relative">
            <input v-model="searchQuery" type="text" class="w-full px-4 py-2 pl-10 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="输入城市名称">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">按地区筛选</label>
          <div class="flex flex-wrap gap-2">
            <button @click="filterRegion = ''" :class="['px-3 py-1 text-sm rounded', filterRegion === '' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">全部</button>
            <button @click="filterRegion = 'asia'" :class="['px-3 py-1 text-sm rounded', filterRegion === 'asia' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">亚洲</button>
            <button @click="filterRegion = 'europe'" :class="['px-3 py-1 text-sm rounded', filterRegion === 'europe' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">欧洲</button>
            <button @click="filterRegion = 'americas'" :class="['px-3 py-1 text-sm rounded', filterRegion === 'americas' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">美洲</button>
          </div>
        </div>

        <div class="max-h-96 overflow-y-auto">
          <div v-for="tz in filteredTimezones" :key="tz.id" @click="selectTimezone(tz)" :class="['p-3 border-b border-border cursor-pointer hover:bg-accent transition', selectedTimezone?.id === tz.id ? 'bg-accent' : '']">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium text-foreground">{{ tz.city }}</div>
                <div class="text-sm text-muted-foreground">{{ tz.country }}</div>
              </div>
              <div class="text-sm text-muted-foreground text-right">
                <div>{{ tz.offset }}</div>
                <div class="text-xs">{{ tz.abbr }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 时区详情 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          时区详情
        </h2>

        <div v-if="selectedTimezone" class="space-y-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 class="font-medium text-blue-800 dark:text-blue-300 mb-2">当前时间</h3>
            <div class="text-2xl font-mono font-bold">{{ currentTime }}</div>
            <div class="text-sm text-blue-600 dark:text-blue-400 mt-1">{{ selectedTimezone.city }}, {{ selectedTimezone.country }}</div>
          </div>

          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 class="font-medium text-green-800 dark:text-green-300 mb-3">基本信息</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-muted-foreground">时区ID:</span><code class="font-mono text-xs">{{ selectedTimezone.id }}</code></div>
              <div class="flex justify-between"><span class="text-muted-foreground">UTC偏移:</span><span class="font-medium">{{ selectedTimezone.offset }}</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">时区缩写:</span><span class="font-medium">{{ selectedTimezone.abbr }}</span></div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-muted-foreground">
          <Globe class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>请选择一个时区查看详情</p>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Globe, Clock, Search, Calendar, Timer } from 'lucide-vue-next'
import { tools } from '~/data/tools'

useSeoMeta({
  title: '时区查询工具 - 全球城市时区信息查询 | Util工具箱',
  description: '在线时区查询工具，查询全球主要城市时区信息、UTC偏移量、夏令时状态。',
  keywords: '时区查询,UTC偏移,世界时钟,夏令时,全球时区,时区转换,城市时区'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: '时区查询工具',
      url: 'https://www.util.cn/tools/timezone-lookup'
    })
  }]
})

const iconMap = { Globe, Clock, Calendar, Timer }

const relatedTools = computed(() => [
  tools.find(t => t.id === 'timezone-convert'),
  tools.find(t => t.id === 'timestamp-convert'),
  tools.find(t => t.id === 'date-formatter'),
  tools.find(t => t.id === 'countdown-timer')
].filter(Boolean))

const timezones = [
  { id: 'Asia/Shanghai', city: '上海', country: '中国', offset: 'UTC+8', abbr: 'CST', dst: false, region: 'asia' },
  { id: 'Asia/Tokyo', city: '东京', country: '日本', offset: 'UTC+9', abbr: 'JST', dst: false, region: 'asia' },
  { id: 'America/New_York', city: '纽约', country: '美国', offset: 'UTC-5/-4', abbr: 'EST/EDT', dst: true, region: 'americas' },
  { id: 'Europe/London', city: '伦敦', country: '英国', offset: 'UTC+0/+1', abbr: 'GMT/BST', dst: true, region: 'europe' },
  { id: 'Europe/Paris', city: '巴黎', country: '法国', offset: 'UTC+1/+2', abbr: 'CET/CEST', dst: true, region: 'europe' }
]

const searchQuery = ref('')
const filterRegion = ref('')
const selectedTimezone = ref(null)
const currentTime = ref('')

const filteredTimezones = computed(() => {
  let result = timezones
  if (filterRegion.value) {
    result = result.filter(tz => tz.region === filterRegion.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(tz => tz.city.toLowerCase().includes(query) || tz.country.toLowerCase().includes(query))
  }
  return result
})

function getTimeInTimezone(timeZone, date) {
  return new Date(date.toLocaleString('en-US', { timeZone })).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function selectTimezone(tz) {
  selectedTimezone.value = tz
  updateCurrentTime()
}

function updateCurrentTime() {
  if (!selectedTimezone.value) return
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    timeZone: selectedTimezone.value.id,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

let timeInterval

onMounted(() => {
  updateCurrentTime()
  timeInterval = setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>
