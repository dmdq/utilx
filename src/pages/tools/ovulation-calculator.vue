<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">排卵期计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">排卵期预测、受孕窗口、安全期计算</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">月经信息</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">上次月经第一天</label>
          <input v-model="lastPeriod" type="date" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">月经周期 (天)</label>
          <input v-model.number="cycleLength" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="默认28">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">月经持续天数</label>
          <input v-model.number="periodDays" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="默认5">
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">计算结果</h2>
      <div class="grid md:grid-cols-3 gap-4 mb-6">
        <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded">
          <p class="text-sm text-gray-600 mb-1">排卵日</p>
          <p class="text-xl font-bold text-pink-600">{{ ovulationDate }}</p>
        </div>
        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded">
          <p class="text-sm text-gray-600 mb-1">排卵期</p>
          <p class="text-xl font-bold text-red-600">{{ ovulationPeriod }}</p>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded">
          <p class="text-sm text-gray-600 mb-1">下次月经</p>
          <p class="text-xl font-bold text-green-600">{{ nextPeriod }}</p>
        </div>
      </div>

      <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
        <h3 class="font-medium mb-2">易受孕期 (受孕窗口)</h3>
        <p class="text-lg font-semibold text-blue-600">{{ fertileWindow }}</p>
        <p class="text-sm text-gray-600 mt-2">排卵日前5天到后4天</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '排卵期计算器 - 排卵期预测工具',
  meta: [{ name: 'description', content: '在线排卵期计算器，预测排卵日、排卵期、易受孕期和安全期。帮助备孕和避孕规划。' }],
  keywords: ['排卵期计算', '排卵日', '易受孕期', '安全期', '备孕', '月经周期']
})

const lastPeriod = ref(new Date().toISOString().split('T')[0])
const cycleLength = ref(28)
const periodDays = ref(5)

const ovulationDate = computed(() => {
  const date = new Date(lastPeriod.value)
  date.setDate(date.getDate() + cycleLength.value - 14)
  return date.toLocaleDateString('zh-CN')
})

const ovulationPeriod = computed(() => {
  const date = new Date(lastPeriod.value)
  const start = new Date(date)
  start.setDate(start.getDate() + cycleLength.value - 18)
  const end = new Date(date)
  end.setDate(end.getDate() + cycleLength.value - 11)
  return `${start.toLocaleDateString('zh-CN')} - ${end.toLocaleDateString('zh-CN')}`
})

const nextPeriod = computed(() => {
  const date = new Date(lastPeriod.value)
  date.setDate(date.getDate() + cycleLength.value)
  return date.toLocaleDateString('zh-CN')
})

const fertileWindow = computed(() => {
  const date = new Date(lastPeriod.value)
  const start = new Date(date)
  start.setDate(start.getDate() + cycleLength.value - 19)
  const end = new Date(date)
  end.setDate(end.getDate() + cycleLength.value - 10)
  return `${start.toLocaleDateString('zh-CN')} - ${end.toLocaleDateString('zh-CN')}`
})
</script>
