<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">行高计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">根据字号计算合适的行高，保持垂直节奏一致</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- 设置面板 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">计算设置</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">字号 (px)</label>
            <input v-model.number="fontSize" type="number" min="8" max="72" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">行高比例</label>
            <div class="flex gap-2">
              <input v-model.number="lineHeightRatio" type="number" min="1" max="3" step="0.05" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            </div>
            <div class="grid grid-cols-4 gap-2 mt-2">
              <button @click="lineHeightRatio = 1.2" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">1.2</button>
              <button @click="lineHeightRatio = 1.4" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">1.4</button>
              <button @click="lineHeightRatio = 1.5" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">1.5</button>
              <button @click="lineHeightRatio = 1.6" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">1.6</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">基准网格 (px)</label>
            <input v-model.number="baseGrid" type="number" min="4" max="16" step="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          </div>
        </div>

        <!-- 计算结果 -->
        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 class="text-sm font-medium mb-2">计算结果</h3>
          <div class="space-y-1 text-sm">
            <div>行高: <span class="font-bold">{{ calculatedLineHeight }}px</span></div>
            <div>对齐网格: <span class="font-bold">{{ gridLines }}行</span></div>
            <div>实际比例: <span class="font-bold">{{ actualRatio.toFixed(2) }}</span></div>
          </div>
        </div>
      </div>

      <!-- 预览 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>

        <div class="space-y-4">
          <!-- 文字预览 -->
          <div>
            <div class="text-sm text-gray-500 mb-2">文字预览</div>
            <div
              class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              :style="{ fontSize: fontSize + 'px', lineHeight: calculatedLineHeight + 'px' }"
            >
              <p>这是一段示例文字，用于展示行高效果。行高对于提升文本可读性非常重要，合适的行高可以让文本更易于阅读。良好的行高还能保持视觉上的平衡。</p>
              <p>第二段文字继续展示行高的效果。当行高设置合适时，文本会呈现出舒适的呼吸感，让阅读体验更加愉悦。</p>
            </div>
          </div>

          <!-- 网格预览 -->
          <div>
            <div class="text-sm text-gray-500 mb-2">网格对齐 (每格{{ baseGrid }}px)</div>
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg relative overflow-hidden" style="background-image: linear-gradient(to bottom, rgba(100,100,100,0.1) 1px, transparent 1px); background-size: 100% 8px;">
              <div
                :style="{ fontSize: fontSize + 'px', lineHeight: calculatedLineHeight + 'px' }"
              >
                <p>文字应该对齐网格线，这样可以保持垂直节奏的一致性。合理的垂直间距是排版设计的重要基础。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常用字号行高对照表 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常用字号行高对照表</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-2 text-left">字号</th>
              <th class="px-4 py-2 text-left">紧凑 (1.2)</th>
              <th class="px-4 py-2 text-left">标准 (1.4)</th>
              <th class="px-4 py-2 text-left">舒适 (1.5)</th>
              <th class="px-4 py-2 text-left">宽松 (1.6)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="size in commonSizes" :key="size" class="border-t border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-medium">{{ size }}px</td>
              <td class="px-4 py-2">{{ Math.round(size * 1.2) }}px</td>
              <td class="px-4 py-2">{{ Math.round(size * 1.4) }}px</td>
              <td class="px-4 py-2">{{ Math.round(size * 1.5) }}px</td>
              <td class="px-4 py-2">{{ Math.round(size * 1.6) }}px</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '行高计算器 - 垂直节奏工具',
  meta: [{ name: 'description', content: '在线行高计算工具，根据字号计算合适的行高，保持垂直节奏一致。' }],
  keywords: ['行高', 'line-height', '垂直节奏', '排版', '字体']
})

const fontSize = ref(16)
const lineHeightRatio = ref(1.5)
const baseGrid = ref(8)

const commonSizes = [12, 14, 16, 18, 20, 24, 30, 36, 48]

const calculatedLineHeight = computed(() => {
  const raw = fontSize.value * lineHeightRatio.value
  // 对齐到基准网格
  return Math.round(raw / baseGrid.value) * baseGrid.value
})

const gridLines = computed(() => {
  return calculatedLineHeight.value / baseGrid.value
})

const actualRatio = computed(() => {
  return calculatedLineHeight.value / fontSize.value
})
</script>
