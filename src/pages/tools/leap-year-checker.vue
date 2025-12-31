<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">闰年检查器</h1>
      <p class="text-gray-600 dark:text-gray-400">快速查询年份是否为闰年，支持批量查询和闰年规则说明</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 单个查询 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-blue-500" />
          单个年份查询
        </h2>

        <!-- 年份输入 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输入年份</label>
          <input
            v-model="singleYear"
            type="number"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="例如: 2024"
            @input="checkSingleYear"
          >
        </div>

        <!-- 快捷选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">快捷选择</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="singleYear = new Date().getFullYear(); checkSingleYear()"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              今年
            </button>
            <button
              @click="singleYear = new Date().getFullYear() + 1; checkSingleYear()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              明年
            </button>
            <button
              @click="singleYear = new Date().getFullYear() - 1; checkSingleYear()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              去年
            </button>
            <button
              @click="singleYear = 2000; checkSingleYear()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              2000年
            </button>
            <button
              @click="singleYear = 1900; checkSingleYear()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              1900年
            </button>
          </div>
        </div>

        <!-- 查询结果 -->
        <div v-if="singleResult" class="space-y-3">
          <div :class="['p-6 rounded-lg', singleResult.isLeap ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700']">
            <div class="text-sm mb-1" :class="singleResult.isLeap ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'">
              {{ singleYear }}年是
            </div>
            <div class="text-3xl font-bold" :class="singleResult.isLeap ? 'text-green-800 dark:text-green-200' : 'text-gray-800 dark:text-gray-200'">
              {{ singleResult.isLeap ? '闰年' : '平年' }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span class="text-blue-700 dark:text-blue-300">全年天数:</span>
              <span class="font-bold ml-2">{{ singleResult.isLeap ? 366 : 365 }}天</span>
            </div>
            <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span class="text-purple-700 dark:text-purple-300">二月天数:</span>
              <span class="font-bold ml-2">{{ singleResult.isLeap ? 29 : 28 }}天</span>
            </div>
          </div>

          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
            <span class="text-gray-600 dark:text-gray-400">判断依据:</span>
            <span class="ml-2">{{ singleResult.reason }}</span>
          </div>
        </div>
      </div>

      <!-- 批量查询 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <List class="w-5 h-5 text-purple-500" />
          批量年份查询
        </h2>

        <!-- 年份范围 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium mb-2">起始年份</label>
            <input
              v-model="batchStart"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="开始年份"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">结束年份</label>
            <input
              v-model="batchEnd"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="结束年份"
            >
          </div>
        </div>

        <!-- 查询按钮 -->
        <button
          @click="checkBatchYears"
          class="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg mb-4"
        >
          批量查询
        </button>

        <!-- 批量结果 -->
        <div v-if="batchResults.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>共查询 {{ batchResults.length }} 年</span>
            <span>闰年: {{ leapCount }} 个 ({{ leapPercent }}%)</span>
          </div>
          <div
            v-for="item in batchResults"
            :key="item.year"
            :class="[
              'p-3 border rounded-lg text-sm',
              item.isLeap ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 bg-gray-50 dark:bg-gray-700'
            ]"
          >
            <div class="flex justify-between items-center">
              <span class="font-medium">{{ item.year }}年</span>
              <div class="flex items-center gap-2">
                <span :class="['font-medium', item.isLeap ? 'text-green-600' : 'text-gray-500']">
                  {{ item.isLeap ? '闰年' : '平年' }}
                </span>
                <span class="text-xs text-gray-400">({{ item.isLeap ? 366 : 365 }}天)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 闰年规则说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info class="w-5 h-5 text-indigo-500" />
        闰年规则说明
      </h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium mb-3">格里高利历闰年规则</h3>
          <div class="space-y-3 text-sm">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="font-medium text-blue-800 dark:text-blue-300 mb-1">普通闰年</div>
              <div class="text-blue-700 dark:text-blue-400">能被4整除但不能被100整除的年份</div>
              <div class="text-xs mt-1 text-blue-600">例如: 2004, 2008, 2012, 2024</div>
            </div>
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div class="font-medium text-green-800 dark:text-green-300 mb-1">世纪闰年</div>
              <div class="text-green-700 dark:text-green-400">能被400整除的年份</div>
              <div class="text-xs mt-1 text-green-600">例如: 1600, 2000, 2400</div>
            </div>
            <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div class="font-medium text-red-800 dark:text-red-300 mb-1">平年</div>
              <div class="text-red-700 dark:text-red-400">不满足上述条件的年份</div>
              <div class="text-xs mt-1 text-red-600">例如: 1900, 2023, 2025</div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-3">典型示例</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span>2000年</span>
              <span class="text-green-600 font-medium">闰年 (能被400整除)</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <span>1900年</span>
              <span class="text-red-600 font-medium">平年 (能被100整除但不能被400整除)</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span>2024年</span>
              <span class="text-green-600 font-medium">闰年 (能被4整除但不能被100整除)</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <span>2023年</span>
              <span class="text-red-600 font-medium">平年 (不能被4整除)</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span>2400年</span>
              <span class="text-green-600 font-medium">闰年 (能被400整除)</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <span>2100年</span>
              <span class="text-red-600 font-medium">平年 (能被100整除但不能被400整除)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 为什么有闰年 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">为什么有闰年？</h2>

      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3">地球公转周期</h3>
          <div class="space-y-2 text-gray-600 dark:text-gray-400">
            <p>地球绕太阳公转一周的实际时间约为 <strong>365.2422天</strong>（365天5小时48分46秒）</p>
            <p>如果每年都按365天计算，每4年会积累约 <strong>1天</strong> 的误差</p>
            <p>通过设置闰年，使历法与地球公转周期保持同步</p>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-3">闰年的作用</h3>
          <div class="space-y-2 text-gray-600 dark:text-gray-400">
            <p>• 闰年2月有29天，全年366天</p>
            <p>• 平年2月有28天，全年365天</p>
            <p>• 每400年中有97个闰年，303个平年</p>
            <p>• 平均每年 = 365 + 97/400 = 365.2425天</p>
            <p class="text-xs">与真实值365.2422天仅差0.0003天</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/date-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">日期计算器</h3>
          <p class="text-sm text-gray-500">日期加减计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/timestamp-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Clock class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">时间戳转换</h3>
          <p class="text-sm text-gray-500">Unix时间戳互转</p>
        </NuxtLink>
        <NuxtLink to="/tools/week-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <List class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">周数计算器</h3>
          <p class="text-sm text-gray-500">计算周数</p>
        </NuxtLink>
        <NuxtLink to="/tools/quarter-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">季度计算器</h3>
          <p class="text-sm text-gray-500">季度查询</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Calendar,
  List,
  Info,
  Clock,
  Calculator
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '闰年检查器 - 快速查询年份是否为闰年',
  meta: [
    {
      name: 'description',
      content: '在线闰年检查工具，快速查询任意年份是否为闰年。支持单个查询和批量查询，显示闰年规则说明和典型示例。'
    },
    {
      name: 'keywords',
      content: '闰年查询,闰年检查,平年闰年,二月天数,闰年规则,在线闰年检查器'
    }
  ]
})

// 判断是否为闰年
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

// 获取判断理由
function getReason(year: number): string {
  if (year % 400 === 0) {
    return '能被400整除，是世纪闰年'
  } else if (year % 100 === 0) {
    return '能被100整除但不能被400整除，是平年'
  } else if (year % 4 === 0) {
    return '能被4整除但不能被100整除，是普通闰年'
  } else {
    return '不能被4整除，是平年'
  }
}

// State
const singleYear = ref(new Date().getFullYear())
const singleResult = ref<any>(null)
const batchStart = ref(2000)
const batchEnd = ref(2025)
const batchResults = ref<any[]>([])

// 闰年统计
const leapCount = computed(() => batchResults.value.filter(r => r.isLeap).length)
const leapPercent = computed(() => {
  if (batchResults.value.length === 0) return '0.0'
  return ((leapCount.value / batchResults.value.length) * 100).toFixed(1)
})

// 检查单个年份
function checkSingleYear() {
  const year = parseInt(singleYear.value) || 0
  singleResult.value = {
    isLeap: isLeapYear(year),
    reason: getReason(year)
  }
}

// 批量查询
function checkBatchYears() {
  const start = parseInt(batchStart.value) || 2000
  const end = parseInt(batchEnd.value) || 2025

  const results = []
  for (let year = Math.min(start, end); year <= Math.max(start, end); year++) {
    results.push({
      year,
      isLeap: isLeapYear(year)
    })
  }
  batchResults.value = results
}

// 初始化
checkSingleYear()
</script>
