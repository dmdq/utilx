<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">体重目标规划器</h1>
      <p class="text-muted-foreground">科学规划减重或增重目标，计算时间线和热量需求，制定可行计划</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target class="w-5 h-5 text-primary" />
            基本信息
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">目标类型</label>
              <div class="grid grid-cols-2 gap-2">
                <button @click="goalType = 'lose'" :class="['p-3 rounded-lg text-sm', goalType === 'lose' ? 'bg-red-100 text-red-700' : 'bg-muted hover:bg-muted/80']">减重</button>
                <button @click="goalType = 'gain'" :class="['p-3 rounded-lg text-sm', goalType === 'gain' ? 'bg-blue-100 text-blue-700' : 'bg-muted hover:bg-muted/80']">增重</button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">当前体重 (kg)</label>
                <input v-model.number="currentWeight" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="当前体重">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">目标体重 (kg)</label>
                <input v-model.number="targetWeight" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="目标体重">
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">性别</label>
              <div class="grid grid-cols-2 gap-2">
                <button @click="gender = 'male'" :class="['p-3 rounded-lg text-sm', gender === 'male' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">男性</button>
                <button @click="gender = 'female'" :class="['p-3 rounded-lg text-sm', gender === 'female' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">女性</button>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">身高 (cm)</label>
              <input v-model.number="height" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="身高">
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">年龄</label>
              <input v-model.number="age" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="年龄">
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">活动水平</label>
              <select v-model="activityLevel" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="1.2">久坐少动</option>
                <option value="1.375">轻度活动</option>
                <option value="1.55">中度活动</option>
                <option value="1.725">高度活动</option>
                <option value="1.9">极度活动</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">每周期望减/增重 (kg)</label>
              <select v-model="weeklyRate" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option :value="0.5">0.5kg（温和）</option>
                <option :value="1">1kg（标准）</option>
                <option :value="1.5">1.5kg（积极）</option>
              </select>
            </div>

            <button @click="calculatePlan" class="w-full px-4 py-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Target class="w-5 h-5 inline mr-2" />
              制定计划
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div v-if="plan" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">您的计划</h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">预计达成时间</p>
              <p class="text-5xl font-bold text-primary mb-2">{{ plan.weeks }}周</p>
              <p class="text-sm">{{ plan.months }}</p>
            </div>
          </div>

          <div class="space-y-3 mb-4">
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span class="text-sm">体重变化</span>
              <span class="font-bold">{{ plan.weightChange }}kg</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span class="text-sm">每日热量目标</span>
              <span class="font-bold">{{ plan.dailyCalories }}大卡</span>
            </div>
          </div>
        </div>

        <!-- 阶段计划 -->
        <div v-if="plan" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">阶段性目标</h2>

          <div class="space-y-2">
            <div
              v-for="(phase, index) in plan.phases"
              :key="index"
              class="p-3 rounded border"
              :class="index === 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-300' : 'bg-muted'"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">阶段 {{ index + 1 }}</span>
                <span class="text-xs px-2 py-1 rounded" :class="phase.badgeClass">{{ phase.badge }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <span>目标: {{ phase.weight }}kg</span>
                <span>时长: {{ phase.weeks }}周</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 成功建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">成功建议</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">设定现实目标</p>
                <p class="text-muted-foreground">每周0.5-1kg的变化是可持续的健康速度</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">记录追踪</p>
                <p class="text-muted-foreground">每周固定时间称重，记录进展</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">调整预期</p>
                <p class="text-muted-foreground">体重波动是正常的，关注长期趋势</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">生活方式改变</p>
                <p class="text-muted-foreground">聚焦于健康饮食和运动，而不仅仅是体重</p>
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
import { Target, CheckCircle } from 'lucide-vue-next'

const goalType = ref('lose')
const gender = ref('male')
const currentWeight = ref(null)
const targetWeight = ref(null)
const height = ref(null)
const age = ref(null)
const activityLevel = ref('1.55')
const weeklyRate = ref(1)

const plan = ref(null)

function calculatePlan() {
  if (!currentWeight.value || !targetWeight.value || !height.value || !age.value) {
    alert('请填写完整信息')
    return
  }

  const weightDiff = targetWeight.value - currentWeight.value
  const totalWeeks = Math.abs(weightDiff / weeklyRate.value)
  const months = (totalWeeks / 4).toFixed(1)

  // 计算BMR和TDEE
  let bmr
  if (gender.value === 'male') {
    bmr = 10 * currentWeight.value + 6.25 * height.value - 5 * age.value + 5
  } else {
    bmr = 10 * currentWeight.value + 6.25 * height.value - 5 * age.value - 161
  }

  const tdee = bmr * parseFloat(activityLevel.value)

  // 计算每日热量需求
  const calorieAdjustment = (weeklyRate.value * 7700) / 7 // 1kg脂肪约7700大卡
  const dailyCalories = Math.round(tdee + (goalType.value === 'gain' ? calorieAdjustment : -calorieAdjustment))

  // 生成阶段性目标
  const phases = []
  const phaseCount = Math.min(4, Math.ceil(totalWeeks / 4))
  const weightPerPhase = weightDiff / phaseCount

  for (let i = 0; i < phaseCount; i++) {
    const phaseWeight = currentWeight.value + (weightPerPhase * (i + 1))
    const phaseWeeks = Math.ceil(totalWeeks / phaseCount)

    let badge, badgeClass
    if (i === 0) {
      badge = '第一阶段'
      badgeClass = 'bg-blue-100 text-blue-700'
    } else if (i === phaseCount - 1) {
      badge = '目标阶段'
      badgeClass = 'bg-green-100 text-green-700'
    } else {
      badge = `中间阶段`
      badgeClass = 'bg-gray-100 text-gray-700'
    }

    phases.push({
      weight: phaseWeight.toFixed(1),
      weeks: phaseWeeks,
      badge,
      badgeClass
    })
  }

  plan.value = {
    weeks: Math.round(totalWeeks),
    months: months + '个月',
    weightChange: weightDiff.toFixed(1),
    dailyCalories,
    phases
  }
}

useSeoMeta({
  title: '体重目标规划器 - 在线减重增重计划制定工具',
  description: '免费在线体重目标规划器，科学规划减重或增重目标，计算时间线和热量需求，制定可行的体重管理计划。', keywords: ['体重目标', '减重计划', '增重计划', '体重管理', '热量计算', '减脂', '增肌', '体重规划', '健康体重']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('体重目标规划器')
</script>
