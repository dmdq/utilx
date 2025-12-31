<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">时间戳批量转换工具</h1>
      <p class="text-gray-600 dark:text-gray-400">同时处理多个Unix时间戳，支持秒和毫秒格式，批量转换为可读日期时间</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-blue-500" />
          输入时间戳
        </h2>

        <!-- 输入选项 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">时间戳格式</label>
          <div class="flex gap-2">
            <button
              @click="inputFormat = 'auto'"
              :class="['px-3 py-1 text-sm rounded', inputFormat === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              自动识别
            </button>
            <button
              @click="inputFormat = 'seconds'"
              :class="['px-3 py-1 text-sm rounded', inputFormat === 'seconds' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              秒 (10位)
            </button>
            <button
              @click="inputFormat = 'milliseconds'"
              :class="['px-3 py-1 text-sm rounded', inputFormat === 'milliseconds' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              毫秒 (13位)
            </button>
          </div>
        </div>

        <!-- 批量输入 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输入时间戳 (每行一个)</label>
          <textarea
            v-model="inputText"
            rows="12"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            placeholder="输入Unix时间戳，每行一个，例如：&#10;1704067200&#10;1704153600&#10;1704240000&#10;..."
          ></textarea>
          <div class="flex justify-between mt-2">
            <span class="text-sm text-gray-500">已输入: {{ lineCount }} 行</span>
            <div class="flex gap-2">
              <button
                @click="pasteFromClipboard"
                class="text-sm text-blue-500 hover:text-blue-700"
              >
                粘贴
              </button>
              <button
                @click="loadSample"
                class="text-sm text-green-500 hover:text-green-700"
              >
                示例
              </button>
              <button
                @click="clearInput"
                class="text-sm text-red-500 hover:text-red-700"
              >
                清空
              </button>
            </div>
          </div>
        </div>

        <!-- 输出选项 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输出格式</label>
          <select
            v-model="outputFormat"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="iso8601">ISO 8601 (YYYY-MM-DD HH:mm:ss)</option>
            <option value="ymd">年-月-日 时:分:秒</option>
            <option value="mdy">月/日/年 时:分:秒 AM/PM</option>
            <option value="dmy">日/月/年 时:分:秒</option>
            <option value="custom">自定义格式</option>
          </select>
        </div>

        <!-- 自定义格式 -->
        <div v-if="outputFormat === 'custom'" class="mb-4">
          <label class="block text-sm font-medium mb-2">自定义格式</label>
          <input
            v-model="customFormat"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            placeholder="例如: YYYY年MM月DD日 HH:mm:ss"
          >
          <div class="text-xs text-gray-500 mt-1">
            支持占位符: YYYY(年), MM(月), DD(日), HH(时), mm(分), ss(秒)
          </div>
        </div>

        <!-- 时区选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">时区</label>
          <select
            v-model="timezone"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="local">本地时区</option>
            <option value="UTC">UTC (协调世界时)</option>
            <option value="Asia/Shanghai">中国 (UTC+8)</option>
            <option value="America/New_York">纽约 (EST/EDT)</option>
            <option value="Europe/London">伦敦 (GMT/BST)</option>
            <option value="Asia/Tokyo">东京 (JST)</option>
          </select>
        </div>

        <!-- 转换按钮 -->
        <button
          @click="convert"
          :disabled="!inputText || lineCount === 0"
          class="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-5 h-5" />
          批量转换
        </button>
      </div>

      <!-- 输出区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-green-500" />
          转换结果
          <span v-if="results.length > 0" class="text-sm font-normal text-gray-500">
            ({{ results.length }} 条)
          </span>
        </h2>

        <!-- 操作按钮 -->
        <div v-if="results.length > 0" class="mb-4 flex gap-2">
          <button
            @click="copyAllResults"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Copy class="w-4 h-4" />
            复制全部
          </button>
          <button
            @click="exportToFile"
            class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Download class="w-4 h-4" />
            导出文件
          </button>
          <button
            @click="clearResults"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
          >
            清空
          </button>
        </div>

        <!-- 结果列表 -->
        <div v-if="results.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="(item, index) in results"
            :key="index"
            class="p-3 border dark:border-gray-700 rounded-lg"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <div class="text-xs text-gray-500 mb-1">第 {{ index + 1 }} 条</div>
                <div class="flex items-center gap-2">
                  <code class="text-sm font-mono text-blue-600 break-all">{{ item.original }}</code>
                  <span v-if="item.detectedFormat" class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-blue-600">
                    {{ item.detectedFormat }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <ArrowRight class="w-4 h-4 text-gray-400" />
                <div class="text-sm font-medium">{{ item.converted }}</div>
              </div>
              <button
                @click="copyResult(item.converted)"
                class="text-gray-400 hover:text-gray-600"
                title="复制"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="errors.length > 0" class="mb-4">
          <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 class="text-sm font-medium text-red-800 dark:text-red-300 mb-2">转换失败 ({{ errors.length }} 条)</h4>
            <div class="text-xs text-red-700 dark:text-red-400 space-y-1">
              <div v-for="(error, index) in errors" :key="index">
                第 {{ error.line }} 行: {{ error.value }} - {{ error.message }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="results.length === 0 && errors.length === 0" class="text-center py-8 text-gray-500">
          <Clock class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>输入时间戳后点击"批量转换"</p>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="results.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart class="w-5 h-5 text-indigo-500" />
        统计信息
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">{{ results.length }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">成功转换</div>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">{{ formatCounts.seconds }}秒</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">秒格式</div>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">{{ formatCounts.milliseconds }}毫秒</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">毫秒格式</div>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-600">{{ errors.length }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">转换失败</div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">使用说明</h2>

      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3">支持的输入格式</h3>
          <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>十位时间戳 (秒): 1704067200</li>
            <li>十三位时间戳 (毫秒): 1704067200000</li>
            <li>自动识别: 工具会自动判断是秒还是毫秒</li>
          </ul>
        </div>

        <div>
          <h3 class="font-medium mb-3">应用场景</h3>
          <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>日志文件中时间戳批量转换</li>
            <li>数据库导出时间戳批量格式化</li>
            <li>API返回数据中的时间戳处理</li>
            <li>监控数据的时间分析</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/timestamp-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Clock class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">时间戳转换</h3>
          <p class="text-sm text-gray-500">单个时间戳转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/date-formatter" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">日期格式化</h3>
          <p class="text-sm text-gray-500">多种日期格式</p>
        </NuxtLink>
        <NuxtLink to="/tools/timezone-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Globe class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">时区转换</h3>
          <p class="text-sm text-gray-500">时区时间转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/date-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">日期计算器</h3>
          <p class="text-sm text-gray-500">日期加减计算</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Clock,
  Calendar,
  RefreshCw,
  Copy,
  Download,
  ArrowRight,
  BarChart,
  Globe,
  Calculator
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '时间戳批量转换工具 - 多个Unix时间戳同时转换',
  meta: [
    {
      name: 'description',
      content: '在线时间戳批量转换工具，支持同时处理多个Unix时间戳。自动识别秒/毫秒格式，转换为可读日期时间，适用于日志分析、数据处理等场景。'
    },
    {
      name: 'keywords',
      content: '时间戳批量转换,Unix时间戳,批量转换,日志时间戳,时间戳格式化,在线批量工具'
    }
  ]
})

// State
const inputText = ref('')
const inputFormat = ref('auto')
const outputFormat = ref('iso8601')
const customFormat = ref('YYYY-MM-DD HH:mm:ss')
const timezone = ref('local')
const results = ref<any[]>([])
const errors = ref<any[]>([])

// Computed
const lineCount = computed(() => {
  if (!inputText.value) return 0
  return inputText.value.split('\n').filter(line => line.trim()).length
})

const formatCounts = computed(() => {
  const counts = { seconds: 0, milliseconds: 0 }
  results.value.forEach(r => {
    if (r.detectedFormat === '秒') counts.seconds++
    if (r.detectedFormat === '毫秒') counts.milliseconds++
  })
  return counts
})

// 转换时间戳
function convert() {
  if (!inputText.value) return

  results.value = []
  errors.value = []

  const lines = inputText.value.split('\n')
  const now = new Date()
  const currentYear = now.getFullYear()

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return

    // 尝试解析为数字
    let timestamp: number | null = null
    let detected = ''

    if (inputFormat.value === 'seconds') {
      timestamp = parseInt(trimmed) * 1000
      detected = '秒'
    } else if (inputFormat.value === 'milliseconds') {
      timestamp = parseInt(trimmed)
      detected = '毫秒'
    } else {
      // 自动识别
      const num = parseInt(trimmed)
      if (isNaN(num)) {
        errors.value.push({
          line: index + 1,
          value: trimmed,
          message: '无效的时间戳格式'
        })
        return
      }

      if (trimmed.length <= 10) {
        // 秒格式 (10位或更少)
        timestamp = num * 1000
        detected = '秒'
      } else {
        // 毫秒格式 (13位)
        timestamp = num
        detected = '毫秒'
      }
    }

    // 验证时间戳
    if (timestamp < 0 || timestamp > 9999999999999) {
      errors.value.push({
        line: index + 1,
        value: trimmed,
        message: '时间戳超出有效范围'
      })
      return
    }

    // 转换为日期
    const date = new Date(timestamp)

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      errors.value.push({
        line: index + 1,
        value: trimmed,
        message: '无效的日期'
      })
      return
    }

    // 格式化输出
    let converted = ''
    try {
      converted = formatDate(date, outputFormat.value, customFormat.value, timezone.value)
    } catch (e) {
      errors.value.push({
        line: index + 1,
        value: trimmed,
        message: '格式化失败'
      })
      return
    }

    results.value.push({
      original: trimmed,
      converted,
      detectedFormat: detected
    })
  })
}

// 格式化日期
function formatDate(date: Date, format: string, customFmt: string, tz: string): string {
  const options: any = {
    timeZone: tz === 'local' ? undefined : tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }

  switch (format) {
    case 'iso8601':
      return date.toLocaleString('zh-CN', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')

    case 'ymd':
      return date.toLocaleString('zh-CN', { ...options, hour12: false })

    case 'mdy':
      return date.toLocaleString('en-US', { ...options, hour12: true })

    case 'dmy':
      return date.toLocaleString('en-GB', { ...options, hour12: false })

    case 'custom':
      // 简单的自定义格式支持
      let result = customFmt
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hour = date.getHours().toString().padStart(2, '0')
      const minute = date.getMinutes().toString().padStart(2, '0')
      const second = date.getSeconds().toString().padStart(2, '0')

      result = result
        .replace(/YYYY/g, year.toString())
        .replace(/YY/g, year.toString().slice(-2))
        .replace(/MM/g, month)
        .replace(/DD/g, day)
        .replace(/HH/g, hour)
        .replace(/mm/g, minute)
        .replace(/ss/g, second)

      return result

    default:
      return date.toLocaleString('zh-CN', options)
  }
}

// 加载示例
function loadSample() {
  const now = Date.now() / 1000
  inputText.value = [
    Math.floor(now).toString(),
    Math.floor(now - 86400).toString(),
    Math.floor(now - 86400 * 7).toString(),
    Math.floor(now - 86400 * 30).toString(),
    Math.floor(now + 86400).toString(),
    Math.floor(now + 86400 * 7).toString()
  ].join('\n')
}

// 粘贴
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
  } catch {
    alert('无法访问剪贴板')
  }
}

// 复制结果
function copyResult(text: string) {
  navigator.clipboard.writeText(text)
}

// 复制全部
function copyAllResults() {
  const text = results.value.map(r => r.converted).join('\n')
  navigator.clipboard.writeText(text)
}

// 导出文件
function exportToFile() {
  const lines = results.value.map(r => `${r.original} -> ${r.converted}`)
  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timestamp-converted-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 清空
function clearInput() {
  inputText.value = ''
  results.value = []
  errors.value = []
}

function clearResults() {
  results.value = []
  errors.value = []
}
</script>
