<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">健康习惯追踪器</h1>
      <p class="text-muted-foreground">追踪日常健康习惯，建立良好的生活方式，实现健康目标</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：习惯选择和打卡 -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle class="w-5 h-5 text-primary" />
            今日习惯打卡
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="habit in predefinedHabits"
              :key="habit.id"
              @click="toggleHabit(habit.id)"
              class="p-4 rounded-lg border-2 cursor-pointer transition-all"
              :class="completedHabits.includes(habit.id) ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'"
            >
              <div class="flex items-center gap-3">
                <component :is="habit.icon" class="w-8 h-8" :class="completedHabits.includes(habit.id) ? 'text-green-500' : 'text-gray-400'" />
                <div class="flex-1">
                  <p class="font-medium">{{ habit.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ habit.description }}</p>
                </div>
                <CheckCircle v-if="completedHabits.includes(habit.id)" class="w-6 h-6 text-green-500" />
                <Circle v-else class="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div class="mt-6 p-4 bg-muted rounded">
            <p class="text-sm text-muted-foreground mb-3">今日完成度</p>
            <div class="w-full bg-background rounded-full h-4 mb-2">
              <div
                class="h-4 rounded-full transition-all bg-gradient-to-r from-green-400 to-green-600"
                :style="{ width: (completedHabits.length / predefinedHabits.length * 100) + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-sm">
              <span>{{ completedHabits.length }}/{{ predefinedHabits.length }}</span>
              <span class="font-medium">{{ Math.round(completedHabits.length / predefinedHabits.length * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- 自定义习惯 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">添加自定义习惯</h2>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <input v-model="customHabit.name" class="px-3 py-2 border border-border rounded-lg text-sm" placeholder="习惯名称">
            <input v-model="customHabit.description" class="px-3 py-2 border border-border rounded-lg text-sm" placeholder="简短描述">
          </div>
          <button @click="addCustomHabit" class="w-full px-4 py-2 bg-muted rounded-lg text-sm">
            <Plus class="w-4 h-4 inline mr-2" />
            添加习惯
          </button>
        </div>

        <!-- 连续打卡记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">连续打卡记录</h2>
            <button @click="resetStreak" class="text-xs text-red-600 hover:underline">重置</button>
          </div>

          <div class="grid grid-cols-7 gap-2 mb-4">
            <div
              v-for="(day, index) in weekDays"
              :key="index"
              class="text-center p-2 rounded"
              :class="day.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'"
            >
              <p class="text-xs font-medium">{{ day.name }}</p>
              <p class="text-lg font-bold mt-1">{{ day.count }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
            <div>
              <p class="text-sm text-muted-foreground">当前连续打卡</p>
              <p class="text-2xl font-bold text-orange-600">{{ currentStreak }} 天</p>
            </div>
            <Trophy class="w-12 h-12 text-yellow-500" />
          </div>
        </div>
      </div>

      <!-- 右侧：统计和激励 -->
      <div class="space-y-4">
        <!-- 成就系统 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">成就徽章</h2>

          <div class="space-y-3">
            <div
              v-for="achievement in achievements"
              :key="achievement.id"
              class="flex items-center gap-3 p-3 rounded"
              :class="achievement.unlocked ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-gray-800 opacity-50'"
            >
              <component :is="achievement.icon" class="w-8 h-8" :class="achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'" />
              <div class="flex-1">
                <p class="font-medium text-sm">{{ achievement.name }}</p>
                <p class="text-xs text-muted-foreground">{{ achievement.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 本周统计 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">本周统计</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>总完成次数</span>
              <span class="font-bold">{{ weeklyTotal }}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>日均完成</span>
              <span class="font-bold">{{ (weeklyTotal / 7).toFixed(1) }}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>最佳日期</span>
              <span class="font-bold">{{ bestDay }}</span>
            </div>
          </div>
        </div>

        <!-- 健康小贴士 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">健康小贴士</h2>

          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
            <p class="font-medium mb-2">{{ dailyTip.title }}</p>
            <p class="text-muted-foreground">{{ dailyTip.content }}</p>
          </div>
        </div>

        <!-- 习惯养成建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">习惯养成建议</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <Target class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">从小处开始</p>
                <p class="text-muted-foreground">选择1-2个最容易实现的习惯开始</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Clock class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">固定时间</p>
                <p class="text-muted-foreground">每天在固定时间执行习惯</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Sparkles class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">叠加新习惯</p>
                <p class="text-muted-foreground">当前习惯稳定后再添加新习惯</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Users class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">寻求支持</p>
                <p class="text-muted-foreground">告诉朋友家人，获得鼓励和监督</p>
              </div>
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
  CheckCircle,
  Circle,
  Plus,
  Trophy,
  Target,
  Clock,
  Sparkles,
  Users,
  Droplet,
  Apple,
  Dumbbell,
  Moon,
  Activity,
  BookOpen
} from 'lucide-vue-next'

const predefinedHabits = ref([
  { id: 'water', name: '喝8杯水', description: '保持充足水分', icon: Droplet },
  { id: 'exercise', name: '运动30分钟', description: '日常锻炼', icon: Activity },
  { id: 'sleep', name: '7-8小时睡眠', description: '充足休息', icon: Moon },
  { id: 'breakfast', name: '吃早餐', description: '健康饮食', icon: Apple },
  { id: 'read', name: '阅读30分钟', description: '持续学习', icon: BookOpen },
  { id: 'stretch', name: '拉伸放松', description: '体态健康', icon: Dumbbell }
])

const completedHabits = ref([])
const customHabit = ref({ name: '', description: '' })

const weekDays = ref([
  { name: '周一', count: 0, completed: false },
  { name: '周二', count: 0, completed: false },
  { name: '周三', count: 0, completed: false },
  { name: '周四', count: 0, completed: false },
  { name: '周五', count: 0, completed: false },
  { name: '周六', count: 0, completed: false },
  { name: '周日', count: 0, completed: false }
])

const currentStreak = computed(() => {
  let streak = 0
  for (let i = weekDays.value.length - 1; i >= 0; i--) {
    if (weekDays.value[i].count > 0) {
      streak += weekDays.value[i].count
    } else {
      break
    }
  }
  return streak
})

const weeklyTotal = computed(() => {
  return weekDays.value.reduce((sum, day) => sum + day.count, 0)
})

const bestDay = computed(() => {
  const max = Math.max(...weekDays.value.map(d => d.count))
  const day = weekDays.value.find(d => d.count === max)
  return day ? day.name : '-'
})

const achievements = computed(() => [
  {
    id: 'first',
    name: '初次尝试',
    description: '完成第一个习惯',
    icon: Sparkles,
    unlocked: weeklyTotal.value > 0
  },
  {
    id: 'streak3',
    name: '连续3天',
    description: '连续打卡3天',
    icon: Trophy,
    unlocked: currentStreak.value >= 3
  },
  {
    id: 'streak7',
    name: '一周全勤',
    description: '连续打卡7天',
    icon: Trophy,
    unlocked: currentStreak.value >= 7
  },
  {
    id: 'perfect',
    name: '完美一天',
    description: '单日完成所有习惯',
    icon: CheckCircle,
    unlocked: completedHabits.value.length >= predefinedHabits.value.length
  }
])

const tips = [
  { title: '早晨黄金时间', content: '早起后的1小时是建立习惯的最佳时机' },
  { title: '环境暗示', content: '将习惯所需物品放在显眼位置' },
  { title: '追踪记录', content: '可视化的进度记录能增强动力' },
  { title: '奖励机制', content: '完成一周后给自己一个小奖励' },
  { title: '接受不完美', content: '错过一天没关系，第二天继续' }
]

const dailyTip = computed(() => {
  const dayIndex = new Date().getDay()
  return tips[dayIndex % tips.length]
})

function toggleHabit(id) {
  const index = completedHabits.value.indexOf(id)
  if (index > -1) {
    completedHabits.value.splice(index, 1)
  } else {
    completedHabits.value.push(id)
  }
}

function addCustomHabit() {
  if (!customHabit.value.name) return

  predefinedHabits.value.push({
    id: 'custom-' + Date.now(),
    name: customHabit.value.name,
    description: customHabit.value.description || '自定义习惯',
    icon: CheckCircle
  })

  customHabit.value = { name: '', description: '' }
}

function resetStreak() {
  weekDays.value.forEach(day => {
    day.count = 0
    day.completed = false
  })
}

useSeoMeta({
  title: '健康习惯追踪器 - 在线习惯养成与打卡工具',
  description: '免费在线健康习惯追踪器，追踪日常健康习惯，建立良好的生活方式，支持连续打卡和成就系统。', keywords: ['习惯追踪', '健康习惯', '习惯养成', '打卡', '习惯记录', '目标追踪', '习惯管理', '21天习惯']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('健康习惯追踪器')
</script>
