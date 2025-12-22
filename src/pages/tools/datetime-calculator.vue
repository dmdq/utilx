<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">日期时间计算器</h1>
      <p class="text-muted-foreground mb-6">日期间隔计算、工作日计算、时区转换等时间相关计算工具</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：主要计算功能 -->
      <div class="space-y-6">
        <!-- 日期间隔计算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">日期间隔计算</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">开始日期</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">结束日期</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div class="flex gap-2">
              <button @click="setToday" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                今天
              </button>
              <button @click="calculateDateDiff" class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                计算间隔
              </button>
              <button @click="swapDates" class="px-3 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/80">
                交换日期
              </button>
            </div>

            <div v-if="dateDifference.days !== null" class="p-4 bg-secondary rounded-lg">
              <h4 class="font-medium mb-2">计算结果</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>总天数: {{ dateDifference.days }}</div>
                <div>总周数: {{ dateDifference.weeks }}</div>
                <div>总月数: {{ dateDifference.months }}</div>
                <div>总年数: {{ dateDifference.years }}</div>
                <div>工作日: {{ dateDifference.workdays }}</div>
                <div>包含周末: {{ dateDifference.weekends }}</div>
              </div>
              <div class="mt-2 text-sm">
                详细间隔: {{ formatDetailedInterval(dateDifference) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 日期加减计算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">日期加减计算</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">基准日期</label>
              <input
                v-model="baseDate"
                type="date"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">年</label>
                <input
                  v-model.number="dateOffset.years"
                  type="number"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">月</label>
                <input
                  v-model.number="dateOffset.months"
                  type="number"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">日</label>
                <input
                  v-model.number="dateOffset.days"
                  type="number"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">操作</label>
                <select v-model="dateOffset.operation" class="w-full px-3 py-2 border rounded-lg">
                  <option value="add">加</option>
                  <option value="subtract">减</option>
                </select>
              </div>
            </div>

            <button @click="calculateDateOffset" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算
            </button>

            <div v-if="offsetResult" class="p-3 bg-secondary rounded-lg">
              <div class="text-sm">结果日期: {{ offsetResult }}</div>
              <div class="text-xs text-muted-foreground">星期{{ offsetResultWeekday }}</div>
            </div>
          </div>
        </div>

        <!-- 工作日计算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">工作日计算</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">开始日期</label>
                <input
                  v-model="workdayCalc.startDate"
                  type="date"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">工作日数量</label>
                <input
                  v-model.number="workdayCalc.days"
                  type="number"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="10"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="workdayCalc.includeHolidays"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm">包含节假日</span>
              </label>

              <div v-if="workdayCalc.includeHolidays" class="space-y-2">
                <label class="block text-sm font-medium">节假日列表 (YYYY-MM-DD)</label>
                <textarea
                  v-model="workdayCalc.holidays"
                  class="w-full px-3 py-2 border rounded-lg text-sm"
                  rows="3"
                  placeholder="2024-01-01&#10;2024-02-10&#10;2024-04-05"
                ></textarea>
              </div>
            </div>

            <button @click="calculateWorkdaysFromCalc" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算工作日
            </button>

            <div v-if="workdayResult.endDate" class="p-3 bg-secondary rounded-lg">
              <div class="text-sm">结束日期: {{ workdayResult.endDate }}</div>
              <div class="text-sm">总日历天数: {{ workdayResult.totalDays }}</div>
              <div class="text-sm">跳过的周末: {{ workdayResult.skippedWeekends }}</div>
              <div class="text-sm" v-if="workdayResult.skippedHolidays > 0">跳过的节假日: {{ workdayResult.skippedHolidays }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：时区转换和其他工具 -->
      <div class="space-y-6">
        <!-- 时区转换 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">时区转换</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">时间</label>
              <input
                v-model="timezoneCalc.time"
                type="datetime-local"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">源时区</label>
                <select v-model="timezoneCalc.fromTimezone" class="w-full px-3 py-2 border rounded-lg">
                  <option value="UTC">UTC</option>
                  <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                  <option value="America/New_York">纽约 (UTC-5/-4)</option>
                  <option value="Europe/London">伦敦 (UTC+0/+1)</option>
                  <option value="Asia/Tokyo">东京 (UTC+9)</option>
                  <option value="Australia/Sydney">悉尼 (UTC+10/+11)</option>
                  <option value="America/Los_Angeles">洛杉矶 (UTC-8/-7)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">目标时区</label>
                <select v-model="timezoneCalc.toTimezone" class="w-full px-3 py-2 border rounded-lg">
                  <option value="UTC">UTC</option>
                  <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                  <option value="America/New_York">纽约 (UTC-5/-4)</option>
                  <option value="Europe/London">伦敦 (UTC+0/+1)</option>
                  <option value="Asia/Tokyo">东京 (UTC+9)</option>
                  <option value="Australia/Sydney">悉尼 (UTC+10/+11)</option>
                  <option value="America/Los_Angeles">洛杉矶 (UTC-8/-7)</option>
                </select>
              </div>
            </div>

            <button @click="convertTimezone" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              转换时区
            </button>

            <div v-if="timezoneResult.converted" class="p-3 bg-secondary rounded-lg">
              <div class="text-sm">{{ timezoneCalc.fromTimezone }}: {{ timezoneResult.original }}</div>
              <div class="text-sm font-medium">{{ timezoneCalc.toTimezone }}: {{ timezoneResult.converted }}</div>
              <div class="text-xs text-muted-foreground mt-1">时差: {{ timezoneResult.offset }}</div>
            </div>
          </div>
        </div>

        <!-- Unix时间戳转换 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">Unix时间戳转换</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Unix时间戳 (秒)</label>
              <div class="flex gap-2">
                <input
                  v-model.number="timestampCalc.timestamp"
                  type="number"
                  class="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="输入时间戳"
                />
                <button @click="getCurrentTimestamp" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  当前
                </button>
              </div>
            </div>

            <button @click="convertTimestamp" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              转换为日期
            </button>

            <div v-if="timestampResult.date" class="p-3 bg-secondary rounded-lg">
              <div class="text-sm">日期: {{ timestampResult.date }}</div>
              <div class="text-sm">时间: {{ timestampResult.time }}</div>
              <div class="text-sm">ISO: {{ timestampResult.iso }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ timestampResult.weekday }}</div>
            </div>

            <div class="border-t pt-4">
              <label class="block text-sm font-medium mb-2">日期转时间戳</label>
              <input
                v-model="timestampCalc.dateInput"
                type="datetime-local"
                class="w-full px-3 py-2 border rounded-lg mb-2"
              />
              <button @click="convertToTimestamp" class="w-full px-3 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/80">
                转换为时间戳
              </button>
              <div v-if="timestampResult.timestamp" class="mt-2 text-sm font-mono bg-muted p-2 rounded">
                {{ timestampResult.timestamp }}
              </div>
            </div>
          </div>
        </div>

        <!-- 相对时间计算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">相对时间计算</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">目标日期时间</label>
              <input
                v-model="relativeCalc.targetDate"
                type="datetime-local"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <button @click="calculateRelative" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算相对时间
            </button>

            <div v-if="relativeResult" class="p-3 bg-secondary rounded-lg">
              <div class="text-sm font-medium mb-2">{{ relativeResult.text }}</div>
              <div class="text-xs text-muted-foreground">
                <div>秒: {{ relativeResult.seconds }}</div>
                <div>分钟: {{ relativeResult.minutes }}</div>
                <div>小时: {{ relativeResult.hours }}</div>
                <div>天: {{ relativeResult.days }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量日期处理 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">批量日期处理</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">日期列表 (每行一个)</label>
              <textarea
                v-model="batchDates.dates"
                class="w-full px-3 py-2 border rounded-lg"
                rows="4"
                placeholder="2024-01-01&#10;2024-02-14&#10;2024-12-25"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button @click="processBatchDates" class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                分析日期
              </button>
              <button @click="sortBatchDates" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                排序日期
              </button>
            </div>

            <div v-if="batchResult.dates.length > 0" class="p-3 bg-secondary rounded-lg">
              <div class="text-sm font-medium mb-2">分析结果</div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>最早: {{ batchResult.earliest }}</div>
                <div>最晚: {{ batchResult.latest }}</div>
                <div>跨度: {{ batchResult.span }}天</div>
                <div>数量: {{ batchResult.dates.length }}</div>
              </div>
              <div class="mt-2 text-xs">
                <div>工作日: {{ batchResult.workdays }}</div>
                <div>周末: {{ batchResult.weekends }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('日期时间计算器')

// 日期间隔计算
const startDate = ref('')
const endDate = ref('')
const dateDifference = ref({
  days: null,
  weeks: 0,
  months: 0,
  years: 0,
  workdays: 0,
  weekends: 0
})

// 日期加减
const baseDate = ref('')
const dateOffset = ref({
  years: 0,
  months: 0,
  days: 0,
  operation: 'add'
})
const offsetResult = ref('')
const offsetResultWeekday = ref('')

// 工作日计算
const workdayCalc = ref({
  startDate: '',
  days: 10,
  includeHolidays: false,
  holidays: ''
})
const workdayResult = ref({
  endDate: '',
  totalDays: 0,
  skippedWeekends: 0,
  skippedHolidays: 0
})

// 时区转换
const timezoneCalc = ref({
  time: '',
  fromTimezone: 'UTC',
  toTimezone: 'Asia/Shanghai'
})
const timezoneResult = ref({
  converted: '',
  original: '',
  offset: ''
})

// Unix时间戳
const timestampCalc = ref({
  timestamp: 0,
  dateInput: ''
})
const timestampResult = ref({
  date: '',
  time: '',
  iso: '',
  weekday: '',
  timestamp: ''
})

// 相对时间
const relativeCalc = ref({
  targetDate: ''
})
const relativeResult = ref(null)

// 批量日期
const batchDates = ref({
  dates: ''
})
const batchResult = ref({
  dates: [],
  earliest: '',
  latest: '',
  span: 0,
  workdays: 0,
  weekends: 0
})

// 初始化
const initializeDates = () => {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const datetimeStr = today.toISOString().slice(0, 16)

  startDate.value = dateStr
  baseDate.value = dateStr
  workdayCalc.value.startDate = dateStr
  timezoneCalc.value.time = datetimeStr
  timestampCalc.value.dateInput = datetimeStr
  relativeCalc.value.targetDate = datetimeStr
}

// 日期间隔计算
const calculateDateDiff = () => {
  if (!startDate.value || !endDate.value) return

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)

  if (start > end) {
    // 交换日期
    [startDate.value, endDate.value] = [endDate.value, startDate.value]
    calculateDateDiff()
    return
  }

  const timeDiff = end - start
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

  dateDifference.value = {
    days,
    weeks: Math.floor(days / 7),
    months: Math.floor(days / 30.44),
    years: Math.floor(days / 365.25),
    workdays: calculateWorkdays(start, end),
    weekends: calculateWeekends(start, end)
  }
}

const calculateWorkdays = (start, end) => {
  let workdays = 0
  let current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workdays++
    }
    current.setDate(current.getDate() + 1)
  }

  return workdays
}

const calculateWeekends = (start, end) => {
  let weekends = 0
  let current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends++
    }
    current.setDate(current.getDate() + 1)
  }

  return weekends
}

const formatDetailedInterval = (diff) => {
  const years = diff.years
  const months = diff.months % 12
  const days = diff.days % 30

  const parts = []
  if (years > 0) parts.push(`${years}年`)
  if (months > 0) parts.push(`${months}个月`)
  if (days > 0) parts.push(`${days}天`)

  return parts.join(' ') || '0天'
}

// 日期加减
const calculateDateOffset = () => {
  if (!baseDate.value) return

  const date = new Date(baseDate.value)
  const operator = dateOffset.value.operation === 'add' ? 1 : -1

  date.setFullYear(date.getFullYear() + operator * dateOffset.value.years)
  date.setMonth(date.getMonth() + operator * dateOffset.value.months)
  date.setDate(date.getDate() + operator * dateOffset.value.days)

  offsetResult.value = date.toISOString().split('T')[0]
  offsetResultWeekday.value = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
}

// 工作日计算（从表单）
const calculateWorkdaysFromCalc = () => {
  if (!workdayCalc.value.startDate || !workdayCalc.value.days) return

  const startDate = new Date(workdayCalc.value.startDate)
  let currentDate = new Date(startDate)
  let workdaysAdded = 0
  let totalDays = 0
  let skippedWeekends = 0
  let skippedHolidays = 0

  const holidays = workdayCalc.value.includeHolidays ?
    workdayCalc.value.holidays.split('\n')
      .map(date => date.trim())
      .filter(date) : []

  while (workdaysAdded < workdayCalc.value.days) {
    totalDays++
    const dayOfWeek = currentDate.getDay()
    const dateStr = currentDate.toISOString().split('T')[0]

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = holidays.includes(dateStr)

    if (!isWeekend && !isHoliday) {
      workdaysAdded++
    } else {
      if (isWeekend) skippedWeekends++
      if (isHoliday) skippedHolidays++
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  // 回退一天，因为我们加了一天但不需要
  currentDate.setDate(currentDate.getDate() - 1)

  workdayResult.value = {
    endDate: currentDate.toISOString().split('T')[0],
    totalDays,
    skippedWeekends,
    skippedHolidays
  }
}

// 时区转换
const convertTimezone = () => {
  if (!timezoneCalc.value.time) return

  // 简化的时区转换（实际应用中应使用 Intl.DateTimeFormat 或专门的时区库）
  const date = new Date(timezoneCalc.value.time)

  // 时区偏移量映射（简化版本）
  const timezoneOffsets = {
    'UTC': 0,
    'Asia/Shanghai': 8,
    'America/New_York': -5, // 简化，不考虑夏令时
    'Europe/London': 0,
    'Asia/Tokyo': 9,
    'Australia/Sydney': 10,
    'America/Los_Angeles': -8
  }

  const fromOffset = timezoneOffsets[timezoneCalc.value.fromTimezone] || 0
  const toOffset = timezoneOffsets[timezoneCalc.value.toTimezone] || 0
  const offsetDiff = toOffset - fromOffset

  const convertedDate = new Date(date.getTime() + offsetDiff * 60 * 60 * 1000)

  timezoneResult.value = {
    original: formatDateTime(date),
    converted: formatDateTime(convertedDate),
    offset: offsetDiff > 0 ? `+${offsetDiff}小时` : `${offsetDiff}小时`
  }
}

const formatDateTime = (date) => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Unix时间戳转换
const getCurrentTimestamp = () => {
  timestampCalc.value.timestamp = Math.floor(Date.now() / 1000)
}

const convertTimestamp = () => {
  const timestamp = timestampCalc.value.timestamp
  const date = new Date(timestamp * 1000)

  timestampResult.value = {
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN'),
    iso: date.toISOString(),
    weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  }
}

const convertToTimestamp = () => {
  if (!timestampCalc.value.dateInput) return

  const date = new Date(timestampCalc.value.dateInput)
  timestampResult.value.timestamp = Math.floor(date.getTime() / 1000)
}

// 相对时间计算
const calculateRelative = () => {
  if (!relativeCalc.value.targetDate) return

  const target = new Date(relativeCalc.value.targetDate)
  const now = new Date()
  const diff = target - now

  const isFuture = diff > 0
  const absDiff = Math.abs(diff)

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let text = ''
  if (days > 0) {
    text = `${isFuture ? '还有' : '已经过去'}${days}天`
  } else if (hours > 0) {
    text = `${isFuture ? '还有' : '已经过去'}${hours}小时`
  } else if (minutes > 0) {
    text = `${isFuture ? '还有' : '已经过去'}${minutes}分钟`
  } else {
    text = isFuture ? '即将到来' : '刚刚过去'
  }

  relativeResult.value = {
    text,
    seconds,
    minutes,
    hours,
    days
  }
}

// 批量日期处理
const processBatchDates = () => {
  const dateStrings = batchDates.value.dates
    .split('\n')
    .map(date => date.trim())
    .filter(date => date)
    .map(date => new Date(date))
    .filter(date => !isNaN(date.getTime()))

  const sortedDates = dateStrings.sort((a, b) => a - b)
  const earliest = sortedDates[0]
  const latest = sortedDates[sortedDates.length - 1]
  const span = Math.floor((latest - earliest) / (1000 * 60 * 60 * 24))

  let workdays = 0
  let weekends = 0

  dateStrings.forEach(date => {
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends++
    } else {
      workdays++
    }
  })

  batchResult.value = {
    dates: sortedDates,
    earliest: earliest.toLocaleDateString('zh-CN'),
    latest: latest.toLocaleDateString('zh-CN'),
    span,
    workdays,
    weekends
  }
}

const sortBatchDates = () => {
  processBatchDates()
}

// 工具函数
const setToday = () => {
  const today = new Date().toISOString().split('T')[0]
  startDate.value = today
  endDate.value = today
}

const swapDates = () => {
  [startDate.value, endDate.value] = [endDate.value, startDate.value]
}

// 初始化
initializeDates()
</script>

<style scoped>
input[type="date"],
input[type="datetime-local"],
input[type="number"],
select {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="date"]:focus,
input[type="datetime-local"]:focus,
input[type="number"]:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea {
  transition: border-color 0.2s, box-shadow 0.2s;
}

textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>