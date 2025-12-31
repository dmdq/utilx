<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">字体比例系统</h1>
      <p class="text-gray-600 dark:text-gray-400">生成和谐的字体大小比例(大标题、标题、正文、小字)</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 mb-6">
      <!-- 基础设置 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">基础设置</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">基准字号 (px)</label>
            <input v-model.number="baseSize" type="number" min="8" max="32" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">比例类型</label>
            <select v-model="scaleType" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
              <option value="majorThird">大三度 (1.250)</option>
              <option value="minorThird">小三度 (1.200)</option>
              <option value="perfectFourth">完全四度 (1.333)</option>
              <option value="perfectFifth">完全五度 (1.500)</option>
              <option value="goldenRatio">黄金比例 (1.618)</option>
              <option value="octave">八度 (2.000)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">层级数量</label>
            <input v-model.number="levels" type="number" min="4" max="10" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          </div>
        </div>
      </div>

      <!-- 预览 -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">字体预览</h2>
        <div class="space-y-3">
          <div
            v-for="(size, index) in fontSizes"
            :key="index"
            class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="w-24 text-sm text-gray-500">{{ size.label }}</div>
            <div class="w-16 text-sm font-mono text-gray-500">{{ size.value }}px</div>
            <div :style="{ fontSize: size.value + 'px' }" class="flex-1 text-gray-800 dark:text-gray-200">
              {{ size.sample }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CSS变量 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">CSS变量</h2>
        <button @click="copyCSS" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">复制</button>
      </div>
      <div class="p-4 bg-gray-900 rounded-lg overflow-x-auto">
        <pre class="text-green-400 text-sm font-mono"><code>:root {
{{ fontCSS }}
}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '字体比例系统 - 和谐的字体层级',
  meta: [{ name: 'description', content: '在线字体比例系统生成工具，基于音乐音阶生成和谐的字体大小层级。' }],
  keywords: ['字体比例', 'typography scale', '字体层级', '排版', '字体大小']
})

const baseSize = ref(16)
const scaleType = ref('majorThird')
const levels = ref(7)

const scales: Record<string, number> = {
  majorThird: 1.250,
  minorThird: 1.200,
  perfectFourth: 1.333,
  perfectFifth: 1.500,
  goldenRatio: 1.618,
  octave: 2.000
}

const labels = ['Caption', 'Small', 'Body', 'Lead', 'H3', 'H2', 'H1', 'Display', 'Display 2', 'Display 3']
const samples = ['正文说明文字', '小号文字', '这是正文内容', '引言段落', '三级标题文字', '二级标题内容', '页面大标题', '特大展示文字', '超大标题', '巨幅展示']

const fontSizes = computed(() => {
  const scale = scales[scaleType.value]
  const sizes = []

  // 生成更小的字号
  let current = baseSize.value
  const smallerSizes = []
  for (let i = 0; i < 2; i++) {
    current = current / scale
    smallerSizes.unshift({ label: labels[i], value: Math.round(current), sample: samples[i] })
  }

  // 基准字号
  sizes.push({ label: 'Body', value: baseSize.value, sample: '这是正文内容' })

  // 生成更大的字号
  current = baseSize.value
  for (let i = 0; i < levels.value - 3; i++) {
    current = current * scale
    sizes.push({ label: labels[i + 4], value: Math.round(current), sample: samples[i + 4] })
  }

  return [...smallerSizes, ...sizes]
})

const fontCSS = computed(() => {
  return fontSizes.value.map((size, i) => `  --font-${size.label.toLowerCase().replace(' ', '-')}: ${size.value}px;  /* ${size.label} */`).join('\n')
})

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(`:root {\n${fontCSS.value}\n}`)
    alert('已复制CSS变量')
  } catch {}
}
</script>
