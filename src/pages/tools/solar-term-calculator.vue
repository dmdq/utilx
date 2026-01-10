<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">二十四节气查询工具 - 中国传统节气日期查询</h1>
      <p class="text-muted-foreground">查询二十四节气日期时间，了解中国传统农耕文化。显示当前节气和下一个节气。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 年份查询 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sun class="w-5 h-5 text-yellow-600" />
          按年份查询
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">选择年份</label>
          <select
            v-model="selectedYear"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
            @change="calculateSolarTerms"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}年</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">快捷选择</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="selectedYear = new Date().getFullYear(); calculateSolarTerms()"
              class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              今年
            </button>
            <button
              @click="selectedYear = new Date().getFullYear() + 1; calculateSolarTerms()"
              class="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80"
            >
              明年
            </button>
            <button
              @click="selectedYear = new Date().getFullYear() - 1; calculateSolarTerms()"
              class="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80"
            >
              去年
            </button>
          </div>
        </div>

        <!-- 当前节气 -->
        <div v-if="currentTerm" class="p-4 bg-yellow-500/10 rounded-lg">
          <div class="text-sm text-yellow-600 mb-1">当前节气</div>
          <div class="text-2xl font-bold text-foreground">
            {{ currentTerm.name }}
          </div>
          <div class="text-sm text-muted-foreground mt-1">
            {{ currentTerm.date }}
          </div>
        </div>

        <!-- 下一个节气 -->
        <div v-if="nextTerm" class="mt-4 p-4 bg-green-600/10 rounded-lg">
          <div class="text-sm text-green-600 mb-1">下一个节气</div>
          <div class="text-xl font-bold text-foreground">
            {{ nextTerm.name }}
          </div>
          <div class="text-sm text-muted-foreground mt-1">
            {{ nextTerm.date }}
          </div>
          <div class="text-xs text-green-500 mt-1">
            还有 {{ nextTerm.daysRemaining }} 天
          </div>
        </div>
      </div>

      <!-- 二十四节气表 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-green-600" />
          {{ selectedYear }}年二十四节气
        </h2>

        <div class="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
          <div
            v-for="(term, index) in solarTerms"
            :key="index"
            :class="[
              'p-3 border rounded-lg text-sm',
              term.isCurrent ? 'border-yellow-500 bg-yellow-500/10' : 'border-border'
            ]"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium text-foreground">{{ term.name }}</div>
                <div class="text-xs text-muted-foreground mt-1">{{ term.meaning }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm text-foreground">{{ term.date }}</div>
                <div v-if="term.isCurrent" class="text-xs text-yellow-600 mt-1">当前</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 节气详情 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">二十四节气详解</h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <!-- 春季节气 -->
        <div>
          <h3 class="font-medium mb-3 text-green-600">春季节气</h3>
          <div class="space-y-2">
            <div v-for="term in springTerms" :key="term.name" class="p-2 bg-green-600/10 rounded">
              <div class="font-medium text-foreground">{{ term.name }}</div>
              <div class="text-xs text-muted-foreground">{{ term.meaning }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ term.custom }}</div>
            </div>
          </div>
        </div>

        <!-- 夏季节气 -->
        <div>
          <h3 class="font-medium mb-3 text-red-600">夏季节气</h3>
          <div class="space-y-2">
            <div v-for="term in summerTerms" :key="term.name" class="p-2 bg-red-600/10 rounded">
              <div class="font-medium text-foreground">{{ term.name }}</div>
              <div class="text-xs text-muted-foreground">{{ term.meaning }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ term.custom }}</div>
            </div>
          </div>
        </div>

        <!-- 秋季节气 -->
        <div>
          <h3 class="font-medium mb-3 text-orange-600">秋季节气</h3>
          <div class="space-y-2">
            <div v-for="term in autumnTerms" :key="term.name" class="p-2 bg-orange-600/10 rounded">
              <div class="font-medium text-foreground">{{ term.name }}</div>
              <div class="text-xs text-muted-foreground">{{ term.meaning }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ term.custom }}</div>
            </div>
          </div>
        </div>

        <!-- 冬季节气 -->
        <div>
          <h3 class="font-medium mb-3 text-blue-600">冬季节气</h3>
          <div class="space-y-2">
            <div v-for="term in winterTerms" :key="term.name" class="p-2 bg-blue-600/10 rounded">
              <div class="font-medium text-foreground">{{ term.name }}</div>
              <div class="text-xs text-muted-foreground">{{ term.meaning }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ term.custom }}</div>
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
          什么是二十四节气?
        </h2>
        <p class="text-muted-foreground mb-4">
          二十四节气是中国古代订立的一种用来指导农事的补充历法，根据地球在黄道（即地球绕太阳公转的轨道）上的位置来划分。
          春秋时期制定出仲春、仲夏、仲秋、仲冬四个节气，到秦汉年间，二十四节气已完全确立。
          2016年11月30日，二十四节气被正式列入联合国教科文组织人类非物质文化遗产代表作名录。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          节气歌
        </h2>
        <div class="bg-muted p-4 rounded-lg font-mono text-xs mb-6">
          <div class="text-foreground">春雨惊春清谷天，夏满芒夏暑相连，</div>
          <div class="text-foreground">秋处露秋寒霜降，冬雪雪冬小大寒。</div>
          <div class="mt-2 text-muted-foreground">
            每句包含一个季节的六个节气
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>选择要查询的年份</li>
          <li>查看该年份的二十四节气日期</li>
          <li>了解当前所处的节气</li>
          <li>查看下一个节气的倒计时</li>
        </ol>
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
  Sun,
  Calendar,
  Moon,
  Calculator,
  Gift,
  HelpCircle,
  ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '二十四节气查询工具 - 中国传统节气日期查询',
  description: '在线二十四节气查询工具，查询任意年份的节气日期时间，显示当前节气和下一个节气。包含节气详解和节气歌。',
  keywords: '二十四节气,节气查询,春分秋分,夏至冬至,中国传统节日,节气日期',
  author: 'Util工具箱',
  ogTitle: '二十四节气查询工具',
  ogDescription: '查询任意年份的二十四节气日期，了解中国传统农耕文化',
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
            name: '二十四节气查询工具',
            description: '在线查询二十四节气日期时间',
            url: 'https://www.util.cn/tools/solar-term-calculator',
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
                name: '节气查询',
                item: 'https://www.util.cn/tools/solar-term-calculator'
              }
            ]
          }
        ]
      })
    }
  ]
})

// 二十四节气定义
const solarTermsData = [
  { name: '小寒', month: 1, day: 5, meaning: '天气寒冷但未至极点', custom: '进补保暖' },
  { name: '大寒', month: 1, day: 20, meaning: '一年中最冷时期', custom: '除旧迎新' },
  { name: '立春', month: 2, day: 4, meaning: '春季开始', custom: '咬春' },
  { name: '雨水', month: 2, day: 19, meaning: '降雨开始', custom: '接寿' },
  { name: '惊蛰', month: 3, day: 6, meaning: '春雷惊醒蛰伏昆虫', custom: '吃梨' },
  { name: '春分', month: 3, day: 21, meaning: '昼夜平分', custom: '竖蛋' },
  { name: '清明', month: 4, day: 5, meaning: '天气晴朗草木繁茂', custom: '扫墓祭祖' },
  { name: '谷雨', month: 4, day: 20, meaning: '雨生百谷', custom: '喝谷雨茶' },
  { name: '立夏', month: 5, day: 6, meaning: '夏季开始', custom: '尝新' },
  { name: '小满', month: 5, day: 21, meaning: '谷物饱满但未成熟', custom: '祭车神' },
  { name: '芒种', month: 6, day: 6, meaning: '麦类作物成熟', custom: '煮梅' },
  { name: '夏至', month: 6, day: 21, meaning: '炎夏到来，白昼最长', custom: '吃面条' },
  { name: '小暑', month: 7, day: 7, meaning: '暑气始盛', custom: '吃藕' },
  { name: '大暑', month: 7, day: 23, meaning: '一年中最热时期', custom: '喝伏茶' },
  { name: '立秋', month: 8, day: 8, meaning: '秋季开始', custom: '贴秋膘' },
  { name: '处暑', month: 8, day: 23, meaning: '暑气消退', custom: '吃鸭子' },
  { name: '白露', month: 9, day: 8, meaning: '天气转凉露水凝', custom: '喝白露茶' },
  { name: '秋分', month: 9, day: 23, meaning: '昼夜平分', custom: '吃秋菜' },
  { name: '寒露', month: 10, day: 8, meaning: '露水已寒', custom: '赏菊花' },
  { name: '霜降', month: 10, day: 23, meaning: '开始降霜', custom: '吃柿子' },
  { name: '立冬', month: 11, day: 7, meaning: '冬季开始', custom: '吃饺子' },
  { name: '小雪', month: 11, day: 22, meaning: '开始降雪', custom: '腌腊肉' },
  { name: '大雪', month: 12, day: 7, meaning: '降雪增多', custom: '腌咸菜' },
  { name: '冬至', month: 12, day: 22, meaning: '寒冬到来，白昼最短', custom: '吃饺子' }
]

// State
const selectedYear = ref(new Date().getFullYear())
const solarTerms = ref([])

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Moon, Calendar, Calculator, Gift
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'lunar-calendar'),
  tools.find(t => t.id === 'date-calculator'),
  tools.find(t => t.id === 'quarter-calculator'),
  tools.find(t => t.id === 'holiday-calculator')
].filter(Boolean)

// 年份列表
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 201 }, (_, i) => currentYear - 100 + i)
})

// 计算节气日期（简化版）
function calculateSolarTerms() {
  const year = selectedYear.value
  const now = new Date()

  const terms = solarTermsData.map((term, index) => {
    // 简化计算：使用固定日期（实际节气日期每年会有±1-2天变化）
    const termDate = new Date(year, term.month - 1, term.day + Math.floor(Math.sin(index) * 2))

    // 计算是否是当前节气（前后7天内）
    const daysDiff = Math.floor((termDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isCurrent = daysDiff >= -7 && daysDiff <= 7

    return {
      ...term,
      date: `${term.month}月${term.day}日`,
      fullDate: termDate,
      isCurrent,
      daysRemaining: daysDiff > 0 ? daysDiff : 365 + daysDiff
    }
  })

  solarTerms.value = terms
}

// 当前节气
const currentTerm = computed(() => {
  return solarTerms.value.find(t => t.isCurrent)
})

// 下一个节气
const nextTerm = computed(() => {
  const now = new Date()
  const upcoming = solarTerms.value
    .filter(t => t.fullDate > now)
    .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
  return upcoming[0]
})

// 春季节气
const springTerms = computed(() => solarTermsData.slice(2, 8))
// 夏季节气
const summerTerms = computed(() => solarTermsData.slice(8, 14))
// 秋季节气
const autumnTerms = computed(() => solarTermsData.slice(14, 20))
// 冬季节气
const winterTerms = computed(() => [...solarTermsData.slice(20), ...solarTermsData.slice(0, 2)])

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
calculateSolarTerms()
</script>
