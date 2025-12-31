<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">季度计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">查询日期所在季度，计算季度起止日期，适用于财务报表、数据统计等场景</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-blue-500" />
          选择日期
        </h2>

        <!-- 日期选择 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">日期</label>
            <input
              v-model="dateInput"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              @change="calculate"
            >
          </div>

          <!-- 快捷操作 -->
          <div>
            <label class="block text-sm font-medium mb-2">快捷操作</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="setToday"
                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                今天
              </button>
              <button
                @click="setFirstDayOfQuarter"
                class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
              >
                季度首日
              </button>
              <button
                @click="setLastDayOfQuarter"
                class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
              >
                季度末日
              </button>
            </div>
          </div>

          <!-- 年份季度选择 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">年份</label>
              <select
                v-model="selectedYear"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                @change="calculateByYearQuarter"
              >
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">季度</label>
              <select
                v-model="selectedQuarter"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                @change="calculateByYearQuarter"
              >
                <option :value="1">第一季度 (Q1)</option>
                <option :value="2">第二季度 (Q2)</option>
                <option :value="3">第三季度 (Q3)</option>
                <option :value="4">第四季度 (Q4)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果显示 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator class="w-5 h-5 text-green-500" />
          计算结果
        </h2>

        <div v-if="result" class="space-y-4">
          <!-- 当前季度信息 -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 class="font-medium text-blue-800 dark:text-blue-300 mb-3">当前季度 ({{ result.quarter }})</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">季度名称:</span>
                <span class="font-medium ml-2">{{ result.quarterName }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">所属年份:</span>
                <span class="font-medium ml-2">{{ result.year }}</span>
              </div>
            </div>
          </div>

          <!-- 季度起止日期 -->
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 class="font-medium text-green-800 dark:text-green-300 mb-3">季度日期范围</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">开始日期:</span>
                <div class="flex items-center gap-2">
                  <code class="font-mono">{{ result.quarterStart }}</code>
                  <button
                    @click="copyText(result.quarterStart)"
                    class="text-green-500 hover:text-green-700"
                    title="复制"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">结束日期:</span>
                <div class="flex items-center gap-2">
                  <code class="font-mono">{{ result.quarterEnd }}</code>
                  <button
                    @click="copyText(result.quarterEnd)"
                    class="text-green-500 hover:text-green-700"
                    title="复制"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">季度天数:</span>
                <span class="font-medium">{{ result.quarterDays }} 天</span>
              </div>
            </div>
          </div>

          <!-- 季度进度 -->
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 class="font-medium text-purple-800 dark:text-purple-300 mb-3">季度进度</h3>
            <div class="mb-2">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600 dark:text-gray-400">已过: {{ result.daysPassed }} 天</span>
                <span class="text-gray-600 dark:text-gray-400">剩余: {{ result.daysRemaining }} 天</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  class="bg-purple-500 h-full transition-all"
                  :style="{ width: `${result.progress}%` }"
                ></div>
              </div>
              <div class="text-center mt-1 text-sm font-medium">
                {{ result.progress.toFixed(1) }}%
              </div>
            </div>
          </div>

          <!-- 上一季度和下一季度 -->
          <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <h3 class="font-medium text-orange-800 dark:text-orange-300 mb-3">相邻季度</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">上一季度:</span>
                <div class="font-medium mt-1">{{ result.prevQuarter }}</div>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">下一季度:</span>
                <div class="font-medium mt-1">{{ result.nextQuarter }}</div>
              </div>
            </div>
          </div>

          <!-- 季度月份列表 -->
          <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h3 class="font-medium text-yellow-800 dark:text-yellow-300 mb-3">本季度月份</h3>
            <div class="flex gap-2">
              <span
                v-for="month in result.months"
                :key="month"
                class="px-3 py-1 bg-yellow-200 dark:bg-yellow-800 rounded-full text-sm font-medium"
              >
                {{ month }}月
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Calculator class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>请选择日期</p>
        </div>
      </div>
    </div>

    <!-- 年度季度总览 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calendar class="w-5 h-5 text-indigo-500" />
        {{ selectedYear }}年季度总览
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="q in 4"
          :key="q"
          @click="selectQuarter(q)"
          :class="[
            'p-4 rounded-lg border-2 cursor-pointer transition',
            selectedQuarter === q
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          ]"
        >
          <div class="font-medium mb-2">Q{{ q }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <div>{{ getQuarterRange(q).start }}</div>
            <div>{{ getQuarterRange(q).end }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 季度说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">季度说明</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3">自然季度划分</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs font-medium">Q1</span>
              <span>1月1日 - 3月31日 (90天或91天)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-xs font-medium">Q2</span>
              <span>4月1日 - 6月30日 (91天)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded text-xs font-medium">Q3</span>
              <span>7月1日 - 9月30日 (92天)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded text-xs font-medium">Q4</span>
              <span>10月1日 - 12月31日 (92天)</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-3">应用场景</h3>
          <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>财务报表（季度财报）</li>
            <li>企业目标管理（季度OKR）</li>
            <li>税务申报（季度报税）</li>
            <li>数据统计分析（季度数据对比）</li>
            <li>绩效考核（季度考评）</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/date-formatter" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">日期格式化</h3>
          <p class="text-sm text-gray-500">ISO 8601格式转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/date-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">日期计算器</h3>
          <p class="text-sm text-gray-500">日期加减计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/workday-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">工作日计算</h3>
          <p class="text-sm text-gray-500">工作日计算器</p>
        </NuxtLink>
        <NuxtLink to="/tools/week-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">周数计算器</h3>
          <p class="text-sm text-gray-500">计算周数</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Calendar,
  Calculator,
  Copy
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '季度计算器 - 查询日期所在季度及起止日期',
  meta: [
    {
      name: 'description',
      content: '在线季度计算器，查询日期所在季度，计算季度起止日期。支持年度季度总览、季度进度计算，适用于财务报表、企业目标管理、税务申报等场景。'
    },
    {
      name: 'keywords',
      content: '季度计算器,季度查询,季度起止日期,财务季度,Q1Q2Q3Q4,在线季度工具'
    }
  ]
})

// State
const dateInput = ref(new Date().toISOString().split('T')[0])
const selectedYear = ref(new Date().getFullYear())
const selectedQuarter = ref(0)

// 年份列表
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)
})

// 计算结果
const result = ref<any>(null)

// 计算季度信息
function calculate() {
  if (!dateInput.value) {
    result.value = null
    return
  }

  const date = new Date(dateInput.value)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const quarter = Math.ceil(month / 3)

  selectedYear.value = year
  selectedQuarter.value = quarter

  calculateResult(year, quarter, date)
}

// 根据年份和季度计算
function calculateByYearQuarter() {
  const year = selectedYear.value
  const quarter = selectedQuarter.value

  // 设置输入日期为该季度的第一天
  const month = (quarter - 1) * 3 + 1
  const date = new Date(year, month - 1, 1)
  dateInput.value = date.toISOString().split('T')[0]

  calculateResult(year, quarter, date)
}

// 计算结果数据
function calculateResult(year: number, quarter: number, date: Date) {
  const quarterStartMonth = (quarter - 1) * 3
  const quarterEndMonth = quarter * 3 - 1

  const quarterStart = new Date(year, quarterStartMonth, 1)
  const quarterEnd = new Date(year, quarterEndMonth + 1, 0)

  const quarterDays = Math.floor((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysPassed = Math.floor((date.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysRemaining = quarterDays - daysPassed
  const progress = (daysPassed / quarterDays) * 100

  const quarterNames = ['第一季度', '第二季度', '第三季度', '第四季度']
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const monthsInQuarter = monthNames.slice(quarterStartMonth, quarterStartMonth + 3)

  // 上一季度
  let prevQuarter = ''
  if (quarter === 1) {
    prevQuarter = `${year - 1}年第四季度`
  } else {
    prevQuarter = `${year}年第${quarter - 1}季度`
  }

  // 下一季度
  let nextQuarter = ''
  if (quarter === 4) {
    nextQuarter = `${year + 1}年第一季度`
  } else {
    nextQuarter = `${year}年第${quarter + 1}季度`
  }

  result.value = {
    year,
    quarter,
    quarterName: quarterNames[quarter - 1],
    quarterStart: formatDate(quarterStart),
    quarterEnd: formatDate(quarterEnd),
    quarterDays,
    daysPassed,
    daysRemaining,
    progress,
    prevQuarter,
    nextQuarter,
    months: monthsInQuarter
  }
}

// 获取季度范围
function getQuarterRange(quarter: number) {
  const year = selectedYear.value
  const quarterStartMonth = (quarter - 1) * 3
  const quarterEndMonth = quarter * 3 - 1

  const quarterStart = new Date(year, quarterStartMonth, 1)
  const quarterEnd = new Date(year, quarterEndMonth + 1, 0)

  return {
    start: formatDate(quarterStart),
    end: formatDate(quarterEnd)
  }
}

// 格式化日期
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 选择季度
function selectQuarter(quarter: number) {
  selectedQuarter.value = quarter
  calculateByYearQuarter()
}

// 快捷操作
function setToday() {
  dateInput.value = new Date().toISOString().split('T')[0]
  calculate()
}

function setFirstDayOfQuarter() {
  if (result.value) {
    dateInput.value = result.value.quarterStart
    calculate()
  }
}

function setLastDayOfQuarter() {
  if (result.value) {
    dateInput.value = result.value.quarterEnd
    calculate()
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
}

// 初始化
onMounted(() => {
  calculate()
})

// 监听日期变化
watch(dateInput, () => {
  calculate()
})
</script>
