<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Tailwind色板生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成Tailwind风格的色阶</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">选择基准颜色</label>
        <input v-model="baseColor" type="color" class="w-full h-12 rounded cursor-pointer">
      </div>

      <h3 class="text-lg font-semibold mb-3">生成的色阶</h3>
      <div class="grid grid-cols-11 gap-1 mb-4">
        <div v-for="(shade, index) in shades" :key="index" class="text-center">
          <div
            class="w-full aspect-square rounded cursor-pointer hover:scale-105 transition"
            :style="{ backgroundColor: shade }"
            @click="copyColor(shade)"
          ></div>
          <div class="text-xs mt-1">{{ 50 + index * 100 }}</div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Tailwind配置</h2>
      <div class="p-4 bg-gray-900 rounded-lg">
        <pre class="text-green-400 text-sm font-mono"><code>colors: {
  primary: {
{{ tailwindConfig }}
  }
}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Tailwind色板生成器 - Tailwind颜色',
  meta: [{ name: 'description', content: '在线Tailwind风格色板生成工具，创建50-950色阶。' }],
  keywords: ['tailwind', '色板', '颜色', 'CSS', '颜色生成']
})

const baseColor = ref('#3B82F6')

// 简化的色阶生成
const shades = computed(() => {
  const hex = baseColor.value
  return [
    adjustBrightness(hex, -80),
    adjustBrightness(hex, -60),
    adjustBrightness(hex, -40),
    adjustBrightness(hex, -20),
    adjustBrightness(hex, -10),
    hex,
    adjustBrightness(hex, 10),
    adjustBrightness(hex, 20),
    adjustBrightness(hex, 30),
    adjustBrightness(hex, 40),
    adjustBrightness(hex, 50)
  ]
})

const tailwindConfig = computed(() => {
  return shades.value.map((s, i) => `    '${(i + 1) * 100}': '${s}'`).join(',\n')
})

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

async function copyColor(color: string) {
  try {
    await navigator.clipboard.writeText(color)
    alert(`已复制: ${color}`)
  } catch {}
}
</script>
