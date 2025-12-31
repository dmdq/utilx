<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">黄金比例计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">计算黄金比例分割，用于版式设计和排版</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- 计算器 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">黄金比例计算</h2>

        <div class="space-y-4">
          <!-- 输入 -->
          <div>
            <label class="block text-sm font-medium mb-2">输入基础尺寸 (px)</label>
            <div class="flex gap-2">
              <input
                v-model.number="baseSize"
                type="number"
                min="1"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                @input="calculate"
              >
              <button @click="calculate" class="px-4 py-2 bg-blue-500 text-white rounded-lg">计算</button>
            </div>
          </div>

          <!-- 方向选择 -->
          <div>
            <label class="block text-sm font-medium mb-2">分割方向</label>
            <div class="flex gap-2">
              <button
                @click="direction = 'horizontal'"
                :class="['flex-1 px-4 py-2 rounded-lg', direction === 'horizontal' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
              >
                水平分割
              </button>
              <button
                @click="direction = 'vertical'"
                :class="['flex-1 px-4 py-2 rounded-lg', direction === 'vertical' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
              >
                垂直分割
              </button>
            </div>
          </div>
        </div>

        <!-- 结果展示 -->
        <div class="mt-6">
          <h3 class="text-sm font-medium mb-3">计算结果</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="text-sm text-gray-500 mb-1">较大段</div>
              <div class="text-2xl font-bold text-blue-600">{{ largerSection }}px</div>
              <div class="text-xs text-gray-400 mt-1">{{ (largerSection / baseSize * 100).toFixed(1) }}%</div>
            </div>
            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div class="text-sm text-gray-500 mb-1">较小段</div>
              <div class="text-2xl font-bold text-green-600">{{ smallerSection }}px</div>
              <div class="text-xs text-gray-400 mt-1">{{ (smallerSection / baseSize * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <!-- 比例说明 -->
        <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-sm font-medium mb-2">黄金比例 (φ)</h3>
          <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>φ ≈ 1.6180339887...</div>
            <div>公式: 较大段 / 较小段 = φ</div>
            <div class="text-xs mt-2">黄金比例被广泛用于艺术、建筑和设计中，被认为是最美感的比例关系。</div>
          </div>
        </div>
      </div>

      <!-- 可视化预览 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">可视化预览</h2>

        <!-- 黄金分割线 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <div
            class="relative bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg overflow-hidden"
            :style="direction === 'horizontal' ? { height: '100px', width: '100%' } : { height: '200px', width: '100px', margin: '0 auto' }"
          >
            <!-- 分割线 -->
            <div
              class="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
              :style="direction === 'horizontal' ? { left: (largerSection / baseSize * 100) + '%' } : { left: '50%', top: (largerSection / baseSize * 100) + '%' }"
            ></div>

            <!-- 标签 -->
            <div
              class="absolute top-1/2 transform -translate-y-1/2 text-white text-sm font-bold"
              :style="direction === 'horizontal' ? { left: '25%', transform: 'translateY(-50%)' } : { left: '50%', top: '25%', transform: 'translate(-50%, -50%)' }"
            >
              {{ largerSection }}px
            </div>
            <div
              class="absolute top-1/2 transform -translate-y-1/2 text-white text-sm font-bold"
              :style="direction === 'horizontal' ? { right: '25%', transform: 'translateY(-50%)' } : { left: '50%', bottom: '25%', transform: 'translate(-50%, 50%)' }"
            >
              {{ smallerSection }}px
            </div>
          </div>
        </div>

        <!-- 黄金螺旋 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-sm font-medium mb-3 text-center">黄金螺旋</h3>
          <svg viewBox="0 0 200 200" class="w-full h-auto">
            <!-- 黄金矩形 -->
            <rect x="10" y="10" width="180" height="180" fill="none" stroke="#667eea" stroke-width="2"/>

            <!-- 分割线 -->
            <line x1="121" y1="10" x2="121" y2="190" stroke="#764ba2" stroke-width="1" stroke-dasharray="4"/>

            <!-- 螺旋线 -->
            <path d="M 10 10 Q 10 190 190 190" fill="none" stroke="url(#gradient)" stroke-width="3"/>

            <!-- 渐变定义 -->
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>

    <!-- 字体尺寸系统 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">黄金比例字体系统</h2>
      <p class="text-sm text-gray-500 mb-4">基于黄金比例生成和谐的字体尺寸层级</p>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(size, index) in fontSizes"
          :key="index"
          class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="text-sm text-gray-500 mb-1">{{ size.label }}</div>
          <div :style="{ fontSize: size.value + 'px' }" class="font-bold text-gray-800 dark:text-gray-200">
            {{ size.value }}px
          </div>
          <div class="text-xs text-gray-400 mt-1">{{ size.scale }}</div>
        </div>
      </div>
    </div>

    <!-- 间距系统 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">黄金比例间距系统</h2>
      <p class="text-sm text-gray-500 mb-4">基于黄金比例生成统一的间距系统</p>

      <div class="grid md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div
          v-for="(spacing, index) in spacings"
          :key="index"
          class="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div
            class="bg-blue-500 rounded"
            :style="{ width: spacing.value + 'px', height: spacing.value + 'px' }"
          ></div>
          <div class="text-sm font-mono mt-2">{{ spacing.value }}px</div>
          <div class="text-xs text-gray-400">{{ spacing.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '黄金比例计算器 - 设计比例工具',
  meta: [{ name: 'description', content: '在线黄金比例计算工具，计算黄金分割点，用于版式设计和字体层级规划。' }],
  keywords: ['黄金比例', 'golden ratio', 'phi', '分割', '设计比例', '排版']
})

const baseSize = ref(400)
const direction = ref<'horizontal' | 'vertical'>('horizontal')

const PHI = 1.6180339887

const largerSection = computed(() => {
  return Math.round(baseSize.value / PHI)
})

const smallerSection = computed(() => {
  return Math.round(baseSize.value - largerSection.value)
})

const fontSizes = computed(() => {
  const base = 16
  const sizes = []
  let current = base

  for (let i = 0; i < 6; i++) {
    const labels = ['Body', 'Lead', 'H3', 'H2', 'H1', 'Display']
    sizes.push({
      label: labels[i] || `Level ${i + 1}`,
      value: Math.round(current),
      scale: `÷ φ^${i}`
    })
    current *= PHI
  }

  return sizes
})

const spacings = computed(() => {
  const base = 8
  const spaces = []
  let current = base

  for (let i = 0; i < 8; i++) {
    const labels = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']
    spaces.push({
      label: labels[i] || `${i}`,
      value: Math.round(current)
    })
    current *= PHI
  }

  return spaces
})

function calculate() {
  // 触发computed重新计算
}
</script>
