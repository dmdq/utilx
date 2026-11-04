<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Crontab 生成器</h1>
      <p class="text-muted-foreground">可视化配置生成 Crontab 定时任务表达式，支持多种定时任务场景</p>
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

        <!-- 高级配置 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">高级配置</h2>

          <!-- 分钟配置 -->
          <div class="mb-4">
            <label class="text-sm font-medium">分钟 (0-59)</label>
            <div class="mt-2 space-y-2">
              <div class="flex gap-2">
                <select v-model="config.minuteType" class="flex-1 px-3 py-2 border border-border rounded-md text-sm">
                  <option value="*">每分钟</option>
                  <option value="specific">指定分钟</option>
                  <option value="range">范围</option>
                  <option value="interval">间隔</option>
                  <option value="list">列表</option>
                </select>
              </div>

              <!-- 具体分钟 -->
              <div v-if="config.minuteType === 'specific'" class="flex flex-wrap gap-2">
                <button
                  v-for="min in quickMinutes"
                  :key="min"
                  @click="toggleSpecific('minutes', min)"
                  :class="[
                    'px-3 py-1 rounded text-sm transition-colors',
                    config.specificMinutes.includes(min)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  {{ min }}
                </button>
              </div>

              <!-- 范围分钟 -->
              <div v-if="config.minuteType === 'range'" class="flex gap-2 items-center">
                <input
                  v-model="config.minuteRange.start"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  class="w-20 px-2 py-1 border border-border rounded text-sm"
                />
                <span>到</span>
                <input
                  v-model="config.minuteRange.end"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="59"
                  class="w-20 px-2 py-1 border border-border rounded text-sm"
                />
              </div>

              <!-- 间隔分钟 -->
              <div v-if="config.minuteType === 'interval'" class="flex gap-2 items-center">
                <span>每</span>
                <input
                  v-model="config.minuteInterval"
                  type="number"
                  min="1"
                  max="60"
                  class="w-20 px-2 py-1 border border-border rounded text-sm"
                />
                <span>分钟</span>
              </div>

              <!-- 列表分钟 -->
              <div v-if="config.minuteType === 'list'" class="flex gap-2">
                <input
                  v-model="config.minuteList"
                  type="text"
                  placeholder="0,15,30,45"
                  class="flex-1 px-2 py-1 border border-border rounded text-sm"
                />
              </div>
            </div>
          </div>

          <!-- 小时配置 -->
          <div class="mb-4">
            <label class="text-sm font-medium">小时 (0-23)</label>
            <div class="mt-2 space-y-2">
              <div class="flex gap-2">
                <select v-model="config.hourType" class="flex-1 px-3 py-2 border border-border rounded-md text-sm">
                  <option value="*">每小时</option>
                  <option value="specific">指定小时</option>
                  <option value="range">范围</option>
                  <option value="interval">间隔</option>
                  <option value="list">列表</option>
                </select>
              </div>

              <!-- 具体小时 -->
              <div v-if="config.hourType === 'specific'" class="flex flex-wrap gap-2">
                <button
                  v-for="hour in quickHours"
                  :key="hour"
                  @click="toggleSpecific('hours', hour)"
                  :class="[
                    'px-3 py-1 rounded text-sm transition-colors',
                    config.specificHours.includes(hour)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  {{ hour }}h
                </button>
              </div>
            </div>
          </div>

          <!-- 日期配置 -->
          <div class="mb-4">
            <label class="text-sm font-medium">日期 (1-31)</label>
            <div class="mt-2">
              <select v-model="config.dayType" class="w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="*">每天</option>
                <option value="specific">指定日期</option>
                <option value="last">最后一天</option>
              </select>
            </div>
          </div>

          <!-- 月份配置 -->
          <div class="mb-4">
            <label class="text-sm font-medium">月份 (1-12)</label>
            <div class="mt-2">
              <select v-model="config.monthType" class="w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="*">每月</option>
                <option value="specific">指定月份</option>
              </select>
            </div>
          </div>

          <!-- 星期配置 -->
          <div class="mb-4">
            <label class="text-sm font-medium">星期 (0-7, 0和7都表示周日)</label>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="(day, index) in weekdays"
                :key="index"
                @click="toggleWeekday(index)"
                :class="[
                  'px-3 py-1 rounded text-sm transition-colors',
                  config.weekdays.includes(index)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                ]"
              >
                {{ day }}
              </button>
            </div>
          </div>
        </div>

        <!-- 命令配置 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">执行命令</h2>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium">要执行的命令</label>
              <textarea
                v-model="config.command"
                placeholder="/usr/bin/php /var/www/html/cron.php"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm h-24 resize-none"
              ></textarea>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.logOutput"
                type="checkbox"
                id="logOutput"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="logOutput" class="text-sm">记录输出到日志</label>
            </div>
            <div v-if="config.logOutput">
              <input
                v-model="config.logPath"
                type="text"
                placeholder="/var/log/cron.log"
                class="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：结果和预览 -->
      <div class="space-y-4">
        <!-- 生成结果 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">生成的 Crontab</h2>
            <button
              @click="copyCrontab"
              :disabled="!generatedCrontab"
              class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>

          <div class="bg-muted/30 rounded-lg p-4">
            <code v-if="generatedCrontab" class="text-sm whitespace-pre-wrap break-all">{{ generatedCrontab }}</code>
            <div v-else class="text-center text-muted-foreground py-8">
              <Clock class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>请配置定时任务</p>
            </div>
          </div>
        </div>

        <!-- 执行说明 -->
        <div v-if="generatedCrontab" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">执行说明</h2>
          <div class="space-y-3 text-sm">
            <div class="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="font-medium mb-1">下次执行时间预览</div>
              <div class="text-muted-foreground">{{ nextExecutionTime }}</div>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <div class="font-medium mb-1">执行频率说明</div>
              <div class="text-muted-foreground">{{ frequencyDescription }}</div>
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
              class="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors group"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="font-medium group-hover:text-primary">{{ example.name }}</div>
                <Copy class="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <code class="text-xs text-muted-foreground">{{ example.crontab }}</code>
              <p class="text-xs text-muted-foreground mt-1">{{ example.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Crontab 教程 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          Crontab 使用教程
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">基本格式</h4>
            <code class="block bg-muted p-3 rounded-md font-mono text-sm">
              * * * * * command<br>
              │ │ │ │ │<br>
              │ │ │ │ └─── 星期几 (0 - 7)<br>
              │ │ │ └───── 月份 (1 - 12)<br>
              │ │ └─────── 日期 (1 - 31)<br>
              │ └───────── 小时 (0 - 23)<br>
              └─────────── 分钟 (0 - 59)
            </code>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">特殊字符说明</h4>
            <ul class="list-disc list-inside space-y-1">
              <li><code>*</code> - 任意值</li>
              <li><code>,</code> - 列表分隔符，如 "1,3,5"</li>
              <li><code>-</code> - 范围，如 "1-5"</li>
              <li><code>/</code> - 步长，如 "*/5" 表示每5个单位</li>
              <li><code>@yearly</code> - 每年1月1日午夜</li>
              <li><code>@monthly</code> - 每月1日午夜</li>
              <li><code>@weekly</code> - 每周日午夜</li>
              <li><code>@daily</code> - 每天午夜</li>
              <li><code>@hourly</code> - 每小时</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Info, Clock, Copy } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const selectedFrequency = ref(null)
const copied = ref(false)

// 配置选项
const config = ref({
  minuteType: '*',
  specificMinutes: [],
  minuteRange: { start: 0, end: 59 },
  minuteInterval: 5,
  minuteList: '',

  hourType: '*',
  specificHours: [],
  hourRange: { start: 0, end: 23 },
  hourInterval: 1,
  hourList: '',

  dayType: '*',
  specificDays: [],

  monthType: '*',
  specificMonths: [],

  weekdays: [],

  command: '',
  logOutput: false,
  logPath: '/var/log/cron.log'
})

// 快速选项
const quickMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const quickHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 执行频率选项
const frequencies = [
  { value: 'every-minute', name: '每分钟', description: '每分钟执行一次' },
  { value: 'every-hour', name: '每小时', description: '每小时执行一次' },
  { value: 'daily', name: '每天', description: '每天指定时间执行' },
  { value: 'weekly', name: '每周', description: '每周指定时间执行' },
  { value: 'monthly', name: '每月', description: '每月指定日期执行' },
  { value: 'yearly', name: '每年', description: '每年指定日期执行' },
  { value: 'workday', name: '工作日', description: '工作日指定时间执行' },
  { value: 'custom', name: '自定义', description: '完全自定义配置' }
]

// 生成 Crontab 表达式
const generatedCrontab = computed(() => {
  const minute = generateField('minute')
  const hour = generateField('hour')
  const day = generateField('day')
  const month = generateField('month')
  const weekday = generateField('weekday')

  let command = config.value.command || 'command'

  if (config.value.logOutput && config.value.logPath) {
    command += ` >> ${config.value.logPath} 2>&1`
  }

  return `${minute} ${hour} ${day} ${month} ${weekday} ${command}`
})

// 生成字段
const generateField = (field) => {
  switch (field) {
    case 'minute':
      switch (config.value.minuteType) {
        case '*': return '*'
        case 'specific': return config.value.specificMinutes.length > 0 ? config.value.specificMinutes.sort((a, b) => a - b).join(',') : '0'
        case 'range': return `${config.value.minuteRange.start}-${config.value.minuteRange.end}`
        case 'interval': return `*/${config.value.minuteInterval}`
        case 'list': return config.value.minuteList || '0'
        default: return '*'
      }
    case 'hour':
      switch (config.value.hourType) {
        case '*': return '*'
        case 'specific': return config.value.specificHours.length > 0 ? config.value.specificHours.sort((a, b) => a - b).join(',') : '0'
        case 'range': return `${config.value.hourRange.start}-${config.value.hourRange.end}`
        case 'interval': return `*/${config.value.hourInterval}`
        case 'list': return config.value.hourList || '0'
        default: return '*'
      }
    case 'day':
      switch (config.value.dayType) {
        case '*': return '*'
        case 'specific': return config.value.specificDays.length > 0 ? config.value.specificDays.sort((a, b) => a - b).join(',') : '1'
        case 'last': return 'L'
        default: return '*'
      }
    case 'month':
      switch (config.value.monthType) {
        case '*': return '*'
        case 'specific': return config.value.specificMonths.length > 0 ? config.value.specificMonths.sort((a, b) => a - b).join(',') : '1'
        default: return '*'
      }
    case 'weekday':
      return config.value.weekdays.length > 0 ? config.value.weekdays.sort((a, b) => a - b).join(',') : '*'
    default:
      return '*'
  }
}

// 执行频率说明
const frequencyDescription = computed(() => {
  const minute = config.value.minuteType
  const hour = config.value.hourType
  const day = config.value.dayType
  const month = config.value.monthType
  const weekday = config.value.weekdays

  if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday.length === 0) {
    return '每分钟执行一次'
  }

  let desc = []

  if (month !== '*') {
    if (config.value.specificMonths.length === 12) {
      desc.push('每月')
    } else {
      desc.push(`在 ${config.value.specificMonths.map(m => `${m}月`).join('、')} `)
    }
  } else {
    desc.push('每月')
  }

  if (weekday.length > 0) {
    if (weekday.length === 7) {
      desc.push('每天')
    } else {
      desc.push(`每周${weekday.map(w => weekdays[w]).join('、')}`)
    }
  } else if (day !== '*') {
    if (config.value.specificDays.length > 0) {
      if (config.value.specificDays.length === 31) {
        desc.push('每天')
      } else {
        desc.push(`每月${config.value.specificDays.join('、')}号`)
      }
    }
  } else {
    desc.push('每天')
  }

  if (hour !== '*') {
    if (config.value.specificHours.length > 0) {
      if (config.value.specificHours.length === 24) {
        desc.push('每小时')
      } else {
        desc.push(`在${config.value.specificHours.join('、')}点`)
      }
    } else {
      desc.push(`每${config.value.hourInterval}小时`)
    }
  } else if (minute !== '*') {
    desc.push('每小时')
  }

  if (minute !== '*') {
    if (config.value.specificMinutes.length > 0) {
      desc.push(`${config.value.specificMinutes.join('、')}分`)
    } else {
      desc.push(`每${config.value.minuteInterval}分钟`)
    }
  } else {
    desc.push('每分钟')
  }

  return desc.join('') + '执行'
})

// 下次执行时间
const nextExecutionTime = computed(() => {
  // 简化版计算，实际应该精确计算
  const now = new Date()
  const next = new Date(now.getTime() + 60000) // 假设1分钟后执行

  return next.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
})

// 常用示例
const examples = [
  {
    name: '每分钟执行',
    crontab: '* * * * * command',
    description: '每分钟执行一次命令'
  },
  {
    name: '每天凌晨2点执行',
    crontab: '0 2 * * * command',
    description: '每天凌晨2点执行'
  },
  {
    name: '工作日上午9点执行',
    crontab: '0 9 * * 1-5 command',
    description: '周一到周五上午9点执行'
  },
  {
    name: '每月1号凌晨执行',
    crontab: '0 0 1 * * command',
    description: '每月1号凌晨0点执行'
  },
  {
    name: '每15分钟执行',
    crontab: '*/15 * * * * command',
    description: '每隔15分钟执行一次'
  },
  {
    name: '每周日晚上11点',
    crontab: '0 23 * * 0 command',
    description: '每周日晚上11点执行'
  }
]

// 选择频率
const selectFrequency = (freq) => {
  selectedFrequency.value = freq

  // 重置配置
  config.value = {
    minuteType: '*',
    specificMinutes: [],
    minuteRange: { start: 0, end: 59 },
    minuteInterval: 5,
    minuteList: '',

    hourType: '*',
    specificHours: [],
    hourRange: { start: 0, end: 23 },
    hourInterval: 1,
    hourList: '',

    dayType: '*',
    specificDays: [],

    monthType: '*',
    specificMonths: [],

    weekdays: [],

    command: config.value.command || '',
    logOutput: config.value.logOutput || false,
    logPath: config.value.logPath || '/var/log/cron.log'
  }

  // 根据频率设置默认值
  switch (freq.value) {
    case 'every-hour':
      config.value.minuteType = 'specific'
      config.value.specificMinutes = [0]
      break
    case 'daily':
      config.value.minuteType = 'specific'
      config.value.specificMinutes = [0]
      config.value.hourType = 'specific'
      config.value.specificHours = [0]
      break
    case 'weekly':
      config.value.minuteType = 'specific'
      config.value.specificMinutes = [0]
      config.value.hourType = 'specific'
      config.value.specificHours = [0]
      config.value.weekdays = [0]
      break
    case 'workday':
      config.value.minuteType = 'specific'
      config.value.specificMinutes = [0]
      config.value.hourType = 'specific'
      config.value.specificHours = [9]
      config.value.weekdays = [1, 2, 3, 4, 5]
      break
    case 'monthly':
      config.value.minuteType = 'specific'
      config.value.specificMinutes = [0]
      config.value.hourType = 'specific'
      config.value.specificHours = [0]
      config.value.dayType = 'specific'
      config.value.specificDays = [1]
      break
  }
}

// 切换具体值
const toggleSpecific = (type, value) => {
  if (type === 'minutes') {
    const index = config.value.specificMinutes.indexOf(value)
    if (index > -1) {
      config.value.specificMinutes.splice(index, 1)
    } else {
      config.value.specificMinutes.push(value)
    }
  } else if (type === 'hours') {
    const index = config.value.specificHours.indexOf(value)
    if (index > -1) {
      config.value.specificHours.splice(index, 1)
    } else {
      config.value.specificHours.push(value)
    }
  }
}

// 切换星期
const toggleWeekday = (value) => {
  const index = config.value.weekdays.indexOf(value)
  if (index > -1) {
    config.value.weekdays.splice(index, 1)
  } else {
    config.value.weekdays.push(value)
  }
}

// 应用示例
const applyExample = (example) => {
  // 解析示例并设置配置
  const parts = example.crontab.split(' ')
  if (parts.length >= 5) {
    // 这里简化处理，实际应该更复杂
    config.value.command = 'command'

    // 根据示例设置配置
    if (parts[0] === '*' && parts[1] === '*') {
      selectFrequency(frequencies[0]) // 每分钟
    } else if (parts[0] === '0' && parts[1] === '2') {
      selectFrequency(frequencies[2]) // 每天
      config.value.specificHours = [2]
    } else if (parts[4] === '1-5') {
      selectFrequency(frequencies[6]) // 工作日
    } else if (parts[2] === '1') {
      selectFrequency(frequencies[4]) // 每月
    } else if (parts[0].includes('*/')) {
      selectFrequency(frequencies[7]) // 自定义
      const interval = parseInt(parts[0].substring(2))
      config.value.minuteType = 'interval'
      config.value.minuteInterval = interval
    }
  }
}

// 复制 Crontab
const copyCrontab = async () => {
  try {
    await navigator.clipboard.writeText(generatedCrontab.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// SEO配置
useSeoMeta({
  title: 'Crontab 生成器 - 在线定时任务生成工具',
  description: '免费的在线 Crontab 定时任务生成器，可视化配置生成定时任务表达式，支持多种执行频率和高级配置。',
  keywords: ['crontab', '定时任务', 'cron', 'linux', '表达式生成', '任务调度', '自动化']
})


</script>