<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">折扣计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">计算折扣后价格、节省金额和折扣率</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入数据</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">原价</label>
            <input
              v-model.number="originalPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="输入原价"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">折扣率 (%)</label>
            <input
              v-model.number="discountPercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="输入折扣率，如 20 表示 8 折"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">折数（可选）</label>
            <input
              v-model.number="discountDecimal"
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="如 8 表示 8 折，会自动转换折扣率"
              @input="convertDecimalToPercent"
            >
            <p class="text-xs text-gray-500 mt-1">输入折数会自动转换折扣率</p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">额外减免金额（可选）</label>
            <input
              v-model.number="extraDiscount"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="额外的减免金额"
            >
          </div>
        </div>

        <!-- 快捷折扣按钮 -->
        <div class="mt-4">
          <label class="block text-sm font-medium mb-2">快捷折扣</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in presetDiscounts"
              :key="preset"
              @click="setDiscount(preset)"
              class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            >
              {{ preset }}%
            </button>
          </div>
        </div>

        <!-- 快捷折数按钮 -->
        <div class="mt-4">
          <label class="block text-sm font-medium mb-2">快捷折数</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="discount in presetDecimals"
              :key="discount.label"
              @click="setDecimal(discount.value)"
              class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            >
              {{ discount.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 计算结果 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">计算结果</h2>

        <div v-if="isValid" class="space-y-4">
          <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">折后价格</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              ¥{{ finalPrice.toFixed(2) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">折扣金额</p>
              <p class="text-xl font-semibold text-red-500">-¥{{ discountAmount.toFixed(2) }}</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">实际折扣率</p>
              <p class="text-xl font-semibold text-blue-500">{{ actualDiscountPercent.toFixed(1) }}%</p>
            </div>
          </div>

          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">节省</p>
            <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {{ ((originalPrice - finalPrice) / originalPrice * 100).toFixed(1) }}% 的价格
            </p>
          </div>

          <!-- 计算详情 -->
          <div class="border-t pt-4">
            <h3 class="text-sm font-medium mb-2">计算详情</h3>
            <div class="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <p>原价: ¥{{ originalPrice.toFixed(2) }}</p>
              <p>折扣: {{ discountPercent }}% = -¥{{ (originalPrice * discountPercent / 100).toFixed(2) }}</p>
              <p v-if="extraDiscount > 0">额外减免: -¥{{ extraDiscount.toFixed(2) }}</p>
              <p class="font-medium">最终价格: ¥{{ finalPrice.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-gray-400">
          请输入有效的原价和折扣率
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">使用说明</h2>
      <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p>• <strong>折扣率</strong>：输入折扣百分比，如 20 表示打 8 折（减免20%）</p>
        <p>• <strong>折数</strong>：直接输入折数，如 8 表示 8 折（会自动转换为折扣率 20%）</p>
        <p>• <strong>额外减免</strong>：在折扣的基础上再减免固定金额</p>
        <p>• 折扣率 = (1 - 折数) × 100%，例如 8 折 = 20% 折扣率</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '折扣计算器 - 在线打折价格计算',
  meta: [{ name: 'description', content: '在线折扣计算器，快速计算打折后价格、节省金额和折扣率。支持折扣率和折数输入，适用于购物优惠、促销活动计算。' }],
  keywords: ['折扣计算', '打折计算', '价格计算', '优惠计算', '折扣率', '折数转换']
})

const originalPrice = ref<number>(100)
const discountPercent = ref<number>(20)
const extraDiscount = ref<number>(0)
const discountDecimal = ref<number>(0)

const presetDiscounts = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80]
const presetDecimals = [
  { label: '9折', value: 9 },
  { label: '8折', value: 8 },
  { label: '7折', value: 7 },
  { label: '6折', value: 6 },
  { label: '5折', value: 5 },
  { label: '4折', value: 4 },
  { label: '3折', value: 3 },
  { label: '2折', value: 2 },
  { label: '1折', value: 1 }
]

const isValid = computed(() => {
  return originalPrice.value > 0 && discountPercent.value >= 0 && discountPercent.value <= 100
})

const discountAmount = computed(() => {
  return originalPrice.value * (discountPercent.value / 100) + extraDiscount.value
})

const finalPrice = computed(() => {
  const price = Math.max(0, originalPrice.value - discountAmount.value)
  return price
})

const actualDiscountPercent = computed(() => {
  if (originalPrice.value === 0) return 0
  return ((originalPrice.value - finalPrice.value) / originalPrice.value) * 100
})

function setDiscount(percent: number) {
  discountPercent.value = percent
  discountDecimal.value = 0
}

function setDecimal(decimal: number) {
  discountDecimal.value = decimal
  discountPercent.value = (1 - decimal / 10) * 100
}

function convertDecimalToPercent() {
  if (discountDecimal.value > 0) {
    const decimal = Math.min(10, Math.max(0.1, discountDecimal.value))
    discountPercent.value = (1 - decimal / 10) * 100
  }
}
</script>
