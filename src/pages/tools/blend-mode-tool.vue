<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">混合模式工具</h1>
      <p class="text-gray-600 dark:text-gray-400">CSS mix-blend-mode可视化预览</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">混合模式</h2>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="mode in blendModes"
            :key="mode"
            @click="selectedMode = mode"
            :class="['px-2 py-2 text-xs rounded', selectedMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div class="relative h-48 rounded-lg overflow-hidden mb-4" style="background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);">
          <!-- 上层元素 -->
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-xl flex items-center justify-center text-white font-bold"
            style="background: linear-gradient(135deg, #667eea, #764ba2);"
            :style="{ mixBlendMode: selectedMode }"
          >
            Blend
          </div>
        </div>

        <div class="p-4 bg-gray-900 rounded-lg">
          <pre class="text-green-400 text-sm font-mono"><code>mix-blend-mode: {{ selectedMode }};</code></pre>
        </div>

        <button @click="copyCSS" class="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg">复制CSS</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '混合模式工具 - mix-blend-mode可视化',
  meta: [{ name: 'description', content: '在线CSS mix-blend-mode可视化工具，预览各种混合模式效果。' }],
  keywords: ['mix-blend-mode', '混合模式', 'CSS混合', 'blend mode']
})

const selectedMode = ref('multiply')
const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
  'exclusion', 'hue', 'saturation', 'color', 'luminosity'
]

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`mix-blend-mode: ${selectedMode.value};`)
    alert('已复制CSS代码')
  } catch {}
}
</script>
