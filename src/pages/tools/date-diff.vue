<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">日期差计算器</h1>
      <p class="text-muted-foreground">精确计算两个日期之间的时间差，支持多种单位显示</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：日期选择 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">选择日期</h2>

          <!-- 第一个日期 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">第一个日期</label>
              <input
                v-model="date1"
                type="datetime-local"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="calculateDifference"
              />
              <div class="mt-2 flex gap-2">
                <button
                  @click="setDate1Today"
                  class="px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  今天
                </button>
                <button
                  @click="setDate1Yesterday"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  昨天
                </button>
                <button
                  @click="setDate1Tomorrow"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  明天
                </button>
              </div>
            </div>

            <!-- 第二个日期 -->
            <div>
              <label class="text-sm font-medium">第二个日期</label>
              <input
                v-model="date2"
                type="datetime-local"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="calculateDifference"
              />
              <div class="mt-2 flex gap-2">
                <button
                  @click="setDate2Today"
                  class="px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  今天
                </button>
                <button
                  @click="setDate2Yesterday"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  昨天
                </button>
                <button
                  @click="setDate2Tomorrow"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  明天
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

        <!-- 计算结果 -->
        <div v-if="difference" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">计算结果</h2>
          <div class="space-y-4">
            <!-- 主要结果 -->
            <div class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="text-sm text-muted-foreground mb-2">时间差</div>
              <div class="text-2xl font-bold">{{ difference.days }}天</div>
              <div class="text-sm text-muted-foreground mt-1">
                或 {{ difference.hours }}小时 或 {{ difference.minutes }}分钟
              </div>
            </div>

            <!-- 详细分解 -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">年</div>
                <div class="font-mono">{{ difference.years }}年</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">月</div>
                <div class="font-mono">{{ difference.months }}月</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">周</div>
                <div class="font-mono">{{ difference.weeks }}周</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">秒</div>
                <div class="font-mono">{{ difference.seconds.toLocaleString() }}秒</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：辅助信息 -->
      <div class="space-y-4">
        <!-- 时间线视图 -->
        <div v-if="timeline" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">时间线视图</h2>
          <div class="space-y-4">
            <div class="relative">
              <div class="absolute left-4 top-6 bottom-6 w-0.5 bg-border"></div>

              <!-- 起始点 -->
              <div class="relative flex items-center gap-3">
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span class="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <div class="font-medium">{{ timeline.date1 }}</div>
                  <div class="text-sm text-muted-foreground">{{ timeline.time1 }}</div>
                </div>
              </div>

              <!-- 时间间隔 -->
              <div class="ml-11 mt-2 p-3 bg-muted rounded-lg">
                <div class="text-sm font-medium">{{ timeline.interval }}</div>
              </div>

              <!-- 结束点 -->
              <div class="relative flex items-center gap-3 mt-4">
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span class="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <div class="font-medium">{{ timeline.date2 }}</div>
                  <div class="text-sm text-muted-foreground">{{ timeline.time2 }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 工作日计算 -->
        <div v-if="workdayResult" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">工作日统计</h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">总天数</span>
              <span class="font-mono">{{ workdayResult.totalDays }}天</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">工作日</span>
              <span class="font-mono text-primary">{{ workdayResult.workdays }}天</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">周末</span>
              <span class="font-mono text-muted-foreground">{{ workdayResult.weekends }}天</span>
            </div>
            <div v-if="workdayResult.holidays > 0" class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">节假日</span>
              <span class="font-mono text-destructive">{{ workdayResult.holidays }}天</span>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="history.length > 0" class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">历史记录</h2>
            <button
              @click="clearHistory"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="(item, index) in history"
              :key="index"
              @click="applyHistory(item)"
              class="p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
            >
              <div class="flex justify-between items-center">
                <div class="text-sm">
                  <span class="font-medium">{{ item.date1 }}</span>
                  <span class="text-muted-foreground mx-2">至</span>
                  <span class="font-medium">{{ item.date2 }}</span>
                </div>
                <span class="text-sm text-muted-foreground">{{ item.days }}天</span>
              </div>
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
          关于日期差计算
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">计算规则</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>计算结果包括所有时间单位，可根据需要选择显示</li>
              <li>闰年和平年的2月份天数差异已自动处理</li>
              <li>跨年计算会正确处理年份变化</li>
              <li>工作日计算排除周六周日（暂不包含法定节假日）</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">常见应用</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>计算项目持续时间</li>
              <li>统计假期天数</li>
              <li>计算服务年限</li>
              <li>倒计时计算</li>
              <li>合同期限计算</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/date-calculator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Calendar class="w-5 h-5 text-primary" />
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
          <NuxtLink
            to="/tools/week-calculator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <CalendarDays class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">周数计算器</p>
              <p class="text-xs text-muted-foreground">计算周数</p>
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
import { Info, Calendar, Cake, CalendarDays, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const date1 = ref('')
const date2 = ref('')
const difference = ref(null)
const timeline = ref(null)
const workdayResult = ref(null)
const history = ref([])

// 快捷预设
const datePresets = [
  { name: '今日对比', days: 0 },
  { name: '本周对比', days: 7 },
  { name: '本月对比', days: 30 },
  { name: '上月对比', days: -30 },
  { name: '本年对比', days: 365 },
  { name: '去年对比', days: -365 }
]

// 计算日期差
const calculateDifference = () => {
  if (!date1.value || !date2.value) {
    difference.value = null
    timeline.value = null
    workdayResult.value = null
    return
  }

  const d1 = new Date(date1.value)
  const d2 = new Date(date2.value)
  const diffTime = Math.abs(d2 - d1)

  // 计算各种单位
  const diffSeconds = Math.floor(diffTime / 1000)
  const diffMinutes = Math.floor(diffTime / (1000 * 60))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)

  // 计算精确的年月日差
  let years = d2.getFullYear() - d1.getFullYear()
  let months = d2.getMonth() - d1.getMonth()
  let days = d2.getDate() - d1.getDate()

  if (days < 0) {
    months--
    const lastMonth = new Date(d2.getFullYear(), d2.getMonth(), 0)
    days += lastMonth.getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  difference.value = {
    seconds: diffSeconds,
    minutes: diffMinutes,
    hours: diffHours,
    days: diffDays,
    weeks: diffWeeks,
    months: years * 12 + months,
    years,
    direction: d2 >= d1 ? '后' : '前'
  }

  // 创建时间线
  timeline.value = {
    date1: d1.toLocaleDateString('zh-CN'),
    time1: d1.toLocaleTimeString('zh-CN'),
    date2: d2.toLocaleDateString('zh-CN'),
    time2: d2.toLocaleTimeString('zh-CN'),
    interval: d2 >= d1 ? `${diffDays}天后` : `${diffDays}天前`
  }

  // 计算工作日
  calculateWorkdays(d1, d2)

  // 保存到历史记录
  saveToHistory()
}

// 计算工作日
const calculateWorkdays = (startDate, endDate) => {
  let start = new Date(startDate)
  let end = new Date(endDate)
  const isReverse = start > end

  if (isReverse) {
    [start, end] = [end, start]
  }

  let workdays = 0
  let weekends = 0
  let current = new Date(start)

  while (current <= end) {
    const day = current.getDay()
    if (day === 0 || day === 6) {
      weekends++
    } else {
      workdays++
    }
    current.setDate(current.getDate() + 1)
  }

  workdayResult.value = {
    totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
    workdays,
    weekends,
    holidays: 0 // 简化版，暂不计算节假日
  }
}

// 设置日期1
const setDate1Today = () => {
  date1.value = new Date().toISOString().slice(0, 16)
  calculateDifference()
}

const setDate1Yesterday = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  date1.value = yesterday.toISOString().slice(0, 16)
  calculateDifference()
}

const setDate1Tomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  date1.value = tomorrow.toISOString().slice(0, 16)
  calculateDifference()
}

// 设置日期2
const setDate2Today = () => {
  date2.value = new Date().toISOString().slice(0, 16)
  calculateDifference()
}

const setDate2Yesterday = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  date2.value = yesterday.toISOString().slice(0, 16)
  calculateDifference()
}

const setDate2Tomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  date2.value = tomorrow.toISOString().slice(0, 16)
  calculateDifference()
}

// 应用预设
const applyPreset = (preset) => {
  const today = new Date()
  const target = new Date()
  target.setDate(target.getDate() + preset.days)

  date1.value = today.toISOString().slice(0, 16)
  date2.value = target.toISOString().slice(0, 16)
  calculateDifference()
}

// 保存到历史记录
const saveToHistory = () => {
  if (!difference.value) return

  const item = {
    date1: new Date(date1.value).toLocaleDateString('zh-CN'),
    date2: new Date(date2.value).toLocaleDateString('zh-CN'),
    days: difference.value.days,
    date1Value: date1.value,
    date2Value: date2.value
  }

  // 避免重复
  const exists = history.value.some(h => h.date1 === item.date1 && h.date2 === item.date2)
  if (!exists) {
    history.value.unshift(item)
    if (history.value.length > 10) {
      history.value = history.value.slice(0, 10)
    }
  }
}

// 应用历史记录
const applyHistory = (item) => {
  date1.value = item.date1Value
  date2.value = item.date2Value
  calculateDifference()
}

// 清空历史记录
const clearHistory = () => {
  history.value = []
}

// SEO配置
useSeoMeta({
  title: '日期差计算器 - 在线计算两个日期的时间差',
  description: '精确计算两个日期之间的时间差，支持年、月、日、小时、分钟、秒等多种单位显示，包含工作日计算功能。',
  keywords: ['日期差', '时间差', '日期计算', '工作日计算', '日期间隔', '在线工具']
})



// 初始化
onMounted(() => {
  // 设置默认值
  const now = new Date()
  date1.value = now.toISOString().slice(0, 16)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  date2.value = tomorrow.toISOString().slice(0, 16)

  calculateDifference()
})
</script>