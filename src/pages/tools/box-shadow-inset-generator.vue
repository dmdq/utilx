<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">内阴影生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">专门生成inset box-shadow效果</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">设置</h2>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">X偏移 (px)</label>
              <input v-model.number="x" type="range" min="-50" max="50" class="w-full">
              <span class="text-sm text-gray-500">{{ x }}px</span>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Y偏移 (px)</label>
              <input v-model.number="y" type="range" min="-50" max="50" class="w-full">
              <span class="text-sm text-gray-500">{{ y }}px</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">模糊半径 (px)</label>
            <input v-model.number="blur" type="range" min="0" max="100" class="w-full">
            <span class="text-sm text-gray-500">{{ blur }}px</span>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">扩展半径 (px)</label>
            <input v-model.number="spread" type="range" min="-50" max="50" class="w-full">
            <span class="text-sm text-gray-500">{{ spread }}px</span>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">颜色</label>
            <input v-model="color" type="color" class="w-full h-10 rounded cursor-pointer">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">透明度</label>
            <input v-model.number="opacity" type="range" min="0" max="1" step="0.01" class="w-full">
            <span class="text-sm text-gray-500">{{ opacity }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div
          class="w-full h-64 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500"
          :style="{ boxShadow: generatedShadow }"
        >
          <span class="text-white text-xl font-bold">Inset Shadow</span>
        </div>

        <div class="mt-4 p-4 bg-gray-900 rounded-lg">
          <pre class="text-green-400 text-sm font-mono"><code>box-shadow: {{ generatedShadow }};</code></pre>
        </div>

        <button @click="copyCSS" class="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg">复制CSS</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '内阴影生成器 - inset box-shadow',
  meta: [{ name: 'description', content: '在线CSS内阴影生成工具，创建inset box-shadow效果。' }],
  keywords: ['inset shadow', '内阴影', 'box-shadow', 'CSS阴影']
})

const x = ref(0)
const y = ref(0)
const blur = ref(20)
const spread = ref(0)
const color = ref('#000000')
const opacity = ref(0.5)

const generatedShadow = computed(() => {
  const rgba = hexToRgba(color.value, opacity.value)
  return `inset ${x.value}px ${y.value}px ${blur.value}px ${spread.value}px ${rgba}`
})

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`box-shadow: ${generatedShadow.value};`)
    alert('已复制CSS代码')
  } catch {}
}
</script>
