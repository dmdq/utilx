<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">时间差可视化工具</h1>
      <p class="text-gray-600 dark:text-gray-400">直观展示两个时间点之间的差值，可视化时间跨度</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-blue-500" />
          选择时间点
        </h2>

        <!-- 开始时间 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">开始时间</label>
          <input
            v-model="startTime"
            type="datetime-local"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="calculateDiff"
          >
        </div>

        <!-- 结束时间 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">结束时间</label>
          <input
            v-model="endTime"
            type="datetime-local"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="calculateDiff"
          >
        </div>

        <!-- 快捷选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">快捷选择</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="setQuickTime('now')"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              现在
            </button>
            <button
              @click="setQuickTime('today')"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              今天0点
            </button>
            <button
              @click="setQuickTime('todayEnd')"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              今天23:59
            </button>
            <button
              @click="setQuickTime('weekAgo')"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              一周前
            </button>
            <button
              @click="setQuickTime('monthAgo')"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              一月前
            </button>
            <button
              @click="setQuickTime('yearAgo')"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              一年前
            </button>
          </div>
        </div>

        <!-- 相对时间选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">相对时间</label>
          <div class="flex gap-2">
            <select
              v-model="relativeTime.value"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="7">7</option>
              <option value="10">10</option>
              <option value="30">30</option>
              <option value="100">100</option>
            </select>
            <select
              v-model="relativeTime.unit"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="min">分钟</option>
              <option value="h">小时</option>
              <option value="d">天</option>
              <option value="w">周</option>
              <option value="mo">月</option>
              <option value="y">年</option>
            </select>
            <select
              v-model="relativeTime.direction"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="after">之后</option>
              <option value="before">之前</option>
            </select>
          </div>
          <button
            @click="applyRelativeTime"
            class="w-full mt-2 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
          >
            应用相对时间
          </button>
        </div>

        <!-- 交换按钮 -->
        <button
          @click="swapTimes"
          class="w-full py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center gap-2"
        >
          <ArrowUpDown class="w-4 h-4" />
          交换开始/结束时间
        </button>
      </div>

      <!-- 结果区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator class="w-5 h-5 text-green-500" />
          时间差结果
        </h2>

        <div v-if="timeDiff" class="space-y-4">
          <!-- 主要差值 -->
          <div class="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-sm text-green-700 dark:text-green-300 mb-1">时间差</div>
            <div class="text-3xl font-bold text-green-800 dark:text-green-200">
              {{ timeDiff.totalSeconds >= 0 ? '' : '-' }}{{ formatDuration(Math.abs(timeDiff.totalSeconds)) }}
            </div>
          </div>

          <!-- 详细分解 -->
          <div class="space-y-2">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">详细分解</div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <span>毫秒:</span>
                <span class="font-mono">{{ Math.abs(timeDiff.milliseconds).toLocaleString() }}</span>
              </div>
              <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <span>秒:</span>
                <span class="font-mono">{{ Math.abs(timeDiff.totalSeconds).toLocaleString() }}</span>
              </div>
              <div class="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span>分钟:</span>
                <span class="font-mono">{{ Math.abs(timeDiff.minutes).toLocaleString() }}</span>
              </div>
              <div class="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span>小时:</span>
                <span class="font-mono">{{ Math.abs(timeDiff.hours).toLocaleString() }}</span>
              </div>
              <div class="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <span>天:</span>
                <span class="font-mono">{{ Math.abs(timeDiff.days).toLocaleString() }}</span>
              </div>
              <div class="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <span>周:</span>
                <span class="font-mono">{{ Math.abs(timeDiff.weeks).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 可视化进度条 -->
          <div>
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">时间跨度可视化</div>
            <div class="space-y-2">
              <!-- 毫秒条 -->
              <div class="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  :style="{ width: `${Math.min(Math.abs(timeDiff.milliseconds) / 1000 * 100, 100)}%` }"
                ></div>
                <div class="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {{ Math.floor(Math.abs(timeDiff.milliseconds) / 1000) }}秒
                </div>
              </div>
              <!-- 分钟条 -->
              <div class="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-500"
                  :style="{ width: `${Math.min(Math.abs(timeDiff.minutes) / 60 * 100, 100)}%` }"
                ></div>
                <div class="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {{ Math.floor(Math.abs(timeDiff.minutes) / 60) }}小时
                </div>
              </div>
              <!-- 天数条 -->
              <div class="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                  :style="{ width: `${Math.min(Math.abs(timeDiff.days) / 30 * 100, 100)}%` }"
                ></div>
                <div class="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {{ Math.floor(Math.abs(timeDiff.days) / 30) }}月
                </div>
              </div>
            </div>
          </div>

          <!-- 人类可读格式 -->
          <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div class="text-sm text-purple-700 dark:text-purple-300 mb-1">人类可读格式</div>
            <div class="font-medium text-purple-800 dark:text-purple-200">
              {{ humanReadable }}
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Clock class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>选择开始和结束时间</p>
        </div>
      </div>
    </div>

    <!-- 时间对比说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">时间对比参考</h2>
      <div class="grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3">常见时间差</h3>
          <div class="space-y-2 text-gray-600 dark:text-gray-400">
            <div>1分钟 = 60秒</div>
            <div>1小时 = 60分钟 = 3,600秒</div>
            <div>1天 = 24小时 = 1,440分钟 = 86,400秒</div>
            <div>1周 = 7天 = 168小时 = 604,800秒</div>
            <div>1月 ≈ 30.44天 = 2,629,746秒</div>
            <div>1年 ≈ 365.25天 = 31,557,600秒</div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-3">趣味对比</h3>
          <div class="space-y-2 text-gray-600 dark:text-gray-400">
            <div>1百万秒 ≈ 11.5天</div>
            <div>1千万秒 ≈ 115天</div>
            <div>1亿秒 ≈ 3.17年</div>
            <div>10亿秒 ≈ 31.7年</div>
            <div>平均人类寿命 ≈ 25亿秒</div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-3">应用场景</h3>
          <div class="space-y-2 text-gray-600 dark:text-gray-400">
            <div>• 项目工期计算</div>
            <div>• 活动倒计时</div>
            <div>• 工作时长统计</div>
            <div>• 年龄精确计算</div>
            <div>• 服务器运行时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/date-diff" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">日期差计算</h3>
          <p class="text-sm text-gray-500">计算日期间隔</p>
        </NuxtLink>
        <NuxtLink to="/tools/countdown-timer" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Timer class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">倒计时器</h3>
          <p class="text-sm text-gray-500">倒计时工具</p>
        </NuxtLink>
        <NuxtLink to="/tools/age-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">年龄计算器</h3>
          <p class="text-sm text-gray-500">精确年龄计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/time-unit-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Clock class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">时间单位转换</h3>
          <p class="text-sm text-gray-500">秒分时天转换</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Clock,
  Calculator,
  ArrowUpDown,
  Calendar,
  Timer
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '时间差可视化工具 - 直观展示时间跨度',
  meta: [
    {
      name: 'description',
      content: '在线时间差可视化工具，直观展示两个时间点之间的差值。支持多种时间单位显示、人类可读格式输出和进度条可视化。'
    },
    {
      name: 'keywords',
      content: '时间差,时间计算,日期差,时间跨度,可视化时间,在线时间差计算器'
    }
  ]
})

// State
const startTime = ref('')
const endTime = ref(new Date().toISOString().slice(0, 16))
const relativeTime = ref({ value: '1', unit: 'h', direction: 'after' })
const timeDiff = ref<any>(null)

// 格式化时长
function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)

  return parts.join(' ')
}

// 人类可读格式
const humanReadable = computed(() => {
  if (!timeDiff.value) return ''
  const seconds = Math.abs(timeDiff.value.totalSeconds)

  if (seconds < 60) return `${Math.floor(seconds)}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}天`
  if (seconds < 2629746) return `${Math.floor(seconds / 604800)}周`
  if (seconds < 31557600) return `${Math.floor(seconds / 2629746)}个月`
  return `${Math.floor(seconds / 31557600)}年`
})

// 计算时间差
function calculateDiff() {
  if (!startTime.value || !endTime.value) return

  const start = new Date(startTime.value)
  const end = new Date(endTime.value)
  const diffMs = end.getTime() - start.getTime()

  timeDiff.value = {
    milliseconds: diffMs,
    totalSeconds: diffMs / 1000,
    minutes: diffMs / (1000 * 60),
    hours: diffMs / (1000 * 60 * 60),
    days: diffMs / (1000 * 60 * 60 * 24),
    weeks: diffMs / (1000 * 60 * 60 * 24 * 7)
  }
}

// 快捷时间选择
function setQuickTime(type: string) {
  const now = new Date()
  const format = (date: Date) => date.toISOString().slice(0, 16)

  switch (type) {
    case 'now':
      startTime.value = format(now)
      break
    case 'today':
      startTime.value = format(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0))
      break
    case 'todayEnd':
      startTime.value = format(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59))
      break
    case 'weekAgo':
      startTime.value = format(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      break
    case 'monthAgo':
      startTime.value = format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
      break
    case 'yearAgo':
      startTime.value = format(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000))
      break
  }
  calculateDiff()
}

// 应用相对时间
function applyRelativeTime() {
  const now = new Date()
  const value = parseInt(relativeTime.value.value) || 1
  const unit = relativeTime.value.unit
  const direction = relativeTime.value.direction

  let milliseconds = 0
  switch (unit) {
    case 'min': milliseconds = value * 60 * 1000; break
    case 'h': milliseconds = value * 60 * 60 * 1000; break
    case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break
    case 'w': milliseconds = value * 7 * 24 * 60 * 60 * 1000; break
    case 'mo': milliseconds = value * 30.44 * 24 * 60 * 60 * 1000; break
    case 'y': milliseconds = value * 365.25 * 24 * 60 * 60 * 1000; break
  }

  if (direction === 'before') {
    milliseconds = -milliseconds
  }

  const result = new Date(now.getTime() + milliseconds)
  startTime.value = result.toISOString().slice(0, 16)
  calculateDiff()
}

// 交换时间
function swapTimes() {
  const temp = startTime.value
  startTime.value = endTime.value
  endTime.value = temp
  calculateDiff()
}

// 初始化
setQuickTime('now')
</script>
