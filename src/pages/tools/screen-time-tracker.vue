<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">屏幕时间追踪器</h1>
      <p class="text-muted-foreground">记录每日屏幕使用时间，分析数字设备使用习惯，建立健康的屏幕时间管理</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：记录工具 -->
      <div class="space-y-4">
        <!-- 添加记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus class="w-5 h-5 text-primary" />
            添加屏幕时间
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">设备类型</label>
              <select v-model="entry.device" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="phone">手机</option>
                <option value="tablet">平板</option>
                <option value="computer">电脑</option>
                <option value="tv">电视</option>
                <option value="game">游戏机</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">使用时长（分钟）</label>
              <div class="grid grid-cols-4 gap-2 mb-2">
                <button @click="entry.duration = 30" :class="['p-2 rounded text-sm', entry.duration === 30 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">30分</button>
                <button @click="entry.duration = 60" :class="['p-2 rounded text-sm', entry.duration === 60 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">1小时</button>
                <button @click="entry.duration = 120" :class="['p-2 rounded text-sm', entry.duration === 120 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">2小时</button>
                <button @click="entry.duration = 180" :class="['p-2 rounded text-sm', entry.duration === 180 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">3小时</button>
              </div>
              <input v-model.number="entry.duration" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="自定义时长">
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">用途分类</label>
              <select v-model="entry.category" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="work">工作/学习</option>
                <option value="social">社交娱乐</option>
                <option value="game">游戏</option>
                <option value="video">看视频</option>
                <option value="reading">阅读</option>
                <option value="other">其他</option>
              </select>
            </div>

            <button @click="addEntry" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm">
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
            今日暂无记录
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in todayLog"
              :key="index"
              class="flex items-center justify-between p-3 bg-muted rounded text-sm"
            >
              <div class="flex-1">
                <span class="font-medium">{{ getDeviceName(item.device) }}</span>
                <span class="text-xs text-muted-foreground ml-2">{{ getCategoryName(item.category) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono">{{ formatDuration(item.duration) }}</span>
                <button @click="removeEntry(index)" class="text-red-500 hover:text-red-700">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：统计和建议 -->
      <div class="space-y-4">
        <!-- 今日统计 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">今日屏幕时间</h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">总时长</p>
              <p class="text-5xl font-bold text-primary mb-2">{{ formatDuration(totalMinutes) }}</p>
              <p class="text-sm" :class="getHealthColor(totalMinutes)">{{ getHealthStatus(totalMinutes) }}</p>
            </div>
          </div>

          <!-- 分类统计 -->
          <div class="space-y-2">
            <div v-for="(stat, category) in categoryStats" :key="category" class="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>{{ getCategoryName(category) }}</span>
              <span class="font-mono">{{ formatDuration(stat) }}</span>
            </div>
          </div>
        </div>

        <!-- 推荐指南 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">屏幕时间指南</h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium mb-1">成人建议</p>
              <p class="text-muted-foreground">除工作外，每日娱乐屏幕时间&lt;2小时</p>
            </div>

            <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <p class="font-medium mb-1">青少年建议</p>
              <p class="text-muted-foreground">每日娱乐屏幕时间&lt;2小时</p>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium mb-1">儿童建议</p>
              <p class="text-muted-foreground">2-5岁：&lt;1小时/天；6岁以上：&lt;2小时/天</p>
            </div>
          </div>
        </div>

        <!-- 健康影响 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">过度使用屏幕的影响</h2>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
              <p class="font-medium">视力</p>
              <p class="text-xs text-muted-foreground">眼疲劳、近视</p>
            </div>
            <div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-center">
              <p class="font-medium">睡眠</p>
              <p class="text-xs text-muted-foreground">影响质量</p>
            </div>
            <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-center">
              <p class="font-medium">体态</p>
              <p class="text-xs text-muted-foreground">颈椎问题</p>
            </div>
            <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-center">
              <p class="font-medium">心理</p>
              <p class="text-xs text-muted-foreground">焦虑抑郁</p>
            </div>
          </div>
        </div>

        <!-- 减少屏幕时间建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">减少屏幕时间的建议</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>设定屏幕使用时间限制，使用应用监控工具</p>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>睡前1小时避免使用电子设备</p>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>每30-60分钟休息眼睛，眺望远方</p>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>培养线下兴趣爱好，增加社交活动</p>
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
import { Plus, X, CheckCircle } from 'lucide-vue-next'

const entry = ref({
  device: 'phone',
  duration: 60,
  category: 'social'
})

const todayLog = ref([])

const totalMinutes = computed(() => {
  return todayLog.value.reduce((sum, item) => sum + item.duration, 0)
})

const categoryStats = computed(() => {
  const stats = {}
  todayLog.value.forEach(item => {
    stats[item.category] = (stats[item.category] || 0) + item.duration
  })
  return stats
})

function addEntry() {
  if (!entry.value.duration || entry.value.duration <= 0) return

  todayLog.value.push({
    device: entry.value.device,
    duration: entry.value.duration,
    category: entry.value.category
  })
}

function removeEntry(index) {
  todayLog.value.splice(index, 1)
}

function clearToday() {
  todayLog.value = []
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`
}

function getDeviceName(device) {
  const names = {
    phone: '手机',
    tablet: '平板',
    computer: '电脑',
    tv: '电视',
    game: '游戏机'
  }
  return names[device] || device
}

function getCategoryName(category) {
  const names = {
    work: '工作/学习',
    social: '社交娱乐',
    game: '游戏',
    video: '看视频',
    reading: '阅读',
    other: '其他'
  }
  return names[category] || category
}

function getHealthStatus(minutes) {
  if (minutes < 120) return '健康范围内'
  if (minutes < 180) return '略微偏高'
  if (minutes < 300) return '偏高，建议控制'
  return '过高，需要减少'
}

function getHealthColor(minutes) {
  if (minutes < 120) return 'text-green-600'
  if (minutes < 180) return 'text-yellow-600'
  if (minutes < 300) return 'text-orange-600'
  return 'text-red-600'
}

useSeoMeta({
  title: '屏幕时间追踪器 - 在线数字设备使用时间记录工具',
  description: '免费在线屏幕时间追踪器，记录每日屏幕使用时间，分析数字设备使用习惯，建立健康的屏幕时间管理。', keywords: ['屏幕时间', '手机使用', '数字健康', '设备使用时间', '屏幕时间管理', '数字排毒', '在线追踪']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('屏幕时间追踪器')
</script>
