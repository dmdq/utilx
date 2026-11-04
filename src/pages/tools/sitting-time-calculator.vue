<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">久坐时间计算器</h1>
      <p class="text-muted-foreground">计算每日久坐时间，评估久坐健康风险，获得活动建议</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：计算工具 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary" />
            计算久坐时间
          </h2>

          <div class="space-y-4">
            <div v-for="(period, index) in periods" :key="index" class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <span class="font-medium text-sm">{{ period.name }}</span>
                <button @click="removePeriod(index)" class="text-red-500 hover:text-red-700 text-xs">删除</button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">开始时间</label>
                  <input v-model="period.start" type="time" class="w-full px-2 py-1 border border-border rounded text-sm">
                </div>
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">结束时间</label>
                  <input v-model="period.end" type="time" class="w-full px-2 py-1 border border-border rounded text-sm">
                </div>
              </div>
            </div>

            <button @click="addPeriod" class="w-full px-4 py-3 bg-muted rounded-lg text-sm">
              <Plus class="w-4 h-4 inline mr-2" />
              添加时间段
            </button>

            <button @click="calculateSitting" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm">
              计算久坐时间
            </button>
          </div>
        </div>

        <!-- 快速估算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">快速估算</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">工作日久坐时长（小时）</label>
              <input v-model.number="workdaySitting" type="number" step="0.5" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="例如: 8">
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">休息日久坐时长（小时）</label>
              <input v-model.number="weekendSitting" type="number" step="0.5" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="例如: 6">
            </div>

            <button @click="quickCalculate" class="w-full px-4 py-3 bg-muted rounded-lg text-sm">
              快速计算
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果和建议 -->
      <div class="space-y-4">
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">计算结果</h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">每日久坐时间</p>
              <p class="text-5xl font-bold text-primary mb-2">{{ result.daily }}小时</p>
            </div>
          </div>

          <div class="p-4 rounded" :class="getRiskClass(result.daily)">
            <div class="flex items-center gap-3">
              <component :is="getRiskIcon(result.daily)" class="w-6 h-6" />
              <div>
                <p class="font-medium">{{ result.riskLevel }}</p>
                <p class="text-sm">{{ result.riskDescription }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 久坐风险 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">久坐时间风险等级</h2>

          <div class="space-y-2 text-sm">
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <div class="flex items-center justify-between">
                <span class="font-medium">低风险</span>
                <span class="font-mono text-green-600">&lt;4小时/天</span>
              </div>
            </div>
            <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <div class="flex items-center justify-between">
                <span class="font-medium">中等风险</span>
                <span class="font-mono text-yellow-600">4-7小时/天</span>
              </div>
            </div>
            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div class="flex items-center justify-between">
                <span class="font-medium">高风险</span>
                <span class="font-mono text-orange-600">7-10小时/天</span>
              </div>
            </div>
            <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded">
              <div class="flex items-center justify-between">
                <span class="font-medium">极高风险</span>
                <span class="font-mono text-red-600">&gt;10小时/天</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 减少久坐建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">减少久坐的建议</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <Activity class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">定时活动</p>
                <p class="text-muted-foreground">每30-60分钟起身活动5-10分钟</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Monitor class="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">使用站立式办公桌</p>
                <p class="text-muted-foreground">交替站立和坐着工作</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Phone class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">站立或走动接电话</p>
                <p class="text-muted-foreground">充分利用通话时间活动身体</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Coffee class="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">走动休息</p>
                <p class="text-muted-foreground">茶歇时间走动而非坐着</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康影响 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">久坐的健康影响</h2>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
              <p class="font-medium">心血管</p>
              <p class="text-xs text-muted-foreground">心脏病风险+147%</p>
            </div>
            <div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-center">
              <p class="font-medium">糖尿病</p>
              <p class="text-xs text-muted-foreground">2型糖尿病风险</p>
            </div>
            <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-center">
              <p class="font-medium">肥胖</p>
              <p class="text-xs text-muted-foreground">体重增加风险</p>
            </div>
            <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-center">
              <p class="font-medium">骨骼</p>
              <p class="text-xs text-muted-foreground">骨质疏松风险</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'
import { Clock, Plus, Activity, Monitor, Phone, Coffee, CheckCircle, AlertTriangle, XCircle } from 'lucide-vue-next'

const periods = ref([
  { name: '工作时间', start: '09:00', end: '12:00' },
  { name: '下午工作', start: '13:00', end: '18:00' }
])

const workdaySitting = ref(8)
const weekendSitting = ref(6)

const result = ref(null)

function addPeriod() {
  periods.value.push({ name: `时间段${periods.value.length + 1}`, start: '00:00', end: '01:00' })
}

function removePeriod(index) {
  periods.value.splice(index, 1)
}

function calculateSitting() {
  let totalMinutes = 0

  periods.value.forEach(period => {
    const [startH, startM] = period.start.split(':').map(Number)
    const [endH, endM] = period.end.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (endMinutes > startMinutes) {
      totalMinutes += endMinutes - startMinutes
    }
  })

  const dailyHours = (totalMinutes / 60).toFixed(1)
  evaluateResult(parseFloat(dailyHours))
}

function quickCalculate() {
  const daily = ((workdaySitting.value || 0) * 5 + (weekendSitting.value || 0) * 2) / 7
  evaluateResult(daily)
}

function evaluateResult(daily) {
  let riskLevel, riskDescription

  if (daily < 4) {
    riskLevel = '低风险'
    riskDescription = '您的久坐时间在健康范围内，请继续保持'
  } else if (daily < 7) {
    riskLevel = '中等风险'
    riskDescription = '久坐时间偏高，建议增加日常活动'
  } else if (daily < 10) {
    riskLevel = '高风险'
    riskDescription = '久坐时间过长，需要立即采取行动减少久坐'
  } else {
    riskLevel = '极高风险'
    riskDescription = '久坐时间严重超标，强烈建议改变生活方式'
  }

  result.value = {
    daily: daily.toFixed(1),
    riskLevel,
    riskDescription
  }
}

function getRiskClass(hours) {
  if (hours < 4) return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
  if (hours < 7) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
  if (hours < 10) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
  return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
}

function getRiskIcon(hours) {
  if (hours < 4) return CheckCircle
  if (hours < 7) return AlertTriangle
  return XCircle
}

useSeoMeta({
  title: '久坐时间计算器 - 在线久坐健康风险评估工具',
  description: '免费在线久坐时间计算器，计算每日久坐时间，评估久坐健康风险，获得科学的活动建议。', keywords: ['久坐', '久坐时间', '久坐危害', '健康风险', '办公健康', '久坐计算', '活动建议']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('久坐时间计算器')
</script>
