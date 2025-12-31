<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">EM断点生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">px转em计算，响应式断点生成</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">设置</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">基准字号 (px)</label>
            <input v-model.number="baseFontSize" type="number" min="12" max="20" class="w-full px-3 py-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">断点 (px)</label>
            <textarea v-model="breakpointsInput" rows="4" class="w-full px-3 py-2 border rounded font-mono text-sm" placeholder="每行一个像素值"></textarea>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">转换结果</h2>
        <div class="space-y-2">
          <div v-for="(bp, index) in convertedBreakpoints" :key="index" class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span class="font-mono">{{ bp.px }}px</span>
            <span class="font-mono">→</span>
            <span class="font-mono">{{ bp.em }}em</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">媒体查询代码</h2>
      <div class="p-4 bg-gray-900 rounded-lg">
        <pre class="text-green-400 text-sm font-mono"><code>{{ mediaQueryCSS }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'EM断点生成器 - 响应式断点',
  meta: [{ name: 'description', content: '在线EM断点生成工具，px转em计算，生成响应式媒体查询。' }],
  keywords: ['em', 'breakpoint', '响应式', '媒体查询', 'px转em']
})

const baseFontSize = ref(16)
const breakpointsInput = ref('320\n576\n768\n992\n1200\n1400')

const convertedBreakpoints = computed(() => {
  return breakpointsInput.value.split('\n')
    .map(line => parseInt(line.trim()))
    .filter(px => !isNaN(px) && px > 0)
    .map(px => ({
      px,
      em: (px / baseFontSize.value).toFixed(2)
    }))
})

const mediaQueryCSS = computed(() => {
  return convertedBreakpoints.value.map((bp, i) => {
    const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    return `@media (min-width: ${bp.em}em) {
  /* ${names[i] || `bp${i + 1}`} (${bp.px}px) */
}`
  }).join('\n\n')
})
</script>
