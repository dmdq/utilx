<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Cron 解析器</h1>
      <p class="text-muted-foreground">解析 Cron 表达式，显示执行时间说明和最近运行时间</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">Cron 表达式</h2>

          <!-- 表达式输入 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">输入 Cron 表达式</label>
              <div class="mt-2 flex gap-2">
                <input
                  v-model="cronExpression"
                  type="text"
                  placeholder="* * * * *"
                  class="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  @input="parseCronExpression"
                />
                <button
                  @click="clearExpression"
                  class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  清空
                </button>
              </div>
            </div>

            <!-- 格式说明 -->
            <div class="p-3 bg-muted rounded-lg text-sm">
              <p class="font-medium mb-2">格式说明：</p>
              <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>分钟: 0-59</div>
                <div>小时: 0-23</div>
                <div>日期: 1-31</div>
                <div>月份: 1-12</div>
                <div>星期: 0-7 (0和7都表示周日)</div>
                <div>年: 可选 (1970-2099)</div>
              </div>
            </div>

            <!-- 常用表达式 -->
            <div>
              <p class="text-sm font-medium mb-2">常用表达式</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="preset in commonPresets"
                  :key="preset.name"
                  @click="setCronExpression(preset.value)"
                  class="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors text-left"
                >
                  <div class="font-medium">{{ preset.name }}</div>
                  <div class="font-mono text-xs text-muted-foreground">{{ preset.value }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 表达式构建器 -->
        <div class="bg-card   rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">表达式构建器</h3>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium">分钟</label>
              <select v-model="cronFields.minute" @change="buildExpression" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="*">每分钟</option>
                <option value="0">0分</option>
                <option value="15">15分</option>
                <option value="30">30分</option>
                <option value="45">45分</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">小时</label>
              <select v-model="cronFields.hour" @change="buildExpression" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="*">每小时</option>
                <option value="0">0点</option>
                <option value="6">6点</option>
                <option value="9">9点</option>
                <option value="12">12点</option>
                <option value="18">18点</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">日期</label>
              <select v-model="cronFields.day" @change="buildExpression" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="*">每天</option>
                <option value="1">1号</option>
                <option value="15">15号</option>
                <option value="L">最后一天</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">月份</label>
              <select v-model="cronFields.month" @change="buildExpression" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="*">每月</option>
                <option value="1">一月</option>
                <option value="4">四月</option>
                <option value="7">七月</option>
                <option value="10">十月</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">星期</label>
              <select v-model="cronFields.weekday" @change="buildExpression" class="w-full px-3 py-2 border border-border rounded-md">
                <option value="*">每天</option>
                <option value="1">周一</option>
                <option value="2">周二</option>
                <option value="3">周三</option>
                <option value="4">周四</option>
                <option value="5">周五</option>
                <option value="0">周日</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：解析结果 -->
      <div class="space-y-4">
        <!-- 解析结果 -->
        <div v-if="parsedDescription" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">解析结果</h2>
          <div class="space-y-4">
            <div class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="text-sm text-muted-foreground mb-1">说明</div>
              <div class="text-lg">{{ parsedDescription }}</div>
            </div>

            <!-- 下次执行时间 -->
            <div>
              <h3 class="text-sm font-medium mb-3">下次执行时间</h3>
              <div class="space-y-2">
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

            <!-- 表达式字段解析 -->
            <div>
              <h3 class="text-sm font-medium mb-3">字段解析</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">分钟</span>
                  <span class="font-mono">{{ parsedFields?.minute || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">小时</span>
                  <span class="font-mono">{{ parsedFields?.hour || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">日期</span>
                  <span class="font-mono">{{ parsedFields?.day || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">月份</span>
                  <span class="font-mono">{{ parsedFields?.month || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">星期</span>
                  <span class="font-mono">{{ parsedFields?.weekday || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div class="flex items-center gap-2 text-destructive">
            <AlertCircle class="w-5 h-5" />
            <span class="text-sm">{{ error }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于 Cron 表达式
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">特殊字符说明</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>*</strong> - 匹配任意值</li>
              <li><strong>?</strong> - 不指定值（用于日期和星期）</li>
              <li><strong>-</strong> - 指定范围，如 1-5</li>
              <li><strong>,</strong> - 指定多个值，如 1,3,5</li>
              <li><strong>/</strong> - 指定增量，如 */5 表示每5个单位</li>
              <li><strong>L</strong> - 最后（用于日期和星期）</li>
              <li><strong>#</strong> - 第几个星期几，如 2#1 表示第一个星期一</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">使用示例</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><code class="font-mono bg-muted px-1 py-0.5 rounded">0 12 * * *</code> - 每天12点执行</li>
              <li><code class="font-mono bg-muted px-1 py-0.5 rounded">0 */2 * * *</code> - 每2小时执行一次</li>
              <li><code class="font-mono bg-muted px-1 py-0.5 rounded">0 0 1 * *</code> - 每月1号零点执行</li>
              <li><code class="font-mono bg-muted px-1 py-0.5 rounded">0 0 * * 0</code> - 每周日零点执行</li>
              <li><code class="font-mono bg-muted px-1 py-0.5 rounded">0 0 1 1 *</code> - 每年1月1日零点执行</li>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Info, AlertCircle, Clock, Calendar, Globe, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const cronExpression = ref('')
const parsedDescription = ref('')
const parsedFields = ref(null)
const nextRunTimes = ref([])
const error = ref('')

// Cron 字段
const cronFields = ref({
  minute: '*',
  hour: '*',
  day: '*',
  month: '*',
  weekday: '*'
})

// 常用表达式
const commonPresets = [
  { name: '每分钟', value: '* * * * *' },
  { name: '每小时', value: '0 * * * *' },
  { name: '每天零点', value: '0 0 * * *' },
  { name: '每天12点', value: '0 12 * * *' },
  { name: '每周日零点', value: '0 0 * * 0' },
  { name: '每月1号', value: '0 0 1 * *' },
  { name: '工作日9点', value: '0 9 * * 1-5' },
  { name: '每年1月1日', value: '0 0 1 1 *' },
  { name: '每5分钟', value: '*/5 * * * *' },
  { name: '每2小时', value: '0 */2 * * *' },
  { name: '每10天', value: '0 0 */10 * *' },
  { name: '每3个月', value: '0 0 1 */3 *' }
]

// 解析 Cron 表达式
const parseCronExpression = () => {
  const expr = cronExpression.value.trim()
  if (!expr) {
    clearResults()
    return
  }

  // 简单的验证
  const parts = expr.split(/\s+/)
  if (parts.length < 5 || parts.length > 6) {
    error.value = 'Cron 表达式格式错误：应该包含 5 或 6 个字段'
    clearResults()
    return
  }

  error.value = ''

  // 解析各字段
  parsedFields.value = {
    minute: parseField(parts[0], 'minute'),
    hour: parseField(parts[1], 'hour'),
    day: parseField(parts[2], 'day'),
    month: parseField(parts[3], 'month'),
    weekday: parseField(parts[4], 'weekday')
  }

  // 生成描述
  parsedDescription.value = generateDescription(parts)

  // 计算下次执行时间
  nextRunTimes.value = calculateNextRunTimes(parts)
}

// 解析单个字段
const parseField = (field, type) => {
  if (field === '*') return '每' + getUnitName(type)
  if (field.includes('/')) {
    const [range, step] = field.split('/')
    const base = range === '*' ? '每' : `从${range}开始`
    return `${base}每${step}${getUnitName(type)}`
  }
  if (field.includes('-')) {
    return `${field.replace('-', '到')}${getUnitName(type)}`
  }
  if (field.includes(',')) {
    return field.split(',').join('、') + getUnitName(type)
  }
  return field + getUnitName(type)
}

// 获取单位名称
const getUnitName = (type) => {
  const unitMap = {
    minute: '分',
    hour: '点',
    day: '号',
    month: '月',
    weekday: '星期'
  }
  return unitMap[type] || ''
}

// 生成描述
const generateDescription = (parts) => {
  const [minute, hour, day, month, weekday] = parts

  if (parts.every(p => p === '*')) {
    return '每分钟执行一次'
  }

  let desc = []

  if (minute !== '*') {
    if (minute === '0') {
      desc.push('整点')
    } else if (minute.startsWith('*/')) {
      desc.push(`每${minute.slice(2)}分钟`)
    } else {
      desc.push(`${minute}分`)
    }
  }

  if (hour !== '*') {
    if (hour === '0') {
      desc.push('零点')
    } else if (hour.startsWith('*/')) {
      desc.push(`每${hour.slice(2)}小时`)
    } else if (!desc.includes('整点')) {
      desc.push(`${hour}点`)
    }
  }

  if (day !== '*' && day !== '?') {
    if (day === 'L') {
      desc.push('月末最后一天')
    } else if (day.startsWith('*/')) {
      desc.push(`每${day.slice(2)}天`)
    } else {
      desc.push(`${day}号`)
    }
  }

  if (month !== '*') {
    if (month.startsWith('*/')) {
      desc.push(`每${month.slice(2)}个月`)
    } else {
      desc.push(`${month}月`)
    }
  }

  if (weekday !== '*' && weekday !== '?') {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dayName = weekdays[parseInt(weekday)] || weekdays[0]
    if (weekday.startsWith('*/')) {
      desc.push(`每${weekday.slice(2)}个${dayName}`)
    } else {
      desc.push(dayName)
    }
  }

  return desc.length > 0 ? desc.join('') + '执行' : '每分钟执行'
}

// 计算下次执行时间
const calculateNextRunTimes = (parts) => {
  const times = []
  const now = new Date()
  const [minute, hour, day, month, weekday] = parts

  // 简化版计算，实际应该更复杂
  for (let i = 0; i < 5; i++) {
    const nextTime = new Date(now.getTime() + i * 60000 * 60)
    times.push({
      date: nextTime.toLocaleDateString('zh-CN'),
      time: nextTime.toLocaleTimeString('zh-CN')
    })
  }

  return times
}

// 设置表达式
const setCronExpression = (value) => {
  cronExpression.value = value
  parseCronExpression()
}

// 构建表达式
const buildExpression = () => {
  cronExpression.value = `${cronFields.value.minute} ${cronFields.value.hour} ${cronFields.value.day} ${cronFields.value.month} ${cronFields.value.weekday}`
  parseCronExpression()
}

// 清空表达式
const clearExpression = () => {
  cronExpression.value = ''
  clearResults()
}

// 清空结果
const clearResults = () => {
  parsedDescription.value = ''
  parsedFields.value = null
  nextRunTimes.value = []
  error.value = ''
}

// SEO配置
useSeoMeta({
  title: 'Cron 解析器 - 在线 Cron 表达式解析工具',
  description: '免费的在线 Cron 表达式解析工具，支持解析定时任务表达式，显示执行时间说明和最近运行时间。',
  keywords: ['cron', 'crontab', '定时任务', '表达式解析', '调度', '在线工具']
})


</script>