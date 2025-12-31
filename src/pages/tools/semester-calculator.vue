<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">学期计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">计算学年、学期起止日期，适用于教学安排、选课规划</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 学年选择 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-blue-500" />
          选择学年
        </h2>

        <!-- 学年 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">学年</label>
          <select
            v-model="academicYear"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="calculateSemesters"
          >
            <option v-for="year in academicYears" :key="year" :value="year">
              {{ year }}-{{ parseInt(year) + 1 }}学年
            </option>
          </select>
        </div>

        <!-- 学校类型 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">学校类型</label>
          <select
            v-model="schoolType"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
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
          <label class="block text-sm font-medium mb-2">快捷操作</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="setCurrentAcademicYear"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              当前学年
            </button>
            <button
              @click="academicYear = parseInt(academicYear) + 1; calculateSemesters()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              下一学年
            </button>
          </div>
        </div>

        <!-- 当前学期信息 -->
        <div v-if="currentSemester" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div class="text-sm text-green-700 dark:text-green-300 mb-1">当前学期</div>
          <div class="text-xl font-bold text-green-800 dark:text-green-200">
            {{ currentSemester.name }}
          </div>
          <div class="text-sm text-green-600 dark:text-green-400 mt-2">
            {{ currentSemester.progress }}% 已完成
          </div>
          <div class="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 mt-2">
            <div
              class="bg-green-500 h-2 rounded-full transition-all"
              :style="{ width: `${currentSemester.progress}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 学期列表 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen class="w-5 h-5 text-purple-500" />
          学期安排
        </h2>

        <div class="space-y-3">
          <div
            v-for="(semester, index) in semesters"
            :key="index"
            :class="[
              'p-4 border rounded-lg',
              semester.isCurrent ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
            ]"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="font-medium text-lg">{{ semester.name }}</div>
                <div class="text-sm text-gray-500">{{ semester.dateRange }}</div>
              </div>
              <div v-if="semester.isCurrent" class="text-xs text-green-600">
                当前学期
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">开始:</span>
                <span class="font-medium ml-1">{{ semester.startDate }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">结束:</span>
                <span class="font-medium ml-1">{{ semester.endDate }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">周数:</span>
                <span class="font-medium ml-1">{{ semester.weeks }}周</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">天数:</span>
                <span class="font-medium ml-1">{{ semester.days }}天</span>
              </div>
            </div>

            <!-- 倒计时 -->
            <div v-if="semester.isCurrent" class="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
              <span class="text-purple-700 dark:text-purple-300">距离结束还有:</span>
              <span class="font-bold ml-2">{{ semester.daysRemaining }}天</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学年统计 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">学年统计</h2>

      <div v-if="yearStats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">{{ yearStats.totalWeeks }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">总周数</div>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">{{ yearStats.totalDays }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">总天数</div>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">{{ yearStats.semesters }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">学期数</div>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-600">{{ yearStats.months }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">月份数</div>
        </div>
      </div>
    </div>

    <!-- 重要时间节点 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">重要时间节点</h2>

      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-3">开学与放假</h3>
          <div class="space-y-2">
            <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span>秋季学期开学:</span>
              <span class="font-medium">9月1日前后</span>
            </div>
            <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span>寒假开始:</span>
              <span class="font-medium">1月中旬-2月初</span>
            </div>
            <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span>春季学期开学:</span>
              <span class="font-medium">2月下旬-3月初</span>
            </div>
            <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span>暑假开始:</span>
              <span class="font-medium">7月初</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-medium mb-3">考试周</h3>
          <div class="space-y-2">
            <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span>期末考试周:</span>
              <span class="font-medium">1月(秋) / 6月(春)</span>
            </div>
            <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span>高考:</span>
              <span class="font-medium">6月7-9日</span>
            </div>
            <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span>中考:</span>
              <span class="font-medium">6月中下旬</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 校历模板 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">大学校历参考</h2>

      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-blue-600">第一学期 (秋季)</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>• 开学: 9月初</div>
            <div>• 国庆放假: 10月1日</div>
            <div>• 期中考试: 11月</div>
            <div>• 元旦放假: 1月1日</div>
            <div>• 期末考试: 1月中</div>
            <div>• 放寒假: 1月中下旬</div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-green-600">第二学期 (春季)</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>• 开学: 2月底3月初</div>
            <div>• 清明放假: 4月</div>
            <div>• 劳动节放假: 5月</div>
            <div>• 端午放假: 6月</div>
            <div>• 期末考试: 6月底7月初</div>
            <div>• 暑假: 7月-8月</div>
          </div>
        </div>

        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-2 text-purple-600">三学期制</h3>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <div>• 秋季学期: 9月-12月</div>
            <div>• 冬季学期: 1月-4月</div>
            <div>• 春季学期: 4月-7月</div>
            <div>• 适用于某些研究生项目</div>
            <div>• 国际学校常见安排</div>
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
        <NuxtLink to="/tools/countdown-timer" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Timer class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">倒计时器</h3>
          <p class="text-sm text-gray-500">倒计时工具</p>
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
  BookOpen,
  Timer,
  List,
  Calculator
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '学期计算器 - 学年起止日期与学期安排查询',
  meta: [
    {
      name: 'description',
      content: '在线学期计算器，查询学年、学期起止日期，适用于教学安排、选课规划。支持大学、中学、小学不同学制。'
    },
    {
      name: 'keywords',
      content: '学期计算,学年安排,校历查询,开学时间,放假时间,在线学期计算器'
    }
  ]
})

// State
const academicYear = ref(new Date().getFullYear())
const schoolType = ref('university')
const semesters = ref<any[]>([])
const currentSemester = ref<any>(null)
const yearStats = ref<any>(null)

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
function isCurrentSemester(start: string, end: string) {
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

// 初始化
calculateSemesters()
</script>
