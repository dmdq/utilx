<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">时区转换器</h1>
      <p class="text-muted-foreground">在全球不同时区之间转换时间，支持夏令时自动调整</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入时间 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">源时区</h2>

          <!-- 日期时间输入 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">日期</label>
              <input
                v-model="sourceDate"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @change="convertTime"
              />
            </div>

            <div>
              <label class="text-sm font-medium">时间</label>
              <input
                v-model="sourceTime"
                type="time"
                step="1"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="convertTime"
              />
            </div>

            <!-- 源时区选择 -->
            <div>
              <label class="text-sm font-medium">时区</label>
              <select
                v-model="sourceTimezone"
                @change="convertTime"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              >
                <option value="">选择时区</option>
                <optgroup
                  v-for="group in timezoneGroups"
                  :key="group.name"
                  :label="group.name"
                >
                  <option
                    v-for="tz in group.timezones"
                    :key="tz.value"
                    :value="tz.value"
                  >
                    {{ tz.label }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- 快捷按钮 -->
            <div class="flex gap-2">
              <button
                @click="setCurrentTime"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                当前时间
              </button>
              <button
                @click="swapTimezones"
                class="flex-1 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors text-sm"
              >
                交换时区
              </button>
            </div>
          </div>
        </div>

        <!-- 目标时区 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">目标时区</h2>

          <!-- 目标时区选择 -->
          <div>
            <label class="text-sm font-medium">时区</label>
            <select
              v-model="targetTimezone"
              @change="convertTime"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
            >
              <option value="">选择时区</option>
              <optgroup
                v-for="group in timezoneGroups"
                :key="group.name"
                :label="group.name"
              >
                <option
                  v-for="tz in group.timezones"
                  :key="tz.value"
                  :value="tz.value"
                >
                  {{ tz.label }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- 转换结果 -->
          <div v-if="targetDateTime" class="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div class="text-sm text-muted-foreground mb-2">转换结果</div>
            <div class="text-xl font-semibold mb-1">{{ targetDate }}</div>
            <div class="text-lg font-mono">{{ targetTime }}</div>
            <div class="text-sm text-muted-foreground mt-2">{{ targetTimezoneLabel }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：比较和批量转换 -->
      <div class="space-y-4">
        <!-- 时差信息 -->
        <div v-if="timeDifference !== null" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">时差信息</h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm">时差</span>
              <span class="font-mono">{{ timeDifference > 0 ? '+' : '' }}{{ timeDifference }}小时</span>
            </div>
            <div class="p-3 bg-muted rounded-lg text-sm">
              <p>{{ sourceTimezoneLabel }}比{{ targetTimezoneLabel }}</p>
              <p class="font-semibold mt-1">
                {{ timeDifference > 0 ? '快' : '慢' }}{{ Math.abs(timeDifference) }}小时
              </p>
            </div>
          </div>
        </div>

        <!-- 多时区对比 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">多时区对比</h2>
          <div class="space-y-3">
            <div
              v-for="tz in popularTimezones"
              :key="tz.value"
              class="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <div>
                <div class="font-medium text-sm">{{ tz.name }}</div>
                <div class="text-xs text-muted-foreground">{{ tz.label }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm">{{ getTimeInTimezone(tz.value) }}</div>
                <div class="text-xs text-muted-foreground">{{ getTimeDifference(tz.value) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 会议规划器 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">会议规划器</h2>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">选择参会时区</label>
              <div class="mt-2 space-y-2">
                <div
                  v-for="tz in selectedTimezones"
                  :key="tz"
                  class="flex items-center gap-2"
                >
                  <span class="text-sm flex-1">{{ getTimezoneLabel(tz) }}</span>
                  <button
                    @click="removeTimezone(tz)"
                    class="px-2 py-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    移除
                  </button>
                </div>
              </div>
              <select
                @change="addTimezone($event.target.value)"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              >
                <option value="">添加参会者时区</option>
                <option
                  v-for="tz in availableTimezones"
                  :key="tz.value"
                  :value="tz.value"
                >
                  {{ tz.label }}
                </option>
              </select>
            </div>

            <!-- 最佳会议时间 -->
            <div v-if="selectedTimezones.length > 0" class="space-y-2">
              <label class="text-sm font-medium">最佳会议时间</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="time in suggestedMeetingTimes"
                  :key="time.time"
                  @click="setMeetingTime(time)"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm transition-colors"
                >
                  {{ time.time }}
                </button>
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
          关于时区
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">常用时区缩写</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div><strong>UTC</strong> - 协调世界时</div>
              <div><strong>GMT</strong> - 格林威治标准时间</div>
              <div><strong>EST</strong> - 美国东部标准时间</div>
              <div><strong>CST</strong> - 中国标准时间</div>
              <div><strong>JST</strong> - 日本标准时间</div>
              <div><strong>CET</strong> - 中欧时间</div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">夏令时</h4>
            <p>部分地区在夏季会将时间调快一小时以充分利用日照时间，称为夏令时（Daylight Saving Time）。本工具会自动处理夏令时转换。</p>
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
            to="/tools/cron-parser"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Calendar class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Cron 解析器</p>
              <p class="text-xs text-muted-foreground">解析定时任务表达式</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/date-calculator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Calculator class="w-5 h-5 text-primary" />
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
import { ref, computed, onMounted } from 'vue'
import { Info, Clock, Calendar, Calculator, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const sourceDate = ref(new Date().toISOString().split('T')[0])
const sourceTime = ref(new Date().toTimeString().split(' ')[0].substring(0, 8))
const sourceTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone)
const targetTimezone = ref('Asia/Shanghai')
const targetDateTime = ref('')
const selectedTimezones = ref(['America/New_York', 'Europe/London', 'Asia/Tokyo'])

// 时区分组
const timezoneGroups = [
  {
    name: '亚洲',
    timezones: [
      { value: 'Asia/Shanghai', label: '中国标准时间 (CST) UTC+8' },
      { value: 'Asia/Tokyo', label: '日本标准时间 (JST) UTC+9' },
      { value: 'Asia/Seoul', label: '韩国标准时间 (KST) UTC+9' },
      { value: 'Asia/Singapore', label: '新加坡时间 (SGT) UTC+8' },
      { value: 'Asia/Hong_Kong', label: '香港时间 (HKT) UTC+8' },
      { value: 'Asia/Taipei', label: '台北时间 (CST) UTC+8' },
      { value: 'Asia/Dubai', label: '迪拜时间 (GST) UTC+4' },
      { value: 'Asia/Kolkata', label: '印度标准时间 (IST) UTC+5:30' },
      { value: 'Asia/Bangkok', label: '曼谷时间 (ICT) UTC+7' }
    ]
  },
  {
    name: '欧洲',
    timezones: [
      { value: 'Europe/London', label: '格林威治时间 (GMT/BST) UTC+0/+1' },
      { value: 'Europe/Paris', label: '中欧时间 (CET/CEST) UTC+1/+2' },
      { value: 'Europe/Berlin', label: '德国时间 (CET/CEST) UTC+1/+2' },
      { value: 'Europe/Moscow', label: '莫斯科时间 (MSK) UTC+3' },
      { value: 'Europe/Madrid', label: '西班牙时间 (CET/CEST) UTC+1/+2' },
      { value: 'Europe/Rome', label: '意大利时间 (CET/CEST) UTC+1/+2' },
      { value: 'Europe/Amsterdam', label: '阿姆斯特丹时间 (CET/CEST) UTC+1/+2' }
    ]
  },
  {
    name: '美洲',
    timezones: [
      { value: 'America/New_York', label: '美国东部时间 (EST/EDT) UTC-5/-4' },
      { value: 'America/Los_Angeles', label: '美国西部时间 (PST/PDT) UTC-8/-7' },
      { value: 'America/Chicago', label: '美国中部时间 (CST/CDT) UTC-6/-5' },
      { value: 'America/Denver', label: '美国山地时间 (MST/MDT) UTC-7/-6' },
      { value: 'America/Toronto', label: '多伦多时间 (EST/EDT) UTC-5/-4' },
      { value: 'America/Vancouver', label: '温哥华时间 (PST/PDT) UTC-8/-7' },
      { value: 'America/Mexico_City', label: '墨西哥城时间 (CST/CDT) UTC-6/-5' },
      { value: 'America/Sao_Paulo', label: '圣保罗时间 (BRT) UTC-3' }
    ]
  },
  {
    name: '大洋洲',
    timezones: [
      { value: 'Australia/Sydney', label: '悉尼时间 (AEST/AEDT) UTC+10/+11' },
      { value: 'Australia/Melbourne', label: '墨尔本时间 (AEST/AEDT) UTC+10/+11' },
      { value: 'Pacific/Auckland', label: '奥克兰时间 (NZST/NZDT) UTC+12/+13' }
    ]
  },
  {
    name: '其他',
    timezones: [
      { value: 'UTC', label: '协调世界时 (UTC) UTC+0' },
      { value: 'Africa/Johannesburg', label: '约翰内斯堡时间 (SAST) UTC+2' },
      { value: 'Asia/Kolkata', label: '印度标准时间 (IST) UTC+5:30' }
    ]
  }
]

// 热门时区
const popularTimezones = [
  { name: '北京', value: 'Asia/Shanghai', label: 'CST' },
  { name: '纽约', value: 'America/New_York', label: 'EST/EDT' },
  { name: '伦敦', value: 'Europe/London', label: 'GMT/BST' },
  { name: '东京', value: 'Asia/Tokyo', label: 'JST' },
  { name: '巴黎', value: 'Europe/Paris', label: 'CET/CEST' },
  { name: '悉尼', value: 'Australia/Sydney', label: 'AEST/AEDT' }
]

// 计算属性
const sourceTimezoneLabel = computed(() => {
  if (!sourceTimezone.value) return ''
  const tz = timezoneGroups.flatMap(g => g.timezones).find(t => t.value === sourceTimezone.value)
  return tz ? tz.label : ''
})

const targetTimezoneLabel = computed(() => {
  if (!targetTimezone.value) return ''
  const tz = timezoneGroups.flatMap(g => g.timezones).find(t => t.value === targetTimezone.value)
  return tz ? tz.label : ''
})

const targetDate = computed(() => {
  if (!targetDateTime.value) return ''
  return targetDateTime.value.toLocaleDateString('zh-CN')
})

const targetTime = computed(() => {
  if (!targetDateTime.value) return ''
  return targetDateTime.value.toLocaleTimeString('zh-CN')
})

const timeDifference = computed(() => {
  if (!sourceTimezone.value || !targetTimezone.value) return null

  const now = new Date()
  const sourceOffset = getTimezoneOffset(sourceTimezone.value, now)
  const targetOffset = getTimezoneOffset(targetTimezone.value, now)

  return (targetOffset - sourceOffset) / 60
})

// 可用时区（未选择的）
const availableTimezones = computed(() => {
  const allTz = timezoneGroups.flatMap(g => g.timezones)
  return allTz.filter(tz => !selectedTimezones.value.includes(tz.value))
})

// 建议的会议时间
const suggestedMeetingTimes = computed(() => {
  return [
    { time: '09:00', label: '早上9点' },
    { time: '10:00', label: '早上10点' },
    { time: '14:00', label: '下午2点' },
    { time: '15:00', label: '下午3点' }
  ]
})

// 获取时区偏移量
const getTimezoneOffset = (timezone, date) => {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  return (tzDate - utcDate) / (1000 * 60)
}

// 获取指定时区的时间
const getTimeInTimezone = (timezone) => {
  if (!sourceDate.value || !sourceTime.value) return '-'

  const dateTime = new Date(`${sourceDate.value}T${sourceTime.value}`)
  return dateTime.toLocaleTimeString('zh-CN', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取时差
const getTimeDifference = (timezone) => {
  if (!sourceTimezone.value) return '-'

  const now = new Date()
  const sourceOffset = getTimezoneOffset(sourceTimezone.value, now)
  const targetOffset = getTimezoneOffset(timezone, now)
  const diff = (targetOffset - sourceOffset) / 60

  return diff > 0 ? `+${diff}h` : `${diff}h`
}

// 获取时区标签
const getTimezoneLabel = (timezone) => {
  const tz = timezoneGroups.flatMap(g => g.timezones).find(t => t.value === timezone)
  return tz ? tz.label.split(' ')[0] : timezone
}

// 转换时间
const convertTime = () => {
  if (!sourceDate.value || !sourceTime.value || !sourceTimezone.value || !targetTimezone.value) {
    targetDateTime.value = null
    return
  }

  const sourceDateTime = new Date(`${sourceDate.value}T${sourceTime.value}`)

  // 转换为目标时区的时间
  const targetTime = sourceDateTime.toLocaleString('zh-CN', {
    timeZone: targetTimezone.value,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  targetDateTime.value = new Date(targetTime.replace(/\//g, '-'))
}

// 设置当前时间
const setCurrentTime = () => {
  const now = new Date()
  sourceDate.value = now.toISOString().split('T')[0]
  sourceTime.value = now.toTimeString().split(' ')[0].substring(0, 8)
  sourceTimezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
  convertTime()
}

// 交换时区
const swapTimezones = () => {
  const temp = sourceTimezone.value
  sourceTimezone.value = targetTimezone.value
  targetTimezone.value = temp
  convertTime()
}

// 添加时区
const addTimezone = (value) => {
  if (value && !selectedTimezones.value.includes(value)) {
    selectedTimezones.value.push(value)
  }
}

// 移除时区
const removeTimezone = (value) => {
  const index = selectedTimezones.value.indexOf(value)
  if (index > -1) {
    selectedTimezones.value.splice(index, 1)
  }
}

// 设置会议时间
const setMeetingTime = (time) => {
  sourceTime.value = time + ':00'
  convertTime()
}

// SEO配置
useSeoMeta({
  title: '时区转换器 - 在线全球时区时间转换工具',
  description: '免费的在线时区转换工具，支持在全球不同时区之间转换时间，自动处理夏令时，包含会议规划器功能。',
  keywords: ['timezone', '时区', '时间转换', 'utc', 'gmt', '夏令时', '会议时间', '在线工具']
})



// 初始化
onMounted(() => {
  convertTime()
})
</script>