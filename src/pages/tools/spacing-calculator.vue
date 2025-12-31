<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">间距计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">基于基准单位生成间距系统</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium mb-1">基准单位 (px)</label>
          <input v-model.number="baseUnit" type="number" min="4" max="16" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">比例类型</label>
          <select v-model="scaleType" class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700">
            <option value="linear">线性 (0.5x, 1x, 1.5x...)</option>
            <option value="fibonacci">斐波那契</option>
            <option value="powers">2的幂次 (1, 2, 4, 8...)</option>
          </select>
        </div>
      </div>

      <h3 class="text-lg font-semibold mb-3">间距系统</h3>
      <div class="grid grid-cols-4 md:grid-cols-8 gap-3">
        <div v-for="(spacing, index) in spacings" :key="index" class="text-center">
          <div class="h-12 bg-blue-500 rounded mb-1 mx-auto" :style="{ width: spacing.value + 'px', height: spacing.value + 'px' }"></div>
          <div class="text-xs font-mono">{{ spacing.value }}px</div>
          <div class="text-xs text-gray-400">{{ spacing.name }}</div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">CSS变量</h2>
      <div class="p-4 bg-gray-900 rounded-lg">
        <pre class="text-green-400 text-sm font-mono"><code>:root {
{{ spacingCSS }}
}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '间距计算器 - 设计间距系统',
  meta: [{ name: 'description', content: '在线间距计算工具，基于基准单位生成设计间距系统。' }],
  keywords: ['spacing', '间距', '设计系统', '间距计算']
})

const baseUnit = ref(8)
const scaleType = ref('linear')

const spacings = computed(() => {
  const base = baseUnit.value
  const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']

  if (scaleType.value === 'linear') {
    return [0.5, 1, 1.5, 2, 3, 4, 6, 8].map((m, i) => ({
      name: names[i],
      value: base * m
    }))
  } else if (scaleType.value === 'fibonacci') {
    return [1, 1, 2, 3, 5, 8, 13, 21].map((f, i) => ({
      name: names[i],
      value: base * f
    }))
  } else {
    return [1, 2, 4, 8, 16, 32, 64, 128].map((p, i) => ({
      name: names[i],
      value: base * p
    }))
  }
})

const spacingCSS = computed(() => {
  return spacings.value.map(s => `  --spacing-${s.name}: ${s.value}px;`).join('\n')
})
</script>
