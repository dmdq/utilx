<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">销售税计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">增值税计算、含税价/不含税价转换</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">不含税价 → 含税价</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">不含税价格</label>
            <input v-model.number="netPrice" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="不含税价">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">税率 (%)</label>
            <input v-model.number="taxRate" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="如 13">
          </div>
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p class="text-sm text-gray-600">含税价</p>
            <p class="text-2xl font-bold text-blue-600">¥{{ grossPrice }}</p>
          </div>
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded">
            <p class="text-sm text-gray-600">税额</p>
            <p class="text-2xl font-bold text-green-600">¥{{ taxAmount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">含税价 → 不含税价</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">含税价格</label>
            <input v-model.number="grossPrice2" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="含税价">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">税率 (%)</label>
            <input v-model.number="taxRate2" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700" placeholder="如 13">
          </div>
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
            <p class="text-sm text-gray-600">不含税价</p>
            <p class="text-2xl font-bold text-purple-600">¥{{ netPrice2 }}</p>
          </div>
          <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
            <p class="text-sm text-gray-600">税额</p>
            <p class="text-2xl font-bold text-orange-600">¥{{ taxAmount2 }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '销售税计算器 - 增值税计算工具',
  meta: [{ name: 'description', content: '在线销售税计算器，支持含税价与不含税价互转、增值税计算。适用于电商、零售、财务管理。' }],
  keywords: ['销售税计算', '增值税计算', '含税价', '不含税价', '税率换算', '价税分离']
})

const netPrice = ref(100)
const taxRate = ref(13)
const grossPrice2 = ref(113)
const taxRate2 = ref(13)

const grossPrice = computed(() => (netPrice.value * (1 + taxRate.value / 100)).toFixed(2))
const taxAmount = computed(() => (netPrice.value * taxRate.value / 100).toFixed(2))
const netPrice2 = computed(() => (grossPrice2.value / (1 + taxRate2.value / 100)).toFixed(2))
const taxAmount2 = computed(() => (parseFloat(netPrice2.value) * taxRate2.value / 100).toFixed(2))
</script>
