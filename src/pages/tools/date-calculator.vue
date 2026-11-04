<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">日期计算器</h1>
      <p class="text-muted-foreground">计算日期加减，获取未来或过去的日期</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：计算器 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">日期计算</h2>

          <!-- 起始日期 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">起始日期</label>
              <input
                v-model="baseDate"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @change="calculateDate"
              />
              <button
                @click="setToday"
                class="mt-2 px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                使用今天
              </button>
            </div>

            <!-- 计算方式选择 -->
            <div>
              <label class="text-sm font-medium">计算方式</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  @click="calculateMode = 'add'"
                  :class="[
                    'px-4 py-2 rounded-md transition-colors',
                    calculateMode === 'add'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  加算
                </button>
                <button
                  @click="calculateMode = 'subtract'"
                  :class="[
                    'px-4 py-2 rounded-md transition-colors',
                    calculateMode === 'subtract'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  减算
                </button>
              </div>
            </div>

            <!-- 时间单位输入 -->
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium">年</label>
                  <input
                    v-model.number="timeUnits.years"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    @input="calculateDate"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">月</label>
                  <input
                    v-model.number="timeUnits.months"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    @input="calculateDate"
                  />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="text-sm font-medium">周</label>
                  <input
                    v-model.number="timeUnits.weeks"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    @input="calculateDate"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">天</label>
                  <input
                    v-model.number="timeUnits.days"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    @input="calculateDate"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">小时</label>
                  <input
                    v-model.number="timeUnits.hours"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    @input="calculateDate"
                  />
                </div>
              </div>
            </div>

            <!-- 快捷选择 -->
            <div>
              <label class="text-sm font-medium">快捷选择</label>
              <div class="mt-2 grid grid-cols-3 gap-2">
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

        <!-- 结果显示 -->
        <div v-if="resultDate" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">计算结果</h2>
          <div class="space-y-3">
            <div class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">计算后日期</div>
              <div class="text-2xl font-bold">{{ resultDate }}</div>
              <div class="text-sm text-muted-foreground mt-1">{{ resultTime }}</div>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">星期</div>
              <div class="font-medium">{{ resultWeekday }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：辅助功能 -->
      <div class="space-y-4">
        <!-- 日期范围计算 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">日期范围计算</h2>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">开始日期</label>
              <input
                v-model="rangeStart"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @change="calculateRange"
              />
            </div>
            <div>
              <label class="text-sm font-medium">结束日期</label>
              <input
                v-model="rangeEnd"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @change="calculateRange"
              />
            </div>
            <div v-if="rangeResult" class="p-4 bg-muted rounded-lg space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">总天数</span>
                <span class="font-mono">{{ rangeResult.totalDays }}天</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">工作日</span>
                <span class="font-mono">{{ rangeResult.workdays }}天</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">周末</span>
                <span class="font-mono">{{ rangeResult.weekends }}天</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 日期差异计算 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">日期差异</h2>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">目标日期</label>
              <input
                v-model="targetDate"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @change="calculateDifference"
              />
              <button
                @click="setTargetToday"
                class="mt-2 px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                使用今天
              </button>
            </div>
            <div v-if="differenceResult" class="p-4 bg-muted rounded-lg space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">相差天数</span>
                <span class="font-mono">{{ differenceResult.days }}天</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">相差周数</span>
                <span class="font-mono">{{ differenceResult.weeks }}周</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">相差月数</span>
                <span class="font-mono">{{ differenceResult.months }}月</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">相差年数</span>
                <span class="font-mono">{{ differenceResult.years }}年</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 节假日查询 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">节假日查询</h2>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium">查询日期</label>
              <input
                v-model="holidayDate"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @change="checkHoliday"
              />
            </div>
            <div v-if="holidayInfo" class="p-4 bg-muted rounded-lg">
              <div v-if="holidayInfo.isHoliday" class="space-y-2">
                <div class="font-medium text-primary">{{ holidayInfo.name }}</div>
                <div class="text-sm text-muted-foreground">{{ holidayInfo.type }}</div>
                <div v-if="holidayInfo.adjust" class="text-sm text-muted-foreground">{{ holidayInfo.adjust }}</div>
              </div>
              <div v-else class="text-sm text-muted-foreground">
                普通工作日
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
          关于日期计算
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">计算规则</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>月份加减会自动处理跨年情况</li>
              <li>闰年计算会自动考虑2月份天数</li>
              <li>计算结果会包含完整的时间信息</li>
              <li>支持工作日和周末的区分计算</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">常见用途</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>计算合同到期日期</li>
              <li>计划项目里程碑</li>
              <li>计算还款日期</li>
              <li>确定预约时间</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/timestamp-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Clock class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">时间戳转换器</p>
              <p class="text-xs text-muted-foreground">Unix时间戳与日期转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/timezone-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Globe class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">时区转换</p>
              <p class="text-xs text-muted-foreground">全球时区时间转换</p>
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
              <p class="text-xs text-muted-foreground">精确计算年龄和天数</p>
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
import { Info, Clock, Globe, Cake, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const calculateMode = ref('add')
const baseDate = ref(new Date().toISOString().split('T')[0])
const resultDate = ref('')
const resultTime = ref('')
const resultWeekday = ref('')
const timeUnits = ref({
  years: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0
})

// 日期范围
const rangeStart = ref('')
const rangeEnd = ref('')
const rangeResult = ref(null)

// 日期差异
const targetDate = ref('')
const differenceResult = ref(null)

// 节假日
const holidayDate = ref('')
const holidayInfo = ref(null)

// 快捷预设
const datePresets = [
  { name: '7天后', years: 0, months: 0, weeks: 1, days: 0, hours: 0 },
  { name: '30天后', years: 0, months: 0, weeks: 4, days: 2, hours: 0 },
  { name: '90天后', years: 0, months: 3, weeks: 0, days: 0, hours: 0 },
  { name: '180天后', years: 0, months: 6, weeks: 0, days: 0, hours: 0 },
  { name: '1年后', years: 1, months: 0, weeks: 0, days: 0, hours: 0 },
  { name: '100天后', years: 0, months: 0, weeks: 14, days: 2, hours: 0 }
]

// 计算日期
const calculateDate = () => {
  if (!baseDate.value) return

  const date = new Date(baseDate.value)

  // 应用时间单位
  if (calculateMode.value === 'add') {
    date.setFullYear(date.getFullYear() + timeUnits.value.years)
    date.setMonth(date.getMonth() + timeUnits.value.months)
    date.setDate(date.getDate() + (timeUnits.value.weeks * 7) + timeUnits.value.days)
    date.setHours(date.getHours() + timeUnits.value.hours)
  } else {
    date.setFullYear(date.getFullYear() - timeUnits.value.years)
    date.setMonth(date.getMonth() - timeUnits.value.months)
    date.setDate(date.getDate() - (timeUnits.value.weeks * 7) - timeUnits.value.days)
    date.setHours(date.getHours() - timeUnits.value.hours)
  }

  // 更新结果
  resultDate.value = date.toLocaleDateString('zh-CN')
  resultTime.value = date.toLocaleTimeString('zh-CN')
  resultWeekday.value = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
}

// 设置今天
const setToday = () => {
  baseDate.value = new Date().toISOString().split('T')[0]
  calculateDate()
}

// 应用预设
const applyPreset = (preset) => {
  timeUnits.value = { ...preset }
  calculateDate()
}

// 计算日期范围
const calculateRange = () => {
  if (!rangeStart.value || !rangeEnd.value) {
    rangeResult.value = null
    return
  }

  const start = new Date(rangeStart.value)
  const end = new Date(rangeEnd.value)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // 计算工作日和周末
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

  rangeResult.value = {
    totalDays: diffDays,
    workdays,
    weekends
  }
}

// 计算日期差异
const calculateDifference = () => {
  if (!baseDate.value || !targetDate.value) {
    differenceResult.value = null
    return
  }

  const date1 = new Date(baseDate.value)
  const date2 = new Date(targetDate.value)
  const diffTime = Math.abs(date2 - date1)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // 计算更精确的差异
  let years = date2.getFullYear() - date1.getFullYear()
  let months = date2.getMonth() - date1.getMonth()
  let days = date2.getDate() - date1.getDate()

  if (days < 0) {
    months--
    const lastMonth = new Date(date2.getFullYear(), date2.getMonth(), 0)
    days += lastMonth.getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  differenceResult.value = {
    days: diffDays,
    weeks: Math.floor(diffDays / 7),
    months: years * 12 + months,
    years
  }
}

// 设置目标日期为今天
const setTargetToday = () => {
  targetDate.value = new Date().toISOString().split('T')[0]
  calculateDifference()
}

// 检查节假日（简化版）
const checkHoliday = () => {
  if (!holidayDate.value) {
    holidayInfo.value = null
    return
  }

  const date = new Date(holidayDate.value)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = date.getDay()

  // 简单的节假日判断（实际应该使用完整的节假日数据）
  const holidays = {
    '1-1': { name: '元旦', type: '法定节假日' },
    '2-14': { name: '情人节', type: '节日' },
    '3-8': { name: '妇女节', type: '节日' },
    '5-1': { name: '劳动节', type: '法定节假日' },
    '6-1': { name: '儿童节', type: '节日' },
    '10-1': { name: '国庆节', type: '法定节假日' },
    '12-25': { name: '圣诞节', type: '节日' }
  }

  const key = `${month}-${day}`
  const holiday = holidays[key]

  if (holiday) {
    holidayInfo.value = {
      ...holiday,
      isHoliday: true
    }
  } else if (weekday === 0 || weekday === 6) {
    holidayInfo.value = {
      name: '周末',
      type: '休息日',
      isHoliday: true
    }
  } else {
    holidayInfo.value = {
      isHoliday: false
    }
  }
}

// SEO配置
useSeoMeta({
  title: '日期计算器 - 在线日期加减计算工具',
  description: '免费的在线日期计算工具，支持日期加减运算、日期范围计算、工作日计算等功能。',
  keywords: ['日期计算', '日期加减', '日期差计算', '工作日计算', '在线工具']
})



// 初始化
onMounted(() => {
  calculateDate()
  setTargetToday()
})
</script>