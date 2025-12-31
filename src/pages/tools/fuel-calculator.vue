<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">油耗计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">百公里油耗、油费计算、行程成本估算</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入数据</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">行驶里程 (公里)</label>
            <input v-model.number="distance" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="如 500">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">消耗燃油 (升)</label>
            <input v-model.number="fuel" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="如 40">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">油价 (元/升)</label>
            <input v-model.number="price" type="number" step="0.01" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="如 8.5">
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">计算结果</h2>
        <div class="space-y-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">百公里油耗</p>
            <p class="text-3xl font-bold text-blue-600">{{ consumption.toFixed(1) }} L/100km</p>
          </div>
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">油费</p>
            <p class="text-3xl font-bold text-green-600">¥{{ totalCost.toFixed(2) }}</p>
          </div>
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">每公里成本</p>
            <p class="text-3xl font-bold text-purple-600">¥{{ costPerKm.toFixed(2) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '油耗计算器 - 汽车油耗成本计算',
  meta: [{ name: 'description', content: '在线油耗计算器，计算百公里油耗、油费和行程成本。支持不同油价计算，适用于车主计算燃油消耗。' }],
  keywords: ['油耗计算', '百公里油耗', '油费计算', '汽车油耗', '燃油成本', '油耗换算']
})

const distance = ref(500)
const fuel = ref(40)
const price = ref(8.5)

const consumption = computed(() => {
  if (distance.value === 0) return 0
  return (fuel.value / distance.value) * 100
})

const totalCost = computed(() => fuel.value * price.value)
const costPerKm = computed(() => {
  if (distance.value === 0) return 0
  return totalCost.value / distance.value
})
</script>
