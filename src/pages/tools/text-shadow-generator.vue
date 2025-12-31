<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文字阴影生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成多层text-shadow效果</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">阴影层级</h2>

        <div class="space-y-4">
          <div v-for="(layer, index) in layers" :key="index" class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg relative">
            <button @click="removeLayer(index)" class="absolute top-2 right-2 text-red-500 hover:bg-red-50 rounded p-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500">X</label>
                <input v-model.number="layer.x" type="number" class="w-full px-2 py-1 text-sm border rounded">
              </div>
              <div>
                <label class="text-xs text-gray-500">Y</label>
                <input v-model.number="layer.y" type="number" class="w-full px-2 py-1 text-sm border rounded">
              </div>
              <div>
                <label class="text-xs text-gray-500">模糊</label>
                <input v-model.number="layer.blur" type="number" class="w-full px-2 py-1 text-sm border rounded">
              </div>
              <div>
                <label class="text-xs text-gray-500">颜色</label>
                <input v-model="layer.color" type="color" class="w-full h-8 rounded">
              </div>
            </div>
          </div>

          <button @click="addLayer" class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg">+ 添加阴影层</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>

        <div class="mb-4">
          <input v-model="previewText" type="text" class="w-full px-3 py-2 border rounded" placeholder="输入预览文字">
        </div>

        <div class="p-8 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[150px] flex items-center justify-center">
          <span
            class="text-4xl font-bold"
            :style="{ textShadow: generatedShadow, color: textColor }"
          >
            {{ previewText }}
          </span>
        </div>

        <div class="mt-4 p-4 bg-gray-900 rounded-lg">
          <pre class="text-green-400 text-sm font-mono"><code>text-shadow: {{ generatedShadow }};</code></pre>
        </div>

        <button @click="copyCSS" class="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg">复制CSS</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '文字阴影生成器 - text-shadow可视化',
  meta: [{ name: 'description', content: '在线text-shadow生成工具，创建多层文字阴影效果。' }],
  keywords: ['text-shadow', '文字阴影', 'CSS文字', '文字效果']
})

interface Layer {
  x: number
  y: number
  blur: number
  color: string
}

const layers = ref<Layer[]>([
  { x: 2, y: 2, blur: 4, color: '#000000' }
])

const previewText = ref('Text Shadow')
const textColor = ref('#3B82F6')

const generatedShadow = computed(() => {
  return layers.value.map(l => `${l.x}px ${l.y}px ${l.blur}px ${l.color}`).join(', ')
})

function addLayer() {
  layers.value.push({ x: 0, y: 0, blur: 0, color: '#000000' })
}

function removeLayer(index: number) {
  if (layers.value.length > 1) {
    layers.value.splice(index, 1)
  }
}

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`text-shadow: ${generatedShadow.value};`)
    alert('已复制CSS代码')
  } catch {}
}
</script>
