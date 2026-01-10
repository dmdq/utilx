<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">中国法定节假日查询工具 - 节假日安排及调休信息</h1>
      <p class="text-muted-foreground">查询中国法定节假日安排、调休信息及放假天数统计。包含春节、国庆、清明等主要节日说明。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 年份选择 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-red-600" />
          选择年份
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">年份</label>
          <select
            v-model="selectedYear"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
            @change="loadHolidays"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}年</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">快捷操作</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="selectedYear = new Date().getFullYear(); loadHolidays()"
              class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              今年
            </button>
            <button
              @click="selectedYear = new Date().getFullYear() + 1; loadHolidays()"
              class="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80"
            >
              明年
            </button>
          </div>
        </div>

        <!-- 节假日统计 -->
        <div v-if="holidayStats" class="space-y-3">
          <div class="p-4 bg-red-600/10 rounded-lg">
            <div class="text-sm text-red-600 mb-1">全年放假天数</div>
            <div class="text-3xl font-bold text-red-700">
              {{ holidayStats.totalDays }}天
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              法定节假日{{ holidayStats.holidaysCount }}个
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-green-600/10 rounded-lg">
              <div class="text-sm text-green-600">调休上班</div>
              <div class="text-xl font-bold text-green-700">
                {{ holidayStats.workDays }}天
              </div>
            </div>
            <div class="p-3 bg-primary/10 rounded-lg">
              <div class="text-sm text-primary">实际休息</div>
              <div class="text-xl font-bold text-primary">
                {{ holidayStats.actualRestDays }}天
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 节假日列表 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift class="w-5 h-5 text-yellow-600" />
          {{ selectedYear }}年节假日安排
        </h2>

        <div class="space-y-3 max-h-[600px] overflow-y-auto">
          <div
            v-for="holiday in holidays"
            :key="holiday.name"
            :class="[
              'p-4 border rounded-lg',
              holiday.isCurrent ? 'border-yellow-500 bg-yellow-500/10' : 'border-border'
            ]"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="font-medium text-lg text-foreground">{{ holiday.name }}</div>
                <div class="text-sm text-muted-foreground">{{ holiday.date }}</div>
              </div>
              <div
                :class="[
                  'px-3 py-1 text-sm rounded',
                  holiday.days >= 3 ? 'bg-red-600/10 text-red-600' : 'bg-muted text-muted-foreground'
                ]"
              >
                {{ holiday.days }}天假
              </div>
            </div>

            <!-- 调休信息 -->
            <div v-if="holiday.adjustment" class="text-sm text-muted-foreground mt-2">
              <div v-if="holiday.adjustment.workDaysBefore">
                调休上班: {{ holiday.adjustment.workDaysBefore }}
              </div>
              <div v-if="holiday.adjustment.workDaysAfter">
                调休上班: {{ holiday.adjustment.workDaysAfter }}
              </div>
            </div>

            <!-- 是否当前 -->
            <div v-if="holiday.isCurrent" class="text-xs text-yellow-600 mt-2">
              正在放假
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 节假日说明 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">节假日说明</h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-2 text-red-600">元旦</h3>
          <div class="text-muted-foreground space-y-1">
            <div>时间: 1月1日</div>
            <div>放假: 1天</div>
            <div>如遇周末顺延</div>
          </div>
        </div>

        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-2 text-red-600">春节</h3>
          <div class="text-muted-foreground space-y-1">
            <div>时间: 农历正月初一</div>
            <div>放假: 8天(含调休)</div>
            <div>最重要传统节日</div>
          </div>
        </div>

        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-2 text-green-600">清明节</h3>
          <div class="text-muted-foreground space-y-1">
            <div>时间: 4月4-6日交节</div>
            <div>放假: 3天</div>
            <div>祭扫先人节日</div>
          </div>
        </div>

        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-2 text-yellow-600">劳动节</h3>
          <div class="text-muted-foreground space-y-1">
            <div>时间: 5月1日</div>
            <div>放假: 5天(含调休)</div>
            <div>国际劳动节</div>
          </div>
        </div>

        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-2 text-purple-600">端午节</h3>
          <div class="text-muted-foreground space-y-1">
            <div>时间: 农历五月初五</div>
            <div>放假: 3天</div>
            <div>传统民俗节日</div>
          </div>
        </div>

        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-2 text-pink-600">中秋节</h3>
          <div class="text-muted-foreground space-y-1">
            <div>时间: 农历八月十五</div>
            <div>放假: 3天</div>
            <div>团圆赏月节日</div>
          </div>
        </div>

        <div class="p-4 border border-border rounded-lg">
          <h3 class="font-medium mb-2 text-red-600">国庆节</h3>
          <div class="text-muted-foreground space-y-1">
            <div>时间: 10月1日</div>
            <div>放假: 7天(黄金周)</div>
            <div>国家生日</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 放假安排原则 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">放假安排原则</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
        <div>
          <h3 class="font-medium mb-3 text-foreground">调休原则</h3>
          <ul class="space-y-2 list-disc list-inside">
            <li>逢周末时在周一补休</li>
            <li>通过调休形成连续假期</li>
            <li>避免形成超长假期</li>
            <li>春节和国庆尽量安排长假</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-3 text-foreground">法定标准</h3>
          <ul class="space-y-2 list-disc list-inside">
            <li>全体公民放假: 7个节日(共11天)</li>
            <li>部分公民放假: 妇女节、青年节等</li>
            <li>少数民族节日可另行规定</li>
            <li>遇周末顺延工作日</li>
          </ul>
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
          中国法定节假日
        </h2>
        <p class="text-muted-foreground mb-4">
          中国法定节假日是指国家规定的全体公民放假的节日，目前共有7个：元旦、春节、清明节、劳动节、端午节、中秋节、国庆节，
          全年共计11天。国务院每年会发布具体的放假安排，包括调休安排。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          调休是什么?
        </h2>
        <p class="text-muted-foreground mb-4">
          调休是指通过调整工作日和休息日，将节假日与周末相连，形成连续的长假期。
          例如，如果节日只放1天但在周二，可能会将周六调休为工作日，这样周日、周一、周二就能连休3天。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">节假日是强制放假吗?</h3>
            <p class="text-muted-foreground mt-1">
              法定节假日是强制性的，用人单位应当依法安排劳动者休假。
              如因生产、工作需要不能休假的，应支付不低于工资的300%的工资报酬。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">调休上班有加班费吗?</h3>
            <p class="text-muted-foreground mt-1">
              调休安排的工作日属于正常工作日，不支付加班费。
              但如果在这一天安排劳动者延长工作时间，应支付150%的加班费。
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
  Gift,
  Moon,
  Sun,
  Calculator,
  HelpCircle,
  ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '中国法定节假日查询工具 - 节假日安排及调休信息',
  description: '在线中国法定节假日查询工具，查询全年节假日安排、调休信息、放假天数统计。包含春节、国庆、清明等主要节日说明。',
  keywords: '法定节假日,放假安排,调休查询,春节放假,国庆放假,节假日查询',
  author: 'Util工具箱',
  ogTitle: '中国法定节假日查询工具',
  ogDescription: '查询中国法定节假日安排、调休信息及放假天数统计',
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
            name: '中国法定节假日查询工具',
            description: '在线查询中国法定节假日安排、调休信息',
            url: 'https://www.util.cn/tools/holiday-calculator',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            }
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '节假日查询',
                item: 'https://www.util.cn/tools/holiday-calculator'
              }
            ]
          }
        ]
      })
    }
  ]
})

// 生成节假日数据（简化版）
function generateHolidays(year) {
  const holidays = [
    {
      name: '元旦',
      date: `${year}-01-01`,
      days: 1,
      month: 1
    },
    {
      name: '春节',
      date: `${year}-02-10`, // 近似日期
      days: 8,
      month: 2,
      adjustment: { workDaysAfter: `${year}-02-17` }
    },
    {
      name: '清明节',
      date: `${year}-04-04`,
      days: 3,
      month: 4
    },
    {
      name: '劳动节',
      date: `${year}-05-01`,
      days: 5,
      month: 5,
      adjustment: { workDaysAfter: `${year}-05-11` }
    },
    {
      name: '端午节',
      date: `${year}-06-10`, // 近似日期
      days: 3,
      month: 6
    },
    {
      name: '中秋节',
      date: `${year}-09-15`, // 近似日期
      days: 3,
      month: 9
    },
    {
      name: '国庆节',
      date: `${year}-10-01`,
      days: 7,
      month: 10,
      adjustment: { workDaysAfter: `${year}-10-12` }
    }
  ]

  const now = new Date()
  holidays.forEach(h => {
    const holidayDate = new Date(h.date)
    h.isCurrent = Math.abs((holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) < h.days
  })

  return holidays
}

// State
const selectedYear = ref(new Date().getFullYear())
const holidays = ref([])
const holidayStats = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Moon, Sun, Calendar, Calculator
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'lunar-calendar'),
  tools.find(t => t.id === 'solar-term-calculator'),
  tools.find(t => t.id === 'date-calculator'),
  tools.find(t => t.id === 'quarter-calculator')
].filter(Boolean)

// 年份列表
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, i) => currentYear - 1 + i)
})

// 加载节假日
function loadHolidays() {
  const year = selectedYear.value
  holidays.value = generateHolidays(year)

  const totalDays = holidays.value.reduce((sum, h) => sum + h.days, 0)
  const workDays = holidays.value.filter(h => h.adjustment).length
  const holidaysCount = holidays.value.length

  holidayStats.value = {
    totalDays,
    workDays,
    actualRestDays: totalDays - workDays,
    holidaysCount
  }
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
loadHolidays()
</script>
