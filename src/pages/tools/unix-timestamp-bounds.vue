<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Unix时间戳边界查询工具</h1>
      <p class="text-gray-600 dark:text-gray-400">查询Unix时间戳的最值、特殊日期对应的边界值</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 时间戳查询 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-blue-500" />
          时间戳边界查询
        </h2>

        <div class="space-y-4">
          <!-- 32位有符号整数范围 -->
          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div class="text-sm text-red-700 dark:text-red-300 mb-1">32位有符号整数范围</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>最小值:</span>
                <code class="font-mono">{{ int32Min }}</code>
              </div>
              <div class="flex justify-between">
                <span>最大值:</span>
                <code class="font-mono">{{ int32Max }}</code>
              </div>
              <div class="flex justify-between">
                <span>日期:</span>
                <span class="text-red-600">
                  {{ formatDate(int32MinDate) }} ~ {{ formatDate(int32MaxDate) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 32位无符号整数范围 -->
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-sm text-green-700 dark:text-green-300 mb-1">32位无符号整数范围</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>最小值:</span>
                <code class="font-mono">0</code>
              </div>
              <div class="flex justify-between">
                <span>最大值:</span>
                <code class="font-mono">{{ uint32Max }}</code>
              </div>
              <div class="flex justify-between">
                <span>日期:</span>
                <span class="text-green-600">
                  1970-01-01 ~ {{ formatDate(uint32MaxDate) }}
                </span>
              </div>
            </div>
          </div>

          <!-- JavaScript范围 -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-sm text-blue-700 dark:text-blue-300 mb-1">JavaScript Number范围</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>安全整数:</span>
                <code class="font-mono">±{{ Number.MAX_SAFE_INTEGER }}</code>
              </div>
              <div class="flex justify-between">
                <span>日期:</span>
                <span class="text-blue-600">
                  {{ formatDate(jsMinDate) }} ~ {{ formatDate(jsMaxDate) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 64位整数范围 -->
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div class="text-sm text-purple-700 dark:text-purple-300 mb-1">64位整数范围</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>毫秒级最大值:</span>
                <code class="font-mono text-xs truncate">{{ int64MaxMs }}</code>
              </div>
              <div class="flex justify-between">
                <span>日期:</span>
                <span class="text-purple-600">
                  ~ {{ formatDate(int64MaxDate) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 特殊日期时间戳 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-green-500" />
          特殊日期时间戳
        </h2>

        <div class="space-y-3">
          <!-- Unix纪元 -->
          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium">Unix纪元</div>
                <div class="text-sm text-gray-500">1970-01-01 00:00:00 UTC</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm">秒: <span class="text-green-600">0</span></div>
                <div class="font-mono text-sm">毫秒: <span class="text-green-600">0</span></div>
              </div>
            </div>
          </div>

          <!-- Y2K38问题 -->
          <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium text-red-600">Y2K38问题</div>
                <div class="text-sm text-gray-500">2038-01-19 03:14:07 UTC</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm">秒: <span class="text-red-600">{{ int32Max }}</span></div>
                <div class="text-xs text-red-500">32位溢出</div>
              </div>
            </div>
          </div>

          <!-- 千年虫 -->
          <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium text-orange-600">千年虫</div>
                <div class="text-sm text-gray-500">2000-01-01 00:00:00 UTC</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm">秒: <span class="text-orange-600">946684800</span></div>
              </div>
            </div>
          </div>

          <!-- 常用时间点 -->
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="font-medium text-blue-700 mb-2">常用时间点</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>2020-01-01:</span>
                <code class="font-mono">{{ timestamp2020 }}</code>
              </div>
              <div class="flex justify-between">
                <span>2024-01-01:</span>
                <code class="font-mono">{{ timestamp2024 }}</code>
              </div>
              <div class="flex justify-between">
                <span>2025-01-01:</span>
                <code class="font-mono">{{ timestamp2025 }}</code>
              </div>
              <div class="flex justify-between">
                <span>当前时间:</span>
                <code class="font-mono">{{ currentTimestamp }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间戳计算器 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">时间戳计算</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- 日期转时间戳 -->
        <div>
          <label class="block text-sm font-medium mb-2">日期转时间戳</label>
          <input
            v-model="inputDate"
            type="datetime-local"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-2"
            @input="convertToTimestamp"
          >
          <div v-if="convertedTimestamp" class="p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <div class="text-sm text-gray-500">时间戳</div>
            <div class="font-mono">秒: {{ convertedTimestamp.sec }}</div>
            <div class="font-mono">毫秒: {{ convertedTimestamp.ms }}</div>
          </div>
        </div>

        <!-- 时间戳转日期 -->
        <div>
          <label class="block text-sm font-medium mb-2">时间戳转日期</label>
          <input
            v-model="inputTimestamp"
            type="number"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-2"
            placeholder="输入Unix时间戳(秒)"
            @input="convertToDate"
          >
          <div v-if="convertedDate" class="p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <div class="text-sm text-gray-500">对应日期</div>
            <div class="font-mono">{{ convertedDate }}</div>
            <div class="text-xs text-gray-400 mt-1">UTC时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 注意事项 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">注意事项</h2>

      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3 text-red-600">Y2K38问题</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-2">
            <p>2038年1月19日，32位Unix时间戳将溢出，从<strong>2147483647</strong>变为<strong>-2147483648</strong>。</p>
            <p>这类似于2000年的千年虫问题，会影响使用32位有符号整数存储时间戳的系统。</p>
            <p><strong>解决方案：</strong>使用64位整数存储时间戳，或将时间戳存储为毫秒级。</p>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-3 text-blue-600">编程语言差异</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>JavaScript:</strong> 使用Number类型，精度到毫秒，安全整数范围±2^53</p>
            <p><strong>Java:</strong> long类型64位，Integer类型32位</p>
            <p><strong>Python:</strong> int类型自动扩展，无溢出问题</p>
            <p><strong>C/C++:</strong> time_t类型，32位或64位取决于系统</p>
          </div>
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
          <p class="text-sm text-gray-500">Unix时间戳互转</p>
        </NuxtLink>
        <NuxtLink to="/tools/timestamp-batch-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <RefreshCw class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">批量转换</h3>
          <p class="text-sm text-gray-500">时间戳批量转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/date-formatter" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">日期格式化</h3>
          <p class="text-sm text-gray-500">日期格式转换</p>
        </NuxtLink>
        <NuxtLink to="/tools/time-unit-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">时间单位转换</h3>
          <p class="text-sm text-gray-500">秒分时天转换</p>
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
  Calculator
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: 'Unix时间戳边界查询工具 - 时间戳最大最小值',
  meta: [
    {
      name: 'description',
      content: '在线Unix时间戳边界查询工具，查询32位、64位时间戳范围，Y2K38问题，特殊日期时间戳对照表。'
    },
    {
      name: 'keywords',
      content: 'Unix时间戳边界,Y2K38,时间戳最大值,时间戳范围,Unix时间戳溢出'
    }
  ]
})

// 常量
const int32Min = -2147483648
const int32Max = 2147483647
const uint32Max = 4294967295
const int64MaxMs = '9223372036854775807'

// 计算日期
const int32MinDate = new Date(int32Min * 1000)
const int32MaxDate = new Date(int32Max * 1000)
const uint32MaxDate = new Date(uint32Max * 1000)

const jsMinDate = new Date(-Number.MAX_SAFE_INTEGER * 1000)
const jsMaxDate = new Date(Number.MAX_SAFE_INTEGER * 1000)

const int64MaxDate = new Date(Number(int64MaxMs))

// 格式化日期
function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('.000Z', ' UTC')
}

// 常用时间戳
const timestamp2020 = Math.floor(new Date('2020-01-01').getTime() / 1000)
const timestamp2024 = Math.floor(new Date('2024-01-01').getTime() / 1000)
const timestamp2025 = Math.floor(new Date('2025-01-01').getTime() / 1000)
const currentTimestamp = Math.floor(Date.now() / 1000)

// State
const inputDate = ref('')
const inputTimestamp = ref('')
const convertedTimestamp = ref<any>(null)
const convertedDate = ref('')

// 日期转时间戳
function convertToTimestamp() {
  if (!inputDate.value) {
    convertedTimestamp.value = null
    return
  }

  const date = new Date(inputDate.value)
  const ms = date.getTime()
  const sec = Math.floor(ms / 1000)

  convertedTimestamp.value = {
    sec,
    ms
  }
}

// 时间戳转日期
function convertToDate() {
  const ts = parseInt(inputTimestamp.value)
  if (isNaN(ts)) {
    convertedDate.value = '无效的时间戳'
    return
  }

  const date = new Date(ts * 1000)
  if (isNaN(date.getTime())) {
    convertedDate.value = '日期超出有效范围'
    return
  }

  convertedDate.value = formatDate(date)
}
</script>
