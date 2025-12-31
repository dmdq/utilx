<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">背景图案生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">CSS background图案(网格、点阵、斜线等)</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">图案类型</h2>
        <div class="grid grid-cols-2 gap-2 mb-6">
          <button
            v-for="pattern in patterns"
            :key="pattern.id"
            @click="selectedPattern = pattern.id"
            :class="['px-3 py-2 rounded-lg text-sm', selectedPattern === pattern.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
          >
            {{ pattern.name }}
          </button>
        </div>

        <h2 class="text-xl font-semibold mb-4">颜色设置</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">背景色</label>
            <input v-model="bgColor" type="color" class="w-full h-10 rounded cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">图案色</label>
            <input v-model="patternColor" type="color" class="w-full h-10 rounded cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">大小 (px)</label>
            <input v-model.number="size" type="range" min="10" max="100" class="w-full">
            <span class="text-sm text-gray-500">{{ size }}px</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div
          class="w-full h-64 rounded-lg mb-4"
          :style="{ background: generatedPattern }"
        ></div>

        <div class="p-4 bg-gray-900 rounded-lg">
          <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>background: {{ generatedPattern }};</code></pre>
        </div>

        <button @click="copyCSS" class="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg">复制CSS</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '背景图案生成器 - CSS pattern生成',
  meta: [{ name: 'description', content: '在线CSS背景图案生成工具，创建网格、点阵、斜线等背景图案。' }],
  keywords: ['background pattern', '背景图案', 'CSS图案', '网格', '点阵']
})

const selectedPattern = ref('grid')
const bgColor = ref('#ffffff')
const patternColor = ref('#3b82f6')
const size = ref(20)

const patterns = [
  { id: 'grid', name: '网格' },
  { id: 'dots', name: '点阵' },
  { id: 'lines', name: '横线' },
  { id: 'diagonal', name: '斜线' },
  { id: 'checkerboard', name: '棋盘' },
  { id: 'zigzag', name: '锯齿' }
]

const generatedPattern = computed(() => {
  const s = size.value
  const bg = bgColor.value
  const color = patternColor.value

  switch (selectedPattern.value) {
    case 'grid':
      return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px), ${bg}`
    case 'dots':
      return `radial-gradient(${color} 1px, transparent 1px), ${bg}`
    case 'lines':
      return `linear-gradient(${color} 1px, transparent 1px), ${bg}`
    case 'diagonal':
      return `repeating-linear-gradient(45deg, ${bg}, ${bg} ${s/2}px, ${color} ${s/2}px, ${color} ${s}px)`
    case 'checkerboard':
      return `conic-gradient(${color} 90deg, ${bg} 90deg 180deg, ${color} 180deg 270deg, ${bg} 270deg)`
    case 'zigzag':
      return `linear-gradient(135deg, ${color} 25%, transparent 25%), linear-gradient(225deg, ${color} 25%, transparent 25%), ${bg}`
    default:
      return bg
  }
})

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`background: ${generatedPattern.value};\nbackground-size: ${size.value}px ${size.value}px;`)
    alert('已复制CSS代码')
  } catch {}
}
</script>
