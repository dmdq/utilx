<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">比例计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">正比例/反比例计算、比例缩放、配方调整</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">比例计算 a:b = c:d</h2>
      <div class="grid grid-cols-4 gap-4 mb-4">
        <input v-model.number="a" type="number" class="px-4 py-2 border rounded dark:bg-gray-700" placeholder="a">
        <input v-model.number="b" type="number" class="px-4 py-2 border rounded dark:bg-gray-700" placeholder="b">
        <input v-model.number="c" type="number" class="px-4 py-2 border rounded dark:bg-gray-700" placeholder="c">
        <input v-model.number="d" type="number" class="px-4 py-2 border rounded dark:bg-gray-700" placeholder="d">
      </div>
      <button @click="calculateProportion" class="px-4 py-2 bg-blue-500 text-white rounded">计算未知数</button>
      <div v-if="proportionResult" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded">
        <p class="text-lg font-semibold text-green-600">未知数 = {{ proportionResult }}</p>
        <p class="text-sm text-gray-600 mt-2">比例值 = {{ ratioValue }}</p>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
      <h2 class="text-xl font-semibold mb-4">缩放计算</h2>
      <div class="flex gap-4 mb-4">
        <input v-model.number="originalValue" type="number" class="flex-1 px-4 py-2 border rounded dark:bg-gray-700" placeholder="原值">
        <input v-model.number="scale" type="number" step="0.01" class="w-32 px-4 py-2 border rounded dark:bg-gray-700" placeholder="缩放倍数">
        <button @click="scaledValue = originalValue * scale" class="px-4 py-2 bg-purple-500 text-white rounded">计算</button>
      </div>
      <div v-if="scaledValue !== null" class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
        <p class="text-lg font-semibold text-purple-600">结果 = {{ scaledValue }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '比例计算器 - 正反比例计算',
  meta: [{ name: 'description', content: '在线比例计算器，计算正比例、反比例、比例缩放、配方调整。解决a:b=c:d比例问题。' }],
  keywords: ['比例计算', '正比例', '反比例', '比例缩放', '配方计算', '比例求解']
})

const a = ref(1)
const b = ref(2)
const c = ref(3)
const d = ref<number | null>(null)
const proportionResult = ref<number | null>(null)
const ratioValue = ref(0.5)
const originalValue = ref(100)
const scale = ref(1.5)
const scaledValue = ref<number | null>(null)

function calculateProportion() {
  const values = [a.value, b.value, c.value, d.value].filter(v => v !== null && v !== 0)
  const known = values.length
  if (known >= 3) {
    if (d.value === null) {
      proportionResult.value = (c.value * b.value) / a.value
    } else if (c.value === null) {
      proportionResult.value = (a.value * d.value) / b.value
    } else if (b.value === null) {
      proportionResult.value = (a.value * d.value) / c.value
    } else if (a.value === null) {
      proportionResult.value = (b.value * c.value) / d.value
    }
    ratioValue.value = a.value / b.value
  }
}
</script>
