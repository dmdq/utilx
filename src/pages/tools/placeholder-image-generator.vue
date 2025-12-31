<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">占位图生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成指定尺寸的占位图片</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div class="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium mb-1">宽度</label>
          <input v-model.number="width" type="number" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">高度</label>
          <input v-model.number="height" type="number" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">背景色</label>
          <input v-model="bgColor" type="color" class="w-full h-10 rounded cursor-pointer">
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium mb-1">文字</label>
        <input v-model="text" class="w-full px-3 py-2 border rounded" placeholder="可选文字">
      </div>

      <div class="flex justify-center mb-6">
        <div
          class="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg"
          :style="{ width: width + 'px', height: height + 'px', background: bgColor, maxWidth: '100%' }"
        >
          <span class="text-white font-bold text-lg">{{ text || `${width} x ${height}` }}</span>
        </div>
      </div>

      <div class="p-4 bg-gray-900 rounded-lg">
        <pre class="text-green-400 text-sm font-mono"><code>&lt;img src="https://via.placeholder.com/{{ width }}x{{ height }}" alt="Placeholder"&gt;</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '占位图生成器 - 在线占位图片',
  meta: [{ name: 'description', content: '在线占位图生成工具，创建指定尺寸的占位图片。' }],
  keywords: ['placeholder', '占位图', '图片占位']
})

const width = ref(300)
const height = ref(200)
const bgColor = ref('#6366F1')
const text = ref('')
</script>
