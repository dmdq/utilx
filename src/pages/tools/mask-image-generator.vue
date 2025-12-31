<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">CSS遮罩生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成mask-image效果，渐变遮罩、图片遮罩</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">遮罩类型</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">类型</label>
            <select v-model="maskType" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
              <option value="linear">线性渐变</option>
              <option value="radial">径向渐变</option>
              <option value="conic">锥形渐变</option>
            </select>
          </div>

          <!-- 线性渐变设置 -->
          <div v-if="maskType === 'linear'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">角度 (deg)</label>
              <input v-model.number="angle" type="range" min="0" max="360" class="w-full">
              <span class="text-sm text-gray-500">{{ angle }}°</span>
            </div>
          </div>

          <!-- 径向渐变设置 -->
          <div v-if="maskType === 'radial'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">位置</label>
              <select v-model="radialPos" class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700">
                <option value="center">中心</option>
                <option value="top">顶部</option>
                <option value="bottom">底部</option>
                <option value="left">左侧</option>
                <option value="right">右侧</option>
              </select>
            </div>
          </div>

          <!-- 颜色停止点 -->
          <div>
            <label class="block text-sm font-medium mb-2">透明度渐变</label>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-sm w-12">不透明</span>
                <input v-model.number="stops.start" type="range" min="0" max="100" class="flex-1">
                <span class="text-sm w-12">{{ stops.start }}%</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm w-12">透明</span>
                <input v-model.number="stops.end" type="range" min="0" max="100" class="flex-1">
                <span class="text-sm w-12">{{ stops.end }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div
            class="w-full h-48 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
            :style="{ maskImage: generatedMask, WebkitMaskImage: generatedMask }"
          >
            Mask Image
          </div>
        </div>

        <div class="mt-4 p-4 bg-gray-900 rounded-lg">
          <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>mask-image: {{ generatedMask }};
-webkit-mask-image: {{ generatedMask }};</code></pre>
        </div>

        <button @click="copyCSS" class="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg">复制CSS</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'CSS遮罩生成器 - mask-image可视化',
  meta: [{ name: 'description', content: '在线CSS mask-image生成工具，创建渐变遮罩、图片遮罩效果。' }],
  keywords: ['mask-image', 'CSS遮罩', '渐变遮罩', 'mask']
})

const maskType = ref('linear')
const angle = ref(180)
const radialPos = ref('center')
const stops = ref({ start: 50, end: 100 })

const generatedMask = computed(() => {
  const { start, end } = stops.value
  switch (maskType.value) {
    case 'linear':
      return `linear-gradient(${angle.value}deg, black ${start}%, transparent ${end}%)`
    case 'radial':
      return `radial-gradient(circle at ${radialPos.value}, black ${start}%, transparent ${end}%)`
    case 'conic':
      return `conic-gradient(from 0deg, black 0deg, black ${start * 3.6}deg, transparent ${end * 3.6}deg)`
    default:
      return 'none'
  }
})

async function copyCSS() {
  const css = `mask-image: ${generatedMask.value};\n-webkit-mask-image: ${generatedMask.value};`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}
</script>
