<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">工作时间计算器 - 计算工作时长和加班费</h1>
      <p class="text-muted-foreground">计算工作时长、加班时长，支持弹性工作制和排班管理。计算每日、每周、每月、每年工作时长。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          工作时间设置
        </h2>

        <!-- 上班时间 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">上班时间</label>
          <input
            v-model="workStartTime"
            type="time"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
          >
        </div>

        <!-- 下班时间 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">下班时间</label>
          <input
            v-model="workEndTime"
            type="time"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
          >
        </div>

        <!-- 休息时间 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">休息时间（分钟）</label>
          <div class="flex gap-2">
            <input
              v-model="breakMinutes"
              type="number"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
              placeholder="60"
            >
            <div class="flex gap-1">
              <button
                v-for="min in [0, 30, 60, 90, 120]"
                :key="min"
                @click="breakMinutes = min"
                :class="['px-3 py-1 text-sm rounded', breakMinutes === min ? 'bg-primary text-primary-foreground' : 'bg-muted']"
              >
                {{ min }}分
              </button>
            </div>
          </div>
        </div>

        <!-- 每周工作天数 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">每周工作天数</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="day in weekDays"
              :key="day.value"
              @click="toggleWorkDay(day.value)"
              :class="[
                'px-3 py-2 text-sm rounded min-w-[50px]',
                workDays.includes(day.value) ? 'bg-primary text-primary-foreground' : 'bg-muted'
              ]"
            >
              {{ day.label }}
            </button>
          </div>
        </div>

        <!-- 加班费率 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">加班费率（时薪倍数）</label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-xs text-muted-foreground">工作日加班:</span>
              <input
                v-model="overtimeRates.weekday"
                type="number"
                step="0.1"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted mt-1"
              >
            </div>
            <div>
              <span class="text-xs text-muted-foreground">周末加班:</span>
              <input
                v-model="overtimeRates.weekend"
                type="number"
                step="0.1"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted mt-1"
              >
            </div>
          </div>
        </div>

        <!-- 计算按钮 -->
        <button
          @click="calculate"
          class="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
        >
          计算工作时长
        </button>
      </div>

      <!-- 结果区域 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator class="w-5 h-5 text-green-600" />
          计算结果
        </h2>

        <div v-if="result" class="space-y-4">
          <!-- 日工作时长 -->
          <div class="p-4 bg-primary/10 rounded-lg">
            <div class="text-sm text-primary mb-1">每日工作时长</div>
            <div class="text-3xl font-bold text-foreground">
              {{ result.dailyWorkHours }}小时
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              (含休息{{ breakMinutes }}分钟)
            </div>
          </div>

          <!-- 周工作时长 -->
          <div class="p-4 bg-green-600/10 rounded-lg">
            <div class="text-sm text-green-600 mb-1">每周工作时长</div>
            <div class="text-2xl font-bold text-foreground">
              {{ result.weeklyWorkHours }}小时
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              {{ result.workDaysPerWeek }}天 × {{ result.dailyWorkHours }}小时
            </div>
          </div>

          <!-- 月工作时长 -->
          <div class="p-4 bg-purple-600/10 rounded-lg">
            <div class="text-sm text-purple-600 mb-1">月工作时长（估算）</div>
            <div class="text-2xl font-bold text-foreground">
              {{ result.monthlyWorkHours }}小时
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              按每月{{ result.workDaysPerWeek * 4 }}工作日计算
            </div>
          </div>

          <!-- 年工作时长 -->
          <div class="p-4 bg-orange-600/10 rounded-lg">
            <div class="text-sm text-orange-600 mb-1">年工作时长（估算）</div>
            <div class="text-2xl font-bold text-foreground">
              {{ result.yearlyWorkHours }}小时
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              按每年52周计算
            </div>
          </div>

          <!-- 工作时间占比 -->
          <div class="p-4 bg-muted rounded-lg">
            <div class="text-sm font-medium text-foreground mb-2">工作时间占比</div>
            <div class="space-y-2">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-muted-foreground">每日占醒着时间:</span>
                  <span class="font-medium text-foreground">{{ result.dailyAwakePercent }}%</span>
                </div>
                <div class="w-full bg-muted-foreground/20 rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full"
                    :style="{ width: `${Math.min(result.dailyAwakePercent, 100)}%` }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-muted-foreground">每周占一周时间:</span>
                  <span class="font-medium text-foreground">{{ result.weeklyPercent }}%</span>
                </div>
                <div class="w-full bg-muted-foreground/20 rounded-full h-2">
                  <div
                    class="bg-green-600 h-2 rounded-full"
                    :style="{ width: `${Math.min(result.weeklyPercent, 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-muted-foreground">
          <Clock class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>设置工作时间后点击计算</p>
        </div>
      </div>
    </div>

    <!-- 加班计算 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">加班计算器</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- 加班输入 -->
        <div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-foreground mb-2">本周加班时长（小时）</label>
            <input
              v-model="weeklyOvertime"
              type="number"
              step="0.5"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
              placeholder="输入加班时长"
              @input="calculateOvertime"
            >
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-foreground mb-2">时薪（元）</label>
            <input
              v-model="hourlyRate"
              type="number"
              step="0.01"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
              placeholder="输入时薪"
              @input="calculateOvertime"
            >
          </div>
        </div>

        <!-- 加班结果 -->
        <div v-if="overtimeResult" class="space-y-3">
          <div class="p-3 bg-red-600/10 rounded-lg">
            <div class="text-sm text-red-600">加班费</div>
            <div class="text-2xl font-bold text-foreground">
              ¥{{ overtimeResult.overtimePay }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-2 bg-muted rounded">
              <span class="text-muted-foreground">工作日加班:</span>
              <span class="font-medium ml-2 text-foreground">{{ overtimeResult.weekdayOvertime }}小时</span>
            </div>
            <div class="p-2 bg-muted rounded">
              <span class="text-muted-foreground">周末加班:</span>
              <span class="font-medium ml-2 text-foreground">{{ overtimeResult.weekendOvertime }}小时</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常见工作制 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">常见工作制参考</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <div
          v-for="schedule in commonSchedules"
          :key="schedule.name"
          @click="applySchedule(schedule)"
          class="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition"
        >
          <h3 class="font-medium mb-2 text-foreground">{{ schedule.name }}</h3>
          <div class="text-sm text-muted-foreground space-y-1">
            <div>时间: {{ schedule.start }} - {{ schedule.end }}</div>
            <div>休息: {{ schedule.break }}分钟</div>
            <div>天数: {{ schedule.days }}天/周</div>
            <div class="text-primary font-medium">{{ schedule.hours }}小时/周</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          工作时间计算
        </h2>
        <p class="text-muted-foreground mb-4">
          本工具可以帮助您快速计算各种工作制下的工作时长，包括每日、每周、每月和每年的工作时长统计。
          支持标准工时制、弹性工作制、996工作制等多种工作模式。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见工作制
        </h2>
        <div class="space-y-3 text-muted-foreground mb-6">
          <div><strong class="text-foreground">标准工时制:</strong> 每周40小时，通常为周一至周五 9:00-18:00</div>
          <div><strong class="text-foreground">弹性工作制:</strong> 灵活安排工作时间，通常仍需满足每周40小时</div>
          <div><strong class="text-foreground">996工作制:</strong> 早9点到晚9点，每周6天，共72小时（不推荐）</div>
          <div><strong class="text-foreground">955工作制:</strong> 早9点到晚5点，每周5天，共35小时</div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          加班费计算
        </h2>
        <p class="text-muted-foreground">
          根据中国劳动法，工作日加班支付不低于工资的150%的工资报酬，
          休息日（周末）加班支付不低于200%，法定节假日加班支付不低于300%。
          本工具可帮您快速估算加班费。
        </p>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              v-if="iconMap[relatedTool.icon]"
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <Calendar v-else class="w-5 h-5 text-primary" />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  Clock,
  Calculator,
  Calendar,
  Timer,
  HelpCircle,
  ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '工作时间计算器 - 计算工作时长和加班费',
  description: '在线工作时间计算器，计算每日、每周、每月、每年工作时长，支持加班费计算和多种工作制。',
  keywords: '工作时间计算,加班费计算,工作时长,弹性工作制,排班管理,在线工作计算器',
  author: 'Util工具箱',
  ogTitle: '工作时间计算器',
  ogDescription: '计算每日、每周、每月、每年工作时长，支持加班费计算',
  ogType: 'website'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '工作时间计算器',
            description: '在线计算工作时长和加班费',
            url: 'https://www.util.cn/tools/work-hours-calculator',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            }
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '工作时间计算器',
                item: 'https://www.util.cn/tools/work-hours-calculator'
              }
            ]
          }
        ]
      })
    }
  ]
})

// 星期
const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 }
]

// 常见工作制
const commonSchedules = [
  { name: '标准工时制', start: '09:00', end: '18:00', break: 60, days: 5, hours: 40 },
  { name: '弹性工作制', start: '10:00', end: '19:00', break: 60, days: 5, hours: 40 },
  { name: '早班制', start: '08:00', end: '17:00', break: 60, days: 5, hours: 40 },
  { name: '晚班制', start: '14:00', end: '23:00', break: 60, days: 5, hours: 40 },
  { name: '996工作制', start: '09:00', end: '21:00', break: 60, days: 6, hours: 72 },
  { name: '955工作制', start: '09:00', end: '17:00', break: 60, days: 5, hours: 35 }
]

// State
const workStartTime = ref('09:00')
const workEndTime = ref('18:00')
const breakMinutes = ref(60)
const workDays = ref([1, 2, 3, 4, 5]) // 周一到周五
const overtimeRates = ref({ weekday: 1.5, weekend: 2 })
const result = ref(null)
const weeklyOvertime = ref(0)
const hourlyRate = ref(0)
const overtimeResult = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calendar, Timer, Clock
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'date-calculator'),
  tools.find(t => t.id === 'time-unit-convert'),
  tools.find(t => t.id === 'workday-calculator'),
  tools.find(t => t.id === 'countdown-timer')
].filter(Boolean)

// 切换工作日
function toggleWorkDay(day) {
  const index = workDays.value.indexOf(day)
  if (index >= 0) {
    workDays.value.splice(index, 1)
  } else {
    workDays.value.push(day)
  }
}

// 计算工作时长
function calculate() {
  const start = parseTime(workStartTime.value)
  const end = parseTime(workEndTime.value)
  const breakHours = (breakMinutes.value || 0) / 60

  let workHours = end - start - breakHours
  if (workHours < 0) workHours += 24 // 跨天

  const workDaysPerWeek = workDays.value.length
  const dailyWorkHours = parseFloat(workHours.toFixed(2))
  const weeklyWorkHours = parseFloat((dailyWorkHours * workDaysPerWeek).toFixed(2))
  const monthlyWorkHours = parseFloat((weeklyWorkHours * 4).toFixed(2))
  const yearlyWorkHours = parseFloat((weeklyWorkHours * 52).toFixed(2))

  result.value = {
    dailyWorkHours,
    weeklyWorkHours,
    monthlyWorkHours,
    yearlyWorkHours,
    workDaysPerWeek,
    dailyAwakePercent: parseFloat(((dailyWorkHours / 16) * 100).toFixed(1)),
    weeklyPercent: parseFloat(((weeklyWorkHours / (7 * 24)) * 100).toFixed(1))
  }
}

// 解析时间
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours + minutes / 60
}

// 计算加班费
function calculateOvertime() {
  const overtime = parseFloat(weeklyOvertime.value) || 0
  const rate = parseFloat(hourlyRate.value) || 0

  // 假设工作日加班和周末加班各占一半
  const weekdayOvertime = (overtime / 2).toFixed(1)
  const weekendOvertime = (overtime / 2).toFixed(1)

  const overtimePay = (
    parseFloat(weekdayOvertime) * rate * overtimeRates.value.weekday +
    parseFloat(weekendOvertime) * rate * overtimeRates.value.weekend
  ).toFixed(2)

  overtimeResult.value = {
    weekdayOvertime,
    weekendOvertime,
    overtimePay
  }
}

// 应用工作制
function applySchedule(schedule) {
  workStartTime.value = schedule.start
  workEndTime.value = schedule.end
  breakMinutes.value = schedule.break

  // 根据工作制设置工作日
  if (schedule.days === 5) {
    workDays.value = [1, 2, 3, 4, 5]
  } else if (schedule.days === 6) {
    workDays.value = [1, 2, 3, 4, 5, 6]
  }

  calculate()
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
calculate()
</script>
