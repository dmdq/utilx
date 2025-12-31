<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">时间单位转换器</h1>
      <p class="text-gray-600 dark:text-gray-400">在不同时间单位之间相互转换，支持秒、分、时、天、周、月、年等</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-blue-500" />
          输入
        </h2>

        <!-- 数值输入 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">数值</label>
          <input
            v-model="inputValue"
            type="number"
            step="any"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="输入数值"
            @input="convert"
          >
        </div>

        <!-- 单位选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">从</label>
          <select
            v-model="inputUnit"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="convert"
          >
            <option value="ms">毫秒</option>
            <option value="s">秒</option>
            <option value="min">分钟</option>
            <option value="h">小时</option>
            <option value="d">天</option>
            <option value="w">周</option>
            <option value="mo">月</option>
            <option value="y">年</option>
          </select>
        </div>

        <!-- 转换到 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">到</label>
          <select
            v-model="outputUnit"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="convert"
          >
            <option value="ms">毫秒</option>
            <option value="s">秒</option>
            <option value="min">分钟</option>
            <option value="h">小时</option>
            <option value="d">天</option>
            <option value="w">周</option>
            <option value="mo">月</option>
            <option value="y">年</option>
          </select>
        </div>

        <!-- 快捷转换 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">快捷转换</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="shortcut in shortcuts"
              :key="shortcut.value"
              @click="applyShortcut(shortcut)"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              {{ shortcut.label }}
            </button>
          </div>
        </div>

        <!-- 转换按钮 -->
        <button
          @click="convert"
          class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-5 h-5" />
          转换
        </button>
      </div>

      <!-- 结果区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator class="w-5 h-5 text-green-500" />
          转换结果
        </h2>

        <!-- 主要结果 -->
        <div class="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
          <div class="text-sm text-green-700 dark:text-green-300 mb-1">{{ resultText }}</div>
          <div class="text-3xl font-mono font-bold text-green-800 dark:text-green-200">
            {{ formattedResult }}
          </div>
        </div>

        <!-- 换算表 -->
        <div class="space-y-2">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">所有单位换算</div>
          <div
            v-for="unit in unitNames"
            :key="unit.value"
            class="flex justify-between items-center p-2 border-b dark:border-gray-700"
          >
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ unit.label }}:</span>
            <div class="flex items-center gap-2">
              <code class="text-sm font-mono">{{ formatNumber(conversions[unit.value]) }}</code>
              <button
                @click="copyResult(conversions[unit.value], unit.label)"
                class="text-green-500 hover:text-green-700"
                title="复制"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 单位说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">单位说明</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2">毫秒</h3>
          <p class="text-gray-600 dark:text-gray-400">1秒 = 1000毫秒，用于精确计时</p>
        </div>
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2">秒</h3>
          <p class="text-gray-600 dark:text-gray-400">国际单位制时间基本单位</p>
        </div>
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2">分钟</h3>
          <p class="text-gray-600 dark:text-gray-400">1分钟 = 60秒</p>
        </div>
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2">小时</h3>
          <p class="text-gray-600 dark:text-gray-400">1小时 = 60分钟 = 3600秒</p>
        </div>
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2">天</h3>
          <p class="text-gray-600 dark:text-gray-400">1天 = 24小时 = 86400秒</p>
        </div>
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2">周</h3>
          <p class="text-gray-600 dark:text-gray-400">1周 = 7天 = 604800秒</p>
        </div>
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2">月</h3>
          <p class="text-gray-600 dark:text-gray-400">按30.44天计算 = 2629746秒</p>
        </div>
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2">年</h3>
          <p class="text-gray-600 dark:text-gray-400">按365.25天计算 = 31557600秒</p>
        </div>
      </div>
    </div>

    <!-- 常用换算 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常用换算参考</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3">编程相关</h3>
          <div class="space-y-2 font-mono text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded">
            <div>1秒 = 1000毫秒 = 1,000,000微秒 = 1,000,000,000纳秒</div>
            <div>Unix时间戳: 秒级(10位) / 毫秒级(13位)</div>
            <div>1分钟 = 60,000毫秒</div>
            <div>1小时 = 3,600,000毫秒</div>
            <div>1天 = 86,400,000毫秒</div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-3">生活相关</h3>
          <div class="space-y-2 text-gray-600 dark:text-gray-400">
            <div>1小时 = 60分钟 = 4个15分钟刻度</div>
            <div>1天 = 24小时 = 1440分钟</div>
            <div>1工作周 = 5个工作日 = 40小时</div>
            <div>1年 ≈ 52周 ≈ 12个月 ≈ 365天</div>
            <div>1世纪 = 100年</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/timestamp-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Clock class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">时间戳转换</h3>
          <p class="text-sm text-gray-500">Unix时间戳互转</p>
        </NuxtLink>
        <NuxtLink to="/tools/date-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">日期计算器</h3>
          <p class="text-sm text-gray-500">日期加减计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/countdown-timer" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Timer class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">倒计时器</h3>
          <p class="text-sm text-gray-500">倒计时工具</p>
        </NuxtLink>
        <NuxtLink to="/tools/stopwatch" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Activity class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">秒表计时器</h3>
          <p class="text-sm text-gray-500">秒表计时工具</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Clock,
  Calculator,
  RefreshCw,
  Copy,
  Timer,
  Activity
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '时间单位转换器 - 秒分时天周月年相互转换',
  meta: [
    {
      name: 'description',
      content: '在线时间单位转换工具，支持毫秒、秒、分钟、小时、天、周、月、年之间的相互转换。提供完整的换算表和常用参考，适用于编程、学习等场景。'
    },
    {
      name: 'keywords',
      content: '时间单位转换,秒分转换,小时换算,天换算,时间计算,在线时间转换器'
    }
  ]
})

// 单位名称
const unitNames = [
  { value: 'ms', label: '毫秒' },
  { value: 's', label: '秒' },
  { value: 'min', label: '分钟' },
  { value: 'h', label: '小时' },
  { value: 'd', label: '天' },
  { value: 'w', label: '周' },
  { value: 'mo', label: '月' },
  { value: 'y', label: '年' }
]

// 快捷转换
const shortcuts = [
  { label: '1分钟', value: 1, unit: 'min' },
  { label: '1小时', value: 1, unit: 'h' },
  { label: '1天', value: 1, unit: 'd' },
  { label: '1周', value: 1, unit: 'w' },
  { label: '1月', value: 1, unit: 'mo' },
  { label: '1年', value: 1, unit: 'y' }
]

// State
const inputValue = ref(1)
const inputUnit = ref('s')
const outputUnit = ref('min')
const conversions = ref<Record<string, number>>({})

// 将输入转换为秒
function toSeconds(value: number, unit: string): number {
  switch (unit) {
    case 'ms': return value / 1000
    case 's': return value
    case 'min': return value * 60
    case 'h': return value * 3600
    case 'd': return value * 86400
    case 'w': return value * 604800
    case 'mo': return value * 2629746 // 30.44天
    case 'y': return value * 31557600 // 365.25天
    default: return value
  }
}

// 从秒转换到目标单位
function fromSeconds(seconds: number, unit: string): number {
  switch (unit) {
    case 'ms': return seconds * 1000
    case 's': return seconds
    case 'min': return seconds / 60
    case 'h': return seconds / 3600
    case 'd': return seconds / 86400
    case 'w': return seconds / 604800
    case 'mo': return seconds / 2629746
    case 'y': return seconds / 31557600
    default: return seconds
  }
}

// 转换
function convert() {
  const input = parseFloat(inputValue.value) || 0
  const seconds = toSeconds(input, inputUnit.value)

  const result: Record<string, number> = {}
  for (const unit of unitNames) {
    result[unit.value] = fromSeconds(seconds, unit.value)
  }
  conversions.value = result
}

// 应用快捷转换
function applyShortcut(shortcut: { value: number; unit: string }) {
  inputValue.value = shortcut.value
  inputUnit.value = shortcut.unit
  convert()
}

// 格式化数字
function formatNumber(num: number): string {
  if (num === 0) return '0'
  if (Math.abs(num) < 0.000001 || Math.abs(num) > 1e9) {
    return num.toExponential(6)
  }
  if (Number.isInteger(num)) {
    return num.toLocaleString()
  }
  return num.toFixed(6).replace(/\.?0+$/, '')
}

// 主要结果文本
const resultText = computed(() => {
  const inputLabel = unitNames.find(u => u.value === inputUnit.value)?.label || ''
  const outputLabel = unitNames.find(u => u.value === outputUnit.value)?.label || ''
  return `${inputValue.value} ${inputLabel} =`
})

// 格式化结果
const formattedResult = computed(() => {
  const result = conversions.value[outputUnit.value] || 0
  return formatNumber(result)
})

// 复制结果
function copyResult(value: number, unit: string) {
  navigator.clipboard.writeText(formatNumber(value))
}

// 初始化
convert()
</script>
