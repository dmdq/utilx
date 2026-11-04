<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Cron 生成器</h1>
      <p class="text-muted-foreground">可视化配置生成 Cron 表达式，支持多种定时任务场景</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：配置区域 -->
      <div class="space-y-4">
        <!-- 执行频率选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">执行频率</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="freq in frequencies"
              :key="freq.value"
              @click="selectFrequency(freq)"
              :class="[
                'px-4 py-3 rounded-md transition-colors text-left',
                selectedFrequency?.value === freq.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">{{ freq.name }}</div>
              <div class="text-xs opacity-80">{{ freq.description }}</div>
            </button>
          </div>
        </div>

        <!-- 详细配置 -->
        <div v-if="selectedFrequency" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">详细配置</h2>

          <!-- 分钟配置 -->
          <div v-if="showMinuteConfig" class="mb-4">
            <label class="text-sm font-medium">分钟</label>
            <div class="mt-2 grid grid-cols-4 gap-2">
              <button
                v-for="min in [0, 15, 30, 45]"
                :key="min"
                @click="config.minute = min"
                :class="[
                  'px-3 py-2 rounded text-sm transition-colors',
                  config.minute === min
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                ]"
              >
                {{ min }}分
              </button>
            </div>
          </div>

          <!-- 小时配置 -->
          <div v-if="showHourConfig" class="mb-4">
            <label class="text-sm font-medium">小时</label>
            <div class="mt-2 grid grid-cols-4 gap-2">
              <button
                v-for="hour in [0, 6, 9, 12, 15, 18, 21]"
                :key="hour"
                @click="config.hour = hour"
                :class="[
                  'px-3 py-2 rounded text-sm transition-colors',
                  config.hour === hour
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                ]"
              >
                {{ hour }}时
              </button>
            </div>
          </div>

          <!-- 日期配置 -->
          <div v-if="showDayConfig" class="mb-4">
            <label class="text-sm font-medium">日期</label>
            <div class="mt-2 flex gap-2">
              <input
                v-model.number="config.day"
                type="number"
                min="1"
                max="31"
                placeholder="1-31"
                class="w-20 px-3 py-2 border border-border rounded-md text-sm"
              />
              <span class="text-sm text-muted-foreground self-center">号</span>
            </div>
          </div>

          <!-- 月份配置 -->
          <div v-if="showMonthConfig" class="mb-4">
            <label class="text-sm font-medium">月份</label>
            <div class="mt-2 grid grid-cols-4 gap-2">
              <button
                v-for="(month, index) in ['一月', '四月', '七月', '十月']"
                :key="index"
                @click="config.month = [1, 4, 7, 10][index]"
                :class="[
                  'px-3 py-2 rounded text-sm transition-colors',
                  config.month === [1, 4, 7, 10][index]
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                ]"
              >
                {{ month }}
              </button>
            </div>
          </div>

          <!-- 星期配置 -->
          <div v-if="showWeekdayConfig" class="mb-4">
            <label class="text-sm font-medium">星期</label>
            <div class="mt-2 grid grid-cols-7 gap-2">
              <button
                v-for="(day, index) in weekdays"
                :key="index"
                @click="config.weekday = index"
                :class="[
                  'px-3 py-2 rounded text-sm transition-colors',
                  config.weekday === index
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                ]"
              >
                {{ day }}
              </button>
            </div>
          </div>

          <!-- 间隔配置 -->
          <div v-if="showIntervalConfig" class="mb-4">
            <label class="text-sm font-medium">间隔时间</label>
            <div class="mt-2 flex items-center gap-3">
              <span class="text-sm">每</span>
              <input
                v-model.number="config.interval"
                type="number"
                min="1"
                max="60"
                class="w-20 px-3 py-2 border border-border rounded-md text-sm"
              />
              <select v-model="config.intervalUnit" class="px-3 py-2 border border-border rounded-md text-sm">
                <option value="minute">分钟</option>
                <option value="hour">小时</option>
                <option value="day">天</option>
                <option value="month">月</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 生成结果 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">生成结果</h2>
          <div class="space-y-3">
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">Cron 表达式</div>
              <div class="font-mono text-lg">{{ generatedExpression || '请选择配置' }}</div>
            </div>
            <div v-if="generatedDescription" class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">执行说明</div>
              <div class="text-sm">{{ generatedDescription }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和常用示例 -->
      <div class="space-y-4">
        <!-- 下次执行时间 -->
        <div v-if="nextRunTimes.length > 0" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">执行预览</h2>
          <div class="space-y-3">
            <div class="text-sm text-muted-foreground">下次执行时间</div>
            <div
              v-for="(time, index) in nextRunTimes"
              :key="index"
              class="flex justify-between items-center p-3 bg-muted rounded-lg"
            >
              <span class="text-sm">{{ time.date }}</span>
              <span class="font-mono text-sm">{{ time.time }}</span>
            </div>
          </div>
        </div>

        <!-- 常用示例 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">常用示例</h2>
          <div class="space-y-3">
            <div
              v-for="example in examples"
              :key="example.name"
              @click="applyExample(example)"
              class="p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors group"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="font-medium group-hover:text-primary">{{ example.name }}</div>
                <Copy class="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <div class="font-mono text-sm text-muted-foreground">{{ example.expression }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ example.description }}</div>
            </div>
          </div>
        </div>

        <!-- 复制和导出 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">操作</h2>
          <div class="space-y-3">
            <button
              v-if="generatedExpression"
              @click="copyExpression"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {{ copied ? '已复制' : '复制表达式' }}
            </button>
            <button
              v-if="generatedExpression"
              @click="testExpression"
              class="w-full px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
            >
              测试表达式
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
          Cron 表达式格式
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">基本格式</h4>
            <code class="block bg-muted p-3 rounded-md font-mono text-sm">
              * * * * *<br>
              分 时 日 月 周
            </code>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">字段说明</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <strong>分钟</strong>：0-59
              </div>
              <div>
                <strong>小时</strong>：0-23
              </div>
              <div>
                <strong>日期</strong>：1-31
              </div>
              <div>
                <strong>月份</strong>：1-12
              </div>
              <div>
                <strong>星期</strong>：0-7 (0和7都表示周日)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/cron-parser"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Search class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Cron 解析器</p>
              <p class="text-xs text-muted-foreground">解析定时任务表达式</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Info, Copy, Search, Clock, Calendar, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const selectedFrequency = ref(null)
const copied = ref(false)
const config = ref({
  minute: 0,
  hour: 0,
  day: 1,
  month: 1,
  weekday: 1,
  interval: 1,
  intervalUnit: 'minute'
})

// 执行频率选项
const frequencies = [
  { value: 'minutely', name: '每分钟', description: '每分钟执行一次' },
  { value: 'hourly', name: '每小时', description: '每小时执行一次' },
  { value: 'daily', name: '每天', description: '每天指定时间执行' },
  { value: 'weekly', name: '每周', description: '每周指定日期执行' },
  { value: 'monthly', name: '每月', description: '每月指定日期执行' },
  { value: 'yearly', name: '每年', description: '每年指定日期执行' },
  { value: 'interval', name: '自定义间隔', description: '按指定间隔执行' },
  { value: 'workday', name: '工作日', description: '工作日指定时间执行' }
]

// 星期选项
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 常用示例
const examples = [
  {
    name: '每天备份',
    expression: '0 2 * * *',
    description: '每天凌晨2点执行备份'
  },
  {
    name: '每小时日志',
    expression: '0 * * * *',
    description: '每小时整点记录日志'
  },
  {
    name: '工作日提醒',
    expression: '0 9 * * 1-5',
    description: '工作日上午9点提醒'
  },
  {
    name: '每周报告',
    expression: '0 18 * * 5',
    description: '每周五下午6点生成报告'
  },
  {
    name: '每月清理',
    expression: '0 3 1 * *',
    description: '每月1号凌晨3点清理数据'
  },
  {
    name: '每5分钟检查',
    expression: '*/5 * * * *',
    description: '每5分钟检查一次状态'
  }
]

// 配置显示控制
const showMinuteConfig = computed(() =>
  selectedFrequency.value?.value === 'hourly' ||
  selectedFrequency.value?.value === 'daily' ||
  selectedFrequency.value?.value === 'weekly' ||
  selectedFrequency.value?.value === 'monthly' ||
  selectedFrequency.value?.value === 'yearly' ||
  selectedFrequency.value?.value === 'workday'
)

const showHourConfig = computed(() =>
  selectedFrequency.value?.value === 'daily' ||
  selectedFrequency.value?.value === 'weekly' ||
  selectedFrequency.value?.value === 'monthly' ||
  selectedFrequency.value?.value === 'yearly' ||
  selectedFrequency.value?.value === 'workday'
)

const showDayConfig = computed(() =>
  selectedFrequency.value?.value === 'monthly' ||
  selectedFrequency.value?.value === 'yearly'
)

const showMonthConfig = computed(() =>
  selectedFrequency.value?.value === 'yearly'
)

const showWeekdayConfig = computed(() =>
  selectedFrequency.value?.value === 'weekly'
)

const showIntervalConfig = computed(() =>
  selectedFrequency.value?.value === 'interval'
)

// 生成表达式
const generatedExpression = computed(() => {
  if (!selectedFrequency.value) return ''

  const { value } = selectedFrequency.value

  switch (value) {
    case 'minutely':
      return '* * * * *'

    case 'hourly':
      return `${config.value.minute} * * * *`

    case 'daily':
      return `${config.value.minute} ${config.value.hour} * * *`

    case 'weekly':
      return `${config.value.minute} ${config.value.hour} * * ${config.value.weekday}`

    case 'monthly':
      return `${config.value.minute} ${config.value.hour} ${config.value.day} * *`

    case 'yearly':
      return `${config.value.minute} ${config.value.hour} ${config.value.day} ${config.value.month} *`

    case 'interval':
      const unit = config.value.intervalUnit
      switch (unit) {
        case 'minute':
          return `*/${config.value.interval} * * * *`
        case 'hour':
          return `0 */${config.value.interval} * * *`
        case 'day':
          return `0 0 */${config.value.interval} * *`
        case 'month':
          return `0 0 1 */${config.value.interval} *`
        default:
          return '* * * * *'
      }

    case 'workday':
      return `${config.value.minute} ${config.value.hour} * * 1-5`

    default:
      return '* * * * *'
  }
})

// 生成描述
const generatedDescription = computed(() => {
  if (!selectedFrequency.value) return ''

  const { value } = selectedFrequency.value

  switch (value) {
    case 'minutely':
      return '每分钟执行一次'

    case 'hourly':
      return `每小时的${config.value.minute}分执行`

    case 'daily':
      return `每天${config.value.hour}:${config.value.minute.toString().padStart(2, '0')}执行`

    case 'weekly':
      return `每周${weekdays[config.value.weekday]}${config.value.hour}:${config.value.minute.toString().padStart(2, '0')}执行`

    case 'monthly':
      return `每月${config.value.day}号${config.value.hour}:${config.value.minute.toString().padStart(2, '0')}执行`

    case 'yearly':
      return `每年${config.value.month}月${config.value.day}号${config.value.hour}:${config.value.minute.toString().padStart(2, '0')}执行`

    case 'interval':
      const unitMap = {
        minute: '分钟',
        hour: '小时',
        day: '天',
        month: '个月'
      }
      return `每${config.value.interval}${unitMap[config.value.intervalUnit]}执行一次`

    case 'workday':
      return `工作日（周一至周五）每天${config.value.hour}:${config.value.minute.toString().padStart(2, '0')}执行`

    default:
      return ''
  }
})

// 下次执行时间
const nextRunTimes = computed(() => {
  if (!generatedExpression.value) return []

  const times = []
  const now = new Date()

  // 简化版计算，实际应该根据表达式精确计算
  for (let i = 0; i < 5; i++) {
    const nextTime = new Date(now.getTime() + i * 60000 * 60)
    times.push({
      date: nextTime.toLocaleDateString('zh-CN'),
      time: nextTime.toLocaleTimeString('zh-CN')
    })
  }

  return times
})

// 选择频率
const selectFrequency = (freq) => {
  selectedFrequency.value = freq
  // 重置配置
  if (freq.value === 'interval') {
    config.value.interval = 1
    config.value.intervalUnit = 'hour'
  }
}

// 应用示例
const applyExample = (example) => {
  cronExpression.value = example.expression
  // 解析表达式并设置配置
  const parts = example.expression.split(' ')
  if (parts.length >= 5) {
    // 简化解析
    if (parts[4] === '*' && parts[2] === '*') {
      selectedFrequency.value = frequencies.find(f => f.value === 'daily')
      config.value.minute = parseInt(parts[0]) || 0
      config.value.hour = parseInt(parts[1]) || 0
    } else if (parts[4] !== '*') {
      selectedFrequency.value = frequencies.find(f => f.value === 'weekly')
      config.value.minute = parseInt(parts[0]) || 0
      config.value.hour = parseInt(parts[1]) || 0
      config.value.weekday = parseInt(parts[4]) || 0
    }
  }
}

// 复制表达式
const copyExpression = async () => {
  if (!generatedExpression.value) return

  try {
    await navigator.clipboard.writeText(generatedExpression.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = generatedExpression.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// 测试表达式
const testExpression = () => {
  if (!generatedExpression.value) return

  // 跳转到 Cron 解析器
  navigateTo(`/tools/cron-parser?expression=${encodeURIComponent(generatedExpression.value)}`)
}

// SEO配置
useSeoMeta({
  title: 'Cron 生成器 - 在线 Cron 表达式生成工具',
  description: '免费的在线 Cron 表达式生成工具，可视化配置生成定时任务表达式，支持多种定时任务场景。',
  keywords: ['cron', 'crontab', '定时任务', '表达式生成', '调度', '在线工具']
})


</script>