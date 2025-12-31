<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">小费计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">餐厅小费计算、分账计算、税率支持</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">账单信息</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">账单金额</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                v-model.number="billAmount"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="输入账单金额"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">小费比例 (%)</label>
            <div class="flex gap-2">
              <input
                v-model.number="tipPercent"
                type="number"
                step="1"
                min="0"
                max="100"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="小费比例"
              >
              <span class="flex items-center px-3 text-gray-500">%</span>
            </div>
          </div>

          <!-- 快捷小费比例 -->
          <div>
            <label class="block text-sm font-medium mb-2">快捷选择</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presetTips"
                :key="preset"
                @click="tipPercent = preset"
                :class="[
                  'px-4 py-2 rounded-lg transition',
                  tipPercent === preset
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900'
                ]"
              >
                {{ preset }}%
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">税率 (%) (可选)</label>
            <div class="flex gap-2">
              <input
                v-model.number="taxRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="税率"
              >
              <span class="flex items-center px-3 text-gray-500">%</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">如果账单已含税请留空</p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">分账人数</label>
            <div class="flex items-center gap-3">
              <button
                @click="peopleCount = Math.max(1, peopleCount - 1)"
                class="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                -
              </button>
              <input
                v-model.number="peopleCount"
                type="number"
                min="1"
                max="100"
                class="flex-1 text-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
              <button
                @click="peopleCount++"
                class="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                +
              </button>
            </div>
          </div>

          <!-- 是否税费包含在小费计算中 -->
          <div class="flex items-center gap-2">
            <input
              v-model="tipOnTax"
              type="checkbox"
              id="tipOnTax"
              class="w-4 h-4 rounded border-gray-300"
            >
            <label for="tipOnTax" class="text-sm">小费基于税前金额计算</label>
          </div>

          <!-- 自定义小费金额 -->
          <div>
            <label class="block text-sm font-medium mb-1">或直接输入小费金额</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                v-model.number="customTipAmount"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="直接输入小费金额"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 计算结果 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">计算结果</h2>

        <div v-if="billAmount > 0" class="space-y-4">
          <!-- 汇总卡片 -->
          <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">总计</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              ¥{{ totalAmount.toFixed(2) }}
            </p>
          </div>

          <!-- 详细明细 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">账单金额</span>
              <span class="font-semibold">¥{{ billAmount.toFixed(2) }}</span>
            </div>

            <div v-if="taxAmount > 0" class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">税费 ({{ taxRate }}%)</span>
              <span class="font-semibold">¥{{ taxAmount.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">小费 ({{ effectiveTipPercent }}%)</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">¥{{ tipAmount.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <span class="font-medium">总计</span>
              <span class="font-bold text-green-600 dark:text-green-400">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <!-- 分账信息 -->
          <div v-if="peopleCount > 1" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div class="flex items-center gap-2 mb-2">
              <Users class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span class="font-medium">分账详情 ({{ peopleCount }}人)</span>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">每人应付</span>
                <span class="font-semibold">¥{{ perPersonAmount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">每人小费</span>
                <span class="font-semibold">¥{{ perPersonTip.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 小费建议 -->
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 class="text-sm font-medium mb-2 flex items-center gap-2">
              <Lightbulb class="w-4 h-4" />
              小费建议参考
            </h3>
            <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <p>• 优质服务: 15-20%</p>
              <p>• 良好服务: 10-15%</p>
              <p>• 一般服务: 5-10%</p>
              <p>• 快餐/外卖: 通常不需要小费</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-gray-400">
          请输入账单金额开始计算
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Users, Lightbulb } from 'lucide-vue-next'

useHead({
  title: '小费计算器 - 餐厅分账计算工具',
  meta: [{ name: 'description', content: '在线小费计算器，快速计算餐厅小费和分账金额。支持自定义小费比例、税率计算、多人分账功能，适用于餐厅结账、聚会AA制等场景。' }],
  keywords: ['小费计算', '分账计算', '餐厅小费', 'AA制', '小费比例', '账单分摊']
})

const billAmount = ref<number>(0)
const tipPercent = ref<number>(15)
const taxRate = ref<number>(0)
const peopleCount = ref<number>(1)
const tipOnTax = ref<boolean>(false)
const customTipAmount = ref<number>(0)

const presetTips = [0, 5, 10, 12, 15, 18, 20, 25]

const taxAmount = computed(() => {
  if (taxRate.value === 0) return 0
  return billAmount.value * (taxRate.value / 100)
})

const effectiveTipPercent = computed(() => {
  if (customTipAmount.value > 0) {
    return ((customTipAmount.value / billAmount.value) * 100).toFixed(1)
  }
  return tipPercent.value
})

const tipAmount = computed(() => {
  if (customTipAmount.value > 0) {
    return customTipAmount.value
  }

  const baseAmount = tipOnTax.value ? billAmount.value : billAmount.value + taxAmount.value
  return baseAmount * (tipPercent.value / 100)
})

const totalAmount = computed(() => {
  return billAmount.value + taxAmount.value + tipAmount.value
})

const perPersonAmount = computed(() => {
  return totalAmount.value / peopleCount.value
})

const perPersonTip = computed(() => {
  return tipAmount.value / peopleCount.value
})
</script>
