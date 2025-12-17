<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Calendar class="w-8 h-8 text-primary" />
        随机日期生成
      </h1>
      <p class="text-muted-foreground">生成随机日期，用于测试、创意或决策</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 日期配置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">日期配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 开始日期 -->
          <div>
            <label class="text-sm font-medium mb-2 block">开始日期</label>
            <input
              v-model="startDate"
              type="date"
              class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <!-- 结束日期 -->
          <div>
            <label class="text-sm font-medium mb-2 block">结束日期</label>
            <input
              v-model="endDate"
              type="date"
              class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <!-- 生成数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">生成数量</label>
            <div class="flex gap-2">
              <input
                v-model.number="dateCount"
                type="number"
                min="1"
                max="50"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">个</span>
            </div>
          </div>

          <!-- 日期格式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">日期格式</label>
            <select v-model="dateFormat" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="YYYY-MM-DD">2024-01-01</option>
              <option value="MM/DD/YYYY">01/01/2024</option>
              <option value="DD/MM/YYYY">01/01/2024</option>
              <option value="YYYY年MM月DD日">2024年01月01日</option>
            </select>
          </div>
        </div>

        <!-- 预设模板 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-2 block">快速设置</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="setDateRange('thisYear')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              今年
            </button>
            <button
              @click="setDateRange('lastYear')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              去年
            </button>
            <button
              @click="setDateRange('nextYear')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              明年
            </button>
            <button
              @click="setDateRange('lastDecade')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              近十年
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="generateDates"
          :disabled="isGenerating"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isGenerating" class="w-5 h-5 animate-spin" />
          <Calendar v-else class="w-5 h-5" />
          {{ isGenerating ? '生成中...' : '生成日期' }}
        </button>

        <button
          v-if="results.length > 0"
          @click="clearResults"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Trash2 class="w-5 h-5" />
          清空结果
        </button>
      </div>

      <!-- 日期结果 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">随机日期</h2>
          <div class="flex gap-2">
            <button
              @click="copyDates"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制日期' }}
            </button>
            <button
              @click="exportDates"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Download class="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="(result, index) in results"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-muted-foreground">批次 {{ index + 1 }}</span>
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div
                v-for="(date, dateIndex) in result.dates"
                :key="dateIndex"
                class="bg-white border border-border rounded-lg p-3 text-center"
              >
                <div class="text-lg font-mono font-medium">{{ formatDate(date) }}</div>
                <div class="text-xs text-muted-foreground mt-1">{{ getWeekday(date) }}</div>
                <div class="text-xs text-muted-foreground">{{ getDaysFromNow(date) }}</div>
              </div>
            </div>

            <!-- 日期统计 -->
            <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div class="font-medium">{{ result.stats.yearRange }}</div>
                <div class="text-muted-foreground">年份跨度</div>
              </div>
              <div>
                <div class="font-medium">{{ result.stats.monthDistribution }}</div>
                <div class="text-muted-foreground">月份分布</div>
              </div>
              <div>
                <div class="font-medium">{{ result.stats.weekdayStats }}</div>
                <div class="text-muted-foreground">工作日/周末</div>
              </div>
              <div>
                <div class="font-medium">{{ result.stats.ageDistribution }}</div>
                <div class="text-muted-foreground">年龄分布</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 总统计 -->
        <div class="mt-6">
          <h3 class="font-medium mb-3">总体统计</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-primary">{{ totalDates }}</div>
              <div class="text-sm text-muted-foreground">总日期数</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-primary">{{ results.length }}</div>
              <div class="text-sm text-muted-foreground">生成批次</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-primary">{{ averageSpan }}</div>
              <div class="text-sm text-muted-foreground">平均跨度</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-primary">{{ uniqueYears }}</div>
              <div class="text-sm text-muted-foreground">涵盖年数</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 日历视图 -->
      <div v-if="results.length > 0 && showCalendar" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium">日历视图</h3>
          <button
            @click="showCalendar = false"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            隐藏
          </button>
        </div>

        <div class="grid grid-cols-7 gap-1 text-center text-sm">
          <div class="font-medium p-2">日</div>
          <div class="font-medium p-2">一</div>
          <div class="font-medium p-2">二</div>
          <div class="font-medium p-2">三</div>
          <div class="font-medium p-2">四</div>
          <div class="font-medium p-2">五</div>
          <div class="font-medium p-2">六</div>
        </div>

        <!-- 这里可以添加更复杂的日历组件 -->
        <div class="text-center text-muted-foreground py-8">
          日历视图开发中...
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">功能特点</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>支持自定义日期范围生成</li>
              <li>多种日期格式输出</li>
              <li>详细的日期统计分析</li>
              <li>批量导出和复制功能</li>
              <li>工作日/周末识别</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">应用场景</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>软件测试数据的日期生成</li>
              <li>活动日期的随机安排</li>
              <li>生日和纪念日随机选择</li>
              <li>历史事件时间线模拟</li>
              <li>项目管理里程碑设置</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">使用技巧</h3>
            <p class="text-muted-foreground">
              可以设置合理的日期范围以获得更有意义的结果。
              例如生成今年的日期用于项目排期，或生成历史日期用于模拟测试。
            </p>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/random-number-generator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机数字生成器</p>
              <p class="text-xs text-muted-foreground">生成指定范围的随机数</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-choice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <List class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机选择器</p>
              <p class="text-xs text-muted-foreground">从列表中随机选择</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-team"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Users class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机分队工具</p>
              <p class="text-xs text-muted-foreground">人员分组管理</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Calendar, RefreshCw, Trash2, Copy, Download, Hash, List, Users, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机日期生成 - 在线日期工具')

// 配置
const startDate = ref('2020-01-01')
const endDate = ref('2024-12-31')
const dateCount = ref(5)
const dateFormat = ref('YYYY-MM-DD')

// 状态
const isGenerating = ref(false)
const results = ref([])
const copied = ref(false)
const showCalendar = ref(false)

// 计算属性
const totalDates = computed(() => {
  return results.value.reduce((total, result) => total + result.dates.length, 0)
})

const allDates = computed(() => {
  return results.value.flatMap(result => result.dates)
})

const averageSpan = computed(() => {
  if (allDates.value.length === 0) return '0'

  const spans = results.value.map(result => {
    if (result.dates.length < 2) return 0
    const sorted = [...result.dates].sort()
    const start = new Date(sorted[0])
    const end = new Date(sorted[sorted.length - 1])
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30.44)) // 月数
  })

  const totalSpan = spans.reduce((sum, span) => sum + span, 0)
  return (totalSpan / spans.length).toFixed(1) + '月'
})

const uniqueYears = computed(() => {
  const years = new Set()
  allDates.value.forEach(date => {
    years.add(new Date(date).getFullYear())
  })
  return years.size
})

// 设置日期范围
const setDateRange = (range) => {
  const now = new Date()
  const currentYear = now.getFullYear()

  switch (range) {
    case 'thisYear':
      startDate.value = `${currentYear}-01-01`
      endDate.value = `${currentYear}-12-31`
      break
    case 'lastYear':
      startDate.value = `${currentYear - 1}-01-01`
      endDate.value = `${currentYear - 1}-12-31`
      break
    case 'nextYear':
      startDate.value = `${currentYear + 1}-01-01`
      endDate.value = `${currentYear + 1}-12-31`
      break
    case 'lastDecade':
      startDate.value = `${currentYear - 10}-01-01`
      endDate.value = `${currentYear}-01-01`
      break
  }
}

// 格式化日期
const formatDate = (date) => {
  const d = new Date(date)

  switch (dateFormat.value) {
    case 'YYYY-MM-DD':
      return d.toISOString().split('T')[0]
    case 'MM/DD/YYYY':
      return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`
    case 'DD/MM/YYYY':
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
    case 'YYYY年MM月DD日':
      return `${d.getFullYear()}年${(d.getMonth() + 1).toString().padStart(2, '0')}月${d.getDate().toString().padStart(2, '0')}日`
    default:
      return d.toISOString().split('T')[0]
  }
}

// 获取星期几
const getWeekday = (date) => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weekdays[new Date(date).getDay()]
}

// 获取距离现在的天数
const getDaysFromNow = (date) => {
  const now = new Date()
  const target = new Date(date)
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))

  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  if (diff > 0) return `${diff}天后`
  return `${Math.abs(diff)}天前`
}

// 计算统计信息
const calculateStats = (dates) => {
  const stats = {
    yearRange: '',
    monthDistribution: '',
    weekdayStats: '',
    ageDistribution: ''
  }

  if (dates.length === 0) return stats

  const years = dates.map(d => new Date(d).getFullYear())
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  stats.yearRange = minYear === maxYear ? minYear : `${minYear}-${maxYear}`

  // 月份分布
  const months = dates.map(d => new Date(d).getMonth() + 1)
  const monthCounts = {}
  months.forEach(m => {
    monthCounts[m] = (monthCounts[m] || 0) + 1
  })
  const maxMonthCount = Math.max(...Object.values(monthCounts))
  stats.monthDistribution = `${maxMonthCount}个集中在某月`

  // 工作日/周末统计
  const weekdays = dates.map(d => new Date(d).getDay())
  const weekendCount = weekdays.filter(d => d === 0 || d === 6).length
  const weekdayCount = dates.length - weekendCount
  stats.weekdayStats = `${weekdayCount}工作日/${weekendCount}周末`

  // 年龄分布
  const now = new Date()
  const ages = dates.map(d => Math.floor((now - new Date(d)) / (1000 * 60 * 60 * 24 * 365.25)))
  if (ages.length > 0) {
    const avgAge = Math.floor(ages.reduce((sum, age) => sum + age, 0) / ages.length)
    stats.ageDistribution = `平均${avgAge}年前`
  }

  return stats
}

// 生成随机日期
const generateRandomDate = (start, end) => {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()

  const randomTime = startTime + Math.random() * (endTime - startTime)
  return new Date(randomTime).toISOString().split('T')[0]
}

// 生成日期
const generateDates = async () => {
  if (isGenerating.value) return

  isGenerating.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  const dates = []
  const usedDates = new Set()

  for (let i = 0; i < dateCount.value; i++) {
    let date
    let attempts = 0

    // 确保日期唯一
    do {
      date = generateRandomDate(startDate.value, endDate.value)
      attempts++

      if (attempts > 100) break // 防止无限循环
    } while (usedDates.has(date) && attempts < 100)

    dates.push(date)
    usedDates.add(date)
  }

  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  const stats = calculateStats(dates)

  results.value.unshift({
    dates,
    timestamp,
    stats
  })

  if (results.value.length > 10) {
    results.value = results.value.slice(0, 10)
  }

  isGenerating.value = false
}

// 复制日期
const copyDates = async () => {
  try {
    const dates = results.value[0].dates.map(date => formatDate(date))
    const text = dates.join('\n')

    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 导出日期
const exportDates = () => {
  if (results.value.length === 0) return

  let content = '随机日期导出\n'
  content += '============\n\n'
  content += `生成时间: ${new Date().toLocaleString()}\n`
  content += `日期范围: ${startDate.value} 至 ${endDate.value}\n`
  content += `生成数量: ${totalDates.value}\n\n`

  results.value.forEach((result, index) => {
    content += `批次 ${index + 1} (${result.timestamp}):\n`
    content += '------------\n'

    result.dates.forEach((date, dateIndex) => {
      content += `${dateIndex + 1}. ${formatDate(date)} (${getWeekday(date)}, ${getDaysFromNow(date)})\n`
    })

    content += '\n' + result.stats.yearRange + '\n\n'
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `random-dates-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 清空结果
const clearResults = () => {
  results.value = []
}
</script>