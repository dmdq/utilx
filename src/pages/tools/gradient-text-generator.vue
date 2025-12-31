<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">渐变文字生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成文字渐变效果和背景裁剪代码</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">设置</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">文字</label>
            <input v-model="text" type="text" class="w-full px-3 py-2 border rounded" placeholder="输入文字">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">渐变起始色</label>
            <input v-model="color1" type="color" class="w-full h-10 rounded cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">渐变结束色</label>
            <input v-model="color2" type="color" class="w-full h-10 rounded cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">角度 (deg)</label>
            <input v-model.number="angle" type="range" min="0" max="360" class="w-full">
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div class="p-8 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
          <span
            class="text-5xl font-bold"
            :style="{ background: generatedGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }"
          >
            {{ text || 'Gradient Text' }}
          </span>
        </div>

        <div class="p-4 bg-gray-900 rounded-lg">
          <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>{{ generatedCSS }}</code></pre>
        </div>

        <button @click="copyCSS" class="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg">复制CSS</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '渐变文字生成器 - 文字渐变效果',
  meta: [{ name: 'description', content: '在线渐变文字生成工具，创建background-clip文字渐变效果。' }],
  keywords: ['gradient text', '文字渐变', 'background-clip', 'CSS文字']
})

const text = ref('Gradient Text')
const color1 = ref('#667eea')
const color2 = ref('#764ba2')
const angle = ref(135)

const generatedGradient = computed(() => {
  return `linear-gradient(${angle.value}deg, ${color1.value}, ${color2.value})`
})

const generatedCSS = computed(() => {
  return `.gradient-text {
  background: ${generatedGradient.value};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}`
})

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(generatedCSS.value)
    alert('已复制CSS代码')
  } catch {}
}
</script>
