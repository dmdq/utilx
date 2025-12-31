<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">日期格式化工具</h1>
      <p class="text-gray-600 dark:text-gray-400">将日期转换为各种标准格式，支持ISO 8601、RFC 2822等常用格式</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-blue-500" />
          选择日期时间
        </h2>

        <!-- 日期时间选择 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">日期</label>
            <input
              v-model="dateInput"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">时间</label>
            <input
              v-model="timeInput"
              type="time"
              step="1"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
          </div>

          <!-- 快捷操作 -->
          <div>
            <label class="block text-sm font-medium mb-2">快捷操作</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="setNow"
                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                当前时间
              </button>
              <button
                @click="setToday"
                class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
              >
                今天0点
              </button>
              <button
                @click="setTodayEnd"
                class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
              >
                今天23:59
              </button>
            </div>
          </div>

          <!-- 时区选择 -->
          <div>
            <label class="block text-sm font-medium mb-2">时区</label>
            <select
              v-model="selectedTimezone"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="local">本地时区</option>
              <option value="UTC">UTC (协调世界时)</option>
              <option value="Asia/Shanghai">中国 (UTC+8)</option>
              <option value="America/New_York">纽约 (EST/EDT)</option>
              <option value="America/Los_Angeles">洛杉矶 (PST/PDT)</option>
              <option value="Europe/London">伦敦 (GMT/BST)</option>
              <option value="Europe/Paris">巴黎 (CET/CEST)</option>
              <option value="Asia/Tokyo">东京 (JST)</option>
              <option value="Australia/Sydney">悉尼 (AEDT)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 格式化结果 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-green-500" />
          格式化结果
        </h2>

        <div v-if="currentDate" class="space-y-3">
          <!-- ISO 8601 -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300">ISO 8601</span>
              <button
                @click="copyText(iso8601)"
                class="text-blue-500 hover:text-blue-700"
                title="复制"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
            <code class="text-sm font-mono break-all">{{ iso8601 }}</code>
            <div class="mt-2 space-y-1 text-xs text-blue-600 dark:text-blue-400">
              <div>日期时间: {{ iso8601DateTime }}</div>
              <div>仅日期: {{ iso8601Date }}</div>
            </div>
          </div>

          <!-- RFC 2822 -->
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-green-700 dark:text-green-300">RFC 2822 (Email/HTTP)</span>
              <button
                @click="copyText(rfc2822)"
                class="text-green-500 hover:text-green-700"
                title="复制"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
            <code class="text-sm font-mono break-all">{{ rfc2822 }}</code>
          </div>

          <!-- 常用格式 -->
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <span class="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 block">常用格式</span>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">YYYY-MM-DD:</span>
                <div class="flex items-center gap-2">
                  <code class="font-mono">{{ dateFormatYMD }}</code>
                  <button
                    @click="copyText(dateFormatYMD)"
                    class="text-purple-500 hover:text-purple-700"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">DD/MM/YYYY:</span>
                <div class="flex items-center gap-2">
                  <code class="font-mono">{{ dateFormatDMY }}</code>
                  <button
                    @click="copyText(dateFormatDMY)"
                    class="text-purple-500 hover:text-purple-700"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">MM/DD/YYYY:</span>
                <div class="flex items-center gap-2">
                  <code class="font-mono">{{ dateFormatMDY }}</code>
                  <button
                    @click="copyText(dateFormatMDY)"
                    class="text-purple-500 hover:text-purple-700"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 中文格式 -->
          <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span class="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2 block">中文格式</span>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">完整日期:</span>
                <div class="flex items-center gap-2">
                  <code class="font-mono">{{ chineseFull }}</code>
                  <button
                    @click="copyText(chineseFull)"
                    class="text-orange-500 hover:text-orange-700"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">简短日期:</span>
                <div class="flex items-center gap-2">
                  <code class="font-mono">{{ chineseShort }}</code>
                  <button
                    @click="copyText(chineseShort)"
                    class="text-orange-500 hover:text-orange-700"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Unix时间戳 -->
          <div class="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Unix时间戳</span>
              <button
                @click="copyText(unixTimestamp)"
                class="text-gray-500 hover:text-gray-700"
                title="复制"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
            <code class="text-sm font-mono">{{ unixTimestamp }}</code>
            <div class="mt-1 text-xs text-gray-500">秒: {{ unixTimestamp }} / 毫秒: {{ unixTimestampMs }}</div>
          </div>

          <!-- 其他信息 -->
          <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <span class="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2 block">日期信息</span>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>星期: {{ dayOfWeek }}</div>
              <div>年中第几天: {{ dayOfYear }}</div>
              <div>年中第几周: {{ weekOfYear }}</div>
              <div>月份天数: {{ daysInMonth }}</div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Calendar class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>请选择日期和时间</p>
        </div>
      </div>
    </div>

    <!-- 格式说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info class="w-5 h-5 text-indigo-500" />
        格式说明
      </h2>

      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3">ISO 8601</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-2">国际标准日期和时间表示法</p>
          <div class="space-y-1 font-mono text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded">
            <div>完整: 2025-12-31T12:30:45+08:00</div>
            <div>日期: 2025-12-31</div>
            <div>时间: 12:30:45+08:00</div>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-3">RFC 2822</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-2">电子邮件和HTTP使用的日期格式</p>
          <div class="space-y-1 font-mono text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded">
            <div>{{ rfc2822 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/timestamp-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Clock class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">时间戳转换</h3>
          <p class="text-sm text-gray-500">Unix时间戳互转</p>
        </NuxtLink>
        <NuxtLink to="/tools/timezone-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Globe class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">时区转换</h3>
          <p class="text-sm text-gray-500">全球时区转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/date-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">日期计算器</h3>
          <p class="text-sm text-gray-500">日期加减计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/cron-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">Cron生成器</h3>
          <p class="text-sm text-gray-500">定时任务表达式</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Calendar,
  Clock,
  Copy,
  Info,
  Globe,
  Calculator
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '日期格式化工具 - 在线ISO 8601/RFC 2822日期格式转换',
  meta: [
    {
      name: 'description',
      content: '在线日期格式化工具，支持ISO 8601、RFC 2822等标准日期格式转换。提供多种日期格式输出，包括中文日期、时间戳，适用于API开发、日志记录等场景。'
    },
    {
      name: 'keywords',
      content: '日期格式化,ISO 8601,RFC 2822,日期转换,时间格式,Unix时间戳,在线日期格式化'
    }
  ]
})

// State
const dateInput = ref(new Date().toISOString().split('T')[0])
const timeInput = ref(new Date().toTimeString().split(' ')[0].slice(0, 8))
const selectedTimezone = ref('local')

// Computed - 当前日期对象
const currentDate = computed(() => {
  if (!dateInput.value) return null

  const dateStr = dateInput.value
  const timeStr = timeInput.value || '00:00:00'

  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute, second = 0] = timeStr.split(':').map(Number)

  let date = new Date(year, month - 1, day, hour, minute, second)

  // 处理时区
  if (selectedTimezone.value !== 'local') {
    const offset = getTimezoneOffset(selectedTimezone.value, date)
    date = new Date(date.getTime() - offset)
  }

  return date
})

// ISO 8601 格式
const iso8601 = computed(() => {
  if (!currentDate.value) return ''
  return currentDate.value.toISOString()
})

const iso8601DateTime = computed(() => {
  if (!currentDate.value) return ''
  return currentDate.value.toISOString().replace('Z', '+00:00')
})

const iso8601Date = computed(() => {
  if (!currentDate.value) return ''
  return currentDate.value.toISOString().split('T')[0]
})

// RFC 2822 格式
const rfc2822 = computed(() => {
  if (!currentDate.value) return ''
  return currentDate.value.toUTCString().replace('GMT', '+0000')
})

// 常用格式
const dateFormatYMD = computed(() => {
  if (!currentDate.value) return ''
  const d = currentDate.value
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

const dateFormatDMY = computed(() => {
  if (!currentDate.value) return ''
  const d = currentDate.value
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
})

const dateFormatMDY = computed(() => {
  if (!currentDate.value) return ''
  const d = currentDate.value
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
})

// 中文格式
const chineseFull = computed(() => {
  if (!currentDate.value) return ''
  const d = currentDate.value
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours()
  const minute = d.getMinutes()
  const second = d.getSeconds()

  return `${year}年${month}月${day}日 ${pad(hour)}:${pad(minute)}:${pad(second)}`
})

const chineseShort = computed(() => {
  if (!currentDate.value) return ''
  const d = currentDate.value
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

// Unix时间戳
const unixTimestamp = computed(() => {
  if (!currentDate.value) return ''
  return Math.floor(currentDate.value.getTime() / 1000).toString()
})

const unixTimestampMs = computed(() => {
  if (!currentDate.value) return ''
  return currentDate.value.getTime().toString()
})

// 日期信息
const dayOfWeek = computed(() => {
  if (!currentDate.value) return ''
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return '星期' + days[currentDate.value.getDay()]
})

const dayOfYear = computed(() => {
  if (!currentDate.value) return ''
  const start = new Date(currentDate.value.getFullYear(), 0, 0)
  const diff = currentDate.value.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

const weekOfYear = computed(() => {
  if (!currentDate.value) return ''
  const d = currentDate.value
  const start = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.ceil((days + start.getDay() + 1) / 7)
})

const daysInMonth = computed(() => {
  if (!currentDate.value) return ''
  const d = currentDate.value
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
})

// Helper functions
function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function getTimezoneOffset(tz: string, date: Date): number {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: tz }))
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  return localDate.getTime() - utcDate.getTime()
}

// 快捷操作
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

function copyText(text: string) {
  navigator.clipboard.writeText(text)
}
</script>
