<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">中国法定节假日查询工具</h1>
      <p class="text-gray-600 dark:text-gray-400">查询中国法定节假日安排、调休信息及放假天数统计</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 年份选择 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-red-500" />
          选择年份
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">年份</label>
          <select
            v-model="selectedYear"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="loadHolidays"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}年</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">快捷操作</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="selectedYear = new Date().getFullYear(); loadHolidays()"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              今年
            </button>
            <button
              @click="selectedYear = new Date().getFullYear() + 1; loadHolidays()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              明年
            </button>
          </div>
        </div>

        <!-- 节假日统计 -->
        <div v-if="holidayStats" class="space-y-3">
          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div class="text-sm text-red-700 dark:text-red-300 mb-1">全年放假天数</div>
            <div class="text-3xl font-bold text-red-800 dark:text-red-200">
              {{ holidayStats.totalDays }}天
            </div>
            <div class="text-sm text-red-600 dark:text-red-400 mt-1">
              法定节假日{{ holidayStats.holidaysCount }}个
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div class="text-sm text-green-700 dark:text-green-300">调休上班</div>
              <div class="text-xl font-bold text-green-800 dark:text-green-200">
                {{ holidayStats.workDays }}天
              </div>
            </div>
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="text-sm text-blue-700 dark:text-blue-300">实际休息</div>
              <div class="text-xl font-bold text-blue-800 dark:text-blue-200">
                {{ holidayStats.actualRestDays }}天
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 节假日列表 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift class="w-5 h-5 text-yellow-500" />
          {{ selectedYear }}年节假日安排
        </h2>

        <div class="space-y-3 max-h-[600px] overflow-y-auto">
          <div
            v-for="holiday in holidays"
            :key="holiday.name"
            :class="[
              'p-4 border rounded-lg',
              holiday.isCurrent ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700'
            ]"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="font-medium text-lg">{{ holiday.name }}</div>
                <div class="text-sm text-gray-500">{{ holiday.date }}</div>
              </div>
              <div
                :class="[
                  'px-3 py-1 text-sm rounded',
                  holiday.days >= 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                ]"
              >
                {{ holiday.days }}天假
              </div>
            </div>

            <!-- 调休信息 -->
            <div v-if="holiday.adjustment" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <div v-if="holiday.adjustment.workDaysBefore">
                调休上班: {{ holiday.adjustment.workDaysBefore }}
              </div>
              <div v-if="holiday.adjustment.workDaysAfter">
                调休上班: {{ holiday.adjustment.workDaysAfter }}
              </div>
            </div>

            <!-- 是否当前 -->
            <div v-if="holiday.isCurrent" class="text-xs text-yellow-600 mt-2">
              🎉 正在放假
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 节假日说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">节假日说明</h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-red-600">元旦</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>时间: 1月1日</div>
            <div>放假: 1天</div>
            <div>如遇周末顺延</div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-red-600">春节</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>时间: 农历正月初一</div>
            <div>放假: 8天(含调休)</div>
            <div>最重要传统节日</div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-green-600">清明节</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>时间: 4月4-6日交节</div>
            <div>放假: 3天</div>
            <div>祭扫先人节日</div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-yellow-600">劳动节</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>时间: 5月1日</div>
            <div>放假: 5天(含调休)</div>
            <div>国际劳动节</div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-purple-600">端午节</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>时间: 农历五月初五</div>
            <div>放假: 3天</div>
            <div>传统民俗节日</div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-pink-600">中秋节</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>时间: 农历八月十五</div>
            <div>放假: 3天</div>
            <div>团圆赏月节日</div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-red-600">国庆节</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>时间: 10月1日</div>
            <div>放假: 7天(黄金周)</div>
            <div>国家生日</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 放假安排原则 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">放假安排原则</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h3 class="font-medium mb-3 text-gray-800 dark:text-gray-200">调休原则</h3>
          <ul class="space-y-2 list-disc list-inside">
            <li>逢周末时在周一补休</li>
            <li>通过调休形成连续假期</li>
            <li>避免形成超长假期</li>
            <li>春节和国庆尽量安排长假</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-3 text-gray-800 dark:text-gray-200">法定标准</h3>
          <ul class="space-y-2 list-disc list-inside">
            <li>全体公民放假: 7个节日(共11天)</li>
            <li>部分公民放假: 妇女节、青年节等</li>
            <li>少数民族节日可另行规定</li>
            <li>遇周末顺延工作日</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/lunar-calendar" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Moon class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">农历日历</h3>
          <p class="text-sm text-gray-500">公历农历转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/solar-term-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Sun class="w-8 h-8 text-yellow-500 mb-2" />
          <h3 class="font-medium">节气查询</h3>
          <p class="text-sm text-gray-500">二十四节气</p>
        </NuxtLink>
        <NuxtLink to="/tools/date-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">日期计算器</h3>
          <p class="text-sm text-gray-500">日期加减计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/quarter-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">季度计算器</h3>
          <p class="text-sm text-gray-500">季度查询</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Calendar,
  Gift,
  Moon,
  Sun,
  Calculator
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '中国法定节假日查询工具 - 节假日安排及调休信息',
  meta: [
    {
      name: 'description',
      content: '在线中国法定节假日查询工具，查询全年节假日安排、调休信息、放假天数统计。包含春节、国庆、清明等主要节日说明。'
    },
    {
      name: 'keywords',
      content: '法定节假日,放假安排,调休查询,春节放假,国庆放假,节假日查询'
    }
  ]
})

// 生成节假日数据（简化版）
function generateHolidays(year: number) {
  const holidays = [
    {
      name: '元旦',
      date: `${year}-01-01`,
      days: 1,
      month: 1
    },
    {
      name: '春节',
      date: `${year}-02-10`, // 近似日期
      days: 8,
      month: 2,
      adjustment: { workDaysAfter: `${year}-02-17` }
    },
    {
      name: '清明节',
      date: `${year}-04-04`,
      days: 3,
      month: 4
    },
    {
      name: '劳动节',
      date: `${year}-05-01`,
      days: 5,
      month: 5,
      adjustment: { workDaysAfter: `${year}-05-11` }
    },
    {
      name: '端午节',
      date: `${year}-06-10`, // 近似日期
      days: 3,
      month: 6
    },
    {
      name: '中秋节',
      date: `${year}-09-15`, // 近似日期
      days: 3,
      month: 9
    },
    {
      name: '国庆节',
      date: `${year}-10-01`,
      days: 7,
      month: 10,
      adjustment: { workDaysAfter: `${year}-10-12` }
    }
  ]

  const now = new Date()
  holidays.forEach(h => {
    const holidayDate = new Date(h.date)
    h.isCurrent = Math.abs((holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) < h.days
  })

  return holidays
}

// State
const selectedYear = ref(new Date().getFullYear())
const holidays = ref<any[]>([])
const holidayStats = ref<any>(null)

// 年份列表
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, i) => currentYear - 1 + i)
})

// 加载节假日
function loadHolidays() {
  const year = selectedYear.value
  holidays.value = generateHolidays(year)

  const totalDays = holidays.value.reduce((sum, h) => sum + h.days, 0)
  const workDays = holidays.value.filter(h => h.adjustment).length
  const holidaysCount = holidays.value.length

  holidayStats.value = {
    totalDays,
    workDays,
    actualRestDays: totalDays - workDays,
    holidaysCount
  }
}

// 初始化
loadHolidays()
</script>
