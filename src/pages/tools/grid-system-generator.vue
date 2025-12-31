<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">网格系统生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成12/16/24列网格系统</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium mb-1">列数</label>
          <select v-model.number="columns" class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700">
            <option :value="12">12列</option>
            <option :value="16">16列</option>
            <option :value="24">24列</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">间距 (px)</label>
          <input v-model.number="gap" type="number" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">边距 (px)</label>
          <input v-model.number="padding" type="number" class="w-full px-3 py-2 border rounded">
        </div>
      </div>

      <h3 class="text-lg font-semibold mb-3">预览</h3>
      <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-x-auto">
        <div class="flex gap-1" :style="{ gap: gap + 'px' }">
          <div v-for="i in columns" :key="i" class="flex-1 bg-blue-500/30 border border-blue-500 h-16 flex items-center justify-center text-xs">{{ i }}</div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">CSS代码</h2>
      <div class="p-4 bg-gray-900 rounded-lg">
        <pre class="text-green-400 text-sm font-mono"><code>{{ gridCSS }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '网格系统生成器 - CSS Grid系统',
  meta: [{ name: 'description', content: '在线网格系统生成工具，创建12/16/24列CSS Grid布局系统。' }],
  keywords: ['grid', '网格系统', 'CSS Grid', '布局']
})

const columns = ref(12)
const gap = ref(16)
const padding = ref(20)

const gridCSS = computed(() => {
  return `.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns.value}, 1fr);
  gap: ${gap.value}px;
  padding: ${padding.value}px;
}

/* 列跨度示例 */
.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-6 { grid-column: span 6; }
.col-${columns.value} { grid-column: span ${columns.value}; }`
})
</script>
