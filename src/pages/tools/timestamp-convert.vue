<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">时间戳转换器</h1>
      <p class="text-muted-foreground">Unix时间戳与日期时间相互转换，支持多种时间格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：时间戳转换 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">时间戳转换</h2>

          <!-- 当前时间戳 -->
          <div class="mb-4 p-4 bg-muted rounded-lg">
            <div class="text-sm text-muted-foreground mb-1">当前时间戳</div>
            <div class="text-2xl font-mono">{{ currentTimestamp }}</div>
            <div class="text-sm text-muted-foreground mt-1">{{ currentDateTime }}</div>
          </div>

          <!-- 时间戳输入 -->
          <div class="space-y-3">
            <label class="text-sm font-medium">Unix 时间戳（秒）</label>
            <input
              v-model="timestampSeconds"
              type="number"
              placeholder="输入10位时间戳"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              @input="updateTimestampFromSeconds"
            />
          </div>

          <div class="space-y-3">
            <label class="text-sm font-medium">Unix 时间戳（毫秒）</label>
            <input
              v-model="timestampMilliseconds"
              type="number"
              placeholder="输入13位时间戳"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              @input="updateTimestampFromMilliseconds"
            />
          </div>

          <!-- 转换结果 -->
          <div v-if="timestampDate" class="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div class="text-sm text-muted-foreground mb-2">转换结果</div>
            <div class="text-lg font-semibold">{{ timestampDate }}</div>
            <div class="text-sm text-muted-foreground mt-1">{{ timestampTime }}</div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="bg-card   rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">快捷操作</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="setCurrentTimestamp"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              当前时间
            </button>
            <button
              @click="setTodayStart"
              class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
            >
              今日零点
            </button>
            <button
              @click="setTodayEnd"
              class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
            >
              今日23:59
            </button>
            <button
              @click="setYesterdayTimestamp"
              class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
            >
              昨天此时
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：日期时间选择器 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">日期时间选择</h2>

          <!-- 日期时间输入 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">选择日期时间</label>
              <input
                v-model="selectedDateTime"
                type="datetime-local"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="updateTimestampFromDateTime"
              />
            </div>

            <!-- 格式化显示 -->
            <div v-if="selectedTimestamp" class="mt-4 space-y-3">
              <div class="p-4 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">Unix 时间戳（秒）</div>
                <div class="font-mono">{{ selectedTimestampSeconds }}</div>
              </div>
              <div class="p-4 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">Unix 时间戳（毫秒）</div>
                <div class="font-mono">{{ selectedTimestampMilliseconds }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 时区信息 -->
        <div class="bg-card   rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">时区信息</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm">本地时区</span>
              <span class="text-sm font-mono">{{ timezone }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">UTC 偏移</span>
              <span class="text-sm font-mono">{{ utcOffset }}</span>
            </div>
          </div>
        </div>

        <!-- 常用时间戳参考 -->
        <div class="bg-card   rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">常用时间戳参考</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center p-2 hover:bg-muted/50 rounded cursor-pointer" @click="setTimestamp(0)">
              <span>1970-01-01 00:00:00 UTC</span>
              <span class="font-mono">0</span>
            </div>
            <div class="flex justify-between items-center p-2 hover:bg-muted/50 rounded cursor-pointer" @click="setTimestamp(86400)">
              <span>1970-01-02 00:00:00 UTC</span>
              <span class="font-mono">86400</span>
            </div>
            <div class="flex justify-between items-center p-2 hover:bg-muted/50 rounded cursor-pointer" @click="setTimestamp(2592000)">
              <span>1970-01-31 00:00:00 UTC</span>
              <span class="font-mono">2592000</span>
            </div>
            <div class="flex justify-between items-center p-2 hover:bg-muted/50 rounded cursor-pointer" @click="setTimestamp(31536000)">
              <span>1971-01-01 00:00:00 UTC</span>
              <span class="font-mono">31536000</span>
            </div>
            <div class="flex justify-between items-center p-2 hover:bg-muted/50 rounded cursor-pointer" @click="setTimestamp(946684800)">
              <span>2000-01-01 00:00:00 UTC</span>
              <span class="font-mono">946684800</span>
            </div>
            <div class="flex justify-between items-center p-2 hover:bg-muted/50 rounded cursor-pointer" @click="setTimestamp(currentTimestamp)">
              <span class="text-muted-foreground">当前</span>
              <span class="font-mono">{{ currentTimestamp }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量转换 -->
    <div class="mt-8 bg-card   rounded-lg p-6">
      <h2 class="text-lg font-semibold mb-4">批量转换</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 批量时间戳输入 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium">时间戳列表（每行一个）</label>
            <button
              @click="clearBatchInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
          <textarea
            v-model="batchTimestamps"
            placeholder="输入多个时间戳，每行一个&#10;例如：&#10;1609459200&#10;1609545600"
            class="w-full h-40 p-3 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          ></textarea>
          <button
            @click="convertBatchTimestamps"
            class="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            转换
          </button>
        </div>

        <!-- 批量转换结果 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium">转换结果</label>
            <button
              v-if="batchResults.length > 0"
              @click="copyBatchResults"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ batchCopied ? '已复制' : '复制' }}
            </button>
          </div>
          <div class="h-40 p-3 bg-muted rounded-lg overflow-auto">
            <div v-if="batchResults.length === 0" class="text-muted-foreground text-sm">
              转换结果将显示在这里
            </div>
            <div v-else class="space-y-1 text-sm">
              <div
                v-for="(result, index) in batchResults"
                :key="index"
                class="flex justify-between items-center p-1 hover:bg-background rounded"
              >
                <span class="font-mono">{{ result.timestamp }}</span>
                <span>{{ result.date }}</span>
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
          关于时间戳
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">什么是 Unix 时间戳？</h4>
            <p>Unix 时间戳（Unix Timestamp）是一种时间表示方式，定义为从格林威治时间1970年1月1日00:00:00开始所经过的秒数。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">时间戳格式</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>10位时间戳</strong>：精确到秒，如：1609459200</li>
              <li><strong>13位时间戳</strong>：精确到毫秒，如：1609459200000</li>
              <li><strong>JavaScript时间戳</strong>：通常是13位毫秒时间戳</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">常见用途</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>程序开发和调试</li>
              <li>数据库时间字段存储</li>
              <li>API 接口时间参数</li>
              <li>缓存失效时间设置</li>
            </ul>
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
            <Calendar class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Cron 解析器</p>
              <p class="text-xs text-muted-foreground">解析定时任务表达式</p>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Info, Calendar, Globe, Calculator, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const timestampSeconds = ref('')
const timestampMilliseconds = ref('')
const timestampDate = ref('')
const timestampTime = ref('')
const selectedDateTime = ref('')
const selectedTimestampSeconds = ref('')
const selectedTimestampMilliseconds = ref('')
const batchTimestamps = ref('')
const batchResults = ref([])
const batchCopied = ref(false)

// 计算属性
const currentTimestamp = computed(() => Math.floor(Date.now() / 1000))
const currentDateTime = computed(() => new Date().toLocaleString('zh-CN'))
const timezone = computed(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
const utcOffset = computed(() => {
  const offset = new Date().getTimezoneOffset()
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  const sign = offset >= 0 ? '+' : '-'
  return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

// 更新时间戳显示
const updateTimestampDisplay = (timestamp) => {
  if (timestamp) {
    const date = new Date(timestamp)
    timestampDate.value = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    timestampTime.value = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } else {
    timestampDate.value = ''
    timestampTime.value = ''
  }
}

// 从秒更新时间戳
const updateTimestampFromSeconds = () => {
  const ts = parseInt(timestampSeconds.value)
  if (!isNaN(ts)) {
    timestampMilliseconds.value = ts * 1000
    updateTimestampDisplay(ts * 1000)
  }
}

// 从毫秒更新时间戳
const updateTimestampFromMilliseconds = () => {
  const ts = parseInt(timestampMilliseconds.value)
  if (!isNaN(ts)) {
    timestampSeconds.value = Math.floor(ts / 1000)
    updateTimestampDisplay(ts)
  }
}

// 从日期时间更新时间戳
const updateTimestampFromDateTime = () => {
  if (selectedDateTime.value) {
    const date = new Date(selectedDateTime.value)
    selectedTimestampMilliseconds.value = date.getTime()
    selectedTimestampSeconds.value = Math.floor(date.getTime() / 1000)
  }
}

// 设置当前时间戳
const setCurrentTimestamp = () => {
  const now = Date.now()
  timestampSeconds.value = Math.floor(now / 1000)
  timestampMilliseconds.value = now
  updateTimestampDisplay(now)
}

// 设置今日开始
const setTodayStart = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  timestampSeconds.value = Math.floor(today.getTime() / 1000)
  timestampMilliseconds.value = today.getTime()
  updateTimestampDisplay(today.getTime())
}

// 设置今日结束
const setTodayEnd = () => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  timestampSeconds.value = Math.floor(today.getTime() / 1000)
  timestampMilliseconds.value = today.getTime()
  updateTimestampDisplay(today.getTime())
}

// 设置昨天时间戳
const setYesterdayTimestamp = () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  timestampSeconds.value = Math.floor(yesterday.getTime() / 1000)
  timestampMilliseconds.value = yesterday.getTime()
  updateTimestampDisplay(yesterday.getTime())
}

// 设置指定时间戳
const setTimestamp = (ts) => {
  timestampSeconds.value = ts
  timestampMilliseconds.value = ts * 1000
  updateTimestampDisplay(ts * 1000)
}

// 批量转换时间戳
const convertBatchTimestamps = () => {
  const lines = batchTimestamps.value.split('\n').filter(line => line.trim())
  batchResults.value = lines.map(line => {
    const ts = parseInt(line.trim())
    const date = new Date(ts * 1000)
    return {
      timestamp: ts,
      date: date.toLocaleString('zh-CN')
    }
  })
}

// 清空批量输入
const clearBatchInput = () => {
  batchTimestamps.value = ''
  batchResults.value = []
}

// 复制批量结果
const copyBatchResults = async () => {
  const text = batchResults.value.map(r => `${r.timestamp} - ${r.date}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    batchCopied.value = true
    setTimeout(() => {
      batchCopied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    batchCopied.value = true
    setTimeout(() => {
      batchCopied.value = false
    }, 2000)
  }
}

// 定时更新当前时间
let timer = null
onMounted(() => {
  setCurrentTimestamp()
  timer = setInterval(() => {
    setCurrentTimestamp()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// SEO配置
useSeoMeta({
  title: '时间戳转换器 - 在线Unix时间戳转换工具',
  description: '免费在线时间戳转换工具，支持Unix时间戳与日期时间相互转换，提供批量转换和常用时间戳参考。',
  keywords: ['timestamp', 'unix', '时间戳', '时间转换', '在线工具', 'utc', 'gmt']
})


</script>