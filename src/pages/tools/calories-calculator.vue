<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">卡路里计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">基础代谢率、每日消耗、饮食热量计算</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入信息</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">性别</label>
            <select v-model="gender" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">年龄</label>
            <input v-model.number="age" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">身高 (cm)</label>
            <input v-model.number="height" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">体重 (kg)</label>
            <input v-model.number="weight" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">活动水平</label>
            <select v-model="activity" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
              <option value="1.2">久坐不动</option>
              <option value="1.375">轻度活动 (1-3天/周)</option>
              <option value="1.55">中度活动 (3-5天/周)</option>
              <option value="1.725">高度活动 (6-7天/周)</option>
              <option value="1.9">极高度活动 (体力劳动/训练)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">计算结果</h2>
        <div class="space-y-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">基础代谢率 (BMR)</p>
            <p class="text-3xl font-bold text-blue-600">{{ bmr }} kcal</p>
          </div>
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">每日总消耗 (TDEE)</p>
            <p class="text-3xl font-bold text-green-600">{{ tdee }} kcal</p>
          </div>
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p class="text-sm font-medium mb-2">减重/增重目标</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>减重 (-500kcal)</span>
                <span class="font-semibold">{{ (tdee - 500).toFixed(0) }} kcal</span>
              </div>
              <div class="flex justify-between">
                <span>增重 (+500kcal)</span>
                <span class="font-semibold">{{ (tdee + 500).toFixed(0) }} kcal</span>
              </div>
              <div class="flex justify-between">
                <span>保持体重</span>
                <span class="font-semibold">{{ tdee }} kcal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '卡路里计算器 - 每日热量需求计算',
  meta: [{ name: 'description', content: '在线卡路里计算器，计算基础代谢率BMR、每日总消耗TDEE、减重增重热量需求。支持Mifflin-St Jeor公式。' }],
  keywords: ['卡路里计算', 'BMR计算', '基础代谢', '每日消耗', 'TDEE', '减重热量', '增重热量']
})

const gender = ref('male')
const age = ref(30)
const height = ref(175)
const weight = ref(70)
const activity = ref(1.375)

const bmr = computed(() => {
  // Mifflin-St Jeor 公式
  if (gender.value === 'male') {
    return (10 * weight.value) + (6.25 * height.value) - (5 * age.value) + 5
  } else {
    return (10 * weight.value) + (6.25 * height.value) - (5 * age.value) - 161
  }
})

const tdee = computed(() => bmr.value * activity.value)
</script>
