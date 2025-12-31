<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">色彩命名工具</h1>
      <p class="text-gray-600 dark:text-gray-400">为颜色值生成语义化名称</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">输入颜色值</label>
        <div class="flex gap-2">
          <input v-model="hexColor" type="color" class="w-20 h-10 rounded cursor-pointer">
          <input v-model="hexColor" maxlength="7" class="flex-1 px-3 py-2 border rounded uppercase font-mono" placeholder="#000000">
        </div>
      </div>

      <div class="mb-4">
        <div class="w-full h-32 rounded-lg" :style="{ backgroundColor: hexColor }"></div>
      </div>

      <div v-if="colorName" class="space-y-3">
        <h3 class="font-semibold">建议名称</h3>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="name in colorNames" :key="name" @click="copyName(name)" class="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 text-left">
            {{ name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '色彩命名工具 - 颜色语义化命名',
  meta: [{ name: 'description', content: '在线色彩命名工具，为颜色值生成语义化名称。' }],
  keywords: ['color naming', '色彩命名', '颜色名称', '语义化']
})

const hexColor = ref('#3B82F6')

// 预定义颜色名称映射
const colorMap: Record<string, string[]> = {
  '#3B82F6': ['primary', 'blue', 'main'],
  '#EF4444': ['danger', 'error', 'red'],
  '#10B981': ['success', 'green'],
  '#F59E0B': ['warning', 'orange', 'yellow'],
  '#6B7280': ['gray', 'neutral', 'muted'],
  '#8B5CF6': ['purple', 'violet'],
  '#EC4899': ['pink', 'rose'],
  '#14B8A6': ['teal', 'cyan'],
  '#F97316': ['orange'],
  '#6366F1': ['indigo']
}

const colorNames = computed(() => {
  const upper = hexColor.value.toUpperCase()
  if (colorMap[upper]) {
    return colorMap[upper]
  }

  // 基于色相生成名称
  const { h } = hexToHsl(hexColor.value)
  const names = []

  if (h < 15 || h >= 345) names.push('red', 'rose')
  else if (h < 45) names.push('orange', 'amber')
  else if (h < 65) names.push('yellow')
  else if (h < 150) names.push('green', 'emerald')
  else if (h < 200) names.push('cyan', 'teal')
  else if (h < 260) names.push('blue', 'sky')
  else if (h < 290) names.push('purple', 'violet')
  else names.push('pink', 'rose')

  return [...names, 'primary', 'accent', 'highlight']
})

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0

  if (max !== min) {
    const d = max - min
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  return { h: Math.round(h * 360), s: 0, l: 0 }
}

async function copyName(name: string) {
  try {
    await navigator.clipboard.writeText(name)
    alert(`已复制: ${name}`)
  } catch {}
}
</script>
