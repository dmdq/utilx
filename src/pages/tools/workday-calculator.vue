<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">工作日计算器</h1>
      <p class="text-muted-foreground">计算两个日期之间的工作日天数，支持自定义节假日</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：日期选择 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">日期范围</h2>

          <!-- 开始日期 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">开始日期</label>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @change="calculateWorkdays"
              />
              <div class="mt-2 flex gap-2">
                <button
                  @click="setToday('start')"
                  class="px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  今天
                </button>
                <button
                  @click="setThisWeek('start')"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  本周一
                </button>
                <button
                  @click="setThisMonth('start')"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  本月1号
                </button>
              </div>
            </div>

            <!-- 结束日期 -->
            <div>
              <label class="text-sm font-medium">结束日期</label>
              <input
                v-model="endDate"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @change="calculateWorkdays"
              />
              <div class="mt-2 flex gap-2">
                <button
                  @click="setToday('end')"
                  class="px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  今天
                </button>
                <button
                  @click="setThisWeek('end')"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  本周日
                </button>
                <button
                  @click="setThisMonth('end')"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  本月底
                </button>
              </div>
            </div>

            <!-- 快捷选择 -->
            <div>
              <label class="text-sm font-medium">快捷选择</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="preset in datePresets"
                  :key="preset.name"
                  @click="applyPreset(preset)"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义设置 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">自定义设置</h2>

          <div class="space-y-4">
            <!-- 工作日设置 -->
            <div>
              <label class="text-sm font-medium mb-2 block">工作日</label>
              <div class="grid grid-cols-7 gap-2">
                <label
                  v-for="(day, index) in weekDays"
                  :key="index"
                  class="flex flex-col items-center"
                >
                  <input
                    v-model="workdays[index]"
                    type="checkbox"
                    :disabled="index === 0 || index === 6"
                    class="mb-1"
                    @change="calculateWorkdays"
                  />
                  <span class="text-xs">{{ day }}</span>
                </label>
              </div>
            </div>

            <!-- 添加节假日 -->
            <div>
              <label class="text-sm font-medium">自定义节假日</label>
              <div class="mt-2 space-y-2">
                <div v-for="(holiday, index) in customHolidays" :key="index" class="flex gap-2">
                  <input
                    v-model="holiday.date"
                    type="date"
                    class="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    @change="calculateWorkdays"
                  />
                  <input
                    v-model="holiday.name"
                    type="text"
                    placeholder="节日名称"
                    class="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    @click="removeHoliday(index)"
                    class="px-3 py-2 text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                @click="addHoliday"
                class="mt-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm w-full"
              >
                添加节假日
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="space-y-4">
        <!-- 统计结果 -->
        <div v-if="result" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">计算结果</h2>

          <div class="space-y-4">
            <!-- 主要结果 -->
            <div class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="text-sm text-muted-foreground mb-2">工作日天数</div>
              <div class="text-3xl font-bold">{{ result.workdays }}天</div>
              <div class="text-sm text-muted-foreground mt-1">
                (总共{{ result.totalDays }}天，其中周末{{ result.weekends }}天)
              </div>
            </div>

            <!-- 详细分解 -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">总天数</div>
                <div class="text-xl font-bold">{{ result.totalDays }}天</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">工作日</div>
                <div class="text-xl font-bold text-primary">{{ result.workdays }}天</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">周末</div>
                <div class="text-xl font-bold text-muted-foreground">{{ result.weekends }}天</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">节假日</div>
                <div class="text-xl font-bold text-destructive">{{ result.holidays }}天</div>
              </div>
            </div>

            <!-- 每周统计 -->
            <div>
              <h3 class="text-sm font-medium mb-3">每周统计</h3>
              <div class="space-y-2">
                <div
                  v-for="(week, index) in result.weeklyStats"
                  :key="index"
                  class="flex justify-between items-center p-2 hover:bg-muted/50 rounded transition-colors"
                >
                  <span class="text-sm">第{{ week.number }}周</span>
                  <div class="flex items-center gap-4">
                    <span class="text-sm text-muted-foreground">{{ week.dateRange }}</span>
                    <span class="text-sm font-mono">{{ week.workdays }}个工作日</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 节假日列表 -->
        <div v-if="holidayList.length > 0" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">节假日列表</h2>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="holiday in holidayList"
              :key="holiday.date"
              class="flex justify-between items-center p-2 hover:bg-muted/50 rounded transition-colors"
            >
              <div>
                <div class="font-medium">{{ holiday.name }}</div>
                <div class="text-sm text-muted-foreground">{{ holiday.date }}</div>
              </div>
              <span class="text-sm px-2 py-1 bg-destructive/10 text-destructive rounded">
                节假日
              </span>
            </div>
          </div>
        </div>

        <!-- 导出功能 -->
        <div v-if="result" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">导出数据</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="exportCSV"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download class="w-4 h-4" />
              导出 CSV
            </button>
            <button
              @click="exportJSON"
              class="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 class="w-4 h-4" />
              导出 JSON
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于工作日计算
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">计算规则</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>默认工作日为周一至周五，周末为周六和周日</li>
              <li>可以自定义哪些日期为工作日</li>
              <li>支持添加自定义节假日，这些日期将从工作日中排除</li>
              <li>计算包含开始日期和结束日期</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">常见应用</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>项目工期计算，排除周末和节假日</li>
              <li>计算请假天数和工作日</li>
              <li>确定交货日期和工作进度</li>
              <li>薪资结算周期计算</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/date-diff"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Calendar class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">日期差计算</p>
              <p class="text-xs text-muted-foreground">计算两个日期的时间差</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/countdown-timer"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Timer class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">倒计时器</p>
              <p class="text-xs text-muted-foreground">设置倒计时</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/cron-parser"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Clock class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Cron 解析器</p>
              <p class="text-xs text-muted-foreground">解析定时任务表达式</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Info, Calendar, Timer, Clock, X, Download, Share2, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const startDate = ref('')
const endDate = ref('')
const workdays = ref([true, true, true, true, true, false, false]) // 周一到周日
const customHolidays = ref([])
const result = ref(null)
const holidayList = ref([])

// 星期名称
const weekDays = ['一', '二', '三', '四', '五', '六', '日']

// 快捷预设
const datePresets = [
  { name: '本周', days: 7 },
  { name: '本月', days: 30 },
  { name: '本季度', days: 90 },
  { name: '本年', days: 365 },
  { name: '下月', days: 60, offset: 30 },
  { name: '下季度', days: 180, offset: 90 }
]

// 中国法定节假日（简化版）
const chinaHolidays = [
  { date: '2024-01-01', name: '元旦' },
  { date: '2024-02-10', name: '春节' },
  { date: '2024-02-11', name: '春节' },
  { date: '2024-02-12', name: '春节' },
  { date: '2024-04-04', name: '清明节' },
  { date: '2024-05-01', name: '劳动节' },
  { date: '2024-06-10', name: '端午节' },
  { date: '2024-09-17', name: '中秋节' },
  { date: '2024-10-01', name: '国庆节' },
  { date: '2024-10-02', name: '国庆节' },
  { date: '2024-10-03', name: '国庆节' }
]

// 判断是否为工作日
const isWorkday = (date) => {
  const dayOfWeek = date.getDay()
  // 周日为0，周一为1
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  // 检查是否为自定义工作日
  if (!workdays.value[dayIndex]) return false

  // 检查是否为节假日
  const dateStr = date.toISOString().split('T')[0]
  const isHoliday = chinaHolidays.some(h => h.date === dateStr) ||
                   customHolidays.value.some(h => h.date === dateStr)

  return !isHoliday
}

// 计算工作日
const calculateWorkdays = () => {
  if (!startDate.value || !endDate.value) {
    result.value = null
    return
  }

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)

  if (start > end) {
    result.value = null
    return
  }

  let totalDays = 0
  let workdayCount = 0
  let weekendCount = 0
  let holidayCount = 0
  const weeklyStats = []
  let currentWeek = { number: 1, workdays: 0, dateRange: '', dates: [] }

  const current = new Date(start)
  let weekNumber = 1

  while (current <= end) {
    totalDays++
    const dayOfWeek = current.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = chinaHolidays.some(h => h.date === current.toISOString().split('T')[0]) ||
                      customHolidays.value.some(h => h.date === current.toISOString().split('T')[0])

    if (isWeekend) {
      weekendCount++
    } else if (isHoliday) {
      holidayCount++
    } else if (isWorkday(current)) {
      workdayCount++
      currentWeek.workdays++
    }

    currentWeek.dates.push(new Date(current))

    // 检查是否为周末，结束当前周统计
    if (dayOfWeek === 0 || current.getTime() === end.getTime()) {
      const firstDate = currentWeek.dates[0]
      const lastDate = currentWeek.dates[currentWeek.dates.length - 1]
      currentWeek.dateRange = `${firstDate.toLocaleDateString('zh-CN')} - ${lastDate.toLocaleDateString('zh-CN')}`
      weeklyStats.push({ ...currentWeek })
      currentWeek = { number: ++weekNumber, workdays: 0, dateRange: '', dates: [] }
    }

    current.setDate(current.getDate() + 1)
  }

  result.value = {
    totalDays,
    workdays: workdayCount,
    weekends: weekendCount,
    holidays: holidayCount,
    weeklyStats
  }

  // 获取期间的所有节假日
  updateHolidayList(start, end)
}

// 更新节假日列表
const updateHolidayList = (start, end) => {
  holidayList.value = []

  // 添加中国法定节假日
  chinaHolidays.forEach(holiday => {
    const holidayDate = new Date(holiday.date)
    if (holidayDate >= start && holidayDate <= end) {
      holidayList.value.push(holiday)
    }
  })

  // 添加自定义节假日
  customHolidays.value.forEach(holiday => {
    if (holiday.date) {
      const holidayDate = new Date(holiday.date)
      if (holidayDate >= start && holidayDate <= end) {
        holidayList.value.push({
          date: holiday.date,
          name: holiday.name || '自定义节假日'
        })
      }
    }
  })

  holidayList.value.sort((a, b) => a.date.localeCompare(b.date))
}

// 设置日期
const setToday = (type) => {
  const today = new Date().toISOString().split('T')[0]
  if (type === 'start') {
    startDate.value = today
  } else {
    endDate.value = today
  }
  calculateWorkdays()
}

const setThisWeek = (type) => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  const sunday = new Date(now.setDate(diff + 6))

  if (type === 'start') {
    startDate.value = monday.toISOString().split('T')[0]
  } else {
    endDate.value = sunday.toISOString().split('T')[0]
  }
  calculateWorkdays()
}

const setThisMonth = (type) => {
  const now = new Date()
  if (type === 'start') {
    startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  } else {
    endDate.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  }
  calculateWorkdays()
}

// 应用预设
const applyPreset = (preset) => {
  const start = new Date()
  const end = new Date()

  if (preset.offset) {
    start.setDate(start.getDate() + preset.offset)
    end.setDate(end.getDate() + preset.offset)
  }

  end.setDate(end.getDate() + preset.days)

  startDate.value = start.toISOString().split('T')[0]
  endDate.value = end.toISOString().split('T')[0]
  calculateWorkdays()
}

// 添加节假日
const addHoliday = () => {
  customHolidays.value.push({ date: '', name: '' })
}

// 删除节假日
const removeHoliday = (index) => {
  customHolidays.value.splice(index, 1)
  calculateWorkdays()
}

// 导出CSV
const exportCSV = () => {
  if (!result.value) return

  let csv = '日期,是否工作日,类型\n'
  const current = new Date(startDate.value)
  const end = new Date(endDate.value)

  while (current <= end) {
    const dateStr = current.toLocaleDateString('zh-CN')
    const isWorkdayValue = isWorkday(current)
    let type = '工作日'

    const dayOfWeek = current.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      type = '周末'
    } else {
      const dateISO = current.toISOString().split('T')[0]
      if (chinaHolidays.some(h => h.date === dateISO) || customHolidays.value.some(h => h.date === dateISO)) {
        type = '节假日'
      }
    }

    csv += `${dateStr},${isWorkdayValue ? '是' : '否'},${type}\n`
    current.setDate(current.getDate() + 1)
  }

  downloadFile(csv, 'workdays.csv', 'text/csv')
}

// 导出JSON
const exportJSON = () => {
  if (!result.value) return

  const data = {
    startDate: startDate.value,
    endDate: endDate.value,
    workdays: workdays.value,
    customHolidays: customHolidays.value,
    result: result.value,
    exportTime: new Date().toISOString()
  }

  downloadFile(JSON.stringify(data, null, 2), 'workdays.json', 'application/json')
}

// 下载文件
const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: '工作日计算器 - 在线计算工作日天数',
  description: '免费在线工作日计算工具，支持自定义节假日、计算工作日天数、排除周末等功能。',
  keywords: ['工作日计算', '工作日天数', '日期计算', '节假日', '在线工具']
})



// 初始化
onMounted(() => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  startDate.value = startOfMonth.toISOString().split('T')[0]
  endDate.value = endOfMonth.toISOString().split('T')[0]

  calculateWorkdays()
})
</script>