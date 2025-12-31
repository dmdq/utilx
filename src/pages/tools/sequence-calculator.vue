<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">数列计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">等差等比数列求和、通项公式、数列生成</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">等差数列</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium mb-1">首项 a₁</label>
              <input v-model.number="ap.a1" type="number" class="w-full px-3 py-2 border rounded dark:bg-gray-700">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">公差 d</label>
              <input v-model.number="ap.d" type="number" class="w-full px-3 py-2 border rounded dark:bg-gray-700">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">项数 n</label>
            <input v-model.number="ap.n" type="number" class="w-full px-3 py-2 border rounded dark:bg-gray-700">
          </div>
          <button @click="calculateArithmetic" class="w-full px-4 py-2 bg-blue-500 text-white rounded">计算</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">等比数列</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium mb-1">首项 a₁</label>
              <input v-model.number="gp.a1" type="number" class="w-full px-3 py-2 border rounded dark:bg-gray-700">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">公比 q</label>
              <input v-model.number="gp.q" type="number" step="0.01" class="w-full px-3 py-2 border rounded dark:bg-gray-700">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">项数 n</label>
            <input v-model.number="gp.n" type="number" class="w-full px-3 py-2 border rounded dark:bg-gray-700">
          </div>
          <button @click="calculateGeometric" class="w-full px-4 py-2 bg-purple-500 text-white rounded">计算</button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">计算结果</h2>
      <div v-if="arithmeticResult" class="grid grid-cols-2 gap-4 mb-4">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <p class="text-sm text-gray-600">等差数列求和</p>
          <p class="text-xl font-bold text-blue-600">{{ arithmeticResult.sum }}</p>
        </div>
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <p class="text-sm text-gray-600">通项公式</p>
          <p class="text-sm">aₙ = {{ ap.a1 }} + (n-1)×{{ ap.d }}</p>
        </div>
      </div>
      <div v-if="geometricResult" class="grid grid-cols-2 gap-4">
        <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
          <p class="text-sm text-gray-600">等比数列求和</p>
          <p class="text-xl font-bold text-purple-600">{{ geometricResult.sum }}</p>
        </div>
        <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
          <p class="text-sm text-gray-600">通项公式</p>
          <p class="text-sm">aₙ = {{ gp.a1 }} × {{ gp.q }}^(n-1)</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '数列计算器 - 等差等比数列求和',
  meta: [{ name: 'description', content: '在线数列计算器，计算等差数列和等比数列的通项公式、求和、生成数列。支持数学学习中的数列问题。' }],
  keywords: ['数列计算', '等差数列', '等比数列', '数列求和', '通项公式', '数列生成']
})

const ap = ref({ a1: 1, d: 2, n: 10 })
const gp = ref({ a1: 1, q: 2, n: 10 })
const arithmeticResult = ref<any>(null)
const geometricResult = ref<any>(null)

function calculateArithmetic() {
  const n = ap.value.n
  const a1 = ap.value.a1
  const d = ap.value.d
  const an = a1 + (n - 1) * d
  const sum = (a1 + an) * n / 2
  arithmeticResult.value = { sum: sum.toFixed(2), an: an.toFixed(2) }
}

function calculateGeometric() {
  const n = gp.value.n
  const a1 = gp.value.a1
  const q = gp.value.q
  if (q === 1) {
    geometricResult.value = { sum: (a1 * n).toFixed(2) }
  } else {
    const sum = a1 * (1 - Math.pow(q, n)) / (1 - q)
    geometricResult.value = { sum: sum.toFixed(4) }
  }
}
</script>
