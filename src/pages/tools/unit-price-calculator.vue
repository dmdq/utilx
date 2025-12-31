<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">单价计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">单价对比、按重量/体积/尺寸换算</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">商品A</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">价格</label>
            <input v-model.number="productA.price" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">数量/重量</label>
            <input v-model.number="productA.quantity" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">单位</label>
            <select v-model="productA.unit" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
              <option value="个">个</option>
              <option value="g">克</option>
              <option value="kg">公斤</option>
              <option value="ml">毫升</option>
              <option value="L">升</option>
              <option value="m">米</option>
            </select>
          </div>
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p class="text-sm text-gray-600">单价</p>
            <p class="text-2xl font-bold text-blue-600">¥{{ unitPriceA }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">商品B</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">价格</label>
            <input v-model.number="productB.price" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">数量/重量</label>
            <input v-model.number="productB.quantity" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">单位</label>
            <select v-model="productB.unit" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
              <option value="个">个</option>
              <option value="g">克</option>
              <option value="kg">公斤</option>
              <option value="ml">毫升</option>
              <option value="L">升</option>
              <option value="m">米</option>
            </select>
          </div>
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
            <p class="text-sm text-gray-600">单价</p>
            <p class="text-2xl font-bold text-purple-600">¥{{ unitPriceB }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">对比结果</h2>
      <div class="p-4 rounded" :class="comparisonClass">
        <p class="text-lg font-semibold">{{ comparisonText }}</p>
        <p class="text-sm text-gray-600 mt-2">差价: ¥{{ priceDifference }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '单价计算器 - 商品单价对比工具',
  meta: [{ name: 'description', content: '在线单价计算器，计算商品单价、对比不同包装的价格、按重量体积换算单价。购物比价必备工具。' }],
  keywords: ['单价计算', '单价对比', '价格对比', '单位换算', '购物比价', '性价比']
})

const productA = ref({ price: 10, quantity: 500, unit: 'g' })
const productB = ref({ price: 25, quantity: 1, unit: 'kg' })

const unitPriceA = computed(() => (productA.value.price / productA.value.quantity).toFixed(4))
const unitPriceB = computed(() => (productB.value.price / productB.value.quantity).toFixed(4))

const priceDifference = computed(() => Math.abs(parseFloat(unitPriceA) - parseFloat(unitPriceB)).toFixed(4))
const comparisonText = computed(() => {
  const a = parseFloat(unitPriceA.value)
  const b = parseFloat(unitPriceB.value)
  if (a < b) return '商品A 更划算'
  if (a > b) return '商品B 更划算'
  return '单价相同'
})
const comparisonClass = computed(() => {
  const a = parseFloat(unitPriceA.value)
  const b = parseFloat(unitPriceB.value)
  if (a < b) return 'bg-green-50 dark:bg-green-900/20'
  if (a > b) return 'bg-red-50 dark:bg-red-900/20'
  return 'bg-gray-50 dark:bg-gray-700'
})
</script>
