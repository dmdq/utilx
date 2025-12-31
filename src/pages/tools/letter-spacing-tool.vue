<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">字间距工具</h1>
      <p class="text-gray-600 dark:text-gray-400">调整字母间距，预览效果</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">设置</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">字间距 (em)</label>
            <input v-model.number="letterSpacing" type="number" min="-0.1" max="0.5" step="0.005" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">快捷预设</label>
            <div class="grid grid-cols-4 gap-2">
              <button @click="letterSpacing = -0.02" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">-0.02</button>
              <button @click="letterSpacing = 0" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">0</button>
              <button @click="letterSpacing = 0.05" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">0.05</button>
              <button @click="letterSpacing = 0.1" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">0.1</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">字号 (px)</label>
            <input v-model.number="fontSize" type="number" min="12" max="72" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">文本</label>
            <textarea v-model="sampleText" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"></textarea>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div
          class="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[200px]"
          :style="{ fontSize: fontSize + 'px', letterSpacing: letterSpacing + 'em' }"
        >
          {{ sampleText }}
        </div>

        <div class="mt-4 p-4 bg-gray-900 rounded-lg">
          <pre class="text-green-400 text-sm font-mono"><code>letter-spacing: {{ letterSpacing }}em;</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '字间距工具 - letter-spacing可视化',
  meta: [{ name: 'description', content: '在线字间距调整工具，实时预览letter-spacing效果。' }],
  keywords: ['letter-spacing', '字间距', '字距', 'CSS字体']
})

const letterSpacing = ref(0)
const fontSize = ref(24)
const sampleText = ref('Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.')
</script>
