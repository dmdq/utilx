<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">闰年检查器 - 快速查询年份是否为闰年</h1>
      <p class="text-muted-foreground">快速查询年份是否为闰年，支持批量查询和闰年规则说明。提供详细的判断依据和典型示例，帮助您理解闰年计算规则。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 单个查询 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
            <Calendar class="w-5 h-5 text-primary" />
            单个年份查询
          </h2>
        </div>

        <!-- 年份输入 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">输入年份</label>
          <input
            v-model="singleYear"
            type="number"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="例如: 2024"
            @input="checkSingleYear"
          >
        </div>

        <!-- 快捷选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">快捷选择</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="singleYear = new Date().getFullYear(); checkSingleYear()"
              class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              今年
            </button>
            <button
              @click="singleYear = new Date().getFullYear() + 1; checkSingleYear()"
              class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              明年
            </button>
            <button
              @click="singleYear = new Date().getFullYear() - 1; checkSingleYear()"
              class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              去年
            </button>
            <button
              @click="singleYear = 2000; checkSingleYear()"
              class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              2000年
            </button>
            <button
              @click="singleYear = 1900; checkSingleYear()"
              class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              1900年
            </button>
          </div>
        </div>

        <!-- 查询结果 -->
        <div v-if="singleResult" class="space-y-3">
          <div :class="['p-6 rounded-lg', singleResult.isLeap ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted']">
            <div class="text-sm mb-1" :class="singleResult.isLeap ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'">
              {{ singleYear }}年是
            </div>
            <div class="text-3xl font-bold" :class="singleResult.isLeap ? 'text-green-800 dark:text-green-200' : 'text-foreground'">
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

          <div class="p-3 bg-muted rounded-lg text-sm">
            <span class="text-muted-foreground">判断依据:</span>
            <span class="ml-2">{{ singleResult.reason }}</span>
          </div>
        </div>
      </div>

      <!-- 批量查询 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
            <List class="w-5 h-5 text-primary" />
            批量年份查询
          </h2>
        </div>

        <!-- 年份范围 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">起始年份</label>
            <input
              v-model="batchStart"
              type="number"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="开始年份"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">结束年份</label>
            <input
              v-model="batchEnd"
              type="number"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="结束年份"
            >
          </div>
        </div>

        <!-- 查询按钮 -->
        <button
          @click="checkBatchYears"
          class="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg mb-4 hover:bg-primary/90"
        >
          批量查询
        </button>

        <!-- 批量结果 -->
        <div v-if="batchResults.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <div class="flex justify-between text-sm text-muted-foreground mb-2">
            <span>共查询 {{ batchResults.length }} 年</span>
            <span>闰年: {{ leapCount }} 个 ({{ leapPercent }}%)</span>
          </div>
          <div
            v-for="item in batchResults"
            :key="item.year"
            :class="[
              'p-3 border rounded-lg text-sm',
              item.isLeap ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-border bg-muted'
            ]"
          >
            <div class="flex justify-between items-center">
              <span class="font-medium">{{ item.year }}年</span>
              <div class="flex items-center gap-2">
                <span :class="['font-medium', item.isLeap ? 'text-green-600' : 'text-muted-foreground']">
                  {{ item.isLeap ? '闰年' : '平年' }}
                </span>
                <span class="text-xs text-muted-foreground">({{ item.isLeap ? 366 : 365 }}天)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          闰年规则说明
        </h2>

        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 class="font-medium text-foreground mb-3">格里高利历闰年规则</h3>
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
            <h3 class="font-medium text-foreground mb-3">典型示例</h3>
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
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          为什么有闰年？
        </h2>
        <div class="grid md:grid-cols-2 gap-6 text-sm mb-8">
          <div>
            <h3 class="font-medium text-foreground mb-3">地球公转周期</h3>
            <div class="space-y-2 text-muted-foreground">
              <p>地球绕太阳公转一周的实际时间约为 <strong>365.2422天</strong>（365天5小时48分46秒）</p>
              <p>如果每年都按365天计算，每4年会积累约 <strong>1天</strong> 的误差</p>
              <p>通过设置闰年，使历法与地球公转周期保持同步</p>
            </div>
          </div>
          <div>
            <h3 class="font-medium text-foreground mb-3">闰年的作用</h3>
            <div class="space-y-2 text-muted-foreground">
              <p>• 闰年2月有29天，全年366天</p>
              <p>• 平年2月有28天，全年365天</p>
              <p>• 每400年中有97个闰年，303个平年</p>
              <p>• 平均每年 = 365 + 97/400 = 365.2425天</p>
              <p class="text-xs">与真实值365.2422天仅差0.0003天</p>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何判断一个年份是否为闰年？</h3>
            <p class="text-muted-foreground mt-1">
              判断闰年的规则是：能被4整除但不能被100整除，或者能被400整除的年份是闰年。
              例如：2000年是闰年（能被400整除），1900年不是闰年（能被100整除但不能被400整除），2024年是闰年（能被4整除但不能被100整除）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">闰年二月有多少天？</h3>
            <p class="text-muted-foreground mt-1">
              闰年的二月有29天，比平年的28天多一天。这是为了弥补历法年度与地球公转周期之间的时间差。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么2000年是闰年而1900年不是？</h3>
            <p class="text-muted-foreground mt-1">
              根据格里高利历规则，世纪年份（整百年）必须能被400整除才是闰年。
              2000能被400整除，所以是闰年；1900不能被400整除，所以是平年。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Calendar,
  List,
  Info,
  Clock,
  Calculator,
  ChevronUp,
  HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '闰年检查器 - 快速查询年份是否为闰年 | Util工具箱',
  description: '在线闰年检查工具，快速查询任意年份是否为闰年。支持单个查询和批量查询，显示闰年规则说明和典型示例。提供详细的判断依据和闰年计算规则。',
  keywords: '闰年查询,闰年检查,平年闰年,二月天数,闰年规则,在线闰年检查器',
  author: 'Util工具箱',
  ogTitle: '闰年检查器 - 快速查询年份是否为闰年',
  ogDescription: '在线闰年检查工具，支持单个和批量查询，提供详细的闰年规则说明和典型示例。',
  ogType: 'website'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '闰年检查器',
            description: '在线闰年检查工具，快速查询年份是否为闰年',
            url: 'https://www.util.cn/tools/leap-year-checker',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '单个年份查询',
              '批量年份查询',
              '闰年规则说明',
              '典型示例展示',
              '详细判断依据'
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何判断一个年份是否为闰年？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '判断闰年的规则是：能被4整除但不能被100整除，或者能被400整除的年份是闰年。'
                }
              },
              {
                '@type': 'Question',
                name: '闰年二月有多少天？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '闰年的二月有29天，比平年的28天多一天。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// 图标映射
const iconMap = {
  Calendar, List, Info, Clock, Calculator
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'date-calculator'),
    tools.find(t => t.id === 'timestamp-convert'),
    tools.find(t => t.id === 'week-calculator'),
    tools.find(t => t.id === 'quarter-calculator')
  ].filter(Boolean)

  return recommended
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 判断是否为闰年
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

// 获取判断理由
function getReason(year) {
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
const singleResult = ref(null)
const batchStart = ref(2000)
const batchEnd = ref(2025)
const batchResults = ref([])

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

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
checkSingleYear()
</script>
