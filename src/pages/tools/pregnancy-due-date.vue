<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">预产期计算器</h1>
      <p class="text-muted-foreground">计算预产期和重要孕期时间节点，追踪胎儿发育进程</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar class="w-5 h-5 text-primary" />
            计算预产期
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">末次月经第一天</label>
              <input
                v-model="lastPeriod"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">月经周期（天）</label>
              <input
                v-model.number="cycleLength"
                type="number"
                min="20"
                max="45"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="默认28天"
              >
            </div>

            <button
              @click="calculateDueDate"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              计算预产期
            </button>
          </div>
        </div>

        <!-- 重要时间节点 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">重要时间节点</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span>预产期</span>
              <span class="font-medium">{{ result.dueDate }}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>受孕日</span>
              <span class="font-mono">{{ result.conceptionDate }}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>早孕期结束（12周）</span>
              <span class="font-mono">{{ result.week12 }}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>中孕期结束（27周）</span>
              <span class="font-mono">{{ result.week27 }}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>早产界限（37周）</span>
              <span class="font-mono">{{ result.week37 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <!-- 当前状态 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">当前状态</h2>

          <div class="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-6 border-2 border-pink-200 dark:border-pink-800 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">当前孕周</p>
              <p class="text-5xl font-bold text-pink-600 mb-2">{{ result.currentWeeks }}周</p>
              <p class="text-sm">{{ result.currentDays }}天</p>
            </div>
          </div>

          <div class="p-4 bg-muted rounded">
            <p class="text-sm text-muted-foreground">距离预产期还有 {{ result.daysUntilDue }} 天</p>
          </div>
        </div>

        <!-- 胎儿发育 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">胎儿发育特点</h2>

          <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded">
            <p class="font-medium mb-2">{{ result.developmentStage.title }}</p>
            <p class="text-sm text-muted-foreground">{{ result.developmentStage.description }}</p>
          </div>
        </div>

        <!-- 孕期注意事项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">孕期注意事项</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-start gap-3">
              <Apple class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p>均衡饮食，补充叶酸、铁、钙</p>
            </div>
            <div class="flex items-start gap-3">
              <Activity class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>适量运动，避免剧烈活动</p>
            </div>
            <div class="flex items-start gap-3">
              <Moon class="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <p>充足睡眠，左侧卧位休息</p>
            </div>
            <div class="flex items-start gap-3">
              <Shield class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>定期产检，按时接种疫苗</p>
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
import { Calendar, Apple, Activity, Moon, Shield } from 'lucide-vue-next'

const lastPeriod = ref('')
const cycleLength = ref(28)

const result = ref(null)

function calculateDueDate() {
  if (!lastPeriod.value) {
    alert('请输入末次月经日期')
    return
  }

  const periodDate = new Date(lastPeriod.value)
  const cycleAdjustment = cycleLength.value - 28

  // 预产期 = 末次月经 + 280天 + 周期调整
  const dueDate = new Date(periodDate)
  dueDate.setDate(dueDate.getDate() + 280 + cycleAdjustment)

  // 受孕日 = 末次月经 + 14天 + 周期调整
  const conceptionDate = new Date(periodDate)
  conceptionDate.setDate(conceptionDate.getDate() + 14 + cycleAdjustment)

  // 计算当前孕周
  const today = new Date()
  const diffTime = today - periodDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const currentWeeks = Math.floor(diffDays / 7)
  const currentDays = diffDays % 7

  // 距离预产期天数
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

  // 重要节点
  const week12 = new Date(periodDate)
  week12.setDate(week12.getDate() + 12 * 7)

  const week27 = new Date(periodDate)
  week27.setDate(week27.getDate() + 27 * 7)

  const week37 = new Date(periodDate)
  week37.setDate(week37.getDate() + 37 * 7)

  // 胎儿发育阶段
  const developmentStage = getDevelopmentStage(currentWeeks)

  result.value = {
    dueDate: formatDate(dueDate),
    conceptionDate: formatDate(conceptionDate),
    week12: formatDate(week12),
    week27: formatDate(week27),
    week37: formatDate(week37),
    currentWeeks,
    currentDays,
    daysUntilDue,
    developmentStage
  }
}

function getDevelopmentStage(weeks) {
  if (weeks < 12) {
    return {
      title: '早孕期（0-12周）',
      description: '器官形成关键期，胚胎细胞快速分化，心脏开始跳动，面部特征形成。'
    }
  } else if (weeks < 27) {
    return {
      title: '中孕期（13-27周）',
      description: '胎儿快速生长，可以感觉到胎动，性别可以辨别，听觉开始发育。'
    }
  } else {
    return {
      title: '晚孕期（28周+）',
      description: '胎儿成熟期，体重快速增加，肺部发育成熟，为出生做准备。'
    }
  }
}

function formatDate(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

useSeoMeta({
  title: '预产期计算器 - 在线孕期时间计算工具',
  description: '免费在线预产期计算器，计算预产期和重要孕期时间节点，追踪胎儿发育进程，提供孕期注意事项。', keywords: ['预产期', '怀孕计算器', '孕周计算', '末次月经', '胎儿发育', '孕期计算', 'due date calculator']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('预产期计算器')
</script>
