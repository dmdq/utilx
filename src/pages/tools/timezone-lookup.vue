<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">时区查询工具</h1>
      <p class="text-gray-600 dark:text-gray-400">查询全球城市时区信息、UTC偏移量、夏令时，支持时区转换</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 搜索和选择 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Globe class="w-5 h-5 text-blue-500" />
          查询时区
        </h2>

        <!-- 搜索框 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">搜索城市或时区</label>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              class="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="输入城市名称（如：北京、东京、纽约）"
            >
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <!-- 筛选 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">按地区筛选</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="filterRegion = ''"
              :class="['px-3 py-1 text-sm rounded', filterRegion === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              全部
            </button>
            <button
              @click="filterRegion = 'asia'"
              :class="['px-3 py-1 text-sm rounded', filterRegion === 'asia' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              亚洲
            </button>
            <button
              @click="filterRegion = 'europe'"
              :class="['px-3 py-1 text-sm rounded', filterRegion === 'europe' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              欧洲
            </button>
            <button
              @click="filterRegion = 'americas'"
              :class="['px-3 py-1 text-sm rounded', filterRegion === 'americas' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              美洲
            </button>
            <button
              @click="filterRegion = 'oceania'"
              :class="['px-3 py-1 text-sm rounded', filterRegion === 'oceania' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              大洋洲
            </button>
            <button
              @click="filterRegion = 'africa'"
              :class="['px-3 py-1 text-sm rounded', filterRegion === 'africa' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              非洲
            </button>
          </div>
        </div>

        <!-- 时区列表 -->
        <div class="max-h-96 overflow-y-auto">
          <div
            v-for="tz in filteredTimezones"
            :key="tz.id"
            @click="selectTimezone(tz)"
            :class="[
              'p-3 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition',
              selectedTimezone?.id === tz.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            ]"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">{{ tz.city }}</div>
                <div class="text-sm text-gray-500">{{ tz.country }}</div>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 text-right">
                <div>{{ tz.offset }}</div>
                <div class="text-xs">{{ tz.abbr }}</div>
              </div>
            </div>
          </div>
          <div v-if="filteredTimezones.length === 0" class="text-center py-8 text-gray-500">
            未找到匹配的时区
          </div>
        </div>
      </div>

      <!-- 时区详情 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-green-500" />
          时区详情
        </h2>

        <div v-if="selectedTimezone" class="space-y-4">
          <!-- 当前时间 -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 class="font-medium text-blue-800 dark:text-blue-300 mb-2">当前时间</h3>
            <div class="text-2xl font-mono font-bold">
              {{ currentTime }}
            </div>
            <div class="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {{ selectedTimezone.city }}, {{ selectedTimezone.country }}
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 class="font-medium text-green-800 dark:text-green-300 mb-3">基本信息</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">时区ID:</span>
                <code class="font-mono text-xs">{{ selectedTimezone.id }}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">UTC偏移:</span>
                <span class="font-medium">{{ selectedTimezone.offset }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">时区缩写:</span>
                <span class="font-medium">{{ selectedTimezone.abbr }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">夏令时:</span>
                <span :class="selectedTimezone.dst ? 'text-orange-600' : 'text-gray-500'">
                  {{ selectedTimezone.dst ? '✓  observing DST' : '✗ 不使用' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 时间对比 -->
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 class="font-medium text-purple-800 dark:text-purple-300 mb-3">与主要城市对比</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div
                v-for="city in compareCities"
                :key="city.id"
                class="flex justify-between items-center"
              >
                <span class="text-gray-600 dark:text-gray-400">{{ city.city }}:</span>
                <span class="font-medium">{{ city.time }}</span>
              </div>
            </div>
          </div>

          <!-- 夏令时信息 -->
          <div v-if="selectedTimezone.dst" class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <h3 class="font-medium text-orange-800 dark:text-orange-300 mb-3">夏令时信息</h3>
            <div class="text-sm text-orange-700 dark:text-orange-400">
              该地区使用夏令时，每年春季拨快1小时，秋季拨回1小时
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Globe class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>请选择一个时区查看详情</p>
        </div>
      </div>
    </div>

    <!-- 世界时钟 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Clock class="w-5 h-5 text-indigo-500" />
        世界时钟
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div
          v-for="city in worldClocks"
          :key="city.id"
          class="p-4 border dark:border-gray-700 rounded-lg text-center"
        >
          <div class="text-lg font-mono font-bold">{{ city.time }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ city.city }}</div>
          <div class="text-xs text-gray-500">{{ city.offset }}</div>
        </div>
      </div>
    </div>

    <!-- 时区说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">时区说明</h2>

      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3">常用时区缩写</h3>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-mono">UTC</span>
              <span class="text-gray-600">协调世界时</span>
            </div>
            <div class="flex justify-between">
              <span class="font-mono">GMT</span>
              <span class="text-gray-600">格林威治标准时间</span>
            </div>
            <div class="flex justify-between">
              <span class="font-mono">EST/EDT</span>
              <span class="text-gray-600">美国东部时间</span>
            </div>
            <div class="flex justify-between">
              <span class="font-mono">PST/PDT</span>
              <span class="text-gray-600">美国太平洋时间</span>
            </div>
            <div class="flex justify-between">
              <span class="font-mono">CST/CDT</span>
              <span class="text-gray-600">美国中部时间 / 中国标准时间</span>
            </div>
            <div class="flex justify-between">
              <span class="font-mono">JST</span>
              <span class="text-gray-600">日本标准时间</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-3">UTC偏移说明</h3>
          <div class="space-y-2 text-gray-600 dark:text-gray-400">
            <p>UTC+0: 英国、葡萄牙、冰岛、西非</p>
            <p>UTC+1: 德国、法国、意大利、中非</p>
            <p>UTC+8: 中国、新加坡、澳大利亚西部</p>
            <p>UTC-5: 美国东部、南美西部</p>
            <p>UTC-8: 美国太平洋、加拿大西部</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/timezone-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Globe class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">时区转换</h3>
          <p class="text-sm text-gray-500">时区时间转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/timestamp-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Clock class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">时间戳转换</h3>
          <p class="text-sm text-gray-500">Unix时间戳互转</p>
        </NuxtLink>
        <NuxtLink to="/tools/date-formatter" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">日期格式化</h3>
          <p class="text-sm text-gray-500">ISO 8601格式</p>
        </NuxtLink>
        <NuxtLink to="/tools/countdown-timer" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Timer class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">倒计时器</h3>
          <p class="text-sm text-gray-500">倒计时工具</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Globe,
  Clock,
  Search,
  Calendar,
  Timer
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '时区查询工具 - 全球城市时区信息查询',
  meta: [
    {
      name: 'description',
      content: '在线时区查询工具，查询全球主要城市时区信息、UTC偏移量、夏令时状态。支持世界时钟对比，适用于跨境业务、国际会议安排等场景。'
    },
    {
      name: 'keywords',
      content: '时区查询,UTC偏移,世界时钟,夏令时,全球时区,时区转换,城市时区'
    }
  ]
})

// 时区数据
const timezones = [
  // 亚洲
  { id: 'Asia/Shanghai', city: '上海', country: '中国', offset: 'UTC+8', abbr: 'CST', dst: false, region: 'asia' },
  { id: 'Asia/Tokyo', city: '东京', country: '日本', offset: 'UTC+9', abbr: 'JST', dst: false, region: 'asia' },
  { id: 'Asia/Seoul', city: '首尔', country: '韩国', offset: 'UTC+9', abbr: 'KST', dst: false, region: 'asia' },
  { id: 'Asia/Singapore', city: '新加坡', country: '新加坡', offset: 'UTC+8', abbr: 'SGT', dst: false, region: 'asia' },
  { id: 'Asia/Hong_Kong', city: '香港', country: '中国', offset: 'UTC+8', abbr: 'HKT', dst: false, region: 'asia' },
  { id: 'Asia/Dubai', city: '迪拜', country: '阿联酋', offset: 'UTC+4', abbr: 'GST', dst: false, region: 'asia' },
  { id: 'Asia/Mumbai', city: '孟买', country: '印度', offset: 'UTC+5:30', abbr: 'IST', dst: false, region: 'asia' },
  { id: 'Asia/Bangkok', city: '曼谷', country: '泰国', offset: 'UTC+7', abbr: 'ICT', dst: false, region: 'asia' },
  { id: 'Asia/Jakarta', city: '雅加达', country: '印度尼西亚', offset: 'UTC+7', abbr: 'WIB', dst: false, region: 'asia' },
  { id: 'Asia/Manila', city: '马尼拉', country: '菲律宾', offset: 'UTC+8', abbr: 'PHT', dst: false, region: 'asia' },

  // 欧洲
  { id: 'Europe/London', city: '伦敦', country: '英国', offset: 'UTC+0 / +1', abbr: 'GMT / BST', dst: true, region: 'europe' },
  { id: 'Europe/Paris', city: '巴黎', country: '法国', offset: 'UTC+1 / +2', abbr: 'CET / CEST', dst: true, region: 'europe' },
  { id: 'Europe/Berlin', city: '柏林', country: '德国', offset: 'UTC+1 / +2', abbr: 'CET / CEST', dst: true, region: 'europe' },
  { id: 'Europe/Moscow', city: '莫斯科', country: '俄罗斯', offset: 'UTC+3', abbr: 'MSK', dst: false, region: 'europe' },
  { id: 'Europe/Rome', city: '罗马', country: '意大利', offset: 'UTC+1 / +2', abbr: 'CET / CEST', dst: true, region: 'europe' },
  { id: 'Europe/Madrid', city: '马德里', country: '西班牙', offset: 'UTC+1 / +2', abbr: 'CET / CEST', dst: true, region: 'europe' },
  { id: 'Europe/Amsterdam', city: '阿姆斯特丹', country: '荷兰', offset: 'UTC+1 / +2', abbr: 'CET / CEST', dst: true, region: 'europe' },
  { id: 'Europe/Zurich', city: '苏黎世', country: '瑞士', offset: 'UTC+1 / +2', abbr: 'CET / CEST', dst: true, region: 'europe' },

  // 美洲
  { id: 'America/New_York', city: '纽约', country: '美国', offset: 'UTC-5 / -4', abbr: 'EST / EDT', dst: true, region: 'americas' },
  { id: 'America/Los_Angeles', city: '洛杉矶', country: '美国', offset: 'UTC-8 / -7', abbr: 'PST / PDT', dst: true, region: 'americas' },
  { id: 'America/Chicago', city: '芝加哥', country: '美国', offset: 'UTC-6 / -5', abbr: 'CST / CDT', dst: true, region: 'americas' },
  { id: 'America/Toronto', city: '多伦多', country: '加拿大', offset: 'UTC-5 / -4', abbr: 'EST / EDT', dst: true, region: 'americas' },
  { id: 'America/Vancouver', city: '温哥华', country: '加拿大', offset: 'UTC-8 / -7', abbr: 'PST / PDT', dst: true, region: 'americas' },
  { id: 'America/Mexico_City', city: '墨西哥城', country: '墨西哥', offset: 'UTC-6 / -5', abbr: 'CST / CDT', dst: true, region: 'americas' },
  { id: 'America/Sao_Paulo', city: '圣保罗', country: '巴西', offset: 'UTC-3 / -2', abbr: 'BRT / BRST', dst: true, region: 'americas' },
  { id: 'America/Buenos_Aires', city: '布宜诺斯艾利斯', country: '阿根廷', offset: 'UTC-3', abbr: 'ART', dst: false, region: 'americas' },

  // 大洋洲
  { id: 'Australia/Sydney', city: '悉尼', country: '澳大利亚', offset: 'UTC+10 / +11', abbr: 'AEDT', dst: true, region: 'oceania' },
  { id: 'Australia/Melbourne', city: '墨尔本', country: '澳大利亚', offset: 'UTC+10 / +11', abbr: 'AEDT', dst: true, region: 'oceania' },
  { id: 'Pacific/Auckland', city: '奥克兰', country: '新西兰', offset: 'UTC+12 / +13', abbr: 'NZDT', dst: true, region: 'oceania' },

  // 非洲
  { id: 'Africa/Cairo', city: '开罗', country: '埃及', offset: 'UTC+2', abbr: 'EET', dst: false, region: 'africa' },
  { id: 'Africa/Johannesburg', city: '约翰内斯堡', country: '南非', offset: 'UTC+2', abbr: 'SAST', dst: false, region: 'africa' },
  { id: 'Africa/Lagos', city: '拉各斯', country: '尼日利亚', offset: 'UTC+1', abbr: 'WAT', dst: false, region: 'africa' },

  // 其他
  { id: 'Pacific/Auckland', city: '奥克兰', country: '新西兰', offset: 'UTC+12', abbr: 'NZST', dst: true, region: 'oceania' }
]

// State
const searchQuery = ref('')
const filterRegion = ref('')
const selectedTimezone = ref<any>(null)
const currentTime = ref('')

// 筛选后的时区列表
const filteredTimezones = computed(() => {
  let result = timezones

  if (filterRegion.value) {
    result = result.filter(tz => tz.region === filterRegion.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(tz =>
      tz.city.toLowerCase().includes(query) ||
      tz.country.toLowerCase().includes(query) ||
      tz.id.toLowerCase().includes(query)
    )
  }

  return result
})

// 对比城市
const compareCities = computed(() => {
  if (!selectedTimezone.value) return []

  const now = new Date()
  const compareList = [
    { id: 'Asia/Shanghai', city: '北京' },
    { id: 'America/New_York', city: '纽约' },
    { id: 'Europe/London', city: '伦敦' },
    { id: 'Asia/Tokyo', city: '东京' }
  ]

  return compareList.map(city => ({
    ...city,
    time: getTimeInTimezone(city.id, now)
  }))
})

// 世界时钟
const worldClocks = computed(() => {
  const cities = [
    { id: 'Asia/Shanghai', city: '北京', offset: '+8' },
    { id: 'America/New_York', city: '纽约', offset: '-5/-4' },
    { id: 'Europe/London', city: '伦敦', offset: '+0/+1' },
    { id: 'Asia/Tokyo', city: '东京', offset: '+9' },
    { id: 'Australia/Sydney', city: '悉尼', offset: '+10/+11' },
    { id: 'Europe/Paris', city: '巴黎', offset: '+1/+2' }
  ]

  const now = new Date()

  return cities.map(city => ({
    ...city,
    time: getTimeInTimezone(city.id, now)
  }))
})

// 获取时区时间
function getTimeInTimezone(timeZone: string, date: Date): string {
  return new Date(date.toLocaleString('en-US', { timeZone })).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 选择时区
function selectTimezone(tz: any) {
  selectedTimezone.value = tz
  updateCurrentTime()
}

// 更新当前时间
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

let timeInterval: any

// 生命周期
onMounted(() => {
  updateCurrentTime()
  timeInterval = setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>
