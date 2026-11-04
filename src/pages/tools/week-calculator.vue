<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">周数计算器</h1>
      <p class="text-muted-foreground">计算日期所在的周数，查询指定年份的周数信息</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：周数查询 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">日期周数查询</h2>

          <!-- 日期输入 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">选择日期</label>
              <input
                v-model="selectedDate"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="calculateWeekInfo"
              />
              <div class="mt-2 flex gap-2">
                <button
                  @click="setToday"
                  class="px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  今天
                </button>
                <button
                  @click="setThisWeek"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  本周
                </button>
                <button
                  @click="setThisMonth"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  本月
                </button>
              </div>
            </div>

            <!-- 周数结果 -->
            <div v-if="weekInfo" class="space-y-3">
              <div class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">第几周</div>
                <div class="text-3xl font-bold">第 {{ weekInfo.weekNumber }} 周</div>
                <div class="text-sm text-muted-foreground mt-1">{{ weekInfo.year }}年</div>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-muted-foreground mb-1">周开始</div>
                  <div class="font-medium">{{ weekInfo.weekStart }}</div>
                </div>
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-muted-foreground mb-1">周结束</div>
                  <div class="font-medium">{{ weekInfo.weekEnd }}</div>
                </div>
              </div>

              <div class="p-4 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-2">本周日期</div>
                <div class="space-y-1">
                  <div
                    v-for="day in weekInfo.weekDays"
                    :key="day.date"
                    class="flex justify-between items-center"
                  >
                    <span class="text-sm">{{ day.name }}</span>
                    <span class="text-sm font-mono">{{ day.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 年度周数统计 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">年度周数统计</h2>

          <!-- 年份选择 -->
          <div class="mb-4">
            <label class="text-sm font-medium">选择年份</label>
            <input
              v-model.number="selectedYear"
              type="number"
              min="1900"
              max="2100"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              @input="calculateYearWeeks"
            />
            <button
              @click="setCurrentYear"
              class="mt-2 px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              今年
            </button>
          </div>

          <!-- 年度统计 -->
          <div v-if="yearWeekInfo" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">总周数</div>
                <div class="text-2xl font-bold">{{ yearWeekInfo.totalWeeks }}</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">天数</div>
                <div class="text-2xl font-bold">{{ yearWeekInfo.totalDays }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">开始日期</div>
                <div class="font-medium">{{ yearWeekInfo.startDate }}</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">结束日期</div>
                <div class="font-medium">{{ yearWeekInfo.endDate }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：周数转换和工具 -->
      <div class="space-y-4">
        <!-- 周数转日期 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">周数转日期</h2>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">年份</label>
                <input
                  v-model.number="weekToYear"
                  type="number"
                  min="1900"
                  max="2100"
                  class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  @input="convertWeekToDate"
                />
              </div>
              <div>
                <label class="text-sm font-medium">周数</label>
                <input
                  v-model.number="weekToNumber"
                  type="number"
                  min="1"
                  max="53"
                  placeholder="1-53"
                  class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  @input="convertWeekToDate"
                />
              </div>
            </div>

            <div v-if="convertedWeek" class="p-4 bg-muted rounded-lg space-y-2">
              <div class="text-sm text-muted-foreground">该周的日期范围</div>
              <div class="font-medium">{{ convertedWeek.start }} - {{ convertedWeek.end }}</div>
              <div class="text-sm text-muted-foreground">共7天</div>
            </div>
          </div>
        </div>

        <!-- ISO 周数说明 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">ISO 周数标准</h2>
          <div class="space-y-3 text-sm">
            <div>
              <h3 class="font-medium mb-2">ISO 8601 标准</h3>
              <p class="text-muted-foreground">国际标准化组织的日期和时间表示法，包含以下规则：</p>
            </div>
            <ul class="space-y-2 text-muted-foreground ml-4">
              <li>• 每周从周一开始</li>
              <li>• 一年的第一周是包含该年第一个星期四的那一周</li>
              <li>这意味着1月4日总是在第1周</li>
              <li>一年可能有52或53周</li>
            </ul>
            <div class="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="font-medium text-sm mb-1">格式示例</div>
              <div class="font-mono text-sm">2024-W52 表示2024年第52周</div>
            </div>
          </div>
        </div>

        <!-- 快速参考 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">快速参考</h2>
          <div class="space-y-3">
            <div
              v-for="ref in quickReferences"
              :key="ref.label"
              class="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
              @click="setReferenceDate(ref.date)"
            >
              <span class="text-sm font-medium">{{ ref.label }}</span>
              <span class="text-sm text-muted-foreground">{{ ref.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于周数计算
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">计算规则</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>遵循 ISO 8601 国际标准进行周数计算</li>
              <li>周一为每周的开始，周日为每周的结束</li>
              <li>一年的第一周是包含1月4日的那一周</li>
              <li>12月29日-12月31日可能属于下一年的第一周</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">应用场景</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>制定周计划和周报</li>
              <li>计算项目周期</li>
              <li>薪资结算周期</li>
              <li>学术日历管理</li>
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
            to="/tools/date-calculator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Calculator class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">日期计算器</p>
              <p class="text-xs text-muted-foreground">日期加减计算</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/age-calculator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Cake class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">年龄计算器</p>
              <p class="text-xs text-muted-foreground">精确计算年龄</p>
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
import { Info, Calendar, Calculator, Cake, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const selectedDate = ref('')
const weekInfo = ref(null)
const selectedYear = ref(new Date().getFullYear())
const yearWeekInfo = ref(null)
const weekToYear = ref(new Date().getFullYear())
const weekToNumber = ref('')
const convertedWeek = ref(null)

// 星期名称
const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 快速参考
const quickReferences = computed(() => {
  const now = new Date()
  const year = now.getFullYear()

  return [
    {
      label: '元旦',
      date: `${year}-01-01`
    },
    {
      label: '劳动节',
      date: `${year}-05-01`
    },
    {
      label: '国庆节',
      date: `${year}-10-01`
    },
    {
      label: '圣诞节',
      date: `${year}-12-25`
    }
  ]
})

// 获取 ISO 周数
const getISOWeek = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  // Thursday in current week decides the year.
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)

  // January 4 is always in week 1.
  const week1 = new Date(d.getFullYear(), 0, 4)

  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

// 获取周的开始和结束日期
const getWeekStartEnd = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday

  const monday = new Date(d.setDate(diff))
  const sunday = new Date(d.setDate(diff + 6))

  return {
    start: monday,
    end: sunday
  }
}

// 获取一周的所有日期
const getWeekDays = (date) => {
  const { start } = getWeekStartEnd(date)
  const days = []

  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push({
      name: weekDayNames[i],
      date: day.toLocaleDateString('zh-CN'),
      value: day.toISOString().split('T')[0]
    })
  }

  return days
}

// 计算周信息
const calculateWeekInfo = () => {
  if (!selectedDate.value) {
    weekInfo.value = null
    return
  }

  const date = new Date(selectedDate.value)
  const weekNumber = getISOWeek(date)
  const year = date.getFullYear()

  // 处理跨年的情况
  const januaryFirst = new Date(year, 0, 1)
  const weekOfJanFirst = getISOWeek(januaryFirst)

  let actualYear = year
  if (weekNumber === 1 && date.getMonth() === 11) {
    actualYear = year + 1
  } else if (weekNumber >= 52 && date.getMonth() === 0) {
    actualYear = year - 1
  }

  const { start, end } = getWeekStartEnd(date)
  const weekDays = getWeekDays(date)

  weekInfo.value = {
    weekNumber,
    year: actualYear,
    weekStart: start.toLocaleDateString('zh-CN'),
    weekEnd: end.toLocaleDateString('zh-CN'),
    weekDays
  }
}

// 计算年度周数
const calculateYearWeeks = () => {
  if (!selectedYear.value) {
    yearWeekInfo.value = null
    return
  }

  const year = selectedYear.value
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)

  // 获取该年最后一周的周数
  const lastWeek = getISOWeek(end)

  // 处理12月31日可能属于下一年第一周的情况
  let totalWeeks = lastWeek
  if (lastWeek === 1) {
    const dec30 = new Date(year, 11, 30)
    totalWeeks = getISOWeek(dec30)
  }

  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

  yearWeekInfo.value = {
    totalWeeks,
    totalDays,
    startDate: start.toLocaleDateString('zh-CN'),
    endDate: end.toLocaleDateString('zh-CN')
  }
}

// 周数转日期
const convertWeekToDate = () => {
  if (!weekToYear.value || !weekToNumber.value) {
    convertedWeek.value = null
    return
  }

  const year = weekToYear.value
  const week = weekToNumber.value

  // 找到该年的第一个星期四
  const januaryFirst = new Date(year, 0, 1)
  const firstThursday = new Date(januaryFirst)
  firstThursday.setDate(januaryFirst.getDate() + (3 - (januaryFirst.getDay() + 6) % 7))

  // 计算第一周的开始日期（周一）
  const weekOneStart = new Date(firstThursday)
  weekOneStart.setDate(firstThursday.getDate() - 3)

  // 计算指定周的开始日期
  const targetWeekStart = new Date(weekOneStart)
  targetWeekStart.setDate(weekOneStart.getDate() + (week - 1) * 7)

  const targetWeekEnd = new Date(targetWeekStart)
  targetWeekEnd.setDate(targetWeekStart.getDate() + 6)

  convertedWeek.value = {
    start: targetWeekStart.toLocaleDateString('zh-CN'),
    end: targetWeekEnd.toLocaleDateString('zh-CN')
  }
}

// 设置今天
const setToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
  calculateWeekInfo()
}

// 设置本周
const setThisWeek = () => {
  const today = new Date()
  const { start } = getWeekStartEnd(today)
  selectedDate.value = start.toISOString().split('T')[0]
  calculateWeekInfo()
}

// 设置本月
const setThisMonth = () => {
  const today = new Date()
  selectedDate.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  calculateWeekInfo()
}

// 设置当前年份
const setCurrentYear = () => {
  selectedYear.value = new Date().getFullYear()
  calculateYearWeeks()
}

// 设置参考日期
const setReferenceDate = (date) => {
  selectedDate.value = date
  calculateWeekInfo()
}

// SEO配置
useSeoMeta({
  title: '周数计算器 - 在线计算日期所在周数和ISO周数',
  description: '免费在线周数计算工具，支持查询日期所在的周数、计算年度总周数、周数转日期等功能。',
  keywords: ['周数计算', 'ISO周数', '第几周', '周数转日期', '日历', '在线工具']
})



// 初始化
onMounted(() => {
  setToday()
  setCurrentYear()
})
</script>