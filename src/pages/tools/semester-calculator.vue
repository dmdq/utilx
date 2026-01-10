<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">学期计算器 - 学年起止日期与学期安排查询</h1>
      <p class="text-muted-foreground">计算学年、学期起止日期，适用于教学安排、选课规划。支持大学、中学、小学不同学制。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 学年选择 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary" />
          选择学年
        </h2>

        <!-- 学年 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">学年</label>
          <select
            v-model="academicYear"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
            @change="calculateSemesters"
          >
            <option v-for="year in academicYears" :key="year" :value="year">
              {{ year }}-{{ parseInt(year) + 1 }}学年
            </option>
          </select>
        </div>

        <!-- 学校类型 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">学校类型</label>
          <select
            v-model="schoolType"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
            @change="calculateSemesters"
          >
            <option value="university">大学 (两学期制)</option>
            <option value="college">专科 (两学期制)</option>
            <option value="highschool">高中 (两学期制)</option>
            <option value="middleschool">初中 (两学期制)</option>
            <option value="primary">小学 (两学期制)</option>
            <option value="university-tri">大学 (三学期制)</option>
          </select>
        </div>

        <!-- 快捷操作 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">快捷操作</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="setCurrentAcademicYear"
              class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              当前学年
            </button>
            <button
              @click="academicYear = parseInt(academicYear) + 1; calculateSemesters()"
              class="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80"
            >
              下一学年
            </button>
          </div>
        </div>

        <!-- 当前学期信息 -->
        <div v-if="currentSemester" class="p-4 bg-primary/10 rounded-lg">
          <div class="text-sm text-primary mb-1">当前学期</div>
          <div class="text-xl font-bold text-foreground">
            {{ currentSemester.name }}
          </div>
          <div class="text-sm text-muted-foreground mt-2">
            {{ currentSemester.progress }}% 已完成
          </div>
          <div class="w-full bg-muted rounded-full h-2 mt-2">
            <div
              class="bg-primary h-2 rounded-full transition-all"
              :style="{ width: `${currentSemester.progress}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 学期列表 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen class="w-5 h-5 text-purple-600" />
          学期安排
        </h2>

        <div class="space-y-3">
          <div
            v-for="(semester, index) in semesters"
            :key="index"
            :class="[
              'p-4 border rounded-lg',
              semester.isCurrent ? 'border-primary bg-primary/10' : 'border-border'
            ]"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="font-medium text-lg text-foreground">{{ semester.name }}</div>
                <div class="text-sm text-muted-foreground">{{ semester.dateRange }}</div>
              </div>
              <div v-if="semester.isCurrent" class="text-xs text-primary">
                当前学期
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-muted-foreground">开始:</span>
                <span class="font-medium ml-1 text-foreground">{{ semester.startDate }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">结束:</span>
                <span class="font-medium ml-1 text-foreground">{{ semester.endDate }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">周数:</span>
                <span class="font-medium ml-1 text-foreground">{{ semester.weeks }}周</span>
              </div>
              <div>
                <span class="text-muted-foreground">天数:</span>
                <span class="font-medium ml-1 text-foreground">{{ semester.days }}天</span>
              </div>
            </div>

            <!-- 倒计时 -->
            <div v-if="semester.isCurrent" class="mt-3 p-2 bg-accent rounded text-sm">
              <span class="text-foreground">距离结束还有:</span>
              <span class="font-bold ml-2">{{ semester.daysRemaining }}天</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学年统计 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">学年统计</h2>

      <div v-if="yearStats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 bg-primary/10 rounded-lg text-center">
          <div class="text-2xl font-bold text-primary">{{ yearStats.totalWeeks }}</div>
          <div class="text-sm text-muted-foreground">总周数</div>
        </div>
        <div class="p-4 bg-green-600/10 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">{{ yearStats.totalDays }}</div>
          <div class="text-sm text-muted-foreground">总天数</div>
        </div>
        <div class="p-4 bg-purple-600/10 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">{{ yearStats.semesters }}</div>
          <div class="text-sm text-muted-foreground">学期数</div>
        </div>
        <div class="p-4 bg-orange-600/10 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-600">{{ yearStats.months }}</div>
          <div class="text-sm text-muted-foreground">月份数</div>
        </div>
      </div>
    </div>

    <!-- 重要时间节点 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">重要时间节点</h2>

      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3 text-foreground">开学与放假</h3>
          <div class="space-y-2">
            <div class="flex justify-between p-2 bg-muted rounded">
              <span class="text-muted-foreground">秋季学期开学:</span>
              <span class="font-medium text-foreground">9月1日前后</span>
            </div>
            <div class="flex justify-between p-2 bg-muted rounded">
              <span class="text-muted-foreground">寒假开始:</span>
              <span class="font-medium text-foreground">1月中旬-2月初</span>
            </div>
            <div class="flex justify-between p-2 bg-muted rounded">
              <span class="text-muted-foreground">春季学期开学:</span>
              <span class="font-medium text-foreground">2月下旬-3月初</span>
            </div>
            <div class="flex justify-between p-2 bg-muted rounded">
              <span class="text-muted-foreground">暑假开始:</span>
              <span class="font-medium text-foreground">7月初</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-3 text-foreground">考试周</h3>
          <div class="space-y-2">
            <div class="flex justify-between p-2 bg-muted rounded">
              <span class="text-muted-foreground">期末考试周:</span>
              <span class="font-medium text-foreground">1月(秋) / 6月(春)</span>
            </div>
            <div class="flex justify-between p-2 bg-muted rounded">
              <span class="text-muted-foreground">高考:</span>
              <span class="font-medium text-foreground">6月7-9日</span>
            </div>
            <div class="flex justify-between p-2 bg-muted rounded">
              <span class="text-muted-foreground">中考:</span>
              <span class="font-medium text-foreground">6月中下旬</span>
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
          什么是学期?
        </h2>
        <p class="text-muted-foreground mb-4">
          学年是指学校的教学年度，一般从秋季开始到次年夏季结束。中国的学年通常分为两个学期：第一学期（秋季学期）和第二学期（春季学期）。
          大学也有三学期制的安排，分别为秋季学期、冬季学期和春季学期。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择您要查询的学年</li>
          <li>选择学校类型（大学、中学、小学等）</li>
          <li>查看学期安排和起止日期</li>
          <li>了解当前学期的进度和剩余时间</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">大学校历有哪些特点?</h3>
            <p class="text-muted-foreground mt-1">
              大学校历通常分为两个学期，第一学期从9月初到1月中下旬，第二学期从2月底到7月初。
              每学期约为20周，包含教学周和考试周。部分大学采用三学期制，每学期约17周。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">寒暑假是如何安排的?</h3>
            <p class="text-muted-foreground mt-1">
              寒假通常在1月中下旬到2月底，持续约4-5周。暑假在7月初到8月底，持续约7-8周。
              具体放假时间可能因学校而异，需以各校公布为准。
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
  BookOpen,
  Timer,
  List,
  Calculator,
  HelpCircle,
  ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '学期计算器 - 学年起止日期与学期安排查询',
  description: '在线学期计算器，查询学年、学期起止日期，适用于教学安排、选课规划。支持大学、中学、小学不同学制。',
  keywords: '学期计算,学年安排,校历查询,开学时间,放假时间,在线学期计算器',
  author: 'Util工具箱',
  ogTitle: '学期计算器 - 学年起止日期查询',
  ogDescription: '在线查询学年、学期起止日期，支持多种学制，适用于教学安排和选课规划。',
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
            name: '学期计算器',
            description: '在线学期计算器，查询学年、学期起止日期',
            url: 'https://www.util.cn/tools/semester-calculator',
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
                name: '学期计算器',
                item: 'https://www.util.cn/tools/semester-calculator'
              }
            ]
          }
        ]
      })
    }
  ]
})

// State
const academicYear = ref(new Date().getFullYear())
const schoolType = ref('university')
const semesters = ref([])
const currentSemester = ref(null)
const yearStats = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calendar, Timer, List, Calculator
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'date-calculator'),
  tools.find(t => t.id === 'countdown-timer'),
  tools.find(t => t.id === 'week-calculator'),
  tools.find(t => t.id === 'quarter-calculator')
].filter(Boolean)

// 学年列表
const academicYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
})

// 计算学期
function calculateSemesters() {
  const year = parseInt(academicYear.value)
  const isTri = schoolType.value === 'university-tri'

  let terms = []

  if (isTri) {
    // 三学期制
    terms = [
      {
        name: '秋季学期',
        startDate: `${year}-09-01`,
        endDate: `${year}-12-31`,
        weeks: 17,
        isCurrent: isCurrentSemester(`${year}-09-01`, `${year}-12-31`)
      },
      {
        name: '冬季学期',
        startDate: `${year + 1}-01-01`,
        endDate: `${year + 1}-04-30`,
        weeks: 17,
        isCurrent: isCurrentSemester(`${year + 1}-01-01`, `${year + 1}-04-30`)
      },
      {
        name: '春季学期',
        startDate: `${year + 1}-05-01`,
        endDate: `${year + 1}-08-31`,
        weeks: 17,
        isCurrent: isCurrentSemester(`${year + 1}-05-01`, `${year + 1}-08-31`)
      }
    ]
  } else {
    // 两学期制
    terms = [
      {
        name: '第一学期 (秋季)',
        startDate: `${year}-09-01`,
        endDate: `${year + 1}-01-20`,
        weeks: 20,
        isCurrent: isCurrentSemester(`${year}-09-01`, `${year + 1}-01-20`)
      },
      {
        name: '第二学期 (春季)',
        startDate: `${year + 1}-02-20`,
        endDate: `${year + 1}-07-10`,
        weeks: 20,
        isCurrent: isCurrentSemester(`${year + 1}-02-20`, `${year + 1}-07-10`)
      }
    ]
  }

  // 计算详细信息
  semesters.value = terms.map(term => {
    const start = new Date(term.startDate)
    const end = new Date(term.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const now = new Date()
    const daysElapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const progress = term.isCurrent ? Math.min(100, Math.max(0, (daysElapsed / days) * 100)) : 0

    return {
      ...term,
      dateRange: `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`,
      days,
      daysRemaining: term.isCurrent ? daysRemaining : 0,
      progress: progress.toFixed(1)
    }
  })

  // 当前学期
  currentSemester.value = semesters.value.find(s => s.isCurrent)

  // 学年统计
  yearStats.value = {
    totalWeeks: terms.reduce((sum, t) => sum + t.weeks, 0),
    totalDays: terms.reduce((sum, t) => sum + t.days, 0),
    semesters: terms.length,
    months: isTri ? 12 : 10
  }
}

// 判断是否当前学期
function isCurrentSemester(start, end) {
  const now = new Date()
  const startDate = new Date(start)
  const endDate = new Date(end)
  return now >= startDate && now <= endDate
}

// 设置当前学年
function setCurrentAcademicYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // 如果是1-8月，当前学年是去年-今年
  if (month < 8) {
    academicYear.value = year - 1
  } else {
    academicYear.value = year
  }
  calculateSemesters()
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
calculateSemesters()
</script>
