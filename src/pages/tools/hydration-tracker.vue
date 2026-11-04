<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">饮水习惯追踪器</h1>
      <p class="text-muted-foreground">追踪每日饮水量，保持身体水分平衡，支持多种饮品记录和饮水提醒</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：设置和记录 -->
      <div class="space-y-4">
        <!-- 目标设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Droplet class="w-5 h-5 text-primary" />
            每日饮水目标
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">性别</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="gender = 'male'"
                  :class="['p-3 rounded-lg text-sm', gender === 'male' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  男性
                </button>
                <button
                  @click="gender = 'female'"
                  :class="['p-3 rounded-lg text-sm', gender === 'female' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  女性
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">体重 (kg)</label>
                <input
                  v-model.number="weight"
                  type="number"
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="体重"
                  @input="calculateGoal"
                >
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">活动水平</label>
                <select v-model="activityLevel" class="w-full px-3 py-2 border border-border rounded-lg text-sm" @change="calculateGoal">
                  <option value="low">久坐</option>
                  <option value="moderate">中度活动</option>
                  <option value="high">高度活动</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">每日目标 (ml)</label>
              <input
                v-model.number="dailyGoal"
                type="number"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono"
                @input="goalFromCalculation = false"
              >
              <p v-if="goalFromCalculation" class="text-xs text-muted-foreground mt-1">
                基于体重和活动水平自动计算
              </p>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <p class="font-medium mb-1">快速参考</p>
              <p class="text-muted-foreground">男性约 2500-3000ml/天，女性约 2000-2500ml/天</p>
            </div>
          </div>
        </div>

        <!-- 添加饮水记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">添加饮水记录</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">饮品类型</label>
              <select v-model="drinkType" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="water">纯净水</option>
                <option value="coffee">咖啡</option>
                <option value="tea">茶</option>
                <option value="juice">果汁</option>
                <option value="milk">牛奶</option>
                <option value="soda">碳酸饮料</option>
                <option value="sports">运动饮料</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">容量 (ml)</label>
              <div class="grid grid-cols-4 gap-2 mb-3">
                <button
                  v-for="preset in [150, 250, 350, 500]"
                  :key="preset"
                  @click="amount = preset"
                  :class="['p-2 rounded text-sm transition-colors', amount === preset ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  {{ preset }}ml
                </button>
              </div>
              <input
                v-model.number="amount"
                type="number"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="自定义容量"
              >
            </div>

            <button
              @click="addDrink"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
            >
              <Plus class="w-4 h-4 inline mr-2" />
              添加记录
            </button>
          </div>
        </div>

        <!-- 今日记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">今日记录</h2>
            <button @click="clearToday" class="text-xs text-red-600 hover:underline">清空</button>
          </div>

          <div v-if="todayLog.length === 0" class="text-center py-8 text-sm text-muted-foreground">
            今日暂无饮水记录
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(record, index) in todayLog"
              :key="index"
              class="flex items-center justify-between p-3 bg-muted rounded-lg text-sm"
            >
              <div class="flex items-center gap-3">
                <component :is="getDrinkIcon(record.type)" class="w-5 h-5" :class="getDrinkColor(record.type)" />
                <div>
                  <span class="font-medium">{{ getDrinkName(record.type) }}</span>
                  <p class="text-xs text-muted-foreground">{{ record.time }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-mono font-medium">{{ record.amount }}ml</span>
                <button @click="removeDrink(index)" class="text-red-500 hover:text-red-700">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="todayLog.length > 0" class="mt-4 p-3 bg-muted rounded">
            <div class="flex items-center justify-between text-sm">
              <span>总摄入: <strong>{{ totalIntake }}ml</strong></span>
              <span>还需: <strong>{{ remaining }}ml</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：进度和统计 -->
      <div class="space-y-4">
        <!-- 进度展示 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-blue-500" />
            今日饮水进度
          </h2>

          <div class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">已完成目标</p>
              <p class="text-5xl font-bold text-blue-600 mb-2">{{ progressPercentage }}%</p>
              <div class="flex items-center justify-center gap-4 text-sm">
                <span>{{ totalIntake }}ml</span>
                <span class="text-muted-foreground">/</span>
                <span>{{ dailyGoal }}ml</span>
              </div>
            </div>
          </div>

          <!-- 水位动画 -->
          <div class="relative h-64 bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg overflow-hidden border-2 border-blue-300 dark:border-blue-700">
            <div
              class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
              :style="{ height: Math.min(progressPercentage, 100) + '%' }"
            >
              <div class="absolute inset-0 bg-blue-400/30 animate-pulse"></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <Droplet class="w-16 h-16 text-blue-600" :class="{ 'animate-bounce': progressPercentage >= 100 }" />
            </div>
            <!-- 刻度线 -->
            <div class="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-4 text-xs text-blue-700 dark:text-blue-300">
              <span>{{ dailyGoal }}ml</span>
              <span>{{ Math.round(dailyGoal * 0.75) }}ml</span>
              <span>{{ Math.round(dailyGoal * 0.5) }}ml</span>
              <span>{{ Math.round(dailyGoal * 0.25) }}ml</span>
              <span>0ml</span>
            </div>
          </div>

          <div v-if="progressPercentage >= 100" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <Trophy class="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p class="font-medium text-green-700 dark:text-green-300">恭喜！今日饮水目标已达成</p>
          </div>
        </div>

        <!-- 饮品统计 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">饮品统计</h2>

          <div class="space-y-3">
            <div
              v-for="(stat, type) in drinkStats"
              :key="type"
              class="flex items-center justify-between p-3 bg-muted rounded"
            >
              <div class="flex items-center gap-2">
                <component :is="getDrinkIcon(type)" class="w-5 h-5" :class="getDrinkColor(type)" />
                <span class="text-sm">{{ getDrinkName(type) }}</span>
              </div>
              <div class="text-right">
                <p class="font-medium font-mono">{{ stat.amount }}ml</p>
                <p class="text-xs text-muted-foreground">{{ stat.count }}次</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 7天统计 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">近7天统计</h2>

          <div class="space-y-2">
            <div
              v-for="(day, index) in weeklyStats"
              :key="index"
              class="flex items-center justify-between p-2 bg-muted rounded text-sm"
            >
              <span>{{ day.date }}</span>
              <span class="font-mono">{{ day.amount }}ml</span>
            </div>
          </div>

          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-center">
            <p class="text-sm text-muted-foreground">7天平均</p>
            <p class="text-2xl font-bold text-blue-600">{{ weeklyAverage }}ml</p>
          </div>
        </div>

        <!-- 健康提示 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">饮水健康提示</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">起床后喝一杯水</p>
                <p class="text-muted-foreground">帮助激活身体机能，促进新陈代谢</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <Clock class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">饭前半小时喝水</p>
                <p class="text-muted-foreground">有助于控制食欲，促进消化</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <AlertTriangle class="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">运动时及时补水</p>
                <p class="text-muted-foreground">每15-20分钟补充150-200ml水分</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <Moon class="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">睡前适量饮水</p>
                <p class="text-muted-foreground">避免过度饮水影响睡眠质量</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 缺水症状 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">身体缺水信号</h2>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
              <p class="font-medium">口渴</p>
              <p class="text-xs text-muted-foreground">明显缺水信号</p>
            </div>
            <div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-center">
              <p class="font-medium">尿液深黄</p>
              <p class="text-xs text-muted-foreground">需增加饮水</p>
            </div>
            <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-center">
              <p class="font-medium">疲劳</p>
              <p class="text-xs text-muted-foreground">轻度缺水症状</p>
            </div>
            <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-center">
              <p class="font-medium">头痛</p>
              <p class="text-xs text-muted-foreground">中度缺水症状</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'
import {
  Droplet,
  Plus,
  X,
  PieChart,
  Trophy,
  CheckCircle,
  Clock,
  AlertTriangle,
  Moon,
  Coffee,
  Leaf,
  Apple,
  GlassWater,
  Cookie
} from 'lucide-vue-next'

const gender = ref('male')
const weight = ref(null)
const activityLevel = ref('moderate')
const dailyGoal = ref(2000)
const goalFromCalculation = ref(false)

const drinkType = ref('water')
const amount = ref(250)
const todayLog = ref([])

function calculateGoal() {
  if (!weight.value) return

  let base = weight.value * 33 // 基础：每公斤33ml

  // 活动水平调整
  const activityMultipliers = {
    low: 1,
    moderate: 1.2,
    high: 1.4
  }

  // 性别调整
  const genderAdjustment = gender.value === 'male' ? 1.1 : 1

  dailyGoal.value = Math.round(base * activityMultipliers[activityLevel.value] * genderAdjustment)
  goalFromCalculation.value = true
}

const totalIntake = computed(() => {
  return todayLog.value.reduce((sum, record) => sum + record.amount, 0)
})

const remaining = computed(() => {
  return Math.max(dailyGoal.value - totalIntake.value, 0)
})

const progressPercentage = computed(() => {
  return Math.min(Math.round((totalIntake.value / dailyGoal.value) * 100), 100)
})

const drinkStats = computed(() => {
  const stats = {}
  todayLog.value.forEach(record => {
    if (!stats[record.type]) {
      stats[record.type] = { amount: 0, count: 0 }
    }
    stats[record.type].amount += record.amount
    stats[record.type].count++
  })
  return stats
})

const weeklyStats = ref([
  { date: '今天', amount: 0 },
  { date: '昨天', amount: 1850 },
  { date: '前天', amount: 2100 },
  { date: '3天前', amount: 1950 },
  { date: '4天前', amount: 2200 },
  { date: '5天前', amount: 1750 },
  { date: '6天前', amount: 2000 }
])

const weeklyAverage = computed(() => {
  const total = weeklyStats.value.reduce((sum, day) => sum + day.amount, 0)
  return Math.round(total / 7)
})

function addDrink() {
  if (!amount.value || amount.value <= 0) return

  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  todayLog.value.push({
    type: drinkType.value,
    amount: amount.value,
    time
  })

  // 更新今天的统计
  weeklyStats.value[0].amount = totalIntake.value
}

function removeDrink(index) {
  todayLog.value.splice(index, 1)
  weeklyStats.value[0].amount = totalIntake.value
}

function clearToday() {
  todayLog.value = []
  weeklyStats.value[0].amount = 0
}

function getDrinkName(type) {
  const names = {
    water: '纯净水',
    coffee: '咖啡',
    tea: '茶',
    juice: '果汁',
    milk: '牛奶',
    soda: '碳酸饮料',
    sports: '运动饮料',
    other: '其他'
  }
  return names[type] || type
}

function getDrinkIcon(type) {
  const icons = {
    water: Droplet,
    coffee: Coffee,
    tea: Leaf,
    juice: Apple,
    milk: GlassWater,
    soda: Cookie,
    sports: Droplet,
    other: Droplet
  }
  return icons[type] || Droplet
}

function getDrinkColor(type) {
  const colors = {
    water: 'text-blue-500',
    coffee: 'text-amber-700',
    tea: 'text-green-600',
    juice: 'text-orange-500',
    milk: 'text-slate-400',
    soda: 'text-red-500',
    sports: 'text-cyan-500',
    other: 'text-gray-500'
  }
  return colors[type] || 'text-gray-500'
}

useSeoMeta({
  title: '饮水习惯追踪器 - 在线每日饮水量记录工具',
  description: '免费在线饮水习惯追踪器，追踪每日饮水量，保持身体水分平衡，支持多种饮品记录和健康提醒。', keywords: ['饮水追踪', '饮水量', '水分补充', '健康饮水', '每日饮水', '饮水习惯', '在线工具']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('饮水习惯追踪器')
</script>
