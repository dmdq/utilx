<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">工作时间计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">计算工作时长、加班时长，支持弹性工作制和排班管理</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-blue-500" />
          工作时间设置
        </h2>

        <!-- 上班时间 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">上班时间</label>
          <input
            v-model="workStartTime"
            type="time"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
        </div>

        <!-- 下班时间 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">下班时间</label>
          <input
            v-model="workEndTime"
            type="time"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
        </div>

        <!-- 休息时间 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">休息时间（分钟）</label>
          <div class="flex gap-2">
            <input
              v-model="breakMinutes"
              type="number"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="60"
            >
            <div class="flex gap-1">
              <button
                v-for="min in [0, 30, 60, 90, 120]"
                :key="min"
                @click="breakMinutes = min"
                :class="['px-3 py-1 text-sm rounded', breakMinutes === min ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
              >
                {{ min }}分
              </button>
            </div>
          </div>
        </div>

        <!-- 每周工作天数 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">每周工作天数</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="day in weekDays"
              :key="day.value"
              @click="toggleWorkDay(day.value)"
              :class="[
                'px-3 py-2 text-sm rounded min-w-[50px]',
                workDays.includes(day.value) ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
              ]"
            >
              {{ day.label }}
            </button>
          </div>
        </div>

        <!-- 加班费率 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">加班费率（时薪倍数）</label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-xs text-gray-500">工作日加班:</span>
              <input
                v-model="overtimeRates.weekday"
                type="number"
                step="0.1"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mt-1"
              >
            </div>
            <div>
              <span class="text-xs text-gray-500">周末加班:</span>
              <input
                v-model="overtimeRates.weekend"
                type="number"
                step="0.1"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mt-1"
              >
            </div>
          </div>
        </div>

        <!-- 计算按钮 -->
        <button
          @click="calculate"
          class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
        >
          计算工作时长
        </button>
      </div>

      <!-- 结果区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator class="w-5 h-5 text-green-500" />
          计算结果
        </h2>

        <div v-if="result" class="space-y-4">
          <!-- 日工作时长 -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-sm text-blue-700 dark:text-blue-300 mb-1">每日工作时长</div>
            <div class="text-3xl font-bold text-blue-800 dark:text-blue-200">
              {{ result.dailyWorkHours }}小时
            </div>
            <div class="text-sm text-blue-600 dark:text-blue-400 mt-1">
              (含休息{{ breakMinutes }}分钟)
            </div>
          </div>

          <!-- 周工作时长 -->
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-sm text-green-700 dark:text-green-300 mb-1">每周工作时长</div>
            <div class="text-2xl font-bold text-green-800 dark:text-green-200">
              {{ result.weeklyWorkHours }}小时
            </div>
            <div class="text-sm text-green-600 dark:text-green-400 mt-1">
              {{ result.workDaysPerWeek }}天 × {{ result.dailyWorkHours }}小时
            </div>
          </div>

          <!-- 月工作时长 -->
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div class="text-sm text-purple-700 dark:text-purple-300 mb-1">月工作时长（估算）</div>
            <div class="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {{ result.monthlyWorkHours }}小时
            </div>
            <div class="text-sm text-purple-600 dark:text-purple-400 mt-1">
              按每月{{ result.workDaysPerWeek * 4 }}工作日计算
            </div>
          </div>

          <!-- 年工作时长 -->
          <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div class="text-sm text-orange-700 dark:text-orange-300 mb-1">年工作时长（估算）</div>
            <div class="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {{ result.yearlyWorkHours }}小时
            </div>
            <div class="text-sm text-orange-600 dark:text-orange-400 mt-1">
              按每年52周计算
            </div>
          </div>

          <!-- 工作时间占比 -->
          <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">工作时间占比</div>
            <div class="space-y-2">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>每日占醒着时间:</span>
                  <span class="font-medium">{{ result.dailyAwakePercent }}%</span>
                </div>
                <div class="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full"
                    :style="{ width: `${Math.min(result.dailyAwakePercent, 100)}%` }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>每周占一周时间:</span>
                  <span class="font-medium">{{ result.weeklyPercent }}%</span>
                </div>
                <div class="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                  <div
                    class="bg-green-500 h-2 rounded-full"
                    :style="{ width: `${Math.min(result.weeklyPercent, 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Clock class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>设置工作时间后点击计算</p>
        </div>
      </div>
    </div>

    <!-- 加班计算 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">加班计算器</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- 加班输入 -->
        <div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">本周加班时长（小时）</label>
            <input
              v-model="weeklyOvertime"
              type="number"
              step="0.5"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="输入加班时长"
              @input="calculateOvertime"
            >
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">时薪（元）</label>
            <input
              v-model="hourlyRate"
              type="number"
              step="0.01"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="输入时薪"
              @input="calculateOvertime"
            >
          </div>
        </div>

        <!-- 加班结果 -->
        <div v-if="overtimeResult" class="space-y-3">
          <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div class="text-sm text-red-700 dark:text-red-300">加班费</div>
            <div class="text-2xl font-bold text-red-800 dark:text-red-200">
              ¥{{ overtimeResult.overtimePay }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span class="text-gray-600 dark:text-gray-400">工作日加班:</span>
              <span class="font-medium ml-2">{{ overtimeResult.weekdayOvertime }}小时</span>
            </div>
            <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span class="text-gray-600 dark:text-gray-400">周末加班:</span>
              <span class="font-medium ml-2">{{ overtimeResult.weekendOvertime }}小时</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常见工作制 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常见工作制参考</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <div
          v-for="schedule in commonSchedules"
          :key="schedule.name"
          @click="applySchedule(schedule)"
          class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
        >
          <h3 class="font-medium mb-2">{{ schedule.name }}</h3>
          <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>时间: {{ schedule.start }} - {{ schedule.end }}</div>
            <div>休息: {{ schedule.break }}分钟</div>
            <div>天数: {{ schedule.days }}天/周</div>
            <div class="text-blue-600 font-medium">{{ schedule.hours }}小时/周</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/date-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">日期计算器</h3>
          <p class="text-sm text-gray-500">日期加减计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/time-unit-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Clock class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">时间单位转换</h3>
          <p class="text-sm text-gray-500">秒分时天转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/workday-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">工作日计算</h3>
          <p class="text-sm text-gray-500">工作日计算</p>
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
import { ref, computed } from 'vue'
import {
  Clock,
  Calculator,
  Calendar,
  Timer
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '工作时间计算器 - 计算工作时长和加班费',
  meta: [
    {
      name: 'description',
      content: '在线工作时间计算器，计算每日、每周、每月、每年工作时长，支持加班费计算和多种工作制。'
    },
    {
      name: 'keywords',
      content: '工作时间计算,加班费计算,工作时长,弹性工作制,排班管理,在线工作计算器'
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
const result = ref<any>(null)
const weeklyOvertime = ref(0)
const hourlyRate = ref(0)
const overtimeResult = ref<any>(null)

// 切换工作日
function toggleWorkDay(day: number) {
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
function parseTime(timeStr: string): number {
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
function applySchedule(schedule: any) {
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

// 初始化
calculate()
</script>
