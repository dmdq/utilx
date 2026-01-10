<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">季度计算器 - 查询日期所在季度及起止日期</h1>
      <p class="text-muted-foreground">查询日期所在季度，计算季度起止日期，适用于财务报表、数据统计等场景。支持年度季度总览、季度进度计算。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary" />
          选择日期
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">日期</label>
          <input v-model="dateInput" type="date" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary" @change="calculate">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">快捷操作</label>
          <div class="flex flex-wrap gap-2">
            <button @click="setToday" class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">今天</button>
            <button @click="setFirstDayOfQuarter" class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground">季度首日</button>
            <button @click="setLastDayOfQuarter" class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground">季度末日</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年份</label>
            <select v-model="selectedYear" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary" @change="calculateByYearQuarter">
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">季度</label>
            <select v-model="selectedQuarter" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary" @change="calculateByYearQuarter">
              <option :value="1">第一季度 (Q1)</option>
              <option :value="2">第二季度 (Q2)</option>
              <option :value="3">第三季度 (Q3)</option>
              <option :value="4">第四季度 (Q4)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 结果显示 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calculator class="w-5 h-5 text-primary" />
          计算结果
        </h2>

        <div v-if="result" class="space-y-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 class="font-medium text-blue-800 dark:text-blue-300 mb-3">当前季度 ({{ result.quarter }})</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-muted-foreground">季度名称:</span><span class="font-medium ml-2">{{ result.quarterName }}</span></div>
              <div><span class="text-muted-foreground">所属年份:</span><span class="font-medium ml-2">{{ result.year }}</span></div>
            </div>
          </div>

          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 class="font-medium text-green-800 dark:text-green-300 mb-3">季度日期范围</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">开始日期:</span>
                <code class="font-mono">{{ result.quarterStart }}</code>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">结束日期:</span>
                <code class="font-mono">{{ result.quarterEnd }}</code>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">季度天数:</span>
                <span class="font-medium">{{ result.quarterDays }} 天</span>
              </div>
            </div>
          </div>

          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 class="font-medium text-purple-800 dark:text-purple-300 mb-3">季度进度</h3>
            <div class="mb-2">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-muted-foreground">已过: {{ result.daysPassed }} 天</span>
                <span class="text-muted-foreground">剩余: {{ result.daysRemaining }} 天</span>
              </div>
              <div class="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div class="bg-purple-500 h-full transition-all" :style="{ width: `${result.progress}%` }"></div>
              </div>
              <div class="text-center mt-1 text-sm font-medium">{{ result.progress.toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-muted-foreground">
          <Calculator class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>请选择日期</p>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink v-for="relatedTool in relatedTools" :key="relatedTool.id" :to="`/tools/${relatedTool.id}`" class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
          <div class="flex items-center gap-2 mb-2">
            <component :is="iconMap[relatedTool.icon]" class="w-5 h-5 text-primary" />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calendar, Calculator, Copy } from 'lucide-vue-next'
import { tools } from '~/data/tools'

useSeoMeta({
  title: '季度计算器 - 查询日期所在季度及起止日期 | Util工具箱',
  description: '在线季度计算器，查询日期所在季度，计算季度起止日期。支持年度季度总览、季度进度计算。',
  keywords: '季度计算器,季度查询,季度起止日期,财务季度,Q1Q2Q3Q4,在线季度工具'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: '季度计算器',
      url: 'https://www.util.cn/tools/quarter-calculator'
    })
  }]
})

const iconMap = { Calendar, Calculator }

const relatedTools = computed(() => [
  tools.find(t => t.id === 'date-formatter'),
  tools.find(t => t.id === 'date-calculator'),
  tools.find(t => t.id === 'workday-calculator'),
  tools.find(t => t.id === 'week-calculator')
].filter(Boolean))

const dateInput = ref(new Date().toISOString().split('T')[0])
const selectedYear = ref(new Date().getFullYear())
const selectedQuarter = ref(0)
const result = ref(null)

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)
})

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

function calculateByYearQuarter() {
  const year = selectedYear.value
  const quarter = selectedQuarter.value
  const month = (quarter - 1) * 3 + 1
  const date = new Date(year, month - 1, 1)
  dateInput.value = date.toISOString().split('T')[0]
  calculateResult(year, quarter, date)
}

function calculateResult(year, quarter, date) {
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

  let prevQuarter = ''
  if (quarter === 1) {
    prevQuarter = `${year - 1}年第四季度`
  } else {
    prevQuarter = `${year}年第${quarter - 1}季度`
  }

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

function formatDate(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

onMounted(() => {
  calculate()
})
</script>
